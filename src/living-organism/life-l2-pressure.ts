import {LivingWorld, type Demand, type PrivateFrame, type BodyShape} from './world';

/**
 * L2/R0: minimal *physical* candidate for recurrent actor-relative pressure.
 * No resident or privileged route selector. The complete machine/plate state
 * stays on the host side of observe(). Different from D1 only by a local,
 * physically accessible, visually inspected crossing near the default body.
 */
const ZERO:Demand={drive:0,turn:0,gazeRate:0};
const WALL:[number,number,number]=[.32,.37,.43];
const GOLD:[number,number,number]=[.82,.62,.25];
const VIOLET:[number,number,number]=[.70,.36,.81];
const OCHRE:[number,number,number]=[.86,.55,.18];

export type L2R0World={
 world:LivingWorld;railHandle:number|null;materialHandle:number;gateHandle:number;plateHandle:number;
};
export function createL2R0World(railEnabled:boolean,shape:BodyShape='B0'):L2R0World{
 const world=new LivingWorld(false,shape);
 try{
  // Physically open elsewhere; no all-enclosing prison.
  // Here a constrained *local* crossing has a true mechanical gate.
  world.addWall(6,5.6,.45,3.8,WALL);
  world.addWall(6,-5.6,.45,3.8,WALL);
  const {plateHandle,gateHandle}=world.addLoadCoupledGate(
   -2,5,1.1,1, 6,0,.48,1.72,3.8,GOLD,
  );
  const materialHandle=world.addObject(-2,8,.7,OCHRE);
  const railHandle=railEnabled?
   world.addRailMover(-4,5,.7,VIOLET,-4,0,2.4):null;
  return {world,railHandle,materialHandle,gateHandle,plateHandle};
 }catch(e){world.free();throw e;}
}

const gateRGB=(f:PrivateFrame):number=>{
 let n=0;
 for(let i=0;i<f.retina.length;i+=3){
  if(Math.abs(f.retina[i]-.82)<.018 &&
     Math.abs(f.retina[i+1]-.62)<.018 &&
     Math.abs(f.retina[i+2]-.25)<.018)n++;
 }
 return n;
};
const retinalDiff=(a:Float32Array,b:Float32Array):number=>{
 let n=0;
 for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;
 return n;
};

export type L2R0Pressure={
 railEnabled:boolean;ticks:number;privateFrames:number;
 lateOpenEntries:number;lateClosedEntries:number;
 totalOpenEntries:number;totalClosedEntries:number;
 loadedTransitions:number;gateX:number;actorX:number;
 firstOpenGatePixels:number|null;firstClosedGatePixels:number;
 firstOpenVsClosedRetinaChannelsChanged:number|null;
 nullFramesWithIllegalKeys:number; // must remain zero
};
/** Strictly host-side microscope. The local actor does not receive gate state,
 * handles, WORLD x/y, 'open' labels or the researcher's objective. */
export function runL2R0Pressure(railEnabled:boolean,ticks=21600):L2R0Pressure{
 const scene=createL2R0World(railEnabled);
 const w=scene.world;
 let privateFrames=0,lastPrivate=-1;
 let firstOpen:Float32Array|null=null;
 let firstOpenGatePixels:number|null=null;
 let firstClosed:Float32Array|null=null;
 let firstClosedGatePixels=0;
 let openEntries=0,closedEntries=0,lateOpen=0,lateClosed=0;
 let wasOpen=false,wasClosed=true;
 let illegal=0;
 try{
  for(let t=1;t<=ticks;t++){
   w.step(ZERO);
   const g=w.inspectGateLink();
   if(!g)throw Error('L2 gate missing from live Rapier World');
   const open=g.gatePosition.x>9.0;
   const closed=g.gatePosition.x<6.8;
   if(open&&!wasOpen){openEntries++;if(t>7200)lateOpen++;}
   if(closed&&!wasClosed){closedEntries++;if(t>7200)lateClosed++;}
   wasOpen=open;wasClosed=closed;
   const f=w.observe();
   if(f.tick!==lastPrivate){
    lastPrivate=f.tick;privateFrames++;
    if(Object.keys(f).sort().join(',')!=='proprio,retina,tick,touch')illegal++;
    if(closed&&!firstClosed){
     firstClosed=f.retina;firstClosedGatePixels=gateRGB(f);
    }
    if(open&&!firstOpen){
     firstOpen=f.retina;firstOpenGatePixels=gateRGB(f);
    }
   }
  }
  const last=w.inspectGateLink()!;
  const actor=w.inspect().actor;
  return {railEnabled,ticks,privateFrames,lateOpenEntries:lateOpen,
   lateClosedEntries:lateClosed,totalOpenEntries:openEntries,
   totalClosedEntries:closedEntries,loadedTransitions:last.loadTransitions,
   gateX:last.gatePosition.x,actorX:actor.x,
   firstOpenGatePixels,firstClosedGatePixels,
   firstOpenVsClosedRetinaChannelsChanged:firstOpen&&firstClosed?
     retinalDiff(firstOpen,firstClosed):null,
   nullFramesWithIllegalKeys:illegal};
 }finally{w.free();}
}

export type L2R0MotorProbe={
 plateHeld:boolean;startGateX:number;endGateX:number;
 actorEndX:number;maxActorX:number;crossedNearPassage:boolean;
 privateFrames:number;physicallyLoaded:boolean;
};
/** Purely *researcher-authored* calibration motor, no goal lookup, no learned
 * agent. Identical constant motor demand after physics settles. */
export function runL2R0MotorProbe(plateHeld:boolean):L2R0MotorProbe{
 const scene=createL2R0World(false);
 const w=scene.world;let privateFrames=0,last=-1,maxActorX=-Infinity;
 try{
  if(plateHeld)w.moveObject(scene.materialHandle,-2,5); // host intervention
  for(let i=0;i<600;i++)w.step(ZERO); // real gate mechanics settle
  const start=w.inspectGateLink()!;
  let physicallyLoaded=start.loaded;
  const drive:Demand={drive:.65,turn:0,gazeRate:0};
  for(let i=0;i<2000;i++){
   const f=w.observe();
   if(f.tick!==last){privateFrames++;last=f.tick;}
   w.step(drive);
   const p=w.inspect().actor;
   maxActorX=Math.max(maxActorX,p.x);
   physicallyLoaded||=Boolean(w.inspectGateLink()?.loaded);
  }
  const g=w.inspectGateLink()!;
  return {plateHeld,startGateX:start.gatePosition.x,
   endGateX:g.gatePosition.x,actorEndX:w.inspect().actor.x,
   maxActorX,crossedNearPassage:maxActorX>7.4,
   privateFrames,physicallyLoaded};
 }finally{w.free();}
}
