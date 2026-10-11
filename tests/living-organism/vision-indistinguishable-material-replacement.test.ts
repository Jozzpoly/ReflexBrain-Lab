import {beforeAll,describe,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld,type PrivateFrame,type Demand} from '../../src/living-organism/world';
import {ApproachEpisode} from '../../src/living-organism/approach-episode';

/**
 * RB-VISION/C4: indistinguishable-looking physical token exchange.
 *
 * All material geometry, native RGB colors, body mechanics and true private
 * sensor histories should remain equal; only WHICH previously observed
 * collider moved is different. The host alone knows that identity.
 *
 * This is an explicit adversarial unobserved teleport/swap, NOT a natural
 * ecological motion claim. An actor can only know the difference if its
 * appearance/temporal history legally contains a distinguishing signal.
 */
type Branch='old-object'|'lookalike';
type WorldCase={
 branch:Branch;w:LivingWorld;approach:ApproachEpisode;
 original:number;copy:number;
 tick:number;contactTick:number|null;
 originalContact:boolean;copyContact:boolean;
 originalDistanceAtContact:number|null;
 lastDemand:Demand;lastPrivateTick:number;
 privateSamples:PrivateFrame[];
};
const COLOR:[number,number,number]=[.1,.85,.8];
const IDLE:Demand={drive:0,turn:0,gazeRate:0};
function build(branch:Branch):WorldCase {
 const w=new LivingWorld(false);
 const original=w.addObject(7,0,.62,COLOR);
 const copy=w.addObject(-30,-30,.62,COLOR);
 const approach=new ApproachEpisode(true,true);
 return {branch,w,approach,original,copy,
  tick:0,contactTick:null,originalContact:false,copyContact:false,
  originalDistanceAtContact:null,lastDemand:IDLE,
  lastPrivateTick:-1,privateSamples:[]};
}
function materialIntervene(b:WorldCase){
 const current=b.w.inspect().actor;
 const near={x:current.x+1.45,y:current.y+.32};
 if(b.branch==='lookalike'){
  b.w.moveObject(b.copy,near.x,near.y);
 }else{
  // Move the originally encountered turquoise material near the body,
  // while its visually identical duplicate occupies the old position.
  // Final sensor geometry is precisely the same as the lookalike branch.
  b.w.moveObject(b.original,near.x,near.y);
  b.w.moveObject(b.copy,7,0);
 }
}
function stepCase(b:WorldCase) {
 const f=b.w.observe();
 if(f.tick!==b.lastPrivateTick){
  b.lastPrivateTick=f.tick;
  b.privateSamples.push(f);
  b.lastDemand=b.approach.decide(f);
 }
 b.w.step(b.lastDemand);
 const sample=b.w.inspectContactSample().contacts;
 if(b.w.inspect().tick%4===0){
  b.originalContact ||= sample.some(c=>c.handle===b.original
    &&c.impulse>.001);
  b.copyContact ||= sample.some(c=>c.handle===b.copy
    &&c.impulse>.001);
 }
 if(b.approach.capture().mode==='contact'&&b.contactTick===null){
  b.contactTick=b.approach.capture().contactTick;
  const actor=b.w.inspect().actor;
  const material=b.w.inspect().objects.find(x=>x.handle===b.original);
  if(!material)throw Error('C4 original host identity missing');
  b.originalDistanceAtContact=Math.hypot(actor.x-material.x,
    actor.y-material.y);
 }
 b.tick=b.w.inspect().tick;
}
function privateEqual(a:PrivateFrame,b:PrivateFrame){
 return a.tick===b.tick
  &&a.retina.every((x,i)=>x===b.retina[i])
  &&a.touch.every((x,i)=>x===b.touch[i])
  &&a.proprio.forward===b.proprio.forward
  &&a.proprio.lateral===b.proprio.lateral
  &&a.proprio.omega===b.proprio.omega
  &&a.proprio.gaze===b.proprio.gaze;
}
beforeAll(initLivingWorld);
describe('RB-VISION/C4 physical same-looking materials with swapped hidden identity',()=>{
 it('tests complete lawful history equality but opposite relation to previously seen material',()=>{
  const a=build('lookalike'),b=build('old-object');
  try{
   const firstA=a.w.observe(),firstB=b.w.observe();
   expect(privateEqual(firstA,firstB)).toBe(true);
   let firstDifferentTick:number|null=null;
   for(let t=0;t<700;t++){
    if(t===80){materialIntervene(a);materialIntervene(b);}
    const currentA=a.w.observe(),currentB=b.w.observe();
    if(!privateEqual(currentA,currentB)&&firstDifferentTick===null)
     firstDifferentTick=currentA.tick;
    stepCase(a);stepCase(b);
    if(a.contactTick!==null&&b.contactTick!==null)break;
   }
   const aF=a.w.observe(),bF=b.w.observe();
   if(!privateEqual(aF,bF)&&firstDifferentTick===null)
    firstDifferentTick=aF.tick;
   const report={
    firstDifferentTick,privateSampleLength:[a.privateSamples.length,
     b.privateSamples.length],
    matchingSampleCount:a.privateSamples.filter((f,i)=>
     !!b.privateSamples[i]&&privateEqual(f,b.privateSamples[i])).length,
    states:[a,b].map(c=>({
     branch:c.branch,tick:c.tick,
     contactTick:c.contactTick,
     touchedOriginal:c.originalContact,touchedCopy:c.copyContact,
     originalGap:c.originalDistanceAtContact,
     privateEnd:c.privateSamples[c.privateSamples.length-1]?
      {touch:Array.from(c.privateSamples[c.privateSamples.length-1].touch),
       forward:c.privateSamples[c.privateSamples.length-1].proprio.forward}:null,
    })),
   };
   console.log('RB_VISION_C4_TOKEN_SWAP_ALIAS '+JSON.stringify(report));
   expect(a.contactTick).not.toBeNull();
   expect(b.contactTick).not.toBeNull();
   expect(a.copyContact).toBe(true);
   expect(a.originalContact).toBe(false);
   expect(b.originalContact).toBe(true);
   expect(b.copyContact).toBe(false);
   expect(firstDifferentTick).toBeNull();
   expect(a.privateSamples.length).toBe(b.privateSamples.length);
   expect(report.matchingSampleCount).toBe(a.privateSamples.length);
  }finally{a.w.free();b.w.free();}
 },30000);
});
