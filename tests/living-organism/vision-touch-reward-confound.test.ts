import {beforeAll,describe,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld,type Demand} from '../../src/living-organism/world';
import {ApproachEpisode} from '../../src/living-organism/approach-episode';

/**
 * RB-VISION/C1: private touch is NOT intrinsically progress on the
 * personally encountered object. Falsify using real collision physics.
 *
 * Existing authored ApproachEpisode ends on ANY lawful touch. B4/B5
 * optimizes "touch happened" as a private reward. A World-origin
 * distractor can collide while turquoise target remains distant,
 * making earlier successful "contact" more valuable than the genuine
 * target contact under the B4 scalar reward.
 *
 * The test observer uses host contact IDs/positions ONLY for post-hoc
 * diagnostics. The actor and reward see ONLY PrivateFrame touch/clock
 * and its own gaze commands.
 */
type Condition='target-only'|'unrelated-rear-touch'|'unrelated-side-touch';
type Result={
 condition:Condition;completionTick:number|null;
 privateContact:boolean;hostTargetTouched:boolean;
 hostOtherTouched:boolean;targetDistanceOnCompletion:number;
 hostTargetMinDistance:number;fakeReward:number;
 lastTouch:ReadonlyArray<number>;nearTarget:boolean;
 bodyPath:number;
};
const IDLE:Demand={drive:0,turn:0,gazeRate:0};
function run(condition:Condition):Result{
 const w=new LivingWorld(false);
 const target=w.addObject(7,0,.62,[.1,.85,.8]);
 const other=w.addObject(-30,-30,.65,[.9,.55,.13]);
 const brain=new ApproachEpisode(true,true);
 let demand=IDLE,lastSample=-1,completionTick:number|null=null;
 let privateContact=false,hostTargetTouched=false,
  hostOtherTouched=false,minTargetDistance=Infinity,
  targetDistanceOnCompletion=Infinity,bodyPath=0;
 let prev=w.inspect().actor;
 let lastTouch:number[]=[];
 try{
  for(let t=0;t<1200;t++){
   if(t===80 && condition!=='target-only'){
    // HOST-controlled independently material collision from an object
    // unrelated to the turquoise target. No label/intent to the actor.
    const a=w.inspect().actor;
    // A collision object is inserted just INSIDE the forward body's
    // contact envelope while the actor retains a real forward demand.
    // The previous rear-side placement did not yield a Rapier impulse.
    w.moveObject(other,a.x+1.45,
     a.y+(condition==='unrelated-rear-touch'?.32:-.32));
   }
   const frame=w.observe();
   if(frame.tick!==lastSample){
    lastSample=frame.tick;
    demand=brain.decide(frame);
    if(Math.max(...frame.touch)>.001){
     privateContact=true;
     lastTouch=Array.from(frame.touch);
    }
   }
   w.step(demand);
   const objects=w.inspect().objects;
   const targetState=objects.find(x=>x.handle===target);
   if(!targetState)throw Error('C1 target host missing');
   const a=w.inspect().actor;
   const distance=Math.hypot(a.x-targetState.x,
    a.y-targetState.y);
   minTargetDistance=Math.min(minTargetDistance,distance);
   bodyPath+=Math.hypot(a.x-prev.x,a.y-prev.y);
   prev=a;
   if((t+1)%4===0){
    const collisions=w.inspectContactSample().contacts;
    hostTargetTouched ||= collisions.some(x=>
     x.handle===target&&x.impulse>.001);
    hostOtherTouched ||= collisions.some(x=>
     x.handle===other&&x.impulse>.001);
   }
   if(brain.capture().mode==='contact'){
    completionTick=brain.capture().contactTick;
    targetDistanceOnCompletion=distance;
    break;
   }
  }
  const realTarget=hostTargetTouched;
  const fakeReward=completionTick===null?0:
   1-.2*(completionTick-4)/1200; // as B4 with zero eye-motor cost
  return {
   condition,completionTick,privateContact,
   hostTargetTouched,hostOtherTouched,
   targetDistanceOnCompletion,
   hostTargetMinDistance:minTargetDistance,
   fakeReward,lastTouch,nearTarget:realTarget,bodyPath,
  };
 }finally{w.free();}
}
beforeAll(initLivingWorld);
describe('RB-VISION/C1 actor-private generic touch vs material activity completion',()=>{
 it('measures a physical unrelated-contact confound in the learned attention reward',()=>{
  const cases=(['target-only','unrelated-rear-touch',
   'unrelated-side-touch'] as const).map(run);
  console.log('RB_VISION_C1_TOUCH_REWARD_CONFOUND '+
   JSON.stringify(cases.map(x=>({
    condition:x.condition,tick:x.completionTick,
    privateTouch:x.privateContact,
    targetTouched:x.hostTargetTouched,
    unrelatedTouched:x.hostOtherTouched,
    gapToTarget:x.targetDistanceOnCompletion,
    learnedRewardProxy:x.fakeReward,
    touchSectors:x.lastTouch,
    bodyPath:x.bodyPath,
   }))));
  expect(cases[0].privateContact).toBe(true);
  expect(cases[0].hostTargetTouched).toBe(true);
  expect(cases[0].hostOtherTouched).toBe(false);
  // All host-only attribution remains outside actor's experience.
  const intrusions=cases.slice(1);
  expect(intrusions.every(x=>x.hostOtherTouched)).toBe(true);
  expect(intrusions.every(x=>x.privateContact)).toBe(true);
  expect(intrusions.some(x=>x.completionTick!==null
   &&!x.hostTargetTouched
   &&x.targetDistanceOnCompletion>3)).toBe(true);
  // Successful fast fake contact can dominate the nominal reward.
  expect(intrusions.some(x=>!x.hostTargetTouched
   &&x.fakeReward>cases[0].fakeReward)).toBe(true);
 },30000);
});
