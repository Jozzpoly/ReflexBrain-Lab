import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld,type Demand} from '../../src/living-organism/world';
import {DevResident} from '../../src/living-organism/dev-resident';

/** Exploratory attribution, NOT preregistered proof of organism competence.
 * 180-tick shadow counterfactuals use real Rapier and sampled legal private
 * proprioception/touch; host World inspection measures physics consequences.
 */
const COMMANDS:readonly Demand[]=[
 {drive:.55,turn:0,gazeRate:0},
 {drive:.40,turn:.65,gazeRate:.20},
 {drive:.40,turn:-.65,gazeRate:-.20},
 {drive:-.35,turn:0,gazeRate:0}
];
type Scene='empty'|'oneMovable'|'twoMovable'|'oneAnchored'|'largeMovable';
type Part=readonly [number,number,number,number,'anchored'|'dynamic'];
const PARTS:Record<Scene,readonly Part[]>={
 empty:[],
 oneMovable:[[3,0,.65,.65,'dynamic']],
 twoMovable:[[3,0,.65,.65,'dynamic'],[4.5,0,.65,.65,'dynamic']],
 oneAnchored:[[3,0,.65,.65,'anchored']],
 largeMovable:[[3,0,1.2,1.2,'dynamic']]
};
const SCENES:Scene[]=['empty','oneMovable','twoMovable','oneAnchored','largeMovable'];
function make(scene:Scene){
 const w=new LivingWorld(false,'B0');
 for(const part of PARTS[scene])w.addMaterialPart(...part);
 return w;
}
function probe(scene:Scene,action:number){
 const w=make(scene);
 try{
  const original=w.inspect().objects.filter(o=>o.kind==='part');
  let lastTick=0,distance=0,touchExposure=0,sampledFrames=0;
  for(let tick=1;tick<=180;tick++){
   w.step(COMMANDS[action]);
   if(tick%4!==0)continue;
   const f=w.observe(),dt=(f.tick-lastTick)/120;
   lastTick=f.tick;
   distance+=Math.hypot(f.proprio.forward,f.proprio.lateral)*dt;
   touchExposure+=Math.min(50,Array.from(f.touch).reduce((a,b)=>a+Math.abs(b),0))*dt;
   sampledFrames++;
  }
  const mobility=Math.max(0,Math.min(1,distance/1.5/3));
  const resistance=Math.max(0,Math.min(1,touchExposure/1.5/12));
  // Exact DevResident.finish arithmetic, under prescribed single action.
  const score=Math.max(-.5,Math.min(1,mobility-.5*resistance));
  const actual=w.inspect().objects.filter(o=>o.kind==='part');
  const materialMovement=actual.reduce((sum,o,i)=>sum+Math.hypot(
    o.x-original[i].x,o.y-original[i].y),0);
  return {scene,action,score,mobility,resistance,materialMovement,
    sampledFrames,physicsTicks:w.inspect().tick};
 }finally{w.free();}
}

describe('RB-R12 exploratory material-value mismatch; no learner promotion',()=>{
 beforeAll(initLivingWorld);
 it('replays four original commands across five source physical worlds',()=>{
  const rows=SCENES.flatMap(scene=>COMMANDS.map((_,action)=>probe(scene,action)));
  expect(rows).toHaveLength(20);
  expect(rows.every(x=>x.physicsTicks===180&&x.sampledFrames===45&&
   Number.isFinite(x.score)&&Number.isFinite(x.materialMovement))).toBe(true);
  console.log('RB_R12_MATERIAL_VALUE_EXPLORATORY '+JSON.stringify(rows));

  const heavy=rows.filter(x=>x.scene==='largeMovable');
  const straight=heavy[0],reverse=heavy[3];
  expect(straight.materialMovement).toBeGreaterThan(1);
  expect(reverse.materialMovement).toBe(0);
  expect(reverse.score).toBeGreaterThan(straight.score);
  expect(heavy.slice(1,3).every(x=>reverse.score>x.score)).toBe(true);

  // Disconfirm overgeneralization: for smaller movable matter, forward wins.
  const light=rows.filter(x=>x.scene==='oneMovable');
  expect(light[0].materialMovement).toBeGreaterThan(1);
  expect(light[0].score).toBeGreaterThan(Math.max(...light.slice(1).map(x=>x.score)));
  const anchored=rows.find(x=>x.scene==='oneAnchored'&&x.action===0)!;
  expect(anchored.materialMovement).toBe(0);
  expect(anchored.score).toBeLessThan(straight.score);
 },120000);

 it('parity: unchanged DevResident REALLY records the predicted first-trial value',()=>{
  const scene:Scene='largeMovable';
  const w=make(scene),resident=new DevResident('adaptive',1183);
  try{
   for(let tick=0;tick<180;tick++){
    const demand=resident.decide(w.observe());
    expect(demand).toEqual(COMMANDS[0]);
    w.step(demand);
   }
   // At tick180, original resident completes the previous action episode.
   resident.decide(w.observe());
   const state=resident.capture();
   expect(state.learnedTrials).toBe(1);
   expect(state.stats[0][0].count).toBe(1);
   const expected=probe(scene,0).score;
   expect(state.stats[0][0].sum).toBeCloseTo(expected,7);
   console.log('RB_R12_ACTUAL_LEARNER_PARITY '+JSON.stringify({
    firstAction:0,actualSavedValue:state.stats[0][0].sum,
    shadowValue:expected,worldTick:w.inspect().tick
   }));
  }finally{w.free();}
 },120000);
});
