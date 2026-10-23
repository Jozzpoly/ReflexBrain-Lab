#!/usr/bin/env python3
"""PP5B identical-original-physics seeded source-control reproduction.

This changes only the ORIGINAL authors' /system/ RANDOM_SEED_FLAG from
clock-based 2 to read seed.ini 1 in TWO matching source worlds.
Original Fortran, cell genotype, material, world, clocks/physics untouched.
"""
import hashlib,json,os,pathlib,re,resource,shutil,subprocess,tarfile,time

SRC=pathlib.Path("/tmp/pp2-preserved-dumbbell-normal")
ROOT=pathlib.Path("/tmp/openpraparat-original")
BINARY=ROOT/"src/praparat_cui"
META=pathlib.Path("artifacts/praparat/pp2_original_normal_lifecycle_audit.json")
REPORT=pathlib.Path("artifacts/praparat/pp5b_original_author_seeded_pair.json")
SOURCE_SHA="e9e105d48ab597612d1749a5f169663559b12287"
REPORT.parent.mkdir(parents=True,exist_ok=True)
result={"status":"UNQUALIFIED","original_source_sha":SOURCE_SHA,
        "protocol":"docs/research/RB_PP5B_FIXED_SEED_NATIVE_REPLAY_ARMED_2026-10-23.md",
        "source_edited":False,"world_cell_genome_edited":False,
        "explicit_experimental_change":"RANDOM_SEED_FLAG 2 -> 1 identically in two isolated copies",
        "source_qualified":False}
def sha(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1<<20),b""):h.update(chunk)
    return h.hexdigest()
def snapshot(folder,i):
    outer=folder/f"cells{i}.dat.tar.gz"
    assert outer.is_file() and outer.stat().st_size>0
    name=f"cells{i}.dat"
    with tarfile.open(outer,"r:gz") as tar:
        files=[m for m in tar.getmembers() if m.isfile() and m.name in (name,"./"+name)]
        assert len(files)==1
        h=hashlib.sha256()
        with tar.extractfile(files[0]) as handle:
            for chunk in iter(lambda:handle.read(1<<20),b""):h.update(chunk)
        return {"step":80*i,"original_native_raw_sha256":h.hexdigest(),
                "original_raw_bytes":files[0].size}
def source_stats(logpath):
    steps=[]
    points={}
    seed_messages=[]
    cur=None
    with logpath.open(errors="replace") as f:
        for line in f:
            if "Read random seed" in line or "Seed set as random" in line or "Seed dose not set" in line:
                seed_messages.append(line.strip()[:100])
            m=re.search(r"^\s*WORLD_STEP\s*=\s*(\d+)",line)
            if m:
                cur=int(m.group(1));steps.append(cur)
            if cur in (81,161,240):
                for key in ("CALC_CLL","CONN_CLL","NUMBER_OF_INFO_TRANS"):
                    a=re.search(r"^\s*"+key+r"\s*=\s*(\d+)",line)
                    if a:points.setdefault(str(cur),{})[key]=int(a.group(1))
    return {"steps_counted":len(steps),
      "all_steps_present":set(range(1,241)).issubset(set(steps)),
      "nondecreasing_steps":all(x<=y for x,y in zip(steps,steps[1:])),
      "last_step":steps[-1] if steps else None,
      "seed_messages":seed_messages[:4],
      "counters":points}
def memlimit():
    n=3*1024**3
    resource.setrlimit(resource.RLIMIT_AS,(n,n))
def original_system_seed_flag(text):
    sections=list(re.finditer(r"(?ims)^\s*&system\b.*?^\s*/",text))
    if len(sections)!=1:raise ValueError("not exactly one original Fortran &system namelist")
    section=sections[0].group(0)
    hits=list(re.finditer(r"(?mi)^\s*RANDOM_SEED_FLAG\s*=\s*2(\s*(?:!.*)?)$",section))
    if len(hits)!=1:raise ValueError("source flag not unique or not 2: cannot alter")
    repl=re.sub(r"(?mi)^(\s*RANDOM_SEED_FLAG\s*=\s*)2(\s*(?:!.*)?)$",r"\g<1>1\2",section,count=1)
    return text[:sections[0].start()]+repl+text[sections[0].end():]
