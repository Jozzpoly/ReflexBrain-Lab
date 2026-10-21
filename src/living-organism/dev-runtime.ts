import {LivingWorld,type BodyShape,type Checkpoint,type Demand} from './world';
import {DevResident,type DevMode,type DevState} from './dev-resident';

type Color=[number,number,number];
const rock:Color=[.44,.48,.55];
const cyan:Color=[.16,.81,.77];
const amber:Color=[.85,.59,.22];
const violet:Color=[.65,.44,.8];
export type DevLayout='yard'|'shifted';
export type DevCheckpoint={
  version:1;mode:DevMode;shape:BodyShape;layout:DevLayout;
  world:Checkpoint;resident:DevState;
};
/** Single ongoing resident on an intentionally bounded, non-task physical habitat.
 * External observer can inspect physics; DevResident never accesses inspect().
 * No navigation map, target ID, reachability marker, cyan preference or goal oracle.
 */
export class DevRuntime {
 readonly world:LivingWorld;
 readonly resident:DevResident;
 readonly shape:BodyShape;
 readonly mode:DevMode;
 readonly layout:DevLayout;
 constructor(mode:DevMode='adaptive',shape:BodyShape='B1',layout:DevLayout='yard',seed=0x51babe){
  this.mode=mode;this.shape=shape;this.layout=layout;
  this.world=new LivingWorld(false,shape);
  this.resident=new DevResident(mode,seed);
  const w=this.world;
  // Far larger than 20x12 old S0 box; optional alternative passages.
  for(const y of [-18,18])w.addWall(0,y,26,.3,rock);
  for(const x of [-26,26])w.addWall(x,0,.3,18,rock);
  if(layout==='yard'){
   w.addWall(8,8,1.1,7,rock);w.addWall(8,-9,1.1,5,rock);
   w.addWall(-13,5,.6,9,rock);w.addWall(-6,-10,7,.65,rock);
   w.addObject(3,0,.65,cyan);
   w.addObject(4,5,1.1,amber);
   w.addObject(-7,6,.85,cyan);
   w.addObject(-1,-8,.6,amber);
   w.addRailMover(-8,-4,.7,violet,-12,3,1.4);
  }else{
   w.addWall(9,-3,1.2,10,rock);w.addWall(-8,8,8,.75,rock);
   w.addWall(0,-12,7,.6,rock);
   w.addObject(3.5,1.5,1,amber);
   w.addObject(2,-4,.6,cyan);
   w.addObject(-8,-5,.9,cyan);
   w.addObject(12,5,.8,amber);
   w.addRailMover(-5,5,.8,violet,-10,7,1.2);
  }
 }
 step(manual:Demand|null=null) {
  // The actor sees only PrivateFrame, not host authority or object descriptors.
  const f=this.world.observe();
  const autonomous=this.resident.decide(f,manual!==null);
  this.world.step(manual??autonomous);
 }
 capture():DevCheckpoint {
  return {version:1,shape:this.shape,mode:this.mode,layout:this.layout,
   world:this.world.captureCheckpoint(),resident:this.resident.capture()};
 }
 restore(cp:DevCheckpoint){
  if(cp.version!==1||cp.shape!==this.shape||cp.mode!==this.mode||cp.layout!==this.layout)
   throw new Error('O-DEV checkpoint identity mismatch');
  this.world.restoreCheckpoint(cp.world);this.resident.restore(cp.resident);
 }
 free(){this.world.free();}
}
