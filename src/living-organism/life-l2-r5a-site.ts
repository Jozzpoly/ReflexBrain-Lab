import {LivingWorld, type Demand, type PrivateFrame, type Checkpoint} from './world';

const ROCK:[number,number,number]=[.44,.49,.50];
const EARTH:[number,number,number]=[.64,.50,.32];
const LEAF:[number,number,number]=[.43,.65,.48];
const SOURCE:[number,number,number]=[.69,.44,.64];
const ZERO:Demand={drive:0,turn:0,gazeRate:0};
const near=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(x:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,x));
const wrap=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));

export type R5Habitat={world:LivingWorld; ordinaryHandles:number[];sourceHandle:number};
export function createR5Habitat(powered:boolean):R5Habitat{
 const world=new LivingWorld(false,'B1');
 try{
  // Material niche at x~8: not a perimeter enclosing the born actor.
  // Open passage on left AND a gap on the upper edge, allowing exchange.
  world.addWall(7.5,-2.7,4.5,.23,ROCK);
  world.addWall(4.5,2.7,1.5,.23,ROCK);
  world.addWall(10.5,2.7,1.5,.23,ROCK);
  world.addWall(12,0,.23,2.7,ROCK);
  world.addWall(3,2.18,.23,.52,ROCK);
  world.addWall(3,-2.18,.23,.52,ROCK);
  // Three truly loose ordinary bodies, no reset/teleport.
  const ordinaryHandles=[
   world.addObject(8.1,0,.70,EARTH),
   world.addObject(10.4,.9,.65,LEAF),
   world.addObject(6.3,1.4,.62,EARTH),
  ];
  // Matched mass/geometry at birth in ON and OFF arms.
  const sourceHandle=powered
   ?world.addRailMover(5.0,0,.75,SOURCE,4.3,10.2,1.4)
   :world.addObject(5.0,0,.75,SOURCE);
  return {world,ordinaryHandles,sourceHandle};
 }catch(e){world.free();throw e;}
}

export type R5Mode='reentrant'|'reactive'|'blind';
export type R5PrivateState={
 version:1;mode:R5Mode;lastTick:number|null;
 lastDemand:Demand;ownX:number;ownY:number;heading:number;
 lastExposureX:number;lastExposureY:number;lastExposureTick:number|null;
 visualFrames:number;opticalLosses:number;reentryFrames:number;
 contactFrames:number;contactEpisodes:number;lastContact:boolean;
 frames:number;control:'see'|'seek'|'scan'|'blind'|'recover';
};
function visual(f:PrivateFrame){
 let left=0,center=0,right=0;
 for(let i=0;i<96;i++){
  const k=i*3;
  if(f.retina[k]+f.retina[k+1]+f.retina[k+2]>.22){
   if(i<32)left++;else if(i<64)center++;else right++;
  }
 }
 return {left,center,right,total:left+center+right};
}
const isContact=(f:PrivateFrame)=>f.touch.some(t=>t>.005);

export class R5Resident{
 private s:R5PrivateState;
 constructor(readonly mode:R5Mode='reentrant'){
  this.s={version:1,mode,lastTick:null,lastDemand:{...ZERO},
   ownX:0,ownY:0,heading:0,lastExposureX:0,lastExposureY:0,
   lastExposureTick:null,visualFrames:0,opticalLosses:0,reentryFrames:0,
   contactFrames:0,contactEpisodes:0,lastContact:false,frames:0,
   control:'scan'};
 }
 decide(f:PrivateFrame):Demand{
  const s=this.s;
  if(s.lastTick!==null&&f.tick<=s.lastTick)return {...s.lastDemand};
  const dt=s.lastTick===null?0:(f.tick-s.lastTick)/120;
  const rotation=f.proprio.omega*dt;
  const half=s.heading+rotation/2;
  s.ownX+=(f.proprio.forward*Math.cos(half)-f.proprio.lateral*Math.sin(half))*dt;
  s.ownY+=(f.proprio.forward*Math.sin(half)+f.proprio.lateral*Math.cos(half))*dt;
  s.heading=wrap(s.heading+rotation);
  const visible=visual(f),contact=isContact(f);
  if(contact&&!s.lastContact)s.contactEpisodes++;
  if(contact)s.contactFrames++;
  s.lastContact=contact;
  const saw=visible.total>0&&this.mode!=='blind';
  const previouslyVisible=s.lastExposureTick!==null&&
   s.lastTick!==null&&s.lastExposureTick===s.lastTick;
  let drive=.22,turn=0,control:R5PrivateState['control']='scan';
  if(saw){
   s.visualFrames++;
   s.lastExposureX=s.ownX;s.lastExposureY=s.ownY;s.lastExposureTick=f.tick;
   turn=clamp((visible.left-visible.right)/32*.7,-.6,.6);
   drive=visible.center>6?.13:.22;
   control='see';
  }else if(this.mode==='blind'){
   drive=.22;turn=0;control='blind';
  }else{
   if(previouslyVisible)s.opticalLosses++;
   const timeSince=s.lastExposureTick===null?Infinity:(f.tick-s.lastExposureTick)/120;
   const dx=s.lastExposureX-s.ownX,dy=s.lastExposureY-s.ownY;
   const distance=Math.hypot(dx,dy);
   if(this.mode==='reentrant'&&s.lastExposureTick!==null&&timeSince>.7&&distance>1.1){
    const err=wrap(Math.atan2(dy,dx)-s.heading);
    turn=clamp(err*1.25,-.85,.85);
    drive=Math.abs(err)>.65?.075:.21;
    s.reentryFrames++;control='seek';
   }else{
    // The cheap rival has no remembered locus, only instantaneous blankness.
    // Both may turn and scan; only 'reentrant' can use where it last saw matter.
    drive=.08;turn=.42;control='scan';
   }
  }
  if(contact){drive=-.17;turn=turn>=0?.65:-.65;control='recover';}
  const out={drive,turn,gazeRate:0};
  s.lastTick=f.tick;s.lastDemand={...out};s.control=control;s.frames++;
  return out;
 }
 capture():R5PrivateState{return structuredClone(this.s);}
 restore(value:R5PrivateState){
  if(value.version!==1||value.mode!==this.mode ||
    ![value.ownX,value.ownY,value.heading,value.lastExposureX,
      value.lastExposureY,value.lastDemand.drive,value.lastDemand.turn].every(Number.isFinite))
   throw Error('R5 private specimen identity or state invalid');
  this.s=structuredClone(value);
 }
}

