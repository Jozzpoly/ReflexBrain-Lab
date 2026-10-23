#!/usr/bin/env python3
"""R10P notebook-geometry independent parity, not the original notebook executed.

This source follows Chan's original notebook cells calc_kernel/calc_once:
centered MID kernel FFT and explicit np.roll(MID) of convolved potential.
Compare to R6's frequency-zero kernel without roll. Same altered 128-grid
unscaled-seed scientific fixture, not Chan's actual 256-grid 4x-resized demo.
"""
import json
from pathlib import Path
import numpy as np
from scripts.r6_orbium_probe import N,R,MU,SIGMA,DT,step,ROOT
from scripts.r6_two_pattern_world_probe import start,CENTERS,large_torus_components

assert (N,R,MU,SIGMA,DT)==(128,13,.15,.014,.1)
MID=N//2
I=np.broadcast_to(np.arange(N,dtype=np.float64),(N,N))
X=(I-MID)/R
Y=X.T
D=np.sqrt(X**2+Y**2)
rm=np.minimum(D,1)
K=(D<1)*(4*rm*(1-rm))**4
assert K.shape==(N,N) and 0<K.sum()<N*N
notebook_kernel_fft=np.fft.fft2(K/K.sum())
def notebook_source_step(a):
    # Literal source semantics from original 2020 notebook code, not R6 step.
    world_FFT=np.fft.fft2(a)
    potential=np.roll(np.real(np.fft.ifft2(notebook_kernel_fft*world_FFT)),
                      MID,(0,1))
    delta=np.maximum(0,1-(potential-MU)**2/(SIGMA**2*9))**4*2-1
    return np.maximum(0,np.minimum(1,a+delta*DT))

TIMES={0,1,5,20,50,100,150,200,400,800}
def case(label,seed):
    ours=seed.copy()
    notebook=seed.copy()
    assert np.array_equal(ours,notebook)
    data=[]
    old_counter=0
    new_counter=0
    for t in range(801):
        if t in TIMES:
            delta=np.abs(ours-notebook)
            comp=large_torus_components(notebook)
            data.append({"tick":t,
             "whole_field_L1":float(delta.sum()),
             "whole_field_Linf":float(delta.max()),
             "r6_field_mass":float(ours.sum()),
             "notebook_style_field_mass":float(notebook.sum()),
             "r6_active_cells_gt_0p1":int((ours>.1).sum()),
             "notebook_active_cells_gt_0p1":int((notebook>.1).sum()),
             "notebook_large_components_gt_mass5":comp["large_components_mass_gt5"],
             "notebook_large_masses":comp["largest_masses"][:3]})
            if t<=5 and float(delta.max())>1e-9:
                raise AssertionError(f"actual notebook rule mismatch at t{t}: max={delta.max()}")
        if t<800:
            ours=step(ours)
            notebook=notebook_source_step(notebook)
            old_counter+=1
            new_counter+=1
    assert old_counter==new_counter==800
    result={"case":label,"counts":{"source_reproduction":old_counter,
         "independent_notebook_centering":new_counter},"samples":data}
    print("RB_R10P_NUMERIC "+json.dumps({
       "case":label,"actual_steps":old_counter,
       "max_linf_t5":next(x["whole_field_Linf"] for x in data if x["tick"]==5),
       "reference_mass_t100":next(x["notebook_style_field_mass"] for x in data if x["tick"]==100),
       "reference_large_components_t100":next(x["notebook_large_components_gt_mass5"] for x in data if x["tick"]==100),
       "reference_mass_t800":data[-1]["notebook_style_field_mass"],
       "reference_large_components_t800":data[-1]["notebook_large_components_gt_mass5"],
       "L1_at_t100":next(x["whole_field_L1"] for x in data if x["tick"]==100),
       "L1_at_t800":data[-1]["whole_field_L1"]
    }))
    return result

def main():
    scenarios={"solo_A":start((64,43))}
    for label,(a,b) in CENTERS.items():
        scenarios["shared_"+label]=start(a)+start(b,rotate=True)
    results=[case(name,field) for name,field in scenarios.items()]
    output={"protocol":"docs/research/RB_R6_R10P_ORIGINAL_NUMERIC_PARITY_ARMED_2026-10-23.md",
      "source_notebook_blob":"cfc370672c62d03125c0d1b106764402021e25a5",
      "warning":"The author code uses 256 and 4x-scaled cells/R in its demo; this is a 128, unscaled fixture",
      "geometry":"notebook centered-MID FFT kernel plus explicit roll vs R6 zero-origin kernel",
      "results":results}
    dest=Path("artifacts/r6/r10p_original_notebook_geometry_parity.json")
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(output,indent=2)+"\n")
    print("RB_R10P_ARTIFACT "+str(dest))
if __name__=="__main__":
    main()
