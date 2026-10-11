import {beforeAll,describe,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld,type Demand} from '../../src/living-organism/world';
import {E0_RAPIER as R} from '../../src/e0-body-seam';
import {ApproachEpisode} from '../../src/living-organism/approach-episode';
import {visibleTurquoisePatches} from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/C7: independently force-driven *World mover* vs the actor's
 * previous visual/motor activity. NO mid-run host teleport or timer event.
 *
 * Move the experiment's whole horizontal lane to y=-3 (where the real
 * LivingWorld mover already applies its y-homing force). The source's
 * actual 120Hz Rapier mover then catches the actor from behind during
 * approach to a previously lawfully seen turquoise target.
 *
 * Compare original private touch-as-completion to host-only true physical
 * collider attribution; do NOT pass mover/target handles to actor.
 * No learner, no self-formed semantic relevance.
 */
type Spec={moverX:number;color:'same'|'orange'};
type Datum={spec:Spec;initialTargetVisible:boolean;
 initialMoverVisible:boolean;contactTick:number|null;
 originalTouched:boolean;moverTouched:boolean;
 distanceToOriginal:number;actorPath:number;
 contactedSector:number;contactMagnitudes:number[];
 retinalTurquoiseAtContact:boolean;
 note:string};
const SPECS:Spec[]=[-3,-4,-5].flatMap(moverX=>
 (['same','orange'] as const).map(color=>({moverX,color})));
const IDLE:Demand={drive:0,turn:0,gazeRate:0};
function run(spec:Spec):Datum{
 const w=new LivingWorld(false);
 const original=w.addObject(7,-3,.62,[.1,.85,.8]);
 const decoy=w.addObject(spec.moverX,-3,.62,
  spec.color==='same'?[.1,.85,.8]:[.9,.55,.13]);
 const cp=w.captureCheckpoint();
 const physics=R.World.restoreSnapshot(cp.physics);
 if(!physics)throw Error('C7 physical checkpoint restore failed');
 const actor=physics.getRigidBody(cp.actorHandle);
 actor.setTranslation({x:0,y:-3},true);
 physics.propagateModifiedBodyPositionsToColliders();
 cp.physics=physics.takeSnapshot();
 physics.free();
 cp.mover={handle:decoy,direction:1};
 w.restoreCheckpoint(cp);
 // Unlike a direct sample() World API, the native frame cache must
 // legitimately advance from the initial 0,0 checkpoint to this pose.
 for(let i=0;i<4;i++)w.step(IDLE);
 const approach=new ApproachEpisode(true,true);
 let initialTargetVisible=false,initialMoverVisible=false;
 let lastFrameTick=-1,demand:Demand=IDLE,bodyPath=0,
  originalTouched=false,moverTouched=false;
 let contactTouch:number[]=[];
 let last=w.inspect().actor;
 let retinalTurquoiseAtContact=false;
 let completed:number|null=null;
 try{
  for(let t=4;t<1200;t++){
   const f=w.observe();
   if(f.tick!==lastFrameTick){
    lastFrameTick=f.tick;
    const turquoise=visibleTurquoisePatches(f.retina);
    if(t===4){
     initialTargetVisible=turquoise.some(p=>!p.clipped);
     // Source-independent host check: the mover begins behind the body,
     // so its color should not be in the native forward retina.
     const orange=[...f.retina].some((c,i)=>
      i%3===0&&c>.85&&c<.95&&
      Math.abs(f.retina[i+1]-.55)<.04);
     initialMoverVisible=orange;
    }
    demand=approach.decide(f);
    if(Math.max(...f.touch)>.001){
     contactTouch=Array.from(f.touch);
     retinalTurquoiseAtContact=turquoise.some(p=>!p.clipped);
    }
   }
   w.step(demand);
   const a=w.inspect().actor;
   bodyPath+=Math.hypot(a.x-last.x,a.y-last.y);last=a;
   if(w.inspect().tick%4===0){
    for(const c of w.inspectContactSample().contacts){
     if(c.impulse>.001){
      originalTouched ||= c.handle===original;
      moverTouched ||= c.handle===decoy;
     }
    }
   }
   if(approach.capture().mode==='contact'){
    completed=approach.capture().contactTick;break;
   }
  }
  const a=w.inspect().actor;
  const originalBody=w.inspect().objects.find(s=>s.handle===original);
  if(!originalBody)throw Error('C7 missing original');
  const distanceToOriginal=Math.hypot(
   a.x-originalBody.x,a.y-originalBody.y);
  return {
   spec,initialTargetVisible,initialMoverVisible,
   contactTick:completed,originalTouched,moverTouched,
   distanceToOriginal,actorPath:bodyPath,
   contactedSector:contactTouch.indexOf(Math.max(...contactTouch)),
   contactMagnitudes:contactTouch,retinalTurquoiseAtContact,
   note:'World force, not host-triggered teleport',
  };
 }finally{w.free();}
}
beforeAll(initLivingWorld);
describe('RB-VISION/C7 natural physical mover contact vs old material concern',()=>{
 it('characterizes whether real World-mover contact can counterfeit target completion',()=>{
  const result=SPECS.map(run);
  console.log('RB_VISION_C7_WORLD_MOVER_CONTACT '+JSON.stringify(result.map(r=>({
   ...r,actorPath:+r.actorPath.toFixed(3),
   distanceToOriginal:+r.distanceToOriginal.toFixed(3),
  }))));
  expect(result.every(r=>r.initialTargetVisible)).toBe(true);
  expect(result.some(r=>r.moverTouched)).toBe(true);
  expect(result.some(r=>r.contactTick!==null
    &&r.moverTouched&&!r.originalTouched)).toBe(true);
 },50000);
});
