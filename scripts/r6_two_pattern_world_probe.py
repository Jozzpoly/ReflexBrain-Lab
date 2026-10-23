#!/usr/bin/env python3
"""R10: two genuine source-anchored Lenia Orbium histories in a common field.
Protocol frozen in RB_R6_R10_TWO_PATTERN_WORLD_ARMED_2026-10-23.md.
No learning/motivation, external motor, fake collision or per-run parameter tuning.
"""
import json
from pathlib import Path
import numpy as np
from scripts.r6_orbium_probe import N, SEED_PATCH, step, circ_centroid, ROOT, SPEC

T = 800
TIMES = (0, 20, 50, 100, 150, 200, 300, 400, 600, 800)
CENTERS = {
 "horizontal": ((64, 43), (64, 85)),
 "vertical": ((43, 64), (85, 64)),
}
assert N == 128 and SEED_PATCH.shape == (20, 20)
assert len(TIMES) == len(set(TIMES)) and TIMES[-1] == T
def start(center, rotate=False):
    y, x = center
    a = np.zeros((N, N), dtype=np.float64)
    patch = np.rot90(SEED_PATCH, k=2) if rotate else SEED_PATCH
    assert 10 <= y < N-10 and 10 <= x < N-10
    a[y-10:y+10, x-10:x+10] = patch
    return a

def large_torus_components(a, threshold=0.1):
    """Actor labels are NOT retained through merges; this is host-only geometry."""
    alive = a > threshold
    seen = np.zeros_like(alive, dtype=bool)
    masses = []
    cells = []
    for y0, x0 in np.argwhere(alive):
        if seen[y0, x0]:
            continue
        stack = [(int(y0), int(x0))]
        seen[y0, x0] = True
        mass = 0.0
        number = 0
        while stack:
            y, x = stack.pop()
            mass += float(a[y, x])
            number += 1
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                ny, nx = (y+dy)%N, (x+dx)%N
                if alive[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny,nx))
        masses.append(mass)
        cells.append(number)
    sizes=sorted(zip(masses,cells),reverse=True)
    return {"components_gt_0p1":len(sizes),
            "large_components_mass_gt5":sum(m>5 for m,n in sizes),
            "largest_masses":[round(float(m),6) for m,n in sizes[:4]],
            "largest_occupied_cells":[int(n) for m,n in sizes[:4]]}

def shape(a):
    assert a.shape == (N, N) and np.isfinite(a).all()
    if not (a.min() >= -1e-10 and a.max() <= 1+1e-10):
        raise AssertionError("Source material leaves [0,1]")
    return {"mass":round(float(a.sum()),8),
            "active_gt_0p1":int(np.count_nonzero(a>.1)),
            "centroid":circ_centroid(a),
            "components":large_torus_components(a)}

def experiment(layout, centers):
    first, second=centers
    a = start(first)
    b = start(second, rotate=True)
    assert not np.any((a>0)&(b>0)), "initial bodies unexpectedly intersect"
    pair = a+b
    assert pair.max() <= 1+1e-10
    initial = {"A":shape(a),"B":shape(b),"pair":shape(pair)}
    snapshots=[]
    counts={"soloA":0,"soloB":0,"shared":0}
    for t in range(T+1):
        if t in TIMES:
            ref=np.clip(a+b,0,1)
            overlap=(a>.1)&(b>.1)
            other=np.minimum(a,b)
            sample={
              "tick":t,
              "alone_A":shape(a),"alone_B":shape(b),"shared":shape(pair),
              "solo_predicted_occupancy_overlap_gt_0p1":int(np.count_nonzero(overlap)),
              "solo_predicted_overlap_mass":round(float(other.sum()),7),
              "actual_vs_independent_clipped_L1":round(float(np.abs(pair-ref).sum()),8),
              "actual_vs_independent_clipped_Linf":round(float(np.abs(pair-ref).max()),8),
              "shared_mass_minus_solos":round(float(pair.sum()-a.sum()-b.sum()),8)
            }
            snapshots.append(sample)
        if t<T:
            a, b, pair = step(a), step(b), step(pair)
            for key in counts: counts[key]+=1
    assert all(v==T for v in counts.values())
    assert len(snapshots)==len(TIMES)
    summary={
      "layout":layout,"centers":centers,"individual_source_seed":"same seed B rotated 180 degrees",
      "real_step_calls":counts,"initial":initial,
      "first_predicted_solo_overlap":next((x["tick"] for x in snapshots
             if x["solo_predicted_occupancy_overlap_gt_0p1"]>0),None),
      "first_measured_counterfactual_L1_gt1":next((x["tick"] for x in snapshots
             if x["actual_vs_independent_clipped_L1"]>1),None),
      "end":snapshots[-1],
      "snapshots":snapshots
    }
    print("RB_R10_PAIR "+json.dumps({
      "layout":layout,
      "real_step_calls":counts,
      "first_solo_overlap":summary["first_predicted_solo_overlap"],
      "first_pair_divergence_L1_gt1":summary["first_measured_counterfactual_L1_gt1"],
      "end_pair_mass":snapshots[-1]["shared"]["mass"],
      "end_solomasses":[snapshots[-1]["alone_A"]["mass"],snapshots[-1]["alone_B"]["mass"]],
      "end_pair_large_components":snapshots[-1]["shared"]["components"]["large_components_mass_gt5"],
      "end_pair_vs_counterfactual_L1":snapshots[-1]["actual_vs_independent_clipped_L1"],
      "sampled_solo_overlap":{str(x["tick"]):x["solo_predicted_occupancy_overlap_gt_0p1"]
                              for x in snapshots}
    },sort_keys=True))
    return summary

def run():
    empty = np.zeros((N,N))
    assert np.count_nonzero(step(empty))==0, "Lenia empty seed incorrectly self-created"
    output = {
      "title":"R10 source-anchored original Orbium two-pattern common-field experiment",
      "source_blob":SPEC["sourceBlob"],
      "source_script":"scripts/r6_orbium_probe.py",
      "source_limit":"Same encoded original Lenia rule, independently reproduced in NumPy; no original notebook runtime parity",
      "protocol":"docs/research/RB_R6_R10_TWO_PATTERN_WORLD_ARMED_2026-10-23.md",
      "grid":[N,N],"timepoints":TIMES,"planned_solver_updates":3*T*len(CENTERS),
      "cases":[experiment(k,v) for k,v in CENTERS.items()]
    }
    artifact=Path("artifacts/r6/r10_two_pattern_shared_world.json")
    artifact.parent.mkdir(parents=True,exist_ok=True)
    artifact.write_text(json.dumps(output,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("RB_R10_TOTAL_ACTUAL_STEPS "+str(3*T*len(CENTERS)))
    print("RB_R10_ARTIFACT "+str(artifact))
    return output
if __name__=="__main__":
    run()