export type R5Checkpoint={version:1;specimen:'l2-r5a-v1';
 powered:boolean;mode:R5Mode;world:Checkpoint;resident:R5PrivateState};
export class R5Runtime{
 readonly world:LivingWorld;
 readonly resident:R5Resident;
 readonly ordinaryHandles:number[];
 readonly sourceHandle:number;
 constructor(readonly powered:boolean,readonly mode:R5Mode='reentrant'){
  const site=createR5Habitat(powered);
  this.world=site.world;
  this.ordinaryHandles=site.ordinaryHandles;
  this.sourceHandle=site.sourceHandle;
  this.resident=new R5Resident(mode);
 }
 step(manual:Demand|null=null){
  // no host coordinates, stage IDs, rail phase or hidden output in decide()
  const demand=manual??this.resident.decide(this.world.observe());
  this.world.step(demand);
 }
 capture():R5Checkpoint{
  return {version:1,specimen:'l2-r5a-v1',powered:this.powered,mode:this.mode,
   world:this.world.captureCheckpoint(),resident:this.resident.capture()};
 }
 restore(c:R5Checkpoint){
  if(c.version!==1||c.specimen!=='l2-r5a-v1'||c.powered!==this.powered||
    c.mode!==this.mode||c.world.bodyShape!=='B1'||c.resident.mode!==this.mode)
   throw Error('R5a specimen mismatch');
  this.world.restoreCheckpoint(c.world);this.resident.restore(c.resident);
 }
 free(){this.world.free();}
}

/** Actual ordinary-body displacement over per-second world samples.
 * Global host measurement only; NEVER offered to the resident. */
export function observeR5Site(powered:boolean,ticks=14400){
 const site=createR5Habitat(powered),w=site.world;
 const tracked=()=>{
  const o=w.inspect().objects;
  return site.ordinaryHandles.map(h=>{const p=o.find(x=>x.handle===h);
   if(!p)throw Error('Material unavailable');return {x:p.x,y:p.y};});
 };
 let prev=tracked(),travel=[0,0,0,0],screenedFrames=0,lastFrame=-1;
 try{
  for(let i=0;i<ticks;i++){
   w.step(ZERO);
   if((i+1)%120===0){
    const next=tracked(),bin=Math.min(3,Math.floor(i/3600));
    travel[bin]+=next.reduce((s,x,j)=>s+near(x,prev[j]),0);
    prev=next;
   }
   const f=w.observe();
   if(f.tick!==lastFrame){lastFrame=f.tick;screenedFrames++;}
  }
  return {powered,ticks,travel,ordinaryPositions:tracked(),screenedFrames,
   endWorld:w.inspect().actor,rawPhysicsBytes:w.captureCheckpoint().physics.length};
 }finally{w.free();}
}

export function observeR5Resident(powered:boolean,mode:R5Mode,ticks=14400){
 const rt=new R5Runtime(powered,mode),w=rt.world;
 const binEye=[0,0,0,0],binTouch=[0,0,0,0],binMaterial=[0,0,0,0];
 let lastTick=-1;let lastOrdinary=w.inspect().objects.filter(x=>rt.ordinaryHandles.includes(x.handle));
 const initial=w.inspect().actor;
 let lateRealContacts=0;
 try{
  for(let i=0;i<ticks;i++){
   rt.step();
   const f=w.observe();
   if(f.tick!==lastTick){
    lastTick=f.tick;
    const b=Math.min(3,Math.floor(Math.max(0,f.tick-1)/3600));
    if(visual(f).total>0)binEye[b]++;
    if(isContact(f))binTouch[b]++;
   }
   if((i+1)%120===0){
    const b=Math.min(3,Math.floor(i/3600));
    const newObj=w.inspect().objects.filter(x=>rt.ordinaryHandles.includes(x.handle));
    binMaterial[b]+=newObj.reduce((n,x,j)=>n+near(x,lastOrdinary[j]),0);
    lastOrdinary=newObj;
   }
   if((i+1)%4===0&&i+1>7200){
    const contacts=w.inspectContactSample().contacts;
    lateRealContacts+=contacts.filter(c=>rt.ordinaryHandles.includes(c.handle)).length;
   }
  }
  const state=rt.resident.capture(),actor=w.inspect().actor;
  return {powered,mode,ticks,binEye,binTouch,binMaterial,lateRealContacts,
   lastActor:actor,birthDistance:near(actor,initial),state,
   checkpointBytes:rt.capture().world.physics.length};
 }finally{rt.free();}
}
