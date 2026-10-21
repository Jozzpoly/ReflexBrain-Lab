import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,type BodyShape,type Demand} from '../../src/living-organism/world';
import {DevRuntime,type DevLayout} from '../../src/living-organism/dev-runtime';
import {DevResident,type DevMode} from '../../src/living-organism/dev-resident';

const ZERO:Demand={drive:0,turn:0,gazeRate:0};
type Summary={shape:BodyShape;layout:DevLayout;mode:DevMode|'world-null';
  steps:number;travel:number;looseMaterialDisplacement:number;independentRailDisplacement:number;
  looseObjectsMoved:number;visited4mCells:number;
  privateFrames:number;touchFrames:number;lastModeStats:ReturnType<DevResident['capture']>;
  actor:{x:number;y:number};totalMaterialObjects:number;finite:boolean};
function run(shape:BodyShape,layout:DevLayout,mode:DevMode|'world-null',ticks=3600):Summary {
 const r=new DevRuntime(mode==='world-null'?'frozen':mode,shape,layout,1183);
 const start=r.world.inspect();
 const initial=new Map(start.objects.filter(o=>o.kind==='object').map(o=>[o.handle,{x:o.x,y:o.y}]));
 const cells=new Set<string>();
 let travel=0,touchFrames=0,privateFrames=0,last=start.actor;
 try{
  for(let i=0;i<ticks;i++){
   if(mode==='world-null')r.world.step(ZERO);
   else r.step();
   const q=r.world.inspect().actor;
   travel+=Math.hypot(q.x-last.x,q.y-last.y);last=q;
   if((i+1)%4===0){
    const f=r.world.observe();
    privateFrames++;
    if(Array.from(f.touch).some(x=>x>.005))touchFrames++;
    cells.add(Math.floor(q.x/4)+':'+Math.floor(q.y/4));
   }
  }
  const final=r.world.inspect();
  const deltas=final.objects.filter(o=>o.kind==='object').map(o=>{
    const p=initial.get(o.handle);
    if(!p)throw Error('physics lost a material body');
    return {handle:o.handle,travel:Math.hypot(o.x-p.x,o.y-p.y)};
   });
  const independentRailDisplacement=deltas.find(d=>d.handle===r.hostMoverHandle)?.travel??NaN;
  const loose=deltas.filter(d=>d.handle!==r.hostMoverHandle);
  const looseMaterialDisplacement=loose.reduce((sum,d)=>sum+d.travel,0);
  return {shape,layout,mode,steps:ticks,travel,
   looseMaterialDisplacement,independentRailDisplacement,
   looseObjectsMoved:loose.filter(d=>d.travel>.10).length,
   visited4mCells:cells.size,
   privateFrames,touchFrames,lastModeStats:r.resident.capture(),
   actor:{x:last.x,y:last.y},totalMaterialObjects:initial.size,
   finite:[travel,looseMaterialDisplacement,independentRailDisplacement,last.x,last.y].every(Number.isFinite)};
 }finally{r.free();}
}
describe('O-DEV/V0 — first continuing non-cyan resident in actual material ecology',()=>{
 beforeAll(initLivingWorld);
 it('keeps action-effect learning tied only to previously self-executed private frames',()=>{
  const r=new DevRuntime('adaptive','B1','yard',1183);
  try{
   for(let t=0;t<1440;t++)r.step();
   const learned=r.resident.capture();
   expect(learned.learnedTrials).toBeGreaterThan(0);
   const before=learned.learnedTrials;
   const manual:Demand={drive:.8,turn:-.4,gazeRate:0};
   for(let t=0;t<300;t++)r.step(manual);
   const after=r.resident.capture();
   expect(after.learnedTrials).toBe(before);
   expect(after.manualFrames).toBeGreaterThan(0);
   expect(after.active).toBeNull();
   for(let t=0;t<960;t++)r.step();
   expect(r.resident.capture().learnedTrials).toBeGreaterThan(before);
  }finally{r.free();}
 },120000);
 it('exactly restores physically realized experience AND private learning history',()=>{
  const r=new DevRuntime('adaptive','B1','shifted',1183);
  const fork=new DevRuntime('adaptive','B1','shifted',9999);
  try{
   for(let t=0;t<977;t++)r.step();
   const cp=r.capture();
   fork.restore(cp);
   expect(fork.world.observe()).toEqual(r.world.observe());
   expect(fork.resident.capture()).toEqual(r.resident.capture());
   for(let t=0;t<1440;t++){r.step();fork.step();}
   expect(fork.world.inspect()).toEqual(r.world.inspect());
   expect(fork.resident.capture()).toEqual(r.resident.capture());
   expect(fork.world.captureCheckpoint().physics).toEqual(r.world.captureCheckpoint().physics);
  }finally{r.free();fork.free();}
 },120000);
 it('records material behavior vs frozen/random/World-only across body and habitat; no winning score imposed',()=>{
  const rows:Summary[]=[];
  for(const shape of ['B0','B1'] as const)
   for(const layout of ['yard','shifted'] as const)
    for(const mode of ['adaptive','frozen','random'] as const)
     rows.push(run(shape,layout,mode));
  for(const layout of ['yard','shifted'] as const)
   for(const shape of ['B0','B1'] as const)
    rows.push(run(shape,layout,'world-null'));
  expect(rows).toHaveLength(16);
  expect(rows.every(x=>x.steps===3600&&x.privateFrames===900&&x.finite&&x.totalMaterialObjects>=4)).toBe(true);
  expect(rows.filter(x=>x.mode==='adaptive').every(x=>x.lastModeStats.learnedTrials>=1)).toBe(true);
  expect(rows.filter(x=>x.mode!=='adaptive').every(x=>x.lastModeStats.learnedTrials===0)).toBe(true);
  // IMPORTANT: no post-hoc tuning to make trained arm win.
  console.log('RB_ODEV_V0_LIVE_RESULT '+JSON.stringify({status:'discovery only',
   claimsNotQualified:['learned semantics','endogenous concern','better organism','private material position','Owner play'],
   runs:rows}));
 },240000);
 it('tests causal private-learning ablation at same world checkpoint without editing host physics',()=>{
  const trained=new DevRuntime('adaptive','B1','yard',1183);
  const ablated=new DevRuntime('adaptive','B1','yard',1183);
  try{
   for(let t=0;t<5400;t++)trained.step();
   const cp=trained.capture();
   ablated.restore(cp);
   const altered=ablated.resident.capture();
   // Remove only acquired skill estimates; keep exactly same embodied history,
   // RNG, current movement commitment, tick, and physical scene.
   altered.stats=altered.stats.map(row=>row.map(()=>({sum:0,count:0})));
   altered.learnedTrials=0;
   ablated.resident.restore(altered);
   let firstMotorDivergence:number|null=null;
   let beforeDivergenceFrames=0;
   for(let i=0;i<3600;i++){
    const fa=trained.world.observe(),fb=ablated.world.observe();
    if(firstMotorDivergence===null){
     expect(fb).toEqual(fa);
     beforeDivergenceFrames++;
    }
    const sa=trained.resident.capture(),sb=ablated.resident.capture();
    const da=trained.resident.decide(fa),db=ablated.resident.decide(fb);
    if(firstMotorDivergence===null&&(Math.abs(da.drive-db.drive)+Math.abs(da.turn-db.turn)+
      Math.abs(da.gazeRate-db.gazeRate))>1e-9) {
      firstMotorDivergence=fa.tick;
      expect(sa.seed).toBe(sb.seed);
      expect(sa.trials).toBe(sb.trials);
    }
    trained.world.step(da);ablated.world.step(db);
   }
   const ax=trained.world.inspect().actor,bx=ablated.world.inspect().actor;
   const afterGap=Math.hypot(ax.x-bx.x,ax.y-bx.y);
   console.log('RB_ODEV_V0_ABLATION '+JSON.stringify({
    originalExperienceTrials:cp.resident.learnedTrials,
    firstMotorDivergence,preDivergenceFrames:beforeDivergenceFrames,
    laterActorSeparation:afterGap,
    interpret:'private learner ablation may fail to change future actions; no useful material-skill claim'}));
   expect(beforeDivergenceFrames).toBeGreaterThan(0);
   expect(Number.isFinite(afterGap)).toBe(true);
  }finally{trained.free();ablated.free();}
 },240000);
 it('transfers ONLY learned private parameters to unseen material arrangement; no positive transfer target assumed',()=>{
  const rows=[];
  for(const shape of ['B0','B1'] as const)for(const seed of [1183,8291]){
   const previous=new DevRuntime('adaptive',shape,'yard',seed);
   const transferred=new DevRuntime('adaptive',shape,'shifted',seed);
   const fresh=new DevRuntime('adaptive',shape,'shifted',seed);
   try{
    for(let i=0;i<3600;i++)previous.step();
    const acquired=previous.resident.capture();
    const clean=transferred.resident.capture();
    expect(clean.stats.every(row=>row.every(x=>x.count===0))).toBe(true);
    // The two recipients start with exactly identical physics and sensory history;
    // transfer ONLY private learned action efficacy parameters.
    clean.stats=structuredClone(acquired.stats);
    clean.learnedTrials=acquired.learnedTrials;
    transferred.resident.restore(clean);
    expect(transferred.world.captureCheckpoint().physics)
      .toEqual(fresh.world.captureCheckpoint().physics);
    let firstDivergence:null|number=null;
    let matchedPrivateFrames=0;
    const before=transferred.world.inspect();
    const firstObjects=new Map(before.objects.filter(o=>o.kind==='object'&&o.handle!==transferred.hostMoverHandle)
      .map(o=>[o.handle,{x:o.x,y:o.y}]));
    for(let i=0;i<3600;i++){
     const f1=transferred.world.observe(),f2=fresh.world.observe();
     if(firstDivergence===null){expect(f1).toEqual(f2);matchedPrivateFrames++;}
     const d1=transferred.resident.decide(f1),d2=fresh.resident.decide(f2);
     if(firstDivergence===null&&(Math.abs(d1.drive-d2.drive)+Math.abs(d1.turn-d2.turn)+
       Math.abs(d1.gazeRate-d2.gazeRate)>1e-9))
       firstDivergence=f1.tick;
     transferred.world.step(d1);fresh.world.step(d2);
    }
    const loose=(r:DevRuntime)=>r.world.inspect().objects
     .filter(o=>firstObjects.has(o.handle))
     .reduce((sum,o)=>{const p=firstObjects.get(o.handle)!;return sum+Math.hypot(o.x-p.x,o.y-p.y);},0);
    const ta=transferred.world.inspect().actor,fa=fresh.world.inspect().actor;
    rows.push({shape,seed,pretrainedTrials:acquired.learnedTrials,
      firstDivergence,matchedPrivateFrames,
      transferredLooseMaterial:loose(transferred),
      freshLooseMaterial:loose(fresh),
      finalActorGap:Math.hypot(ta.x-fa.x,ta.y-fa.y)});
   }finally{previous.free();transferred.free();fresh.free();}
  }
  expect(rows).toHaveLength(4);
  expect(rows.every(x=>x.pretrainedTrials>0&&x.matchedPrivateFrames>0&&
   [x.transferredLooseMaterial,x.freshLooseMaterial,x.finalActorGap].every(Number.isFinite))).toBe(true);
  console.log('RB_ODEV_V0_TRANSFER '+JSON.stringify({rows,
   caution:'4 seed/body contexts, same layout transfer is not general learned-meaning or normalized opportunity metric; both recipients continue online learning'}));
 },240000);

});
