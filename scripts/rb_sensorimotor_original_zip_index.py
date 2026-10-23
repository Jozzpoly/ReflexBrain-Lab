"""Read remote Zenodo ZIP central directory via HTTP ranges, not 225 MB body.

Do not download/open/execute any pickle or model code. >2MB reads are refused.
"""
import json, pathlib, struct, urllib.request, urllib.error
META="https://zenodo.org/api/records/10211741"
MAX_RANGE=2_000_000
report={"record":10211741,"status":"UNKNOWN","file_count":0,
        "bytes_downloaded_upper_bound":0,"models_not_executed":True}
def get_json(url):
    req=urllib.request.Request(url,headers={"User-Agent":"ReflexBrain-Research/1.0 (zip-index only)"})
    with urllib.request.urlopen(req,timeout=18) as r:
        content=r.read(MAX_RANGE+1)
        if len(content)>MAX_RANGE:raise RuntimeError("Record metadata beyond bound")
        return json.loads(content)
def bounded_range(url,byte_range):
    req=urllib.request.Request(url,headers={"Range":byte_range,
        "Accept-Encoding":"identity","User-Agent":"ReflexBrain-Research/1.0 (HTTP range only)"})
    with urllib.request.urlopen(req,timeout=25) as r:
        status=r.status
        if status!=206:
            # Close the body without reading it. No accidental full dataset retrieval.
            raise RuntimeError("HTTP_range_not_honored_"+str(status))
        n=r.read(MAX_RANGE+1)
        if len(n)>MAX_RANGE:raise RuntimeError("ZIP central directory exceeds read bound")
        report["bytes_downloaded_upper_bound"]+=len(n)
        return n
try:
    j=get_json(META)
    files=j.get("files",[])
    if len(files)!=1:raise RuntimeError("unexpected_archive_file_count")
    f=files[0]
    report["zip_name"]=f.get("key")
    report["zip_bytes"]=f.get("size")
    url=(f.get("links") or {}).get("self") or (f.get("links") or {}).get("content")
    if not url:raise RuntimeError("archive_has_no_content_link")
    tail=bounded_range(url,"bytes=-65557")
    i=tail.rfind(b"PK\x05\x06")
    if i<0 or i+22>len(tail):raise RuntimeError("EOCD_not_in_standard_tail")
    sig,disk,cd_disk,n_disk,n_all,size,offset,comment=struct.unpack_from("<4sHHHHIIH",tail,i)
    if n_all==0xffff or size==0xffffffff or offset==0xffffffff:
        raise RuntimeError("ZIP64_requires_explicit_safe_followup")
    if size>MAX_RANGE:raise RuntimeError("central_directory_too_large")
    cd=bounded_range(url,f"bytes={offset}-{offset+size-1}")
    candidates=[]
    entries=[]
    p=0
    for _ in range(n_all):
        if cd[p:p+4]!=b"PK\x01\x02":raise RuntimeError("malformed_zip_central_header")
        flag=struct.unpack_from("<H",cd,p+8)[0]
        method=struct.unpack_from("<H",cd,p+10)[0]
        compressed=struct.unpack_from("<I",cd,p+20)[0]
        uncompressed=struct.unpack_from("<I",cd,p+24)[0]
        nlen,xlen,clen=struct.unpack_from("<HHH",cd,p+28)
        loc_offset=struct.unpack_from("<I",cd,p+42)[0]
        raw=cd[p+46:p+46+nlen]
        name=raw.decode("utf-8" if flag & 2048 else "cp437",errors="replace")
        e={"path":name,"compressed_bytes":compressed,"bytes":uncompressed,
           "compression":method,"local_header_offset":loc_offset}
        entries.append(e)
        if name.lower().endswith((".pt",".pth",".pickle",".pkl",".npy",".npz",".json")):
            candidates.append(e)
        p+=46+nlen+xlen+clen
    if len(entries)!=n_all:raise RuntimeError("bad_zip_entry_count")
    report["status"]="ZIP_INDEX_RETRIEVED_BY_RANGE"
    report["file_count"]=len(entries)
    report["candidate_file_count"]=len(candidates)
    report["candidate_total_uncompressed_bytes"]=sum(e["bytes"] for e in candidates)
    report["candidate_examples"]=sorted(candidates,key=lambda e:e["bytes"])[:60]
    report["top_directories"]=list(dict.fromkeys(e["path"].split("/")[0] for e in entries))[:25]
except Exception as e:
    report["status"]="UNRESOLVED_SAFE_RANGE_AUDIT"
    report["error_type"]=type(e).__name__
    report["error"]=str(e)[:230]
p=pathlib.Path("artifacts/donors/sensorimotor_original_remote_zip_index.json")
p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(report,indent=2),encoding="utf8")
print("RB_SML_ZIP_INDEX "+json.dumps(report))
