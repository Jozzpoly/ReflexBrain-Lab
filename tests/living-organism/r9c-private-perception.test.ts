import {beforeAll,describe,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld,type PrivateFrame} from '../../src/living-organism/world';
import {E0_RAPIER as R,e0PairImpulse} from '../../src/e0-body-seam';
beforeAll(initLivingWorld);
const place={x:2.1,y:1.05,hx:.48,hy:.44};
const local=(point:{x:number;y:number},origin:{x:number;y:number},rot:number)=>{
 const x=point.x-origin.x,y=point.y-origin.y,c=Math.cos(rot),s=Math.sin(rot);
 return {x:c*x+s*y,y:-s*x+c*y};
};
const signalDiff=(a:PrivateFrame,b:PrivateFrame)=>{
 let retina=0,touch=0;
 for(let k=0;k<a.retina.length;k++)retina=Math.max(retina,Math.abs(a.retina[k]-b.retina[k]));
 for(let k=0;k<a.touch.length;k++)touch=Math.max(touch,Math.abs(a.touch[k]-b.touch[k]));
 const proprio=Math.max(Math.abs(a.proprio.forward-b.proprio.forward),
  Math.abs(a.proprio.lateral-b.proprio.lateral),
  Math.abs(a.proprio.omega-b.proprio.omega),
  Math.abs(a.proprio.gaze-b.proprio.gaze));
 return {retina,touch,proprio,maximum:Math.max(retina,touch,proprio)};
};
describe('R9C real 30Hz private proprioception of physical body–material coupling',()=>{
 it('identical legal private prefix; difference begins only after real contact-conditioned joint',()=>{
  const free=new LivingWorld(false,'B0'),bond=new LivingWorld(false,'B0');
  let joint:any=null;
  try{
   const freeId=free.addMaterialPart(place.x,place.y,place.hx,place.hy,'dynamic');
   const bondId=bond.addMaterialPart(place.x,place.y,place.hx,place.hy,'dynamic');
   const xFree=free as any,xBond=bond as any;
   const freeBody=xFree.world.getCollider(freeId).parent();
   const bondBody=xBond.world.getCollider(bondId).parent();
   // Experimental rotatable material in both matched worlds; stock R8 locks part rotation.
   freeBody.lockRotations(false,true);bondBody.lockRotations(false,true);
   const realFirst:{free:number|null;bond:number|null}={free:null,bond:null};
   const frames:{tick:number;diff:{retina:number;touch:number;proprio:number;maximum:number}}[]=[];
   let fixedAt:number|null=null;
   let maximumRelError=0;
   let bondedShape:{x:number;y:number}|null=null;
   free.observe();bond.observe();
   for(let tick=1;tick<=1200;tick++){
    const demand={drive:tick<930?1:tick<1090?0:.75,
      turn:tick<930?0:tick<1090?.85:0,gazeRate:0};
    free.step(demand);bond.step(demand);
    const cf=e0PairImpulse(xFree.world,xFree.actor.collider(0).handle,freeId);
    const cb=e0PairImpulse(xBond.world,xBond.actor.collider(0).handle,bondId);
    if(cf.impulse>.001&&realFirst.free===null)realFirst.free=tick;
    if(cb.impulse>.001&&realFirst.bond===null)realFirst.bond=tick;
    if(cb.impulse>.001&&!joint){
     const actor=xBond.actor,part=bondBody;
     const a=actor.translation(),p=part.translation();
     const ar=actor.rotation(),pr=part.rotation();
     const at={x:a.x+(p.x-a.x)*.72,y:a.y+(p.y-a.y)*.72};
     joint=xBond.world.createImpulseJoint(
      R.JointData.fixed(local(at,a,ar),0,local(at,p,pr),ar-pr),
      actor,part,true);
     joint.setContactsEnabled(false);fixedAt=tick;
     bondedShape=local(p,a,ar);
    }
    if(joint&&bondedShape){
     const a=xBond.actor.translation(),p=bondBody.translation();
     const now=local(p,a,xBond.actor.rotation());
     maximumRelError=Math.max(maximumRelError,
      Math.hypot(now.x-bondedShape.x,now.y-bondedShape.y));
    }
    if(tick%4===0){
     const a=free.observe(),b=bond.observe();
     expect(a.tick).toBe(tick);expect(b.tick).toBe(tick);
     expect(Object.keys(a).sort()).toEqual(['proprio','retina','tick','touch']);
     const diff=signalDiff(a,b);
     frames.push({tick,diff});
    }
   }
   const before=frames.filter(x=>x.tick<Math.min(realFirst.bond??0,realFirst.free??0));
   const after=frames.filter(x=>x.tick>(fixedAt??Infinity));
   const firstDivergence=after.find(x=>x.diff.maximum>1e-4)?.tick??null;
   const maxProprio=Math.max(...after.map(x=>x.diff.proprio));
   const maxRetina=Math.max(...after.map(x=>x.diff.retina));
   const maxTouch=Math.max(...after.map(x=>x.diff.touch));
   const summary={steps:free.inspect().tick,frames:frames.length,
    firstContactFree:realFirst.free,firstContactBond:realFirst.bond,
    fixedAt,firstPrivateDivergence:firstDivergence,
    priorFrames:before.length,priorMaxDiff:Math.max(...before.map(x=>x.diff.maximum)),
    maxProprio,maxRetina,maxTouch,maximumJointRelativeError:maximumRelError,
    finalJointValid:joint?.isValid()??false};
   console.log('RB_R9C_PRIVATE_SIGNALS '+JSON.stringify(summary));
   expect(summary.steps).toBe(1200);
   expect(summary.frames).toBe(300);
   expect(summary.firstContactFree).toBeGreaterThan(0);
   expect(summary.firstContactBond).toBe(summary.firstContactFree);
   expect(summary.fixedAt).toBe(summary.firstContactBond);
   expect(summary.priorFrames).toBeGreaterThan(3);
   expect(summary.priorMaxDiff).toBe(0);
   expect(summary.firstPrivateDivergence).toBeGreaterThan(summary.fixedAt!);
   expect(summary.maxProprio).toBeGreaterThan(.01);
   expect(summary.finalJointValid).toBe(true);
   expect(summary.maximumJointRelativeError).toBeLessThan(.1);
  }finally{free.free();bond.free();}
 },120000);
});
