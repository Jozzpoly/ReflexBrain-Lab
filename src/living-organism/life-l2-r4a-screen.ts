import {LivingWorld,type Demand,type PrivateFrame} from './world';
import {SituatedResident,type SituatedMode,type SituatedState} from './life-l2-situated-resident';
import {SituatedRuntime} from './life-l2-situated-runtime';

/** R4a: pre-frozen open habitat screen, not a new cognition model.
 * Actor receives ONLY its physical private frame. Host checks exposure.
 */
type Color=[number,number,number];
const earth:Color=[.43,.51,.48],stone:Color=[.59,.51,.44],leaf:Color=[.37,.62,.46],
  mineral:Color=[.69,.39,.55],railColor:Color=[.66,.50,.76];
const ZERO:Demand={drive:0,turn:0,gazeRate:0};
export type HabitatVariant='r3-original'|'shell-dynamic'|'shell-static';
export type R4aWindow={
  index:number;startSeconds:number;
  privateFrames:number;nonemptyRetinaFrames:number;
  visiblePixelSamples:number;privateTouchFrames:number;
  nearestMaterialDistanceStart:number|null;
  nearestMaterialDistanceEnd:number|null;
  netOrdinaryMaterialMotion:number;endActorX:number;endActorY:number;
  maxDistanceFromBirth:number;
};
export type R4aScreen={
  habitat:HabitatVariant;mode:SituatedMode|'zero';ticks:number;
  privateFrames:number;touchEpisodes:number;habitUpdates:number;
  finalHabit:number;finalDistance:number;
  worldMaterialMovement:number;
  windows:R4aWindow[];physicsSnapshotBytes:number;
};
function createShell(active:boolean):{world:LivingWorld;ordinaryHandles:number[]}{
 const world=new LivingWorld(false,'B1');
 const ordinaryHandles:number[]=[];
 try{
  // Two staggered porous rings. Gaps everywhere: no perimeter or cage.
  for(let i=0;i<8;i++){
   const theta=i*Math.PI/4;
   ordinaryHandles.push(world.addObject(4.5*Math.cos(theta),4.5*Math.sin(theta),
    i%3===0?.8:.65,i%2?leaf:stone));
  }
  for(let i=0;i<8;i++){
   const theta=(i+.35)*Math.PI/4;
   ordinaryHandles.push(world.addObject(9*Math.cos(theta),9*Math.sin(theta),
    i%3===1?.9:.75,i%2?mineral:earth));
  }
  // Independent fixed reference points, not path/winner gates.
  world.addWall(-11,6,1.9,.38,stone);
  world.addWall(11,-6,1.9,.38,stone);
  world.addWall(1,12,.4,2.2,stone);
  world.addWall(-2,-12,.4,2.2,stone);
  if(active){
   // Genuine bounded force-driven Rapier mover, close to upper inner objects.
   world.addRailMover(-9,4.5,.8,railColor,-10,10,1.7);
  }
  return{world,ordinaryHandles};
 }catch(e){world.free();throw e;}
}
function hasMaterial(frame:PrivateFrame){
 let n=0;
 for(let i=0;i<96;i++){
  const k=i*3;
  if(frame.retina[k]+frame.retina[k+1]+frame.retina[k+2]>.22)n++;
 }
 return n;
}
export function runR4aScreen(
 habitat:HabitatVariant,mode:SituatedMode|'zero'='adaptive',ticks=14400,
):R4aScreen{
 if(ticks!==14400)throw Error('R4a frozen execution interval is exactly 120s');
 let world:LivingWorld,ordinaryHandles:number[],resident:SituatedResident|null=null;
 let originalRuntime:SituatedRuntime|null=null;
 if(habitat==='r3-original'){
  originalRuntime=new SituatedRuntime(mode==='zero'?'frozen':mode);
  world=originalRuntime.world;resident=mode==='zero'?null:originalRuntime.resident;
  ordinaryHandles=world.inspect().objects.filter(o=>o.kind==='object').map(o=>o.handle);
 }else{
  const shell=createShell(habitat==='shell-dynamic');
  world=shell.world;ordinaryHandles=shell.ordinaryHandles;
  resident=mode==='zero'?null:new SituatedResident(mode);
 }
 const windows:R4aWindow[]=Array.from({length:4},(_,index)=>({
  index,startSeconds:index*30,privateFrames:0,nonemptyRetinaFrames:0,
  visiblePixelSamples:0,privateTouchFrames:0,nearestMaterialDistanceStart:null,
  nearestMaterialDistanceEnd:null,netOrdinaryMaterialMotion:0,
  endActorX:0,endActorY:0,maxDistanceFromBirth:0,
 }));
 const initial=world.inspect();
 const birthplace={x:initial.actor.x,y:initial.actor.y};
 const originalMaterial=new Map(initial.objects.filter(o=>ordinaryHandles.includes(o.handle))
  .map(o=>[o.handle,{x:o.x,y:o.y}]));
 let prevMaterial=new Map(originalMaterial),lastFrame=-1;
 let privateFrames=0,maxEndDist=0;
 const relevant=()=>world.inspect().objects.filter(o=>ordinaryHandles.includes(o.handle));
 const proximity=()=>{
  const w=world.inspect();
  const list=w.objects.filter(o=>ordinaryHandles.includes(o.handle));
  return list.length?Math.min(...list.map(o=>
   Math.hypot(o.x-w.actor.x,o.y-w.actor.y)-o.hx)):null;
 };
 try{
  for(let i=0;i<ticks;i++){
   const frame=world.observe();
   const d=resident?resident.decide(frame):ZERO;
   world.step(d);
   const fresh=world.observe();
   if(fresh.tick!==lastFrame){
    lastFrame=fresh.tick;privateFrames++;
    const idx=Math.min(3,Math.floor(Math.max(0,fresh.tick-1)/3600));
    const win=windows[idx];
    win.privateFrames++;
    const pixels=hasMaterial(fresh);
    win.visiblePixelSamples+=pixels;
    if(pixels>0)win.nonemptyRetinaFrames++;
    if(Array.from(fresh.touch).some(v=>v>.005))win.privateTouchFrames++;
   }
   if(i%3600===0){
    const idx=Math.min(3,Math.floor(i/3600));
    windows[idx].nearestMaterialDistanceStart=proximity();
   }
   if((i+1)%120===0){
    const a=world.inspect().actor;
    const dist=Math.hypot(a.x-birthplace.x,a.y-birthplace.y);
    const idx=Math.min(3,Math.floor(i/3600));
    windows[idx].maxDistanceFromBirth=Math.max(windows[idx].maxDistanceFromBirth,dist);
    maxEndDist=dist;
   }
   if((i+1)%3600===0){
    const idx=Math.floor(i/3600),win=windows[idx];
    const w=world.inspect();
    win.endActorX=w.actor.x;win.endActorY=w.actor.y;
    win.nearestMaterialDistanceEnd=proximity();
    const current=relevant();
    win.netOrdinaryMaterialMotion=current.reduce((total,o)=>{
     const last=prevMaterial.get(o.handle);
     return total+(last?Math.hypot(o.x-last.x,o.y-last.y):0);
    },0);
    prevMaterial=new Map(current.map(o=>[o.handle,{x:o.x,y:o.y}]));
   }
  }
  const current=relevant();
  const totalMotion=current.reduce((total,o)=>{
   const x=originalMaterial.get(o.handle);
   return total+(x?Math.hypot(o.x-x.x,o.y-x.y):0);
  },0);
  const s=resident?.capture();
  const cp=world.captureCheckpoint();
  return {habitat,mode,ticks,privateFrames,
   touchEpisodes:s?.touchEpisodes??0,habitUpdates:s?.habitUpdates??0,
   finalHabit:s?.habit??0,finalDistance:maxEndDist,
   worldMaterialMovement:totalMotion,windows,physicsSnapshotBytes:cp.physics.length};
 }finally{
  if(originalRuntime)originalRuntime.free();
  else world.free();
 }
}
