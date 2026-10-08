import {LivingWorld,type Demand,type Checkpoint} from './world';
import {Occupant,type OccupantState} from './occupant';
export type RuntimeCheckpoint={version:2;world:Checkpoint;occupant:OccupantState};
export class LivingRuntime{
 readonly world:LivingWorld;
 readonly occupant=new Occupant();
 constructor(){this.world=new LivingWorld();}
 step(manual:Demand|null=null){
  const autonomous=this.occupant.decide(this.world.observe());
  this.world.step(manual??autonomous);
 }
 inspect(){return this.world.inspect();}
 observe(){return this.world.observe();}
 capture():RuntimeCheckpoint{return {version:2,world:this.world.captureCheckpoint(),occupant:this.occupant.capture()};}
 restore(cp:RuntimeCheckpoint){if(cp.version!==2)throw new Error('Unsupported runtime checkpoint');this.world.restoreCheckpoint(cp.world);this.occupant.restore(cp.occupant);}
 free(){this.world.free();}
}
