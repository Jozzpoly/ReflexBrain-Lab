import {describe,expect,it} from 'vitest';
import {AutonomousLifeWorld} from '../src/r3/life-world';
import {createR3ListenerEffectorRun,R3_SUPPLIER_STOCKED_TEXT,R3_LISTENER_EFFECTOR_PLACES} from '../src/r3/grounded-listener-effector-run';
import type {ResidentObservation,LifeWorldPublicSnapshot} from '../src/r3/life-contracts';

const source=R3_LISTENER_EFFECTOR_PLACES.source.position;
const sourceRaw=(world:LifeWorldPublicSnapshot)=>world.objects.filter(x=>x.kind==='raw_blank'&&x.location.kind==='free'&&Math.hypot(x.location.position.x-source.x,x.location.position.y-source.y)<=0.6).length;
const seenSourceRaw=(ob:ResidentObservation)=>ob.visibleObjects.filter(x=>x.kind==='raw_blank'&&x.location.kind==='free'&&Math.hypot(x.location.position.x-source.x,x.location.position.y-source.y)<=0.6).length;
const STOCKED=(ob:ResidentObservation)=>ob.heardEvents.some(x=>x.kind==='speech'&&x.actorId==='resident:mira'&&x.payload.text===R3_SUPPLIER_STOCKED_TEXT);
const ID='resident:ida' as const;

function observationalRun(mode:'reserve-purpose-aware'|'reserve-purpose-blind'|'supply-ideal',duration=5400){
 const run=createR3ListenerEffectorRun(mode);
 const completionRows:{tick:number;sourceStockHost:number;sourceSeenPrivately:number;visibleObjects:number;heardTexts:string[];selfX:number;selfY:number}[]=[];
 let noDirectSourceFrames=0;
 let sourceDeficitFrames=0;
 let firstCompletionTick:null|number=null;
 for(let k=0;k<duration;k++){
  const ob=run.world.perceive(ID);
  const host=run.world.snapshot();
  const available=sourceRaw(host);
  if(available<3)sourceDeficitFrames++;
  if(seenSourceRaw(ob)===0)noDirectSourceFrames++;
  if(STOCKED(ob)){
   if(firstCompletionTick===null)firstCompletionTick=ob.tick;
   completionRows.push({tick:ob.tick,sourceStockHost:available,sourceSeenPrivately:seenSourceRaw(ob),visibleObjects:ob.visibleObjects.length,
    heardTexts:ob.heardEvents.filter(e=>e.kind==='speech').map(e=>String(e.payload.text)),
    selfX:ob.self.position.x,selfY:ob.self.position.y});
  }
  run.advanceOneTick();
 }
 return {mode,metrics:run.metrics(), firstCompletionTick,completionRows,
  completionWithoutDirectSource:completionRows.filter(x=>x.sourceSeenPrivately===0).length,
  completionWhileSourceBelowCapacity:completionRows.filter(x=>x.sourceStockHost<3).length,
  noDirectSourceFrames,sourceDeficitFrames, finalSourceStock:sourceRaw(run.world.snapshot())};
}

function advanceToFeedback(tick:number){
 const run=createR3ListenerEffectorRun('reserve-purpose-blind');
 for(let k=0;k<tick;k++)run.advanceOneTick();
 expect(run.world.tick).toBe(tick);
 expect(STOCKED(run.world.perceive(ID))).toBe(true);
 return run;
}

function makeAliasWorld(stock:number){
 const w=new AutonomousLifeWorld({sourcePosition:{x:4,y:0},sourceCapacity:3,sourceReplenishTicks:120,workbenchPosition:{x:10,y:0},processingTicks:24});
 w.addResident(ID,{x:6,y:0},{sightRadius:.75,hearingRadius:5,speedPerTick:.16});
 for(let i=0;i<stock;i++)w.addMaterial('raw_blank',{x:4+i*.12,y:0});
 return w;
}

