import { LivingRuntime } from './runtime';
import { visibleTurquoisePatches } from './retina-geometry';

export type M1Shift = {label:string; x:number; y:number; relocated:boolean};
const SHIFTS:M1Shift[] = [
  {label:'rear-upper',x:-6,y:3,relocated:true},
  {label:'rear-lower',x:-6,y:-3,relocated:true},
  {label:'front-lower',x:6,y:-3,relocated:true},
  {label:'front-near',x:6,y:3,relocated:true},
  {label:'unchanged',x:5,y:3,relocated:false},
];
const FORK_TICK=80;
const CONTINUE_TICKS=4800;

export type M1Side={
  mode:'retained'|'no-bearing-memory';
  reached:boolean;
  firstContactTick:number|null;
  endingGap:number;
  pathDistance:number;
  visibleFrames:number;
  targetTouchWindows:number;
  otherTouchWindows:number;
  finalMode:string;
  firstMotorDifferenceTick:number|null;
  finite:boolean;
};
export type M1Scene={shift:M1Shift; privateSeenAtFork:boolean; exactCommonFork:boolean; arms:[M1Side,M1Side]};
export type M1Result={
  scientific:'PASS'|'FAIL'|'INCONCLUSIVE';
  deterministic:boolean;
  retainedTouches:number;
  ablatedTouches:number;
  retainedMedianGap:number;
  ablatedMedianGap:number;
  scenes:M1Scene[];
  reasons:string[];
};
const median=(xs:number[])=>{
  const s=[...xs].sort((a,b)=>a-b);
  return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;
};
const isTurquoise=(c:readonly number[])=>c[0]<.3&&c[1]>.65&&c[2]>.6;
const finitePosition=(a:{x:number;y:number;vx:number;vy:number})=>
  [a.x,a.y,a.vx,a.vy].every(Number.isFinite);
const sameUint8=(a:Uint8Array,b:Uint8Array)=>
  a.length===b.length && a.every((v,i)=>v===b[i]);
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);

/**
 * A single physical World/brain is allowed to acquire a private history for 80 ticks.
 * Then two complete identical state forks receive an identical World perturbation.
 * The only intervention in the challenger brain is removing two private
 * recent-direction memory fields before each ordinary step.
 */
