#!/usr/bin/env python3
"""PP6B: original Fortran native cell-by-cell paired source comparison.

Use SAME PP6 sunlit/unsunlit fixed-seed experiment, not a new physics run.
No loader of arbitrary Python serialized code, no untrusted pickle.
"""
from __future__ import annotations
import hashlib,json,math,pathlib,tarfile

BASE=pathlib.Path("/tmp/pp5b-author-fixed-seed-1")
DARK=pathlib.Path("/tmp/pp6-causal-original-no-sun-rgb")
PP6=pathlib.Path("artifacts/praparat/pp6_original_native_causal_sunlight.json")
DEST=pathlib.Path("artifacts/praparat/pp6b_same_original_cell_world_consequences.json")
DEST.parent.mkdir(parents=True,exist_ok=True)
result={"status":"UNQUALIFIED","protocol":
        "docs/research/RB_PP6B_ORIGINAL_MATCHED_CELL_CONSEQUENCE_ARMED_2026-10-23.md",
        "source_cells_not_edited":True,"additional_simulation_steps":0,"samples":[]}
def ffloat(x):
    return float(x.strip().replace(b"D",b"E"))
def floats(x):
    return tuple(float(t.replace(b"D",b"E")) for t in x.split())
def record(fd,idx,sha):
    raw={}
    for k in range(42):
        line=fd.readline()
        if not line:raise ValueError("original 42-line source truncated")
        sha.update(line)
        if k in (0,1,4,15,18,19,20,21,22,36,37):raw[k]=line
    if int(raw[0])==0:return None
    if idx==1 or int(raw[36])!=0:return None
    xyz=floats(raw[4])
    if len(xyz)!=3:raise ValueError("author source xyz not 3")
    energy=ffloat(raw[15])
    sensor=floats(raw[19]);act=floats(raw[20])
    if len(sensor)!=28 or len(act)!=28:
        raise ValueError("source neural vectors not native 28/28")
    if not math.isfinite(energy) or any(not math.isfinite(x) for x in xyz+sensor+act):
        raise ValueError("source numeric nonfinite")
    return {"age":int(raw[18]),"book":hashlib.sha256(raw[1].strip()).hexdigest(),
      "w1":hashlib.sha256(raw[21].strip()).hexdigest(),
      "w2":hashlib.sha256(raw[22].strip()).hexdigest(),
      "pos":xyz,"E":energy,"in":sensor,"out":act,"NN":int(raw[37])}
def pct(samples):
    a=sorted(samples)
    if not a:return {"n":0,"median":None,"p25":None,"p75":None}
    def at(q):
        k=(len(a)-1)*q
        i=int(k);j=min(len(a)-1,i+1)
        return round(a[i]*(j-k+i)+a[j]*(k-i),6)
    return {"n":len(a),"median":at(.5),"p25":at(.25),"p75":at(.75)}
