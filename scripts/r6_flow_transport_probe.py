#!/usr/bin/env python3
"""R6/O2: independent NumPy reimplementation of Flow-Lenia's mass-transport
REINTEGRATION operator only (not the full JAX model). No organism/evolution
claim. Based on Plantec et al.:
https://github.com/erwanplantec/FlowLenia/blob/main/flowlenia/reintegration_tracking.py
See docs/research/RB_R6_O2_ARMED_2026-10-22.md.
"""
import json
import numpy as np
from pathlib import Path

N = 24
SIGMA = .65
DD = 3
DT = .2
STEPS = 20

POS = np.stack(np.meshgrid(np.arange(N)+.5, np.arange(N)+.5,
                           indexing="ij"), axis=-1)
GAUSSIAN_SIGMA = 1.3
def seed():
    y,x = np.meshgrid(np.arange(N),np.arange(N),indexing="ij")
    a=.9*np.exp(-((x-3)**2+(y-4)**2)/(2*GAUSSIAN_SIGMA**2))
    a+=.55*np.exp(-((x-20)**2+(y-21)**2)/(2*(GAUSSIAN_SIGMA*.8)**2))
    return a.astype(np.float64)

def researcher_flow(kind):
    out=np.zeros((N,N,2),dtype=np.float64)
    if kind=="uniform":
        out[...,0]=2.0
        out[...,1]=-1.4
    elif kind=="reverse":
        out[...,0]=-2.0
        out[...,1]=1.4
    elif kind=="varying":
        out[...,0]=2*np.sin(2*np.pi*(POS[...,1]-.5)/N)
        out[...,1]=1.5*np.cos(2*np.pi*(POS[...,0]-.5)/N)
    elif kind in ("still","blank"):
        pass
    else:
        raise ValueError(kind)
    return out

def reintegration(A, F, border="wall"):
    """Direct same-distribution, rolled-source area overlap as author JAX
    _apply_without_hidden. One material channel, float64 and square N.
    All source/flow is externally supplied; this does NOT simulate Lenia
    growth, learned organ, conserved energy or hereditary parameters.
    """
    assert A.shape==(N,N) and F.shape==(N,N,2)
    assert border in ("wall","torus")
    mu=POS+np.clip(DT*F,-(DD-SIGMA),DD-SIGMA)
    if border=="wall":
        mu=np.clip(mu,SIGMA,N-SIGMA)
    result=np.zeros_like(A)
    for dx in range(-DD,DD+1):
        for dy in range(-DD,DD+1):
            source=np.roll(A,(dx,dy),(0,1))
            target=np.roll(mu,(dx,dy),(0,1))
            dist=np.abs(POS-target)
            if border=="torus":
                dist=np.minimum(dist,np.minimum(np.abs(POS-target+N),
                                               np.abs(POS-target-N)))
            width=np.clip(.5-dist+SIGMA,0,min(1,2*SIGMA))
            area=width[...,0]*width[...,1]/(4*SIGMA**2)
            result+=source*area
    return result

def evolve(kind,border):
    a=np.zeros((N,N),dtype=np.float64) if kind=="blank" else seed()
    F=researcher_flow(kind)
    initial=a.copy()
    total0=float(a.sum())
    max_step_error=0
    for _ in range(STEPS):
        new=reintegration(a,F,border)
        max_step_error=max(max_step_error,abs(float(new.sum()-a.sum())))
        a=new
    return {"kind":kind,"border":border,"steps":STEPS,
            "mass_initial":round(total0,12),
            "mass_final":round(float(a.sum()),12),
            "max_absolute_step_mass_error":max_step_error,
            "final_occupied_gt_0p05":int((a>.05).sum()),
            "fraction_mass_moved_L1":round(float(np.abs(a-initial).sum()/
                    max(total0,1e-15)),8),
            "field":a}

def experiment():
    runs=[evolve(k,b) for b in ("wall","torus")
          for k in ("blank","still","uniform","varying","reverse")]
    # Carefully separate source-checkable claims from inferred outcomes.
    for b in ("wall","torus"):
        v=[z for z in runs if z["border"]==b]
        for z in v:
            if z["max_absolute_step_mass_error"]>=1e-9:
                raise AssertionError("O2 FAILED conservation, border="+b+
                                     ", kind="+z["kind"])
        if v[0]["mass_final"]!=0: raise AssertionError("blank created material")
        if np.allclose(v[1]["field"],v[2]["field"]):
            raise AssertionError("authored flow failed to change spatial arrangement")
    return {"specimen":"research/O2 transport-only", "grid":[N,N],
            "source":"Plantec et al. Flow-Lenia reintegration operator; independently reproduced in NumPy",
            "limits":"No full JAX morphodynamics or hereditary-parameter mixing",
            "cases":[{k:v for k,v in z.items() if k!="field"} for z in runs],
            "pairwise":{b:{"still_vs_uniform_mass_field_L1":
                        round(float(np.abs(next(z for z in runs if z["border"]==b and z["kind"]=="still")["field"] -
                        next(z for z in runs if z["border"]==b and z["kind"]=="uniform")["field"]).sum()),8)}
                        for b in ("wall","torus")}}

if __name__=="__main__":
    out=experiment()
    dest=Path("artifacts/r6")
    dest.mkdir(parents=True,exist_ok=True)
    (dest/"flow_operator_O2.json").write_text(json.dumps(out,indent=2)+"\n")
    for arm in out["cases"]:
        print("R6_O2 "+json.dumps(arm,sort_keys=True))
    print("R6_O2_PAIRWISE "+json.dumps(out["pairwise"],sort_keys=True))