function scene(shift:M1Shift):M1Scene {
  const parent=new LivingRuntime();
  let control:LivingRuntime|null=null, ablated:LivingRuntime|null=null;
  try{
    const candidates=parent.inspect().objects.filter(o=>o.kind==='object'&&isTurquoise(o.color));
    if(candidates.length!==2)throw Error('unexpected initial visible-color target fixture');
    const target=candidates.find(o=>Math.abs(o.x-5)<.01&&Math.abs(o.y-3)<.01);
    const distractor=candidates.find(o=>o.handle!==target?.handle);
    if(!target||!distractor)throw Error('missing target or distractor fixture');
    // Controlled initial scene: eliminate ambiguous lookalike before private learning.
    parent.world.moveObject(distractor.handle,50,50);
    for(let tick=0;tick<FORK_TICK;tick++)parent.step();
    const cp=parent.capture();
    const privateSeenAtFork=cp.occupant.lastSeenTick!==null &&
      cp.occupant.lastSeenTick<=FORK_TICK;
    // Two complete, independent *live* World+agent clones.
    control=new LivingRuntime();control.restore(cp);
    ablated=new LivingRuntime();ablated.restore(cp);
    const cpA=control.capture(),cpB=ablated.capture();
    const exactCommonFork=sameUint8(cpA.world.physics,cpB.world.physics) &&
      same(cpA.world.frame,cpB.world.frame) &&
      same(cpA.world.surfaces,cpB.world.surfaces) &&
      same(cpA.world.mover,cpB.world.mover) &&
      same(cpA.occupant,cpB.occupant) && same(cpA.vision,cpB.vision) &&
      same(control.inspect(),ablated.inspect());
    if(shift.relocated){
      control.world.moveObject(target.handle,shift.x,shift.y);
      ablated.world.moveObject(target.handle,shift.x,shift.y);
    }
    type Tracker={
      side:M1Side; prior:{x:number;y:number}; lastSampleTick:number;
    };
    const makeTracker=(mode:M1Side['mode']):Tracker=>{
      const s=control!.inspect().actor;
      return{
        prior:{x:s.x,y:s.y},lastSampleTick:-1,
        side:{mode,reached:false,firstContactTick:null,endingGap:Infinity,
          pathDistance:0,visibleFrames:0,targetTouchWindows:0,
          otherTouchWindows:0,finalMode:'',firstMotorDifferenceTick:null,finite:true},
      };
    };
    const a=makeTracker('retained'),b=makeTracker('no-bearing-memory');
    let firstDivergence:number|null=null;
    for(let i=0;i<CONTINUE_TICKS;i++){
      // The ablation is private and immediate, not a World-side "relocated" event.
      const z=ablated.occupant.capture();
      ablated.occupant.restore({...z,lastDirection:null,lastSeenTick:null});
      control.step();ablated.step();
      const p=control.occupant.capture(),q=ablated.occupant.capture();
      const currentTick=control.inspect().tick;
      if(firstDivergence===null && !same(p.demand,q.demand))
        firstDivergence=currentTick;
      for(const [runtime,t] of [[control,a],[ablated,b]] as const){
        const host=runtime.inspect(), actor=host.actor;
        const previous=t.prior;
        t.side.pathDistance+=Math.hypot(actor.x-previous.x,actor.y-previous.y);
        previous.x=actor.x;previous.y=actor.y;
        t.side.finite &&=finitePosition(actor);
        const targetNow=host.objects.find(o=>o.handle===target.handle);
        if(!targetNow)throw Error('target handle vanished in host World');
        t.side.endingGap=Math.max(0,
          Math.hypot(actor.x-targetNow.x,actor.y-targetNow.y)-1-targetNow.hx);
        t.side.finalMode=runtime.occupant.capture().mode;
        const sampled=runtime.observe();
        if(sampled.tick!==t.lastSampleTick){
          t.lastSampleTick=sampled.tick;
          if(visibleTurquoisePatches(sampled.retina).length>0)t.side.visibleFrames++;
          const hostContacts=runtime.world.inspectContactSample();
          if(hostContacts.tick===sampled.tick){
            const targetTouch=hostContacts.contacts.some(c=>c.handle===target.handle);
            const otherTouch=hostContacts.contacts.some(c=>c.handle!==target.handle);
            if(targetTouch){
              t.side.targetTouchWindows++;
              if(t.side.firstContactTick===null)t.side.firstContactTick=hostContacts.tick;
              t.side.reached=true;t.side.endingGap=0;
            }
            if(otherTouch)t.side.otherTouchWindows++;
          }
        }
      }
    }
    a.side.firstMotorDifferenceTick=firstDivergence;
    b.side.firstMotorDifferenceTick=firstDivergence;
    return {shift,privateSeenAtFork,exactCommonFork,arms:[a.side,b.side]};
  }finally{
    parent.free();control?.free();ablated?.free();
  }
}
function once():Omit<M1Result,'deterministic'> {
  const scenes=SHIFTS.map(scene);
  const changed=scenes.filter(s=>s.shift.relocated);
  const retainedTouches=changed.filter(s=>s.arms[0].reached).length;
  const ablatedTouches=changed.filter(s=>s.arms[1].reached).length;
  const retainedMedianGap=median(changed.map(s=>s.arms[0].endingGap));
  const ablatedMedianGap=median(changed.map(s=>s.arms[1].endingGap));
  const reasons:string[]=[];
  const invalid=scenes.some(s=>!s.exactCommonFork||!s.privateSeenAtFork||
    s.arms.some(a=>!a.finite||a.visibleFrames===0));
  if(invalid)reasons.push('source fork, prior legal sighting, finite body or native vision unqualified');
  if(retainedTouches<3)reasons.push('retained private memory contacts fewer than 3/4 relocated targets');
  if(retainedTouches<ablatedTouches+2)reasons.push('retained private memory does not earn 2 additional physical contacts');
  const margin=ablatedMedianGap===0 ? 0:
    (ablatedMedianGap-retainedMedianGap)/ablatedMedianGap;
  if(margin<.25)reasons.push('retained median material gap not 25% better');
  const stable=scenes.find(s=>!s.shift.relocated);
  if(stable?.arms[1].reached&&!stable.arms[0].reached)
    reasons.push('retained memory harmed unchanged-target material contact');
  return{
    scientific:invalid?'INCONCLUSIVE':reasons.length?'FAIL':'PASS',
    retainedTouches,ablatedTouches,retainedMedianGap,ablatedMedianGap,
    scenes,reasons,
  };
}
export function runM1MemoryMaterialAudit():M1Result {
  const a=once(),b=once(),deterministic=same(a,b);
  return{
    ...a,deterministic,
    scientific:deterministic?a.scientific:'INCONCLUSIVE',
    reasons:deterministic?a.reasons:[...a.reasons,'whole-life source repeat not deterministic'],
  };
}
export const M1_FROZEN={shifts:SHIFTS,forkTick:FORK_TICK,continuationTicks:CONTINUE_TICKS} as const;
