#!/usr/bin/env python3
"""PP0 original OpenPraparat archived specimen / headless source smoke run.

Run from ReflexBrain repository on Linux after pinned original source checkout
and 'make praparat_cui' in /tmp/openpraparat-original/src.
Extract no executable members from archive, do not execute arbitrary archive
contents; only original compiled Fortran source. Source and biology unchanged.
"""
from __future__ import annotations
import hashlib, json, os, pathlib, re, subprocess, tarfile, time
ROOT=pathlib.Path("/tmp/openpraparat-original")
ARCHIVE=ROOT/"examples.tar.gz"
TARGET="examples/01dumbbell_shaped/01normal"
MAX_TOTAL=300_000_000
MAX_SELECTED=160_000_000
MAX_FILE=70_000_000
AUDIT=pathlib.Path("artifacts/praparat/pp0_original_exemplar_audit.json")
AUDIT.parent.mkdir(parents=True,exist_ok=True)
EXPECTED_SHA="e9e105d48ab597612d1749a5f169663559b12287"
report={"protocol":"docs/research/RB_PP0_ORIGINAL_PRAPARAT_EXEMPLAR_ARMED_2026-10-23.md",
        "upstream_repo":"A5size/OpenPraparat","upstream_sha":EXPECTED_SHA,
        "physics_source_edited":False, "science_qualified":False,"status":"not_started"}
def sha256(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for piece in iter(lambda:f.read(1<<20),b""): h.update(piece)
    return h.hexdigest()
def run_cmd(cmd,*,cwd,seconds=20):
    with open(cwd/"pp0_process.log","wb") as f:
        try:
            z=subprocess.run(cmd,cwd=cwd,stdout=f,stderr=subprocess.STDOUT,timeout=seconds,check=False,
                             env={**os.environ, "OMP_NUM_THREADS":"1"})
            return z.returncode,False
        except subprocess.TimeoutExpired:
            return None,True
def main():
    got=subprocess.check_output(["git","-C",str(ROOT),"rev-parse","HEAD"],text=True).strip()
    assert got==EXPECTED_SHA,(got,EXPECTED_SHA)
    assert ARCHIVE.is_file()
    report["archive"]={"bytes":ARCHIVE.stat().st_size,"sha256":sha256(ARCHIVE)}
    work=pathlib.Path("/tmp/pp0-preserved-dumbbell")
    work.mkdir(parents=True,exist_ok=True)
    raw=[]
    selected=[]
    total=chosen=0
    with tarfile.open(ARCHIVE,mode="r:gz") as archive:
        for member in archive:
            name=member.name.lstrip("./")
            part=pathlib.PurePosixPath(name)
            if part.is_absolute() or ".." in part.parts or member.issym() or member.islnk() or member.isdev():
                raise ValueError("Unsafe archive member: "+name[:120])
            if not (member.isfile() or member.isdir()):
                raise ValueError("Unknown archive member type: "+name[:120])
            if member.isfile():
                if member.size>MAX_FILE: raise ValueError("archive file exceeds single-file bound "+name)
                total+=member.size
                if total>MAX_TOTAL:raise ValueError("original archive expands beyond 300 MB")
            raw.append({"name":name,"bytes":member.size,"type":"file" if member.isfile() else "directory"})
            if name==TARGET or name.startswith(TARGET+"/"):
                selected.append(member)
                if member.isfile():chosen+=member.size
                if chosen>MAX_SELECTED:raise ValueError("selected original folder expands >160MB")
        assert len(selected)>0,"original author sample folder absent"
        assert chosen>0
        for member in selected:
            name=member.name.lstrip("./")
            sub=pathlib.PurePosixPath(name).relative_to(TARGET)
            dest=work.joinpath(*sub.parts)
            if member.isdir():
                dest.mkdir(parents=True,exist_ok=True)
            elif member.isfile():
                dest.parent.mkdir(parents=True,exist_ok=True)
                with archive.extractfile(member) as f,open(dest,"wb") as w:
                    while True:
                        data=f.read(1<<20)
                        if not data:break
                        w.write(data)
    report["archive_index"]={"members":len(raw),"total_unpacked_bytes":total,
                            "selected_members":len(selected),"selected_unpacked_bytes":chosen,
                            "top_paths":sorted(set(r["name"].split("/")[1] if "/" in r["name"] else r["name"] for r in raw))[:30]}
    report["selected_input_files"]={}
    for file in work.rglob("*"):
        if file.is_file():
            name=str(file.relative_to(work))
            report["selected_input_files"][name]={"bytes":file.stat().st_size,
                                                   "sha256":sha256(file)}
    orig=work/"input"
    assert orig.is_file(),"missing original Fortran namelist input"
    text=orig.read_text(encoding="utf-8")
    match=re.search(r"(?ims)^\s*&cycle\b[^/]*?/",text)
    assert match is not None and len(re.findall(r"(?im)^\s*&cycle\b",text))==1
    report["original_cycle_block"]=match.group(0).strip()
    report["original_setting_blocks"]=re.findall(r"(?im)^\s*&([A-Za-z_]+)\b",text)
    # The published parameters/world/cell/system are left EXACTLY unchanged.
    orig.write_text(text[:match.start()]+"\n&cycle\n out_cycle=1\n in_cycle=10\n/\n"+
                    text[match.end():],encoding="utf-8")
    report["executed_cycle_block"]="&cycle out_cycle=1 in_cycle=10 /"
    report["modified_input_cycle_only"]=True
    binary=ROOT/"src/praparat_cui"
    assert binary.exists(),"original compiler did not produce program"
    # The program's output can be huge; own log and store only last fragments.
    resultfile=work/"cells1.dat"
    before=time.time()
    rc,timed_out=run_cmd(["bash","-c",
                "ulimit -v 3145728; exec "+str(binary)],cwd=work,seconds=150)
    elapsed=time.time()-before
    report["run"]={"exit_code":rc,"timed_out":timed_out,"seconds_wall":round(elapsed,3),
       "snapshot_exists":resultfile.exists(),
       "snapshot_bytes":resultfile.stat().st_size if resultfile.exists() else 0}
    if resultfile.is_file() and resultfile.stat().st_size>0:
        report["run"]["snapshot_sha256"]=sha256(resultfile)
        with resultfile.open("rb") as f:report["run"]["snapshot_first_100_bytes"]=repr(f.read(100))
    lines=(work/"pp0_process.log").read_text(errors="replace").splitlines()
    report["run"]["original_stdout_tail"]=lines[-45:]
    if rc==0 and not timed_out and resultfile.exists() and resultfile.stat().st_size>10:
        report["status"]="ORIGINAL_ENGINE_EXECUTED_PRESERVED_EXEMPLAR"
        report["science_qualified"]=True
    else:report["status"]="ORIGINAL_SOURCE_EXECUTION_INCOMPLETE"
    return report
try:
    main()
except Exception as e:
    report["status"]="ORIGINAL_SOURCE_EXECUTION_INCOMPLETE"
    report["error_type"]=type(e).__name__
    report["error"]=str(e)[:420]
finally:
    AUDIT.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("RB_PP0_SOURCE_AUDIT "+json.dumps({k:report.get(k) for k in
        ("status","science_qualified","archive_index","original_cycle_block",
         "original_setting_blocks","selected_input_files","run","error","error_type")},
         ensure_ascii=False)[:12000])
if not report["science_qualified"]:
    raise SystemExit("PP0 SOURCE RECOVERABILITY FAIL; inspect JSON audit")
