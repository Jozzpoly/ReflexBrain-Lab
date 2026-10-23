#!/usr/bin/env python3
"""PP6 original-source causal sunlight ablation after PP5B fixed-seed parity.

NO source engine/genome edits, only native SUN_IOL RGB illumination namelist.
Single experimental world vs exactly source-paired native baseline.
"""
from __future__ import annotations
import hashlib,json,math,os,pathlib,re,resource,shutil,subprocess,tarfile,time

ROOT=pathlib.Path("/tmp/openpraparat-original")
ORIGIN=pathlib.Path("/tmp/pp5b-author-fixed-seed-1")
EXPERIMENT=pathlib.Path("/tmp/pp6-causal-original-no-sun-rgb")
SEED_META=pathlib.Path("artifacts/praparat/pp5b_original_author_seeded_pair.json")
PP2_META=pathlib.Path("artifacts/praparat/pp2_original_normal_lifecycle_audit.json")
ARTIFACT=pathlib.Path("artifacts/praparat/pp6_original_native_causal_sunlight.json")
SOURCE_SHA="e9e105d48ab597612d1749a5f169663559b12287"
ARTIFACT.parent.mkdir(parents=True,exist_ok=True)
out={"status":"NOT_QUALIFIED","protocol":"docs/research/RB_PP6_CAUSAL_NATIVE_SUNLIGHT_ARMED_2026-10-23.md",
 "source_sha":SOURCE_SHA,"source_code_edited":False,
 "original_world_condition_changed_only":"SUN_IOLr/g/b -> 0.0d0",
 "no_organism_learning_or_alive_claim":True}
