import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld} from '../../src/living-organism/world';
beforeAll(initLivingWorld);
const motor=(i:number)=>({drive:i%700<380?.58:-.32,turn:Math.sin(i/223)*.42,gazeRate:Math.cos(i/97)*.21});
describe('R8 stress and invariant audit — not a life demonstration',()=>{
 it('48 authored parts, multiple physical modes, 5000 real updates and exact historical replay',()=>{
  const w=new LivingWorld(false);
  try{
   const ids:number[]=[];
   for(let i=0;i<48;i++){
    const x=(i%8)*3.0-12;
    const y=Math.floor(i/8)*3.3-9.7;
    const mode=i%3===0?'anchored':'dynamic';
    ids.push(w.addMaterialPart(x,y,.4+(i%3)*.1,.34+(i%4)*.08,mode));
   }
   expect(new Set(ids).size).toBe(48);
   let cp:ReturnType<typeof w.captureCheckpoint>|null=null;
   for(let i=0;i<5000;i++){
    if(i===520)w.setMaterialPartMode(ids[0],'dynamic');
    if(i===730)w.moveMaterialPart(ids[13],8,8);
    if(i===1090)w.setMaterialPartMode(ids[7],'anchored');
    if(i===1530)w.moveMaterialPart(ids[31],-10,2.2);
    if(i===2700)cp=w.captureCheckpoint();
    w.step(motor(i));
   }
   if(!cp)throw new Error('test did not reach physical checkpoint');
   const final=w.captureCheckpoint(),details=w.inspect();
   expect(details.tick).toBe(5000);
   expect(details.objects.filter(o=>o.kind==='part').length).toBe(48);
   for(const part of details.objects.filter(o=>o.kind==='part')){
    expect([part.x,part.y,part.angle].every(Number.isFinite)).toBe(true);
    expect(Math.abs(part.x)).toBeLessThan(1e5);
    expect(Math.abs(part.y)).toBeLessThan(1e5);
   }
   expect(w.observe().tick).toBe(5000);
   w.restoreCheckpoint(cp);
   expect(w.inspect().tick).toBe(2700);
   for(let i=2700;i<5000;i++)w.step(motor(i));
   const replay=w.captureCheckpoint();
   expect(replay.physics).toEqual(final.physics);
   expect(replay.frame.retina).toEqual(final.frame.retina);
   expect(w.inspect()).toEqual(details);
   console.log('RB_R8_STRESS '+JSON.stringify({solverUpdates:5000,
    partCount:48,restoredAt:2700,fullByteReplay:true,physicsBytes:final.physics.length}));
  }finally{w.free();}
 },120000);
 it('the 64-part safety boundary rejects only invalid additions, without corrupting the scene',()=>{
  const w=new LivingWorld(false);
  try{
   const ids=Array.from({length:64},(_,i)=>w.addMaterialPart(
    15+(i%8)*1.5,-6+Math.floor(i/8)*1.5,.28,.28,i%2?'anchored':'dynamic'));
   expect(w.inspect().objects.filter(o=>o.kind==='part').length).toBe(64);
   expect(()=>w.addMaterialPart(12,12,.4,.4,'anchored')).toThrow();
   expect(w.inspect().objects.filter(o=>o.kind==='part').length).toBe(64);
   for(let i=0;i<100;i++)w.step({drive:0,turn:0,gazeRate:0});
   const cp=w.captureCheckpoint();
   w.removeMaterialPart(ids[18]);
   const fresh=w.addMaterialPart(-18,-7,.28,.28,'dynamic');
   expect(w.inspect().objects.filter(o=>o.kind==='part').length).toBe(64);
   expect(w.inspect().objects.find(o=>o.handle===fresh)?.mode).toBe('dynamic');
   w.restoreCheckpoint(cp);
   expect(w.inspect().objects.some(o=>o.handle===ids[18])).toBe(true);
   expect(w.inspect().objects.filter(o=>o.kind==='part').length).toBe(64);
  }finally{w.free();}
 });
});
