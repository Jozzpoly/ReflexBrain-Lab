#!/usr/bin/env python3
"""PP2 full authored normal exemplar 240-step numerical lifecycle audit.

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
MAX_TOTAL=1_100_000_000
MAX_SELECTED=500_000_000
MAX_FILE=420_000_000
AUDIT=pathlib.Path("artifacts/praparat/pp2_original_normal_lifecycle_audit.json")
AUDIT.parent.mkdir(parents=True,exist_ok=True)
EXPECTED_SHA="e9e105d48ab597612d1749a5f169663559b12287"
report={"protocol":"docs/research/RB_PP2_ORIGINAL_LONGER_LIFECYCLE_ARMED_2026-10-23.md",
        "upstream_repo":"A5size/OpenPraparat","upstream_sha":EXPECTED_SHA,
        "physics_source_edited":False, "science_qualified":False,"status":"not_started","fixture_reason":"published 01normal 435MB preserved grown specimen, original dynamics unchanged; 10-step recovery only"}
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
    work=pathlib.Path("/tmp/pp2-preserved-dumbbell-normal")
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
                if (name==TARGET or name.startswith(TARGET+"/")) and member.size>MAX_FILE:
                    raise ValueError("SELECTED archive file exceeds single-file bound "+name)
                total+=member.size
                if total>MAX_TOTAL:raise ValueError("original archive has >1.1GB metadata uncompressed")
            raw.append({"name":name,"bytes":member.size,"type":"file" if member.isfile() else "directory"})
            if name==TARGET or name.startswith(TARGET+"/"):
                selected.append(member)
                if member.isfile():chosen+=member.size
                if chosen>MAX_SELECTED:raise ValueError("selected original folder expands >500MB")
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
    report["original_source_settings"]={}
    for key in ("TRANS_INTERVAL_STEP","RANDOM_SEED_FLAG","FIX_FLAG",
                "CELLS_INIT_FLAG","NUMBER_OF_CELL","SUN_INIT_FLAG"):
        v=re.search(r"(?im)^\s*"+key+r"\s*=\s*([0-9]+)",text)
        report["original_source_settings"][key]=int(v.group(1)) if v else None
    orig.write_text(text[:match.start()]+"\n&cycle\n out_cycle=3\n in_cycle=80\n/\n"+
                    text[match.end():],encoding="utf-8")
    report["executed_cycle_block"]="&cycle out_cycle=3 in_cycle=80 /"
    report["modified_input_cycle_only"]=True
    binary=ROOT/"src/praparat_cui"
    assert binary.exists(),"original compiler did not produce program"
    before=time.time()
    rc,timed_out=run_cmd(["bash","-c",
                "ulimit -v 3145728; exec "+str(binary)],cwd=work,seconds=180)
    elapsed=time.time()-before
    run={"exit_code":rc,"timed_out":timed_out,"seconds_wall":round(elapsed,3)}
    stored=[]
    for idx in range(1,4):
        resultfile=work/f"cells{idx}.dat.tar.gz"
        item={"nominal_world_step":idx*80,
              "exists":resultfile.exists(),
              "compressed_bytes":resultfile.stat().st_size if resultfile.exists() else 0}
        if resultfile.is_file() and resultfile.stat().st_size>0:
            item["sha256"]=sha256(resultfile)
            with tarfile.open(resultfile,"r:gz") as archive:
                members=archive.getmembers()
                innername=f"cells{idx}.dat"
                info=next((m for m in members if m.isfile() and
                           m.name in (innername,"./"+innername)),None)
                if info is not None and 10<info.size<600_000_000:
                    item["validated_inner_bytes"]=info.size
                    with archive.extractfile(info) as inp:
                        item["first_100_bytes"]=repr(inp.read(100))
        stored.append(item)
    run["original_native_output_archives"]=stored
    lines=(work/"pp0_process.log").read_text(errors="replace").splitlines()
    keys=("CALC_CLL","CONN_CLL","NUMBER_OF_INFO_TRANS",
          "EAT_COUNT*","DEATHS_COUNT*","EXPANSION_COUNT*","CONNECT_COUNT*",
          "DISCONNECT_COUNT*","TURN_BOOKMARKER_COUNT*","TOT_ENERGY*",
          "ALONE_COUNT*","ENERGY_TRANSIT_COUNT*")
    sample_ticks=(10,80,160,200,240)
    history={k:{} for k in sample_ticks}
    stamps=[]
    tick=None
    for line in lines:
        m=re.match(r"^\s*WORLD_STEP\s*=\s*(\d+)",line)
        if m:
            tick=int(m.group(1))
            stamps.append(tick)
        if tick in history:
            for key in keys:
                m=re.match(r"^\s*"+re.escape(key)+r"\s*=\s*(.*)$",line)
                if m:
                    vals=m.group(1).split()
                    if vals:
                        try: history[tick][key]=float(vals[0])
                        except ValueError: history[tick][key]=m.group(1)[:100]
    run["sampled_original_counters"]={str(k):v for k,v in history.items()}
    run["last_world_step"]=stamps[-1] if stamps else None
    run["logged_steps"]=len(stamps)
    run["first_logged_step"]=stamps[0] if stamps else None
    run["nondecreasing_world_step"]=all(x<=y for x,y in zip(stamps,stamps[1:]))
    run["complete_world_step_coverage"]=set(range(1,241)).issubset(set(stamps))
    run["duplicate_step_log_ids"]=sorted(t for t in set(stamps) if stamps.count(t)>1)
    run["original_stdout_tail"]=lines[-18:]
    report["run"]=run
    qualified=(rc==0 and not timed_out and
               run["last_world_step"]==240 and run["nondecreasing_world_step"] and
               run["complete_world_step_coverage"] and
               all(x.get("validated_inner_bytes",0)>10 for x in stored))
    report["science_qualified"]=bool(qualified)
    report["status"]=("ORIGINAL_240_STEP_LIFECYCLE_EXECUTED" if qualified
                       else "ORIGINAL_LIFECYCLE_INCOMPLETE")
    return report
try:
    main()
except Exception as e:
    report["status"]="ORIGINAL_SOURCE_EXECUTION_INCOMPLETE"
    report["error_type"]=type(e).__name__
    report["error"]=str(e)[:420]
finally:
    AUDIT.write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("RB_PP2_LIFECYCLE_RESULT "+json.dumps({k:report.get(k) for k in
        ("status","science_qualified","archive_index","original_cycle_block",
         "original_setting_blocks","selected_input_files","run","error","error_type")},
         ensure_ascii=False)[:12000])
if not report["science_qualified"]:
    raise SystemExit("PP2 LIFECYCLE SOURCE EXECUTION FAIL; inspect JSON audit")
