"""FL0: exact upstream Flow-Lenia update, no trained brain or generated policy.

Upstream source must be checked out at dce428c6b0c5079a06e5606fb7b5ac1fe1323bc5
by workflow before this script is run. Scientific indicators are descriptive, not PASS gates.
"""
from __future__ import annotations
import json
import os
import pathlib
import sys
import numpy as np
import jax
import jax.numpy as jnp
import jax.random as jr
import equinox as eqx

from flowlenia.flowlenia import Config, FlowLenia
from flowlenia.utils import conn_from_matrix

ORIGINAL_SHA = "dce428c6b0c5079a06e5606fb7b5ac1fe1323bc5"
assert jax.default_backend() == "cpu", "CPU-only frozen experiment"
N, T, INJURY_STEP = 64, 80, 20
TIMES = frozenset([0, 1, 10, 20, 21, 40, 60, 80])
M = np.array([[3, 1, 0], [0, 3, 1], [1, 0, 3]], dtype=int)
c0, c1 = conn_from_matrix(M)
cfg = Config(X=N, Y=N, C=3, k=int(M.sum()), c0=c0, c1=c1)
model = FlowLenia(cfg, key=jr.key(1111))
initial = model.initialize(jr.key(1))
seed = jr.uniform(jr.key(4321), (20, 20, 3))
starting = initial._replace(A=initial.A.at[22:42, 22:42, :].set(seed))
control = starting
wounded = starting
empty = initial
step = eqx.filter_jit(model)
def metrics(state):
    a = np.asarray(jax.device_get(state.A), dtype=np.float64)
    if not np.isfinite(a).all():
        raise AssertionError("source process created nonfinite material")
    if a.min() < -1e-5:
        raise AssertionError("source process generated negative material")
    weight = np.maximum(0, np.sum(a, axis=2))
    mass = float(a.sum(dtype=np.float64))
    if mass > 1e-12:
        x, y = np.indices((N, N))
        center = [float(np.sum(x * weight) / mass), float(np.sum(y * weight) / mass)]
        mean_sq = float(np.sum(((x-center[0])**2+(y-center[1])**2)*weight)/mass)
    else:
        center = None
        mean_sq = None
    return {"mass": mass, "active_cells_gt_005": int(np.count_nonzero(weight > .05)),
            "center": center, "mean_sq_extent": mean_sq,
            "max_cell": float(a.max()), "min_cell": float(a.min())}
def compare(c,w):
    a = np.asarray(jax.device_get(c.A), dtype=np.float64)
    b = np.asarray(jax.device_get(w.A), dtype=np.float64)
    return float(np.sum(np.abs(a-b), dtype=np.float64))
initial_mass=metrics(starting)["mass"]
snapshots=[]
removed=None
for tick in range(T + 1):
    if tick in TIMES:
        cm, wm, em = metrics(control), metrics(wounded), metrics(empty)
        snapshots.append({"tick": tick, "phase": "before_wound" if tick == INJURY_STEP else "normal",
                          "intact":cm, "wounded":wm, "blank":em, "L1_intact_vs_wounded":compare(control,wounded)})
    if tick == INJURY_STEP:
        pre = metrics(wounded)["mass"]
        wounded = wounded._replace(A=wounded.A.at[28:36,28:36,:].set(0))
        removed = pre - metrics(wounded)["mass"]
        snapshots.append({"tick": tick, "phase": "after_wound", "removed_mass": removed,
                          "wounded":metrics(wounded), "L1_intact_vs_wounded":compare(control,wounded)})
    if tick < T:
        control = step(control)
        wounded = step(wounded)
        empty = step(empty)
assert len(snapshots) == len(TIMES)+1
assert removed is not None and removed > 0, "intervention did not remove material"
assert snapshots[-1]["tick"] == T
assert abs(snapshots[-1]["blank"]["mass"]) < 1e-7, "empty world made material"
assert snapshots[-1]["L1_intact_vs_wounded"] > 0, "wound and intact became identical"
# Mass conservation checked numerically and publicly, but not forced to assert without
# observing original source numeric behavior. Any drift is scientifically visible.
result = {
 "source":{"repository":"erwanplantec/FlowLenia","sha":ORIGINAL_SHA,
           "implementation":"flowlenia.flowlenia.FlowLenia.__call__","jax":jax.__version__,
           "equinox":eqx.__version__},
 "frozen":{"grid":[N,N],"C":cfg.C,"kernels":cfg.k,"dt":cfg.dt,
           "boundary":cfg.border,"sigma":cfg.sigma,"dd":cfg.dd,
           "steps_per_arm":T,"arms":["blank","intact","wounded"],
           "seed_patch":[22,42,22,42],"wound_crop":[28,36,28,36],
           "wound_time":INJURY_STEP,"model_key":1111,"material_key":4321},
 "initial_mass":initial_mass,"removed_mass":removed,"snapshots":snapshots,
 "last_mass_delta_uninjured":snapshots[-1]["intact"]["mass"]-initial_mass,
 "last_mass_delta_wounded":snapshots[-1]["wounded"]["mass"]-(initial_mass-removed)
}
path=pathlib.Path("artifacts/fl0/original_flowlenia_source_replay.json")
path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(result, indent=2),encoding="utf-8")
print("RB_FL0_SOURCE_RESULT "+json.dumps({
 "originalSHA":ORIGINAL_SHA,
 "executed_full_source_updates_per_arm":T,
 "starting_mass":initial_mass,"removed_mass":removed,
 "end_mass_intact":snapshots[-1]["intact"]["mass"],
 "end_mass_wounded":snapshots[-1]["wounded"]["mass"],
 "end_mass_blank":snapshots[-1]["blank"]["mass"],
 "last_difference_L1":snapshots[-1]["L1_intact_vs_wounded"],
 "end_active_cells_intact":snapshots[-1]["intact"]["active_cells_gt_005"],
 "end_active_cells_wounded":snapshots[-1]["wounded"]["active_cells_gt_005"],
 "result_file":str(path)}))
