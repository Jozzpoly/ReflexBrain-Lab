"""Metadata-only tar.gz archive size manifest. No files extracted or executed."""
import tarfile, json, hashlib, pathlib
source=pathlib.Path("/tmp/openpraparat-original/examples.tar.gz")
entries=[]
status="OK"
try:
    with tarfile.open(source,mode="r:gz") as f:
        for m in f:
            entries.append({"path":m.name.lstrip("./"),"bytes":m.size,"type":"file" if m.isfile() else "dir" if m.isdir() else "other"})
    entries.sort(key=lambda x:x["bytes"],reverse=True)
    report={"status":status,"compressed_bytes":source.stat().st_size,
            "files":len(entries),"total_uncompressed_bytes":sum(x["bytes"] for x in entries),
            "largest_files":entries[:25],
            "example_roots":sorted(set("/".join(x["path"].split("/")[:3]) for x in entries if x["path"].startswith("examples/")))[:20],
            "by_example":{}}
    for e in entries:
        parts=e["path"].split("/")
        if len(parts)>2 and parts[0]=="examples":
            key="/".join(parts[:3])
            out=report["by_example"].setdefault(key,{"files":0,"bytes":0,"max_file_bytes":0})
            if e["type"]=="file":
                out["files"]+=1
                out["bytes"]+=e["bytes"]
                out["max_file_bytes"]=max(out["max_file_bytes"],e["bytes"])
except Exception as exc:
    report={"status":"INDEX_FAILURE","error":str(exc)[:240]}
dest=pathlib.Path("artifacts/praparat/pp0_archive_manifest.json")
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(report,indent=2)+"\n")
print("RB_PP0_ARCHIVE_MANIFEST "+json.dumps(report)[:9000])
