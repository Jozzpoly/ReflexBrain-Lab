import {LivingWorld,type Demand,type Checkpoint} from './world';
import {Occupant,type OccupantState} from './occupant';
import {PrivateVision,type VisionState} from './private-vision';
export type RuntimeCheckpoint={version:5;world:Checkpoint;occupant:OccupantState;vision:VisionState};
export class LivingRuntime{
 readonly world:LivingWorld;
 readonly occupant=new Occupant();
 readonly vision=new PrivateVision();
 constructor(){this.world=new LivingWorld();}
 step(manual:Demand|null=null){
  const frame=this.world.observe();this.vision.observe(frame);
  const autonomous=this.occupant.decide(frame);
  this.world.step(manual??autonomous);
 }
 inspect(){return this.world.inspect();}
 observe(){return this.world.observe();}
 capture():RuntimeCheckpoint{return {version:5,world:this.world.captureCheckpoint(),occupant:this.occupant.capture(),vision:this.vision.capture()};}
 restore(cp:RuntimeCheckpoint){if(cp.version!==5)throw new Error('Unsupported runtime checkpoint');this.world.restoreCheckpoint(cp.world);this.occupant.restore(cp.occupant);this.vision.restore(cp.vision);}
 free(){this.world.free();}
}
