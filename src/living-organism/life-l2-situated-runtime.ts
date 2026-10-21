import {LivingWorld,type Checkpoint,type Demand} from './world';
import {SituatedResident,type SituatedMode,type SituatedState} from './life-l2-situated-resident';
type Color=[number,number,number];
const rock:Color=[.38,.45,.48],ochre:Color=[.72,.48,.26],moss:Color=[.34,.62,.42],violet:Color=[.59,.40,.66];

export type SituatedCheckpoint={version:1;specimen:'l2-r3-situated-v1';
 mode:SituatedMode;world:Checkpoint;resident:SituatedState};
export class SituatedRuntime{
 readonly world:LivingWorld;
 readonly resident:SituatedResident;
 readonly mode:SituatedMode;
 constructor(mode:SituatedMode='adaptive'){
  this.mode=mode;
  this.world=new LivingWorld(false,'B1');
  this.resident=new SituatedResident(mode);
  const w=this.world;
  // Open terrain with local anchors and actual material; not a sealed cage.
  w.addWall(11,6,4,.55,rock);
  w.addWall(11,-7,4,.55,rock);
  w.addWall(-9,10,.5,7,rock);
  w.addWall(17,0,.6,3,rock);
  w.addObject(4.0,0,.8,ochre);
  w.addObject(6.5,2.6,.75,moss);
  w.addObject(-4.5,-3.2,1.1,ochre);
  w.addObject(1.5,-8,1.1,moss);
  w.addRailMover(-7,5,.75,violet,-12,2,1.3);
 }
 /** Decision is made at 30Hz. Repeated 120Hz ticks reuse last motor. */
 step(manual:Demand|null=null){
  const frame=this.world.observe();
  const motor=manual===null?this.resident.decide(frame):null;
  if(manual!==null)this.resident.onAuthorityWithheld(frame);
  this.world.step(manual??motor!);
 }
 capture():SituatedCheckpoint{
  return {version:1,specimen:'l2-r3-situated-v1',mode:this.mode,
   world:this.world.captureCheckpoint(),resident:this.resident.capture()};
 }
 restore(cp:SituatedCheckpoint){
  if(cp.version!==1||cp.specimen!=='l2-r3-situated-v1'||
    cp.mode!==this.mode||cp.world.bodyShape!=='B1'||
    cp.resident.mode!==this.mode)throw Error('L2/R3 incompatible specimen history');
  this.world.restoreCheckpoint(cp.world);
  this.resident.restore(cp.resident);
 }
 free(){this.world.free();}
}
