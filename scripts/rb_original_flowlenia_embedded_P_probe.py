"""FL1 exact author's FlowLeniaParams, cell-carried P; no callback or learning."""
import json, pathlib
import numpy as np
import jax
import jax.numpy as jnp
import jax.random as jr
import equinox as eqx
from flowlenia.flowlenia_params import Config, FlowLeniaParams
from flowlenia.utils import conn_from_matrix

SHA="dce428c6b0c5079a06e5606fb7b5ac1fe1323bc5"
assert jax.default_backend()=="cpu"
M=np.array([[2,1,0],[0,2,1],[1,0,2]],dtype=int)
c0,c1=conn_from_matrix(M)
cfg=Config(X=64,Y=64,C=3,k=int(M.sum()),c0=c0,c1=c1)
assert cfg.mix_rule=="stoch"
model=FlowLeniaParams(cfg,key=jr.key(1),callback=None)
base=model.initialize(jr.key(1))
a=jr.uniform(jr.key(2),(20,20,3))
p_left=jr.uniform(jr.key(111),(1,1,cfg.k))
p_right=jr.uniform(jr.key(222),(1,1,cfg.k))
init_a=base.A.at[22:42,22:42,:].set(a)
uni_p=base.P.at[22:42,22:42,:].set(p_left)
split_p=uni_p.at[32:42,22:42,:].set(p_right)
states={
  "blank":base,
  "uniform_P":base._replace(A=init_a,P=uni_p),
  "split_P":base._replace(A=init_a,P=split_p),
  "zero_P":base._replace(A=init_a)
}
step=eqx.filter_jit(model)
TIMES={0,1,10,20,40,60,80}
snapshots=[]
def frame(state):
  A=np.asarray(jax.device_get(state.A),dtype=np.float64)
  P=np.asarray(jax.device_get(state.P),dtype=np.float64)
  if not np.isfinite(A).all() or not np.isfinite(P).all():
    raise AssertionError("upstream local-rule source created nonfinite states")
  if float(A.min()) < -1e-5: raise AssertionError("negative source mass")
  weight=np.maximum(0,A.sum(axis=2))
  total=weight.sum()
  active=weight>.05
  if total>1e-9:
    weights=weight/total
    mu=np.sum(P*weights[...,None],axis=(0,1))
    var=np.sum(((P-mu)**2)*weights[...,None],axis=(0,1))
  else:
    mu=np.zeros((cfg.k,));var=np.zeros((cfg.k,))
  beyond=active.copy();beyond[22:42,22:42]=False
  carrying=np.linalg.norm(P,axis=2)>1e-5
  return {"mass":float(total),"active_cells":int(active.sum()),
      "active_outside_seed":int(beyond.sum()),
      "active_outside_seed_with_P":int((beyond&carrying).sum()),
      "mean_P":np.round(mu,6).tolist(),"variance_P":np.round(var,6).tolist(),
      "max_P":float(P.max()),"min_P":float(P.min())}
def l1(a,b,field):
  x=np.asarray(jax.device_get(getattr(a,field)),dtype=np.float64)
  y=np.asarray(jax.device_get(getattr(b,field)),dtype=np.float64)
  return float(np.abs(x-y).sum())
for t in range(81):
  if t in TIMES:
    snapshots.append({"tick":t,"arms":{name:frame(state) for name,state in states.items()},
      "A_L1_split_vs_uniform":l1(states["split_P"],states["uniform_P"],"A"),
      "P_L1_split_vs_uniform":l1(states["split_P"],states["uniform_P"],"P"),
      "A_L1_zero_vs_uniform":l1(states["zero_P"],states["uniform_P"],"A")})
  if t<80: states={name:step(state) for name,state in states.items()}
last=snapshots[-1]
assert len(snapshots)==len(TIMES)
assert abs(last["arms"]["blank"]["mass"])<1e-7, "blank source created matter"
assert last["A_L1_split_vs_uniform"] >= 0
res={"source":{"repo":"erwanplantec/FlowLenia","sha":SHA,
  "implementation":"flowlenia.flowlenia_params.FlowLeniaParams.__call__",
  "jax":jax.__version__,"equinox":eqx.__version__},
 "protocol":{"grid":[64,64],"C":cfg.C,"k":cfg.k,"dd":cfg.dd,"dt":cfg.dt,
 "sigma":cfg.sigma,"mix_rule":cfg.mix_rule,"callback":None,"steps_per_arm":80,
 "initial_A":"same original seeded random 20x20 per nonempty arm",
 "uniform_P_key":111,"split_P_second_half_key":222},
 "snapshots":snapshots}
path=pathlib.Path("artifacts/fl1/original_embedded_P_rules.json")
path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(res,indent=2),encoding="utf-8")
print("RB_FL1_SOURCE_RESULT "+json.dumps({
 "sha":SHA,"sourceStepsPerArm":80,
 "last_mass":{k:v["mass"] for k,v in last["arms"].items()},
 "last_active":{k:v["active_cells"] for k,v in last["arms"].items()},
 "last_new_cells_carrying_P":{k:v["active_outside_seed_with_P"] for k,v in last["arms"].items()},
 "last_P_variance_first_component":{k:v["variance_P"][0] for k,v in last["arms"].items()},
 "last_A_L1_split_vs_uniform":last["A_L1_split_vs_uniform"],
 "last_A_L1_zero_vs_uniform":last["A_L1_zero_vs_uniform"],
 "last_P_L1_split_vs_uniform":last["P_L1_split_vs_uniform"],
 "file":str(path)}))
