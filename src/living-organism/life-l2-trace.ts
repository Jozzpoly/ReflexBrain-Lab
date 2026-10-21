import {LivingWorld, type Checkpoint, type Demand, type PrivateFrame} from './world';

type XY={x:number;y:number};
const ZERO:Demand={drive:0,turn:0,gazeRate:0};
const FORWARD:Demand={drive:.55,turn:0,gazeRate:0};
const BLOCK:[number,number,number]=[.83,.56,.24];
const ROCK:[number,number,number]=[.38,.43,.48];

export type R2aScene={world:LivingWorld;materialHandle:number};
export function createR2aScene(materialAt:XY={x:3.5,y:0}):R2aScene {
 const world=new LivingWorld(false,'B0');
 try {
  // A local open passage, not a perimeter/cage and not a target/quest.
  world.addWall(5,3.8,5,.25,ROCK);
  world.addWall(5,-3.8,5,.25,ROCK);
  const materialHandle=world.addObject(materialAt.x,materialAt.y,.75,BLOCK);
  return {world,materialHandle};
 }catch(e){world.free();throw e;}
}
const material=(s:R2aScene):XY=>{
 const o=s.world.inspect().objects.find(x=>x.handle===s.materialHandle);
 if(!o)throw Error('Actual loose material unavailable to researcher');
 return {x:o.x,y:o.y};
};
const distance=(a:XY,b:XY)=>Math.hypot(a.x-b.x,a.y-b.y);

/** Actual actor→World embodied trace followed by idle *physical* time;
 * no researcher's object repositioning or target ID is given to the actor. */
export type R2aHistory={
 actorDemand:'forward'|'zero';start:XY;afterAction:XY;afterWait:XY;
 actionMovement:number;lateResidualFromStart:number;lateExtraMovement:number;
 beforeWitness:PrivateFrame;afterActionFrame:PrivateFrame;afterWaitFrame:PrivateFrame;
 finalCheckpoint:Checkpoint;
};
export function runR2aHistory(actorDemand:'forward'|'zero'):R2aHistory{
 const scene=createR2aScene(),w=scene.world;
 try{
  const start=material(scene),beforeWitness=w.observe();
  for(let i=0;i<480;i++)w.step(actorDemand==='forward'?FORWARD:ZERO);
  const afterAction=material(scene),afterActionFrame=w.observe();
  for(let i=0;i<3600;i++)w.step(ZERO);
  const afterWait=material(scene),afterWaitFrame=w.observe();
  return {actorDemand,start,afterAction,afterWait,
   actionMovement:distance(afterAction,start),
   lateResidualFromStart:distance(afterWait,start),
   lateExtraMovement:distance(afterWait,afterAction),
   beforeWitness,afterActionFrame,afterWaitFrame,
   finalCheckpoint:w.captureCheckpoint()};
 }finally{w.free();}
}

export type R2aReencounter={
 initialLegalFrame:PrivateFrame;firstMaterialContactTick:number|null;
 firstPrivateTouchTick:number|null;endActor:XY;maxActorX:number;lastPrivateFrame:PrivateFrame;
};
/** Host-controlled World-afterstate transplant; a NEW physical B0 witness
 * begins at the SAME origin. Never claim same-actor/brain continuous life.
 * The blind motor receives no private frame or World identity. */
export function runR2aReencounter(materialAt:XY):R2aReencounter{
 const scene=createR2aScene(materialAt),w=scene.world;
 const initialLegalFrame=w.observe();
 let firstMaterialContactTick:number|null=null,firstPrivateTouchTick:number|null=null;
 let lastContactSample=-1,lastPrivateTick=-1,maxActorX=0;
 let lastPrivateFrame=initialLegalFrame;
 try{
  for(let i=0;i<600;i++){
   w.step(FORWARD);
   const c=w.inspectContactSample();
   if(c.tick!==lastContactSample){
    lastContactSample=c.tick;
    if(firstMaterialContactTick===null&&c.contacts.some(x=>x.handle===scene.materialHandle))
     firstMaterialContactTick=c.tick;
   }
   const f=w.observe();
   if(f.tick!==lastPrivateTick){
    lastPrivateTick=f.tick;lastPrivateFrame=f;
    if(firstPrivateTouchTick===null&&f.touch.some(x=>x>0))
      firstPrivateTouchTick=f.tick;
   }
   maxActorX=Math.max(maxActorX,w.inspect().actor.x);
  }
  const actor=w.inspect().actor;
  return {initialLegalFrame,firstMaterialContactTick,firstPrivateTouchTick,
   endActor:{x:actor.x,y:actor.y},maxActorX,lastPrivateFrame};
 }finally{w.free();}
}

export type R2aReplay={matched:boolean;checkpointTick:number;physicsBytes:number};
/** Exact World + sensor cache, not a LIFE/L1 or new LIFE/L2 process restart. */
export function runR2aReplay():R2aReplay{
 const scene=createR2aScene(),w=scene.world;
 try{
  for(let i=0;i<480;i++)w.step(FORWARD);
  const cp=w.captureCheckpoint();
  const continuation=()=>{
   for(let i=0;i<3600;i++)w.step(ZERO);
   const checkpoint=w.captureCheckpoint();
   const host=w.inspect();
   return {physics:Array.from(checkpoint.physics),host,
    frame:w.observe(),other:{pendingTouch:checkpoint.pendingTouch,
     events:checkpoint.pendingContactEvents,contacts:checkpoint.contactSample}};
  };
  const unbroken=continuation();
  w.restoreCheckpoint(cp);
  const resumed=continuation();
  return {matched:JSON.stringify(unbroken)===JSON.stringify(resumed),
   checkpointTick:cp.tick,physicsBytes:cp.physics.length};
 }finally{w.free();}
}
