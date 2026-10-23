import {beforeAll,describe,expect,it} from 'vitest';
import {E0_RAPIER as R,E0_DT,initE0Rapier,createE0World,createE0Body,
  applyE0Demand,e0PairImpulse} from '../../src/e0-body-seam';

beforeAll(initE0Rapier);
type Arm='empty'|'free'|'bond-on-contact'|'world-anchor-on-contact';
const arms:Arm[]=['empty','free','bond-on-contact','world-anchor-on-contact'];
const widths=[2.5,4.0];
const cases=widths.flatMap(gap=>arms.map(arm=>({gap,arm})));
const xy=(p:any)=>({x:p.x,y:p.y});
const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
const local=(v:{x:number;y:number},p:{x:number;y:number},r:number)=>{
 const dx=v.x-p.x,dy=v.y-p.y,c=Math.cos(r),s=Math.sin(r);
 return {x:c*dx+s*dy,y:-s*dx+c*dy};
};
function simulate(gap:number,arm:Arm){
 const world=createE0World(),{rb:actor,co:actorCollider}=createE0Body(world,0,0);
 const hasPart=arm!=='empty';
 const cargo=hasPart?world.createRigidBody(R.RigidBodyDesc.dynamic()
  .setTranslation(2.1,1.05).setLinearDamping(1.7).setAngularDamping(3)):null;
 const cargoCollider=hasPart?world.createCollider(R.ColliderDesc.cuboid(.48,.44)
  .setMass(2.1).setFriction(.45).setRestitution(.015),cargo):null;
 const bumperBodies:any[]=[];
 const bumperColliders:any[]=[];
 // Real opposing physical walls, not a programmatic "can pass" label.
 for(const sign of [-1,1]){
  const y=sign*(gap/2+1.5);
  const wall=world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(6.5,y));
  bumperBodies.push(wall);
  bumperColliders.push(world.createCollider(R.ColliderDesc.cuboid(.42,1.5),wall));
 }
 let firstContactTick:number|null=null,linkedTick:number|null=null;
 let breakTick:number|null=null,partStopsAt:number|null=null;
 let joint:any=null;
 let connectionFirst:{pos:{x:number;y:number};angle:number}|null=null;
 let maximumRelativeError=0;
 let contactFrames=0,partWallContactFrames=0,wallContacts=0;
 let maxActorX=-Infinity,farCounter=0;
 const snapshots:any[]=[];
 try{
  for(let tick=1;tick<=2400;tick++){
   // Same externally frozen motor samples for all arms and both gaps.
   const drive=tick<930?1:tick<1090?0:.75;
   const turn=tick<930?0:tick<1090?.85:0;
   applyE0Demand(actor,drive,turn);
   world.step();
   const bodyPos=xy(actor.translation());
   maxActorX=Math.max(maxActorX,bodyPos.x);
   if(bodyPos.x>7.5)farCounter++;
   for(const wall of bumperColliders)
    if(e0PairImpulse(world,actorCollider.handle,wall.handle).impulse>.001)wallContacts++;
   if(cargoCollider){
    const collision=e0PairImpulse(world,actorCollider.handle,cargoCollider.handle);
    if(collision.impulse>.001){
     contactFrames++;
     if(firstContactTick===null)firstContactTick=tick;
     // Form connection ONLY upon real local actor–material physical event.
     if(arm==='bond-on-contact'&&joint===null&&linkedTick===null){
      const a=xy(actor.translation()),c=xy(cargo.translation());
      const aRot=actor.rotation(),bRot=cargo.rotation();
      const d=dist(a,c);
      if(d<2.5){
       const jointWorld={x:a.x+(c.x-a.x)*.72,y:a.y+(c.y-a.y)*.72};
       const anchorA=local(jointWorld,a,aRot),anchorB=local(jointWorld,c,bRot);
       joint=world.createImpulseJoint(R.JointData.fixed(
        anchorA,0,anchorB,aRot-bRot),actor,cargo,true);
       joint.setContactsEnabled(false);
       linkedTick=tick;
       connectionFirst={pos:local(c,a,aRot),angle:bRot-aRot};
      }
     }
     if(arm==='world-anchor-on-contact'&&partStopsAt===null){
      partStopsAt=tick;
      cargo.setLinvel({x:0,y:0},true);cargo.setAngvel(0,true);
      cargo.setBodyType(R.RigidBodyType.Fixed,true);
     }
    }
    if(joint&&connectionFirst){
     const a=xy(actor.translation()),c=xy(cargo.translation());
     const rel=local(c,a,actor.rotation());
     maximumRelativeError=Math.max(maximumRelativeError,dist(rel,connectionFirst.pos));
     let cargoBumperImpulse=0;
     for(const wall of bumperColliders)
      cargoBumperImpulse+=e0PairImpulse(world,cargoCollider.handle,wall.handle).impulse;
     if(cargoBumperImpulse>.1){
      partWallContactFrames++;
      // Local impact-triggered physical break; never a timed release or actor action.
      if(cargoBumperImpulse>4.0&&breakTick===null){
       world.removeImpulseJoint(joint,true);joint=null;breakTick=tick;
      }
     }
    }
   }
   if(tick%300===0){
    const a=xy(actor.translation()),p=cargo?xy(cargo.translation()):null;
    snapshots.push({tick,actor:{...a,angle:actor.rotation()},
      cargo:p&&{...p,angle:cargo.rotation()},joined:Boolean(joint)});
   }
  }
  const result={arm,gap,steps:world.timestep===E0_DT?2400:-1,
    firstContactTick,linkedTick,breakTick,partStopsAt,contactFrames,
    partWallContactFrames,wallContacts,maxActorX,maxRelativeDeviation:maximumRelativeError,
    lastActor:xy(actor.translation()),lastPart:cargo?xy(cargo.translation()):null,
    finalJointValid:joint?.isValid()??false,farCounter,snapshots};
  console.log('RB_R9_PHYSICAL_FEASIBILITY '+JSON.stringify(result));
  expect(result.steps).toBe(2400);
  expect(Number.isFinite(result.maxActorX)).toBe(true);
  expect(result.snapshots.every(x=>Number.isFinite(x.actor.x)&&Number.isFinite(x.actor.y))).toBe(true);
  if(arm!=='empty')expect(firstContactTick).not.toBeNull();
  if(arm==='bond-on-contact'){
   expect(linkedTick).not.toBeNull();
   expect(maximumRelativeError).toBeLessThan(2);
  }
  if(arm==='world-anchor-on-contact')expect(partStopsAt).not.toBeNull();
  return result;
 }finally{world.free();}
}
describe('R9 real Rapier conditional material-coupling feasibility, not artificial life',()=>{
 it.each(cases)('gap $gap / $arm',({gap,arm})=>simulate(gap,arm),180000);
});
