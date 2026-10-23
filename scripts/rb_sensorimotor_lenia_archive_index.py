"""Read only publication Zenodo record *metadata*; never download datasets.

External catalog availability is a feasibility question, not a science PASS.
"""
from __future__ import annotations
import json, pathlib, urllib.request, urllib.error
URL="https://zenodo.org/api/records/10211741"
report={"record":10211741,"api_url":URL,"accessible":False,
        "status":"UNKNOWN","files":[],"no_dataset_download":True}
try:
    req=urllib.request.Request(URL, headers={"User-Agent":"ReflexBrain-Research/1.0 (record metadata only)",
                                            "Accept":"application/json"})
    with urllib.request.urlopen(req,timeout=15) as r:
        raw=r.read(2_000_001)
        if len(raw)>2_000_000:raise ValueError("record catalog unexpectedly oversized")
        data=json.loads(raw)
    files=data.get("files") or []
    report["accessible"]=True
    report["status"]="CATALOG_READ"
    report["title"]=data.get("metadata",{}).get("title")
    report["total_file_count"]=len(files)
    report["total_reported_bytes"]=sum(int(f.get("size",0)) for f in files)
    report["files"]=[{"key":str(f.get("key",f.get("filename",""))),
                       "size":int(f.get("size",0)),
                       "checksum":str(f.get("checksum",""))}
                      for f in files]
except (urllib.error.URLError, OSError, ValueError, json.JSONDecodeError) as e:
    report["status"]="UNKNOWN_UNREACHABLE"
    report["error_type"]=type(e).__name__
    report["reason"]=str(e)[:180]
path=pathlib.Path("artifacts/donors/sensorimotor_lenia_original_archive_index.json")
path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(report,indent=2),encoding="utf-8")
print("RB_SML_ARCHIVE_INDEX "+json.dumps({
    "status":report["status"],"total_file_count":report.get("total_file_count"),
    "total_reported_bytes":report.get("total_reported_bytes"),
    "files":report["files"][:35],
    "error_type":report.get("error_type"),"reason":report.get("reason"),
    "material_downloads":0}))