def compare(step,source_report):
    idx=step//80
    pa=BASE/f"cells{idx}.dat.tar.gz"
    pb=DARK/f"cells{idx}.dat.tar.gz"
    stats={"step":step,"source_same_age_book_cells":0,"sunlit_physical_cells":0,
          "dark_physical_cells":0,"common_physical_slots":0,
          "different_age_or_book_common_slot":0,
          "both_neural_active_original":0,"same_weights_matched_cells":0,
          "changed_original_neighbor_inputs":0,"changed_world_RGB_inputs":0,
          "changed_world_touch_inputs":0,"changed_neural_outputs":0,
          "source_neural_outputs_changed_with_no_input_change":0,
          "native_raw_source_sha256":[]}
    deltas={k:[] for k in ("energy_diff_dark_minus_light","position_difference",
            "neighbor_input_L1","incoming_RGB_L1","incoming_touch_abs","output_L1")}
    with tarfile.open(pa,"r:gz") as ta,tarfile.open(pb,"r:gz") as tb:
        an=f"cells{idx}.dat"
        ra=next((x for x in ta.getmembers() if x.isfile() and x.name in (an,"./"+an)),None)
        rb=next((x for x in tb.getmembers() if x.isfile() and x.name in (an,"./"+an)),None)
        if ra is None or rb is None:raise ValueError("native original archive missing exact step")
        ha,hb=hashlib.sha256(),hashlib.sha256()
        with ta.extractfile(ra) as a,tb.extractfile(rb) as b:
            al=a.readline();bl=b.readline()
            ha.update(al);hb.update(bl)
            if int(al)!=15000 or int(bl)!=15000:raise ValueError("source header not 15000")
            for i in range(1,15001):
                ca=record(a,i,ha);cb=record(b,i,hb)
                stats["sunlit_physical_cells"]+=int(ca is not None)
                stats["dark_physical_cells"]+=int(cb is not None)
                if ca is None or cb is None:continue
                stats["common_physical_slots"]+=1
                if ca["age"]!=cb["age"] or ca["book"]!=cb["book"]:
                    stats["different_age_or_book_common_slot"]+=1
                    continue
                stats["source_same_age_book_cells"]+=1
                deltas["energy_diff_dark_minus_light"].append(cb["E"]-ca["E"])
                deltas["position_difference"].append(
                    math.sqrt(sum((x-y)**2 for x,y in zip(ca["pos"],cb["pos"]))))
                if ca["NN"]!=1 or cb["NN"]!=1:continue
                stats["both_neural_active_original"]+=1
                if ca["w1"]==cb["w1"] and ca["w2"]==cb["w2"]:
                    stats["same_weights_matched_cells"]+=1
                diffs=[abs(x-y) for x,y in zip(ca["in"],cb["in"])]
                internal=sum(diffs[:24]);rgb=sum(diffs[24:27]);touch=diffs[27]
                output=sum(abs(x-y) for x,y in zip(ca["out"],cb["out"]))
                deltas["neighbor_input_L1"].append(internal)
                deltas["incoming_RGB_L1"].append(rgb)
                deltas["incoming_touch_abs"].append(touch)
                deltas["output_L1"].append(output)
                stats["changed_original_neighbor_inputs"]+=int(max(diffs[:24])>1e-8)
                stats["changed_world_RGB_inputs"]+=int(max(diffs[24:27])>1e-8)
                stats["changed_world_touch_inputs"]+=int(touch>1e-8)
                stats["changed_neural_outputs"]+=int(output>1e-8)
                stats["source_neural_outputs_changed_with_no_input_change"]+=int(
                    output>1e-8 and max(diffs)<=1e-8)
            if a.read(1).strip() or b.read(1).strip():
                raise ValueError("trailing original source data")
        stats["native_raw_source_sha256"]=[ha.hexdigest(),hb.hexdigest()]
    expected=next(x for x in source_report["paired_native_snapshots"] if x["step"]==step)
    if stats["native_raw_source_sha256"]!=[
        expected["source_baseline"]["original_native_sha"],
        expected["native_sun_off"]["original_native_sha"]]:
        raise ValueError("actual PP6 source SHA mismatch: worlds not same exact original run")
    if stats["sunlit_physical_cells"]!=expected["source_baseline"]["non_information_non_sun_cells"]:
        raise ValueError("native baseline body cell count inconsistent")
    if stats["dark_physical_cells"]!=expected["native_sun_off"]["non_information_non_sun_cells"]:
        raise ValueError("native dark body cell count inconsistent")
    stats["distributions"]={key:pct(value) for key,value in deltas.items()}
    return stats
try:
    pp=json.loads(PP6.read_text())
    if pp["status"]!="ORIGINAL_SUNLIGHT_CAUSAL_PAIR_COMPLETED" or not pp["source_qualified"]:
        raise ValueError("PP6 actual matched original source not qualified")
    result["samples"]=[compare(k,pp) for k in (80,160,240)]
    result["status"]="ORIGINAL_SAME_CELL_CAUSAL_COMPARISON_EXECUTED"
    result["qualified"]=True
except Exception as e:
    result["status"]="ORIGINAL_MATCHED_CELL_COMPARISON_FAILED"
    result["error_type"]=type(e).__name__
    result["error"]=str(e)[:450]
finally:
    DEST.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print("RB_PP6B_ACTUAL_CELL_RESPONSE "+json.dumps(result)[:12500])
if not result.get("qualified"):raise SystemExit("PP6B source-native comparison FAIL")
