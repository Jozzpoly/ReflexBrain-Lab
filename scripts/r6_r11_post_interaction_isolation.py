#!/usr/bin/env python3
"""R11 one-configuration postinteraction isolation, no controller or learned labels.
See PRE-REGISTERED RB_R6_R11_POST_INTERACTION_INDIVIDUATION_ARMED_2026-10-23.
"""
import json
import numpy as np
from pathlib import Path
from scripts.r6_orbium_probe import N,step,circ_centroid,ROOT,SPEC
from scripts.r6_two_pattern_world_probe import start,CENTERS,large_torus_components

def torus_center(coords,field):
    """Weighted circular centroid of one *diagnostically segmented* component."""
    ys=np.array([y for y,x in coords])
    xs=np.array([x for y,x in coords])
    w=field[ys,xs]
    phase_y=np.angle(np.sum(w*np.exp(2j*np.pi*ys/N)))%(2*np.pi)
    phase_x=np.angle(np.sum(w*np.exp(2j*np.pi*xs/N)))%(2*np.pi)
    return float(phase_y*N/(2*np.pi)),float(phase_x*N/(2*np.pi))

def physical_components(field):
    mask=field>.1
    seen=np.zeros_like(mask,dtype=bool)
    clusters=[]
    for row,col in np.argwhere(mask):
        row=int(row);col=int(col)
        if seen[row,col]:continue
        todo=[(row,col)]
        seen[row,col]=True
        coords=[]
        while todo:
            y,x=todo.pop()
            coords.append((y,x))
            for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
                yy,xx=(y+dy)%N,(x+dx)%N
                if mask[yy,xx] and not seen[yy,xx]:
                    seen[yy,xx]=True
                    todo.append((yy,xx))
        mass=float(sum(float(field[y,x]) for y,x in coords))
        if mass>5:
            cy,cx=torus_center(coords,field)
            clusters.append({"mass":mass,"cells":coords,"centroid":[cy,cx]})
    return sorted(clusters,key=lambda x:x["mass"],reverse=True)

def torus_distance2(yy,xx,cy,cx):
    dy=(yy-cy+N/2)%N-N/2
    dx=(xx-cx+N/2)%N-N/2
    return dy**2+dx**2

def diagnostics(f):
    assert np.isfinite(f).all() and 0<=f.min() and f.max()<=1
    comp=large_torus_components(f)
    return {"mass":float(f.sum()),"occupied_gt_0p1":int((f>.1).sum()),
            "large_components":comp["large_components_mass_gt5"],
            "largest_masses":comp["largest_masses"][:4],
            "centroid":circ_centroid(f)}

def main():
    one,two=CENTERS["horizontal"]
    shared=start(one)+start(two,rotate=True)
    solo=start(one)
    actual_before=0
    for i in range(150):
        shared=step(shared)
        solo=step(solo)
        actual_before+=1
    assert actual_before==150
    components=physical_components(shared)
    if len(components)!=2:
        raise AssertionError(f"R11 precondition false: {len(components)} mass>5 components at t150")
    keep,remove=sorted(components,key=lambda c:c["centroid"][1])
    (ky,kx),(ry,rx)=keep["centroid"],remove["centroid"]
    yy,xx=np.indices((N,N))
    # Host Voronoi geometry. It cannot magically identify any living being.
    cut=torus_distance2(yy,xx,ry,rx)<torus_distance2(yy,xx,ky,kx)
    if any(cut[y,x] for y,x in keep["cells"]):
        raise AssertionError("Prearmed Voronoi partition would damage protected >0.1 component")
    removed=float(shared[cut].sum())
    isolated=shared.copy()
    isolated[cut]=0
    sham=shared.copy()
    untouched=shared.copy()
    assert np.array_equal(sham,untouched) and removed>0
    steps={k:0 for k in ("original_shared","excised","sham","original_solo")}
    observations=[{"tick":150,"phase":"pre-intervention",
                   "original_shared":diagnostics(shared),"original_solo":diagnostics(solo)},
                  {"tick":150,"phase":"post-intervention",
                   "original_shared":diagnostics(untouched),"excised":diagnostics(isolated),
                   "sham":diagnostics(sham),"original_solo":diagnostics(solo)}]
    for t in range(151,801):
        untouched=step(untouched);steps["original_shared"]+=1
        isolated=step(isolated);steps["excised"]+=1
        sham=step(sham);steps["sham"]+=1
        solo=step(solo);steps["original_solo"]+=1
        if not np.array_equal(sham,untouched):
            raise AssertionError(f"R11 unmodified identical histories differ at t{t}")
        if t in (151,200,300,400,600,800):
            observations.append({"tick":t,"phase":"after",
              "original_shared":diagnostics(untouched),
              "excised":diagnostics(isolated),
              "sham":diagnostics(sham),
              "original_solo":diagnostics(solo),
              "L1_excised_vs_untouched":float(np.abs(isolated-untouched).sum())})
    assert all(x==650 for x in steps.values())
    result={"protocol":"docs/research/RB_R6_R11_POST_INTERACTION_INDIVIDUATION_ARMED_2026-10-23.md",
      "source_blob":SPEC["sourceBlob"],
      "frozen_initial_horizontal_centers":CENTERS["horizontal"],
      "time_first_shared_state":150,
      "precut_actual_steps":actual_before,
      "postcut_actual_steps":steps,
      "t150_component_masses":[keep["mass"],remove["mass"]],
      "t150_component_centers":[keep["centroid"],remove["centroid"]],
      "removed_mass":removed,
      "fraction_of_shared_mass_removed":removed/float(shared.sum()),
      "untouched_protected_segment_gt_0p1":True,
      "observations":observations}
    path=Path("artifacts/r6/r11_post_organism_interaction_isolation.json")
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(result,indent=2)+"\n")
    print("RB_R11_RESULT "+json.dumps({
      "original_source_actual_steps":actual_before,
      "after_intervention_steps":steps,
      "removed_mass":removed,
      "removed_fraction":result["fraction_of_shared_mass_removed"],
      "at_t150":observations[1],
      "later":[{"tick":x["tick"],
                 "shared_mass":x["original_shared"]["mass"],
                 "isolated_mass":x["excised"]["mass"],
                 "isolated_large_components":x["excised"]["large_components"],
                 "isolated_largest_masses":x["excised"]["largest_masses"],
                 "L1":x["L1_excised_vs_untouched"]}
               for x in observations if x.get("phase")=="after"],
      "artifact":str(path)
    }))
if __name__=="__main__":
    main()
