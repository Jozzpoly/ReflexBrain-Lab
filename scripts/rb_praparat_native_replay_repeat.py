#!/usr/bin/env python3
"""PP5A source-only original native saved-world replay identity audit.

Compare two separately initialized author programs in SAME CI environment.
No code/data changes except identical PP2 &cycle console duration; preserve
uncompressed inner original cell file hashes, not potentially different tar
header timestamps. No physical perturbation or learner.
"""
import hashlib, json, os, pathlib, re, resource, shutil, subprocess, tarfile, time

ROOT=pathlib.Path("/tmp/openpraparat-original")
FIRST=pathlib.Path("/tmp/pp2-preserved-dumbbell-normal")
SECOND=pathlib.Path("/tmp/pp5a-repeat-original-normal")
BINARY=ROOT/"src/praparat_cui"
ARTIFACT=pathlib.Path("artifacts/praparat/pp5a_original_same_fixture_replay.json")
META=pathlib.Path("artifacts/praparat/pp2_original_normal_lifecycle_audit.json")
SHA="e9e105d48ab597612d1749a5f169663559b12287"
ARTIFACT.parent.mkdir(parents=True,exist_ok=True)
report={"protocol":"docs/research/RB_PP5A_NATIVE_REPLAY_REPRODUCIBILITY_ARMED_2026-10-23.md",
 "source_commit":SHA,"identical_biology_source":True,
 "physics_perturbations":0,"status":"UNTESTED_REPRODUCIBILITY"}