try:
    metadata=json.loads(META.read_text())
    assert metadata["science_qualified"] is True
    assert subprocess.check_output(["git","-C",str(ROOT),"rev-parse","HEAD"],text=True).strip()==SOURCE_SHA
    assert BINARY.is_file()
    author=metadata["selected_input_files"]
    assert all(k in author for k in ("input","cells_file","field.d"))
    seeded=SRC/"seed.ini"
    assert seeded.is_file() and 0<seeded.stat().st_size<1024*1024, "original clock seeded author source did not leave seed.ini"
    result["original_seed_ini_sha256"]=sha(seeded)
    result["original_seed_ini_bytes"]=seeded.stat().st_size
    authored_input=(SRC/"input").read_text()
    assert "in_cycle=80" in authored_input.replace(" ","")
    assert "out_cycle=3" in authored_input.replace(" ","")
    experiment_input=original_system_seed_flag(authored_input)
    assert experiment_input!=authored_input
    result["author_input_cycle_override_sha256"]=hashlib.sha256(authored_input.encode()).hexdigest()
    result["experimental_input_seed_flag_1_sha256"]=hashlib.sha256(experiment_input.encode()).hexdigest()
    for key,m in author.items():
        if key=="input":continue
        actual=sha(SRC/key)
        assert actual==m["sha256"],"original biological/world source input was modified: "+key
    records=[]
    for i in (1,2):
        folder=pathlib.Path(f"/tmp/pp5b-author-fixed-seed-{i}")
        folder.mkdir(exist_ok=False)
        source_checks={}
        for key in author:
            dest=folder/key
            dest.parent.mkdir(parents=True,exist_ok=True)
            if key=="input":
                dest.write_text(experiment_input)
            else:
                shutil.copyfile(SRC/key,dest)
            source_checks[key]=sha(dest)
        shutil.copyfile(seeded,folder/"seed.ini")
        if sha(folder/"seed.ini")!=result["original_seed_ini_sha256"]:
            raise ValueError("seed.ini identity lost")
        assert source_checks["input"]==result["experimental_input_seed_flag_1_sha256"]
        expected_files={key:meta["sha256"] for key,meta in author.items() if key!="input"}
        assert all(source_checks[key]==v for key,v in expected_files.items())
        start=time.monotonic()
        with (folder/"native_process.log").open("wb") as log:
            try:
                code=subprocess.run([str(BINARY)],cwd=folder,stdout=log,
                     stderr=subprocess.STDOUT,env={**os.environ,"OMP_NUM_THREADS":"1"},
                     preexec_fn=memlimit,timeout=180).returncode
                timed_out=False
            except subprocess.TimeoutExpired:
                code=None;timed_out=True
        timing=time.monotonic()-start
        stats=source_stats(folder/"native_process.log")
        snaps=[snapshot(folder,idx) for idx in (1,2,3)]
        records.append({"run":i,"status":code,"timed_out":timed_out,
                        "seconds":round(timing,3),"source_log":stats,
                        "raw_native_snapshots":snaps,"initial_source_hashes":source_checks})
    result["runs"]=records
    qualified=all(x["status"]==0 and not x["timed_out"] and
                  x["source_log"]["last_step"]==240 and
                  x["source_log"]["all_steps_present"] and
                  x["source_log"]["nondecreasing_steps"] and
                  x["source_log"]["seed_messages"] and
                  any("Read random seed" in a for a in x["source_log"]["seed_messages"])
                  for x in records)
    result["source_qualified"]=bool(qualified)
    result["raw_native_same"]=[
        records[0]["raw_native_snapshots"][i]["original_native_raw_sha256"]==
        records[1]["raw_native_snapshots"][i]["original_native_raw_sha256"]
        for i in range(3)]
    if qualified:
        result["status"]=("MATCHED_SAME_SOURCE_SEED_REPLAY_EXACT" if all(result["raw_native_same"])
                          else "MATCHED_SEED_REPLAY_NOT_EXACT")
    else:result["status"]="ORIGINAL_MATCHED_SOURCE_INCOMPLETE"
except Exception as exc:
    result["status"]="ORIGINAL_MATCHED_SOURCE_INCOMPLETE"
    result["error_type"]=type(exc).__name__
    result["error"]=str(exc)[:500]
finally:
    REPORT.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print("RB_PP5B_MATCHED_SEED "+json.dumps({
       "status":result["status"],"qualified":result["source_qualified"],
       "identical_each_80step_snapshot":result.get("raw_native_same"),
       "original_native_seed_file_bytes":result.get("original_seed_ini_bytes"),
       "runA":result.get("runs",[None,None])[0] if result.get("runs") else None,
       "runB":result.get("runs",[None,None])[1] if result.get("runs") else None,
       "error":result.get("error")
       },ensure_ascii=False)[:12000])
if not result["source_qualified"]:
    raise SystemExit("PP5B source execution incomplete; see compact artifact")