function auditAlias(intervene:boolean){
 const empty=makeAliasWorld(0),full=makeAliasWorld(3);
 const frames=[];
 for(let t=0;t<=12;t++){
  const observedEmpty=empty.perceive(ID),observedFull=full.perceive(ID);
  frames.push({tick:t,x:observedEmpty.self.position.x,
   seenEmpty:seenSourceRaw(observedEmpty),seenFull:seenSourceRaw(observedFull),
   firstVisiblyDifferent:JSON.stringify(observedEmpty)!==JSON.stringify(observedFull),
   sourceEmpty:sourceRaw(empty.snapshot()),sourceFull:sourceRaw(full.snapshot())});
  if(t===0){
   expect(observedEmpty).toEqual(observedFull);
   expect(sourceRaw(empty.snapshot())).toBe(0);expect(sourceRaw(full.snapshot())).toBe(3);
  }
  if(t===12)break;
  const cmds=intervene?new Map([[ID,{kind:'move_to' as const,target:{x:4,y:0}}]]):new Map();
  empty.step(cmds);full.step(cmds);
 }
 return {firstDifferenceTick:frames.find(r=>r.firstVisiblyDifferent)?.tick??null,
  firstSourceEvidenceTick:frames.find(r=>r.seenFull>r.seenEmpty)?.tick??null,frames};
}

describe('R3/A1: source-native private feedback vs genuine concern evidence',()=>{
 it('recovers ordinary grounded rack-stocked completions and detects missing same-frame direct reserve proof',()=>{
  const actual=['reserve-purpose-aware','reserve-purpose-blind','supply-ideal'] as const;
  const arms=actual.map(x=>observationalRun(x));
  for(const x of arms){
   expect(x.metrics.ticks).toBe(5400);
   expect(x.completionRows.length).toBe(x.metrics.miraStockedReportCount);
   expect(x.noDirectSourceFrames).toBeGreaterThan(0);
  }
  // These conditions establish expected native fixture equivalence only,
  // not a result-oriented bound on semantic learning.
  expect(arms[0].metrics.idaForwardedCount).toBe(0);
  expect(arms[1].metrics.idaForwardedCount).toBeGreaterThan(0);
  expect(arms[1].metrics.sourceReserveDeficitTicks).toBeGreaterThan(arms[0].metrics.sourceReserveDeficitTicks);
  console.log('RB_R3_A1_PRIVATE_FEEDBACK '+JSON.stringify({armResults:arms}));
 },120_000);

 it('source-faithful intervention distinguishes source stock only after lawful physical checking',()=>{
  const measured=observationalRun('reserve-purpose-blind',1500);
  expect(measured.firstCompletionTick).not.toBeNull();
  const tick=measured.firstCompletionTick!;
  const noMove=advanceToFeedback(tick),seek=advanceToFeedback(tick);
  expect(noMove.world.snapshot()).toEqual(seek.world.snapshot());
  expect(noMove.world.perceive(ID)).toEqual(seek.world.perceive(ID));
  const before=noMove.world.perceive(ID);
  const beforeReserve=sourceRaw(noMove.world.snapshot());
  const continuations=[];
  for(let k=0;k<=12;k++){
   const neutral=noMove.world.perceive(ID),action=seek.world.perceive(ID);
   const homeCount=sourceRaw(noMove.world.snapshot()),seekCount=sourceRaw(seek.world.snapshot());
   continuations.push({k,worldTick:noMove.world.tick,passiveVisibleSource:seenSourceRaw(neutral),
    activeVisibleSource:seenSourceRaw(action),
    passiveX:neutral.self.position.x,activeX:action.self.position.x,
    worldSourceStockPassive:homeCount,worldSourceStockActive:seekCount});
   if(k===12)break;
   noMove.world.step(new Map());
   seek.world.step(new Map([[ID,{kind:'move_to',target:source}]]));
  }
  const hiddenStockEmpty=auditAlias(false);
  const hiddenStockProbe=auditAlias(true);
  expect(continuations[0].worldSourceStockPassive).toBe(beforeReserve);
  expect(continuations[0].worldSourceStockActive).toBe(beforeReserve);
  expect(continuations[0].passiveVisibleSource).toBe(seenSourceRaw(before));
  expect(continuations[0].activeVisibleSource).toBe(seenSourceRaw(before));
  expect(continuations.every(r=>r.worldSourceStockActive===r.worldSourceStockPassive)).toBe(true);
  // Matched body and legal private input at origin despite physically different stock.
  expect(hiddenStockEmpty.firstDifferenceTick).toBeNull();
  expect(hiddenStockProbe.firstDifferenceTick).not.toBeNull();
  console.log('RB_R3_A1_CHECKING '+JSON.stringify({
   firstHeardCompletionTick:tick,beforeReserve,initialIdaPrivateFrame:before,
   originalContinuation:continuations,matchedStockAlias:{idle:hiddenStockEmpty,active: hiddenStockProbe},
   interpretation:'Researcher-selected lawful move_to probes source stock, not learned checking or learned purpose. Post-branch physical body differs by design; native source replenishment remains enabled.'}));
 },120_000);
});
