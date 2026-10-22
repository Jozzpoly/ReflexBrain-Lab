import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld} from '../../src/living-organism/world';
import {Occupant} from '../../src/living-organism/occupant';
import {decodeR8Save,encodeR8Save} from '../../src/living-organism/r8-save';
beforeAll(initLivingWorld);
const idle={drive:0,turn:0,gazeRate:0};
function healthy(w:LivingWorld){
 const s=w.inspect(),f=w.observe();
 const a=s.actor;for(const x of [a.x,a.y,a.vx,a.vy,a.angle])expect(Number.isFinite(x)).toBe(true);
 for(const o of s.objects)for(const x of [o.x,o.y,o.hx,o.hy,o.angle])expect(Number.isFinite(x)).toBe(true);
 for(const x of f.retina)expect(Number.isFinite(x)).toBe(true);
 for(const x of f.touch)expect(Number.isFinite(x)).toBe(true);
 return s;
}
describe('R8 real Owner chaos and long material-history preflight',()=>{
 it('120s honest physics: material stays, finite open world, actual frames progress, seamless saved replay',()=>{
  const w=new LivingWorld(false),occupant=new Occupant();
  try{
   for(const [x,y,hx,hy,mode] of [
    [3.1,.2,.52,.55,'dynamic'],[5.2,-.6,.6,.6,'dynamic'],
    [4.2,2.5,1.15,.22,'dynamic'],[7.1,1.9,.22,1.15,'anchored'],
    [-2.4,2.3,.6,.55,'dynamic'],[-4.4,-1.8,1.15,.22,'anchored'],
    [1.1,-3.4,.22,1.15,'anchored'],
   ] as const)w.addMaterialPart(x,y,hx,hy,mode);
   const initial=w.inspect();
   let count=0;
   for(let i=0;i<7200;i++){w.step(occupant.decide(w.observe()));count++;}
   const mid=healthy(w);
   expect(mid.tick).toBe(7200);
   const encoded=encodeR8Save({world:w.captureCheckpoint(),resident:occupant.capture(),scene:'encounter'});
   const saved=decodeR8Save(encoded);
   for(let i=0;i<7200;i++){w.step(occupant.decide(w.observe()));count++;}
   const end=healthy(w);
   const residentEnd=occupant.capture();
   const savedWorld=new LivingWorld(false),savedBrain=new Occupant();
   try{
    savedWorld.restoreCheckpoint(saved.world);savedBrain.restore(saved.resident);
    for(let i=0;i<7200;i++)savedWorld.step(savedBrain.decide(savedWorld.observe()));
    expect(savedWorld.captureCheckpoint().physics).toEqual(w.captureCheckpoint().physics);
    expect(savedBrain.capture()).toEqual(residentEnd);
   }finally{savedWorld.free();}
   expect(count).toBe(14400);
   expect(end.tick).toBe(14400);
   expect(w.observe().tick).toBe(14400);
   expect(end.objects.filter(x=>x.kind==='part').length).toBe(7);
   console.log('R8_LONG_LIVED_ENGINEERING '+JSON.stringify({
    trueSolverTicks:count,minute1Actor:[mid.actor.x,mid.actor.y],
    minute2Actor:[end.actor.x,end.actor.y],partCount:end.objects.length,
    externalOwnerActions:0,internalBuilding:false,checkpointReplayExact:true,
    scope:'World and dumb occupant continuity, not autonomous ecology/life'}));
  }finally{w.free();}
 },180000);
 it('32-part randomized lifecycle; remove/undo/restoration no handle reuse confusion',()=>{
  const w=new LivingWorld(false);
  try{
   const ids:number[]=[];
   for(let i=0;i<32;i++){
    const a=i*Math.PI*2/32,r=7+(i%3)*.8;
    ids.push(w.addMaterialPart(Math.cos(a)*r,Math.sin(a)*r,
      i%2?.28:.65,i%2?.65:.3,i%3?'dynamic':'anchored'));
   }
   expect(new Set(ids).size).toBe(32);
   const before=w.captureCheckpoint();
   for(let i=0;i<32;i++){
    if(i%3===0)w.setMaterialPartMode(ids[i],i%2?'dynamic':'anchored');
    if(i%4===0)w.moveMaterialPart(ids[i],6+i*.1,(i%5)-2);
    if(i%5===0)w.removeMaterialPart(ids[i]);
    for(let k=0;k<18;k++)w.step(idle);
   }
   healthy(w);
   const after=w.captureCheckpoint();
   const kept=w.inspect().objects.filter(x=>x.kind==='part');
   expect(kept.length).toBe(25);
   const restore=new LivingWorld(false);
   try{
    restore.restoreCheckpoint(after);
    expect(restore.inspect()).toEqual(w.inspect());
    for(let i=0;i<304;i++){w.step(idle);restore.step(idle);}
    expect(restore.captureCheckpoint().physics).toEqual(w.captureCheckpoint().physics);
   }finally{restore.free();}
   w.restoreCheckpoint(before);
   expect(w.inspect().objects.filter(x=>x.kind==='part').length).toBe(32);
   expect(w.inspect().objects.filter(x=>x.kind==='part').map(x=>x.handle)).toEqual(ids);
  }finally{w.free();}
 },120000);
 it('intentional overlap and rapid anchor mode switches do not generate NaNs',()=>{
  const w=new LivingWorld(false);
  try{
   const ids=[
     w.addMaterialPart(.1,0,.6,.6,'dynamic'),
     w.addMaterialPart(.15,0,.6,.6,'anchored'),
     w.addMaterialPart(1.2,.2,.3,.5,'dynamic'),
   ];
   for(let k=0;k<1200;k++){
    if(k%120===0)w.setMaterialPartMode(ids[2],k%240?'dynamic':'anchored');
    w.step({drive:k%300<150?1:-.6,turn:k%140<70?.3:-.3,gazeRate:0});
    if(k%120===0)healthy(w);
   }
   expect(w.inspect().tick).toBe(1200);
   healthy(w);
  }finally{w.free();}
 },120000);
});
