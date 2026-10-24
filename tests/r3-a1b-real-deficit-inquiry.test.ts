import {describe,expect,it} from 'vitest';
import {createR3ListenerEffectorRun,R3_LISTENER_EFFECTOR_PLACES,R3_SUPPLIER_STOCKED_TEXT} from '../src/r3/grounded-listener-effector-run';
import type {ResidentObservation,ResidentIntent,LifeWorldPublicSnapshot} from '../src/r3/life-contracts';

const ID='resident:ida' as const;
const SOURCE=R3_LISTENER_EFFECTOR_PLACES.source.position;
function remaining(s:LifeWorldPublicSnapshot){
 return s.objects.filter(o=>o.kind==='raw_blank'&&o.location.kind==='free'&&
  Math.hypot(o.location.position.x-SOURCE.x,o.location.position.y-SOURCE.y)<=.6).length;
}
function privateSource(eye:ResidentObservation){
 return eye.visibleObjects.filter(o=>o.kind==='raw_blank'&&o.location.kind==='free'&&
  Math.hypot(o.location.position.x-SOURCE.x,o.location.position.y-SOURCE.y)<=.6).length;
}
function heardStocked(eye:ResidentObservation){
 return eye.heardEvents.some(e=>e.kind==='speech'&&e.actorId==='resident:mira'&&e.payload.text===R3_SUPPLIER_STOCKED_TEXT);
}
function toTick(t:number){
 const r=createR3ListenerEffectorRun('reserve-purpose-blind');
 for(let k=0;k<t;k++)r.advanceOneTick();
 return r;
}
describe('R3/A1B: legal checking at first genuinely depleted-source completion',()=>{
 it('audits information delay versus source replenishment without new resident behavior',()=>{
  const ordinary=createR3ListenerEffectorRun('reserve-purpose-blind');
  let first:null|{tick:number,hostCount:number,frame:ResidentObservation}=null;
  for(let k=0;k<5400;k++){
   const legal=ordinary.world.perceive(ID);
   const host=remaining(ordinary.world.snapshot());
   if(heardStocked(legal)&&host<3){
    first={tick:legal.tick,hostCount:host,frame:legal};
    break;
   }
   ordinary.advanceOneTick();
  }
  if(first===null){
   console.log('RB_R3_A1B_REAL_DEFICIT '+JSON.stringify({status:'INCONCLUSIVE_NO_DEFICIT_COME_BACK_WITHIN_FROZEN_5400',sourceSha:'04f2835c2aec6a6e82248b2ff5744e89bd7b54e8'}));
   return;
  }
  const passive=toTick(first.tick),inquire=toTick(first.tick);
  expect(passive.world.snapshot()).toEqual(inquire.world.snapshot());
  expect(passive.world.perceive(ID)).toEqual(inquire.world.perceive(ID));
  expect(passive.world.perceive(ID)).toEqual(first.frame);
  expect(remaining(passive.world.snapshot())).toBe(first.hostCount);
  const frames=[];
  const cmd=new Map<typeof ID,ResidentIntent>([[ID,{kind:'move_to',target:SOURCE}]]);
  for(let i=0;i<=12;i++){
   const a=passive.world.perceive(ID),b=inquire.world.perceive(ID);
   const ac=remaining(passive.world.snapshot()),bc=remaining(inquire.world.snapshot());
   const pos=b.self.position;
   const sourceFullyInSight=[SOURCE.x,SOURCE.x+.12,SOURCE.x+.24].every(x=>Math.hypot(x-pos.x,SOURCE.y-pos.y)<=.75);
   frames.push({sinceReportTicks:i,tick:passive.world.tick,
    passiveSeen:privateSource(a),activeSeen:privateSource(b),
    passiveX:a.self.position.x,activeX:b.self.position.x,
    hostReservePassive:ac,hostReserveActive:bc,sourceFullyInSight,
    activePrivateDeficitQualified:sourceFullyInSight&&privateSource(b)<3&&bc===privateSource(b)});
   expect(ac).toBe(bc);
   if(i<12){passive.world.step(new Map());inquire.world.step(cmd);}
  }
  const report={
   status:'SAMPLED_NO_LEARNER', selectedBy:'first source-stocked report privately heard with researcher-host source reserve below3 in ordinary unchanged reserve-purpose-blind R3',
   initialWorldTick:first.tick,initialHostSourceCount:first.hostCount,
   initialVisibleToIda:privateSource(first.frame),
   firstDirectAnySourceTick:frames.find(x=>x.activeSeen>0)?.sinceReportTicks??null,
   firstFullCoverageTick:frames.find(x=>x.sourceFullyInSight)?.sinceReportTicks??null,
   firstPrivatelyConfirmableDeficitTick:frames.find(x=>x.activePrivateDeficitQualified)?.sinceReportTicks??null,
   reserveRegeneratedDuringWindow:frames.some(x=>x.hostReservePassive>first.hostCount),
   frames,limits:'Researcher commands 12 lawful inquiry ticks; no resident continuation/learning. R3 World source timer remains active, source positions are researcher-side for checking FOV completeness.'};
  console.log('RB_R3_A1B_REAL_DEFICIT '+JSON.stringify(report));
  expect(frames).toHaveLength(13);
  expect(frames[0].passiveSeen).toBe(frames[0].activeSeen);
 },120000);
});
