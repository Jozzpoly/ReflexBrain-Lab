#!/usr/bin/env python3
"""R6/O0 observational donor: *original* Lenia Orbium rule/seed.
No learned brain, no organism-quality or robustness claim from passing code tests.
Origin (MIT): https://github.com/Chakazul/Lenia/blob/master/Jupyter/Lenia.ipynb
Source blob: cfc370672c62d03125c0d1b106764402021e25a5.
Same 20x20 seed + R13/mu=.15/sigma=.014/dt=.1 and polynomial kernel/growth.
"""
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SPEC = json.loads((ROOT / "research" / "r6" / "orbium_source.json").read_text())
N = 128
R = SPEC["params"]["R"]
MU = SPEC["params"]["mu"]
SIGMA = SPEC["params"]["sigma"]
DT = SPEC["params"]["dt"]
assert SPEC["params"]["kernel_type"] == 0 and SPEC["params"]["delta_type"] == 0
assert SPEC["params"]["peaks"] == [1]
SEED_PATCH = np.array(SPEC["cells"], dtype=np.float64)
assert SEED_PATCH.shape == (20, 20)
assert np.isclose(SEED_PATCH.sum(), 75.1)

q = np.fft.fftfreq(N) * N
yy, xx = np.meshgrid(q, q, indexing="ij")
r = np.hypot(xx, yy) / R
kernel = np.zeros((N,N), dtype=np.float64)
inside = (r > 0) & (r < 1)
kernel[inside] = (4 * r[inside] * (1-r[inside])) ** 4
kernel /= kernel.sum()
FK = np.fft.fft2(kernel)

def initial():
    a = np.zeros((N, N), dtype=np.float64)
    a[54:74, 54:74] = SEED_PATCH
    return a

def step(a):
    u = np.fft.ifft2(np.fft.fft2(a) * FK).real
    # DEFAULT polynomial function in the source Notebook, NOT the alternate
    # Gaussian Delta that appears in other versions of Lenia.
    growth = 2 * np.maximum(0, 1 - (u - MU)**2 / (SIGMA**2 * 9))**4 - 1
    return np.clip(a + DT * growth, 0, 1)

def circ_centroid(a):
    mass = a.sum()
    if mass < 1e-8: return None
    v = np.arange(N)*2*np.pi/N
    # circular center, avoid position discontinuity from periodic boundaries
    cx = np.angle(np.sum(a * np.exp(1j * v)[None,:])) % (2*np.pi)
    cy = np.angle(np.sum(a * np.exp(1j * v)[:,None])) % (2*np.pi)
    return [round(float(cx * N / (2*np.pi)), 3),
            round(float(cy * N / (2*np.pi)), 3)]

def record(t,a):
    return {"step":t,"mass":round(float(a.sum()),5),
            "occupied_0p1":int((a>.1).sum()),
            "centroid_torus":circ_centroid(a)}

def evolve(case, total=500):
    a = np.zeros((N,N)) if case == "blank" else initial()
    frames=[]; removed=None
    for t in range(total+1):
        if t==150 and case not in ("blank","intact"):
            before=float(a.sum())
            if case=="noise":
                rng=np.random.default_rng(123)
                a=np.clip(a+rng.normal(0,.1,a.shape)*(a>.01),0,1)
            elif case.startswith("remove"):
                radius=int(case.split("_")[1])
                cy,cx=np.unravel_index(a.argmax(),a.shape)
                iy,ix=np.ogrid[:N,:N]
                # physical disk centered at the densest actual cell, on torus
                dx=(ix-cx+N//2)%N-N//2
                dy=(iy-cy+N//2)%N-N//2
                a[dx*dx+dy*dy<=radius*radius]=0
            else:
                raise ValueError(case)
            removed={"massBefore":round(before,5),
                     "massImmediatelyAfter":round(float(a.sum()),5),
                     "lossFraction":round((before-float(a.sum()))/max(before,1e-12),5)}
        if t in (0,50,100,149,150,151,200,300,400,500):
            frames.append(record(t,a))
        if t<total: a=step(a)
    return {"case":case,"perturbationAt150":removed,"measurements":frames,
            "survived_500_mass_gt5":bool(a.sum()>5)}

def experiment():
    return {"source_blob":SPEC["sourceBlob"],"canvas":[N,N],
            "rule":"original Lenia polynomial quad4 kernel and polynomial growth",
            "case_results":[evolve(x) for x in
                ["intact","blank","noise","remove_1","remove_2","remove_3"]]}

if __name__=="__main__":
    result=experiment()
    p=ROOT/"artifacts"/"r6"
    p.mkdir(parents=True,exist_ok=True)
    (p/"orbium_donor_results.json").write_text(json.dumps(result,indent=2)+"\n")
    for arm in result["case_results"]:
        z=arm["measurements"]
        print("R6_O0",arm["case"],
          "m0",z[0]["mass"],"m150",next(t["mass"] for t in z if t["step"]==150),
          "m500",z[-1]["mass"],"alive",arm["survived_500_mass_gt5"],
          "loss",arm["perturbationAt150"])
