#!/usr/bin/env python3
"""PP6C: original-light-zero numerical-singularity audit, read ONLY source states.

No changes to authors' native engine / RNG / original data or PP6 conditions.
Original Fortran source write_cell_into_one, 42 exact lines per slot.
"""
from __future__ import annotations
import collections
import hashlib
import json
import math
import pathlib
import tarfile

BASE=pathlib.Path("/tmp/pp5b-author-fixed-seed-1")
DARK=pathlib.Path("/tmp/pp6-causal-original-no-sun-rgb")
SOURCE=pathlib.Path("artifacts/praparat/pp6_original_native_causal_sunlight.json")
DEST=pathlib.Path("artifacts/praparat/pp6c_original_zero_sun_emitter_numerical_audit.json")
DEST.parent.mkdir(parents=True, exist_ok=True)
source_meta=json.loads(SOURCE.read_text())
report={"status":"NOT_QUALIFIED","original_source_sha":"e9e105d48ab597612d1749a5f169663559b12287",
        "protocol":"docs/research/RB_PP6C_ORIGINAL_ZERO_LIGHT_SINGULARITY_ARMED_2026-10-23.md",
        "original_physics_edited":False,"extra_source_steps":0,"snapshots":[]}
FIELDS={
    4:("position_xyz",3),
    6:("velocity_xyz",3),
    8:("color_rgb",3),
    9:("alpha_rgb",3),
    10:("emission_IOL_r",1),
    11:("emission_IOL_g",1),
    12:("emission_IOL_b",1),
    15:("energy",1),
    16:("alpha",1),
}
def parse_floats(line,expected):
    try:
        v=[float(s.replace(b"D",b"E")) for s in line.split()]
        if len(v)!=expected:raise ValueError("wrong dimension")
        return v
    except ValueError:
        return None
def inspect(directory,idx,expected):
    tarpath=directory/f"cells{idx}.dat.tar.gz"
    with tarfile.open(tarpath,"r:gz") as tar:
        item=next((m for m in tar.getmembers() if m.isfile()
                    and m.name in (f"cells{idx}.dat",f"./cells{idx}.dat")),None)
        if item is None or item.size>=600_000_000:raise ValueError("native state not bounded")
        counts=collections.Counter()
        nonfinite_by_field=collections.Counter()
        invalid_info_examples=[]
        sun_state={}
        hasher=hashlib.sha256()
        with tar.extractfile(item) as inp:
            headline=inp.readline()
            hasher.update(headline)
            if int(headline.strip())!=15000:raise ValueError("not original 15k source slots")
            for slot in range(1,15001):
                saved={}
                for n in range(42):
                    b=inp.readline()
                    if not b:raise ValueError(f"truncated slot {slot} at field {n}")
                    hasher.update(b)
                    if n in FIELDS or n in (0,36):
                        saved[n]=b
                if int(saved[0].strip())!=1:continue
                counts["live"]+=1
                is_info=int(saved[36].strip())==1
                if is_info:counts["info_total"]+=1
                if slot==1:
                    counts["sun_present"]+=1
                if not is_info and slot!=1:continue
                if is_info and slot!=1:counts["non_sun_info_particles"]+=1
                vals={}
                bad_fields=[]
                for field,(name,count) in FIELDS.items():
                    v=parse_floats(saved[field],count)
                    if v is None or not all(math.isfinite(f) for f in v):
                        if is_info:nonfinite_by_field[name]+=1
                        bad_fields.append(name)
                    vals[name]=v
                if slot==1:
                    sun_state={name:{"value":v,"finite":v is not None and all(math.isfinite(q) for q in v)}
                               for name,v in vals.items()}
                    continue
                if not is_info:continue
                if bad_fields:
                    counts["info_any_invalid"]+=1
                    if len(invalid_info_examples)<3:
                        invalid_info_examples.append({"native_slot":slot,"invalid_fields":bad_fields,
                          "native_color_literal":saved[8][:80].decode("ascii",errors="replace").strip(),
                          "native_alpha_literal":saved[9][:80].decode("ascii",errors="replace").strip()})
                emitted=vals["emission_IOL_r"],vals["emission_IOL_g"],vals["emission_IOL_b"]
                if all(v is not None and all(math.isfinite(q) for q in v) for v in emitted):
                    rgb=[emitted[0][0],emitted[1][0],emitted[2][0]]
                    if max(abs(q) for q in rgb)<1e-12:
                        counts["info_zero_rgb_emission"]+=1
                        if "color_rgb" in bad_fields or "alpha_rgb" in bad_fields:
                            counts["info_zero_rgb_with_invalid_color_or_alpha"]+=1
            if inp.read(1).strip():raise ValueError("nonempty trailing original binary text")
        actual_hash=hasher.hexdigest()
        if actual_hash!=expected["original_native_sha"]:
            raise ValueError("wrong original PP6 raw native source state")
        if counts["info_total"]!=expected["INFO_TRANS_cells"]:
            raise ValueError("source info count mismatch")
        return {"step":idx*80,"original_native_sha":actual_hash,
         "source_info_expected":expected["INFO_TRANS_cells"],
         "counts":dict(counts),
         "nonfinite_information_field_counts":dict(nonfinite_by_field),
         "sun_source_state":sun_state,
         "invalid_info_examples":invalid_info_examples}
try:
    assert source_meta["status"]=="ORIGINAL_SUNLIGHT_CAUSAL_PAIR_COMPLETED"
    assert source_meta["source_qualified"]
    for idx in (1,2,3):
        actual=next(row for row in source_meta["paired_native_snapshots"] if row["step"]==idx*80)
        a=inspect(BASE,idx,actual["source_baseline"])
        b=inspect(DARK,idx,actual["native_sun_off"])
        report["snapshots"].append({"step":idx*80,"source_sunlit":a,"source_sun_RGB_zero":b})
    report["status"]="SAME_ORIGINAL_PP6_INFO_FIELDS_SOURCE_VERIFIED"
    report["qualified"]=True
    report["source_singularity_observed"]=any(
        r["source_sun_RGB_zero"]["counts"].get("info_zero_rgb_with_invalid_color_or_alpha",0)>0
        for r in report["snapshots"])
except Exception as e:
    report["status"]="SOURCE_NATIVE_SINGULARITY_AUDIT_INCOMPLETE"
    report["error_type"]=type(e).__name__
    report["error"]=str(e)[:400]
finally:
    DEST.write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print("RB_PP6C_SINGULARITY "+json.dumps(report)[:15500])
if not report.get("qualified"):
    raise SystemExit("PP6C cannot qualify original numerical-field audit")