def hash_file(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for p in iter(lambda:f.read(1024*1024),b""):h.update(p)
    return h.hexdigest()
def inner_hash(folder,idx):
    file=folder/f"cells{idx}.dat.tar.gz"
    assert file.is_file() and file.stat().st_size>0, f"missing original output {file}"
    with tarfile.open(file,"r:gz") as tf:
        inner=f"cells{idx}.dat"
        members=[z for z in tf.getmembers() if z.isfile() and z.name in (inner,"./"+inner)]
        if len(members)!=1:raise ValueError("missing/ambiguous native inner original state")
        h=hashlib.sha256()
        with tf.extractfile(members[0]) as stream:
            for p in iter(lambda:stream.read(1024*1024),b""):h.update(p)
        return {"inner_raw_bytes":members[0].size,
                "inner_raw_sha256":h.hexdigest(),"archive_bytes":file.stat().st_size}
def source_seed_mode(input_text):
    # One uncommented Fortran namelist assignment only; inherited default is 0.
    t="\n".join(x.split("!")[0] for x in input_text.splitlines())
    matches=re.findall(r"(?mi)^\s*RANDOM_SEED_FLAG\s*=\s*(\d+)",t)
    if len(matches)>1:raise ValueError("ambiguous author original RNG namelist")
    return {"RANDOM_SEED_FLAG":int(matches[0]) if matches else 0,
            "explicit_in_input":bool(matches)}
def preexec():
    limit=3*1024*1024*1024
    resource.setrlimit(resource.RLIMIT_AS,(limit,limit))
def original_log(folder,name):
    path=folder/name
    assert path.exists()
    step=[]
    counters={}
    seed_mode=[]
    current=None
    with path.open(errors="replace") as f:
        for line in f:
            if "Seed dose not set" in line or "Read random seed" in line or "Seed set as random" in line:
                seed_mode.append(line.strip()[:150])
            m=re.search(r"^\s*WORLD_STEP\s*=\s*(\d+)",line)
            if m:
                current=int(m.group(1))
                step.append(current)
            if current in (81,161,240):
                for key in ("CALC_CLL","CONN_CLL","NUMBER_OF_INFO_TRANS"):
                    m=re.match(r"^\s*"+key+r"\s*=\s*([0-9]+)",line)
                    if m:counters.setdefault(str(current),{})[key]=int(m.group(1))
    return {"first_step":step[0] if step else None,
            "last_step":step[-1] if step else None,
            "all_1to240_present":set(range(1,241)).issubset(set(step)),
            "nondecreasing":all(a<=b for a,b in zip(step,step[1:])),
            "number_of_printed_step_markers":len(step),
            "seed_mode_messages":seed_mode[:4],
            "source_preupdate_counters":counters}
try:
    meta=json.loads(META.read_text())
    if meta.get("science_qualified") is not True:raise ValueError("PP2 real source unavailable")
    actual_sha=subprocess.check_output(["git","-C",str(ROOT),"rev-parse","HEAD"],text=True).strip()
    assert actual_sha==SHA
    assert BINARY.is_file()
    authored=meta["selected_input_files"]
    assert set(("input","cells_file","field.d")).issubset(authored)
    SECOND.mkdir(exist_ok=False)
    pristine={}
    for name,srcmeta in authored.items():
        src=FIRST/name
        assert src.is_file(),f"source author input file missing {name}"
        # original executable is allowed to rewrite console cycle; other original
        # world files MUST still equal their pre-run archive provenance.
        if name!="input" and hash_file(src)!=srcmeta["sha256"]:
            raise ValueError("original preserved source input changed during PP2: "+name)
        dest=SECOND/name
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(src,dest)
        pristine[name]={"first_source_hash":hash_file(src),
                        "repeat_source_hash":hash_file(dest),
                        "matches_orig_authored":(hash_file(src)==srcmeta["sha256"])}
        if pristine[name]["first_source_hash"]!=pristine[name]["repeat_source_hash"]:
            raise ValueError("initial input clone SHA mismatch")
    original_input=(FIRST/"input").read_text()
    assert (SECOND/"input").read_text()==original_input
    if "out_cycle=3" not in original_input.replace(" ","") or "in_cycle=80" not in original_input.replace(" ",""):
        raise ValueError("not the qualified original PP2 cycle-only input")
    report["input"]={"original_archived_files":pristine,
                     "author_source_seed_mode":source_seed_mode(original_input),
                     "first_work_seed_ini_present":(FIRST/"seed.ini").exists(),
                     "source_log_seed":original_log(FIRST,"pp0_process.log")["seed_mode_messages"]}
    start=time.monotonic()
    with (SECOND/"pp5a_process.log").open("wb") as out:
        try:
            proc=subprocess.run([str(BINARY)],cwd=SECOND,stdout=out,
                      stderr=subprocess.STDOUT,env={**os.environ,"OMP_NUM_THREADS":"1"},
                      preexec_fn=preexec,timeout=180,check=False)
            status,expired=proc.returncode,False
        except subprocess.TimeoutExpired:
            status,expired=None,True
    elapsed=time.monotonic()-start
    report["repeat_run"]={"return_code":status,"timed_out":expired,"wall_sec":round(elapsed,3),
                          "source_log":original_log(SECOND,"pp5a_process.log")}
    report["first_run"]={"source_log":original_log(FIRST,"pp0_process.log")}
    report["identical_native_snapshots"]=[]
    for i in (1,2,3):
        a=inner_hash(FIRST,i)
        b=inner_hash(SECOND,i)
        report["identical_native_snapshots"].append({
            "step":i*80,"first":a,"repeat":b,
            "same_raw_native_bytes":a["inner_raw_sha256"]==b["inner_raw_sha256"]})
    good=status==0 and not expired and all(
        r["source_log"]["all_1to240_present"] and r["source_log"]["nondecreasing"]
        and r["source_log"]["last_step"]==240 for r in
        (report["first_run"],report["repeat_run"]))
    if not good:
        report["status"]="INCOMPLETE_SOURCE_REPLAY"
    else:
        same=all(x["same_raw_native_bytes"] for x in report["identical_native_snapshots"])
        report["source_execution_qualified"]=True
        report["identical_original_state_replay"]=same
        report["status"]=("ORIGINAL_STATE_REPLAY_BITWISE_IDENTICAL" if same
                          else "ORIGINAL_STATE_REPLAY_DIFFERED")
except Exception as exc:
    report["status"]="UNQUALIFIED_SOURCE_REPLAY"
    report["error_type"]=type(exc).__name__
    report["error"]=str(exc)[:370]
finally:
    ARTIFACT.write_text(json.dumps(report,indent=2)+"\n")
    print("RB_PP5A_REPLAY "+json.dumps({
        "status":report["status"],
        "source_execution_qualified":report.get("source_execution_qualified"),
        "strict_identical":report.get("identical_original_state_replay"),
        "original_seed":report.get("input",{}).get("author_source_seed_mode"),
        "native_hashes":report.get("identical_native_snapshots"),
        "repeat_run_sec":report.get("repeat_run",{}).get("wall_sec"),
        "first_native_counter":report.get("first_run",{}).get("source_log",{}).get("source_preupdate_counters"),
        "repeat_native_counter":report.get("repeat_run",{}).get("source_log",{}).get("source_preupdate_counters"),
        "error":report.get("error")
    })[:8300])
if not report.get("source_execution_qualified"):
    raise SystemExit("PP5A source reproducibility gate incomplete; inspect report")