def filehash(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for c in iter(lambda:f.read(1<<20),b""):h.update(c)
    return h.hexdigest()
def change_only_sun_rgb(original):
    blocks=list(re.finditer(r"(?ims)^\s*&world\b.*?^\s*/",original))
    if len(blocks)!=1:raise ValueError("source original world namelist ambiguity")
    match=blocks[0]
    section=match.group(0)
    original_values={}
    defaults={"SUN_IOLr":10.0,"SUN_IOLg":10.0,"SUN_IOLb":8.0}
    for name,default in defaults.items():
        pattern=rf"(?mi)^(\s*{name}\s*=\s*)([-+0-9.eEdD]+)(\s*(?:!.*)?)$"
        found=list(re.finditer(pattern,section))
        if len(found)>1:raise ValueError("duplicate original sun param "+name)
        if found:
            native=found[0].group(2)
            original_values[name]=float(native.replace("d","e").replace("D","E"))
            section=re.sub(pattern,rf"\g<1>0.0d0\3",section,count=1)
        else:
            original_values[name]=default
            cut=re.search(r"(?m)^\s*/\s*$",section)
            if not cut:raise ValueError("source namelist world closure missing")
            section=section[:cut.start()]+f" {name}=0.0d0\n"+section[cut.start():]
    if sum(abs(v) for v in original_values.values())<1e-8:
        raise ValueError("original world already dark, source perturbation null at configuration")
    return original[:match.start()]+section+original[match.end():],original_values

def analyze_original_cells(dir,idx):
    outer=dir/f"cells{idx}.dat.tar.gz"
    assert outer.is_file() and outer.stat().st_size>0
    with tarfile.open(outer,"r:gz") as tf:
        name=f"cells{idx}.dat"
        members=[m for m in tf.getmembers() if m.isfile() and m.name in (name,"./"+name)]
        if len(members)!=1:raise ValueError("native original cell snapshot missing")
        sha=hashlib.sha256()
        count=0;signal=0;edges_twice=0;computational=0
        sensor_light_cells=0;sensor_touch_cells=0
        sensor_light_strength=0.;sensor_touch_strength=0.;energy_non_sun_non_info=0.
        with tf.extractfile(members[0]) as raw:
            first=raw.readline();sha.update(first)
            if int(first.strip())!=15000:raise ValueError("native source slot header mismatch")
            for i in range(1,15001):
                record=[]
                for k in range(42):
                    line=raw.readline()
                    if not line:raise ValueError(f"native source slot {i} truncated at {k}")
                    sha.update(line)
                    # no need store the long author genome or weight arrays in RAM
                    if k in (0,15,19,26,36,37):record.append((k,line))
                fields={k:v for k,v in record}
                active=int(fields[0].strip())
                if not active:continue
                count+=1
                inf=int(fields[36].strip())
                if inf==1:signal+=1
                links=[int(x) for x in fields[26].split()]
                if len(links)!=8:raise ValueError("invalid original graph flags")
                edges_twice+=sum(x==1 for x in links)
                if i==1 or inf!=0:continue
                computational+=1
                energy_non_sun_non_info+=float(fields[15].strip().replace(b"D",b"E"))
                if int(fields[37].strip())==1:
                    values=[float(x.replace(b"D",b"E")) for x in fields[19].split()]
                    if len(values)!=28 or not all(math.isfinite(v) for v in values):
                        raise ValueError("native input channels unqualified")
                    rgb=sum(abs(v) for v in values[24:27])
                    touch=abs(values[27])
                    if rgb>1e-8:sensor_light_cells+=1
                    if touch>1e-8:sensor_touch_cells+=1
                    sensor_light_strength+=rgb
                    sensor_touch_strength+=touch
            if raw.read(1).strip():raise ValueError("trailing original raw source state")
        return {"step":idx*80,
          "original_native_sha":sha.hexdigest(),"raw_bytes":members[0].size,
          "active_cells":count,"INFO_TRANS_cells":signal,
          "original_spring_edges":edges_twice//2,
          "non_information_non_sun_cells":computational,
          "non_information_non_sun_energy":round(energy_non_sun_non_info,6),
          "native_neural_cells_receiving_RGB":sensor_light_cells,
          "native_neural_cells_receiving_touch":sensor_touch_cells,
          "native_incoming_RGB_abs_sum":round(sensor_light_strength,6),
          "native_incoming_touch_abs_sum":round(sensor_touch_strength,6)}
def source_log(logfile):
    stamps=[];current=None;points={}
    seed_mode=[]
    with logfile.open(errors="replace") as f:
        for line in f:
            if "Read random seed" in line:seed_mode.append("Read random seed")
            m=re.match(r"^\s*WORLD_STEP\s*=\s*(\d+)",line)
            if m:current=int(m.group(1));stamps.append(current)
            if current in (81,161,240):
                for key in ("CALC_CLL","CONN_CLL","NUMBER_OF_INFO_TRANS"):
                    z=re.match(r"^\s*"+key+r"\s*=\s*(\d+)",line)
                    if z:points.setdefault(str(current),{})[key]=int(z.group(1))
    return {"logged_steps":len(stamps),"last_step":stamps[-1] if stamps else None,
            "all_1to240":set(range(1,241)).issubset(set(stamps)),
            "seed_mode":seed_mode[:2],
            "native_counters":points}
def bounded():
    limit=3*1024*1024*1024
    resource.setrlimit(resource.RLIMIT_AS,(limit,limit))
try:
    published=json.loads(PP2_META.read_text())
    seed_control=json.loads(SEED_META.read_text())
    if seed_control.get("status")!="MATCHED_SAME_SOURCE_SEED_REPLAY_EXACT" or not all(seed_control["raw_native_same"]):
        raise ValueError("PP5B original source duplicate histories NOT proven identical")
    assert subprocess.check_output(["git","-C",str(ROOT),"rev-parse","HEAD"],text=True).strip()==SOURCE_SHA
    assert (ROOT/"src/praparat_cui").is_file()
    pristine=published["selected_input_files"]
    EXPERIMENT.mkdir(exist_ok=False)
    source_checks={}
    for key,original_meta in pristine.items():
        if key=="input":continue
        p=ORIGIN/key
        if filehash(p)!=original_meta["sha256"]:raise ValueError("baseline original authored physics/genome changed")
        dest=EXPERIMENT/key
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(p,dest)
        source_checks[key]=filehash(dest)
    seed=ORIGIN/"seed.ini"
    assert seed.is_file()
    shutil.copy2(seed,EXPERIMENT/"seed.ini")
    assert filehash(EXPERIMENT/"seed.ini")==filehash(seed)==seed_control["original_seed_ini_sha256"]
    original=(ORIGIN/"input").read_text()
    changed,baselines=change_only_sun_rgb(original)
    assert changed!=original
    assert re.search(r"(?mi)^\s*RANDOM_SEED_FLAG\s*=\s*1\b",changed)
    (EXPERIMENT/"input").write_text(changed)
    out["original_author_sun_RGB_baseline"]=baselines
    out["initial_seed_sha256"]=filehash(seed)
    out["experiment_input_sha256"]=filehash(EXPERIMENT/"input")
    out["baseline_input_sha256"]=filehash(ORIGIN/"input")
    out["original_nondiffering_input_source_sha256"]=source_checks
    before=time.monotonic()
    with (EXPERIMENT/"pp6_source.log").open("wb") as f:
        try:
            code=subprocess.run([str(ROOT/"src/praparat_cui")],cwd=EXPERIMENT,
                stdout=f,stderr=subprocess.STDOUT,preexec_fn=bounded,
                timeout=180,env={**os.environ,"OMP_NUM_THREADS":"1"}).returncode
            timedout=False
        except subprocess.TimeoutExpired:
            timedout=True;code=None
    out["program"]={"return_code":code,"timed_out":timedout,
                    "wall_seconds":round(time.monotonic()-before,3),
                    "source_log":source_log(EXPERIMENT/"pp6_source.log")}
    if code!=0 or timedout or not out["program"]["source_log"]["all_1to240"] or out["program"]["source_log"]["last_step"]!=240:
        raise ValueError("original experimental physics did not run complete 240 steps")
    if not out["program"]["source_log"]["seed_mode"]:
        raise ValueError("source experimental program failed fixed-seed initialization")
    evidence=[]
    for idx in (1,2,3):
        baseline=analyze_original_cells(ORIGIN,idx)
        treated=analyze_original_cells(EXPERIMENT,idx)
        assert baseline["original_native_sha"]==seed_control["runs"][0]["raw_native_snapshots"][idx-1]["original_native_raw_sha256"]
        evidence.append({"step":idx*80,"source_baseline":baseline,
           "native_sun_off":treated,
           "raw_state_changed":baseline["original_native_sha"]!=treated["original_native_sha"],
           "delta_total_active_cells":treated["active_cells"]-baseline["active_cells"],
           "delta_spring_edges":treated["original_spring_edges"]-baseline["original_spring_edges"],
           "delta_non_sun_noninfo_energy":
              round(treated["non_information_non_sun_energy"]-baseline["non_information_non_sun_energy"],6),
           "delta_native_neural_RGB_sensed":
              treated["native_neural_cells_receiving_RGB"]-baseline["native_neural_cells_receiving_RGB"]})
    out["paired_native_snapshots"]=evidence
    out["status"]="ORIGINAL_SUNLIGHT_CAUSAL_PAIR_COMPLETED"
    out["source_qualified"]=True
except Exception as exc:
    out["status"]="CAUSAL_SOURCE_GATE_INCOMPLETE"
    out["error_type"]=type(exc).__name__
    out["error"]=str(exc)[:500]
finally:
    ARTIFACT.write_text(json.dumps(out,indent=2)+"\n",encoding="utf-8")
    print("RB_PP6_SUN_CAUSAL "+json.dumps({
       "status":out["status"],"qualified":out.get("source_qualified"),
       "baseline_sun":out.get("original_author_sun_RGB_baseline"),
       "outcome":out.get("paired_native_snapshots"),
       "experiment_sec":out.get("program",{}).get("wall_seconds"),
       "error":out.get("error")
    })[:15000])
if not out.get("source_qualified"):raise SystemExit("PP6 source causal gate incomplete")
