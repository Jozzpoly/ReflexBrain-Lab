import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {DevRuntime} from '../../src/living-organism/dev-runtime';
import {encodeLifeL1,decodeLifeL1} from '../../src/living-organism/life-l1-codec';

describe('LIFE/L1 binary-accurate portable snapshot codec',()=>{
 beforeAll(initLivingWorld);
 it('retains full physics, 30Hz private frame, private learning after a non-boundary frame tick',()=>{
  const a=new DevRuntime('adaptive','B1','shifted',1183);
  const b=new DevRuntime('adaptive','B1','shifted',99991);
  try{
   for(let i=0;i<977;i++)a.step();
   const orig=a.capture();
   const json=encodeLifeL1(orig),restored=decodeLifeL1(json);
   expect(restored.world.physics).toBeInstanceOf(Uint8Array);
   expect(restored.world.frame.retina).toBeInstanceOf(Float32Array);
   expect(restored.world.frame.touch).toBeInstanceOf(Float32Array);
   expect(restored.world.pendingTouch).toBeInstanceOf(Float32Array);
   expect(restored.world.frame.tick).toBe(976);
   expect(restored.world.physics).toEqual(orig.world.physics);
   expect(restored.world.frame).toEqual(orig.world.frame);
   expect(restored.world.pendingTouch).toEqual(orig.world.pendingTouch);
   expect(restored.resident).toEqual(orig.resident);
   b.restore(restored);
   expect(b.capture()).toEqual(orig);
   for(let i=0;i<1440;i++){a.step();b.step();}
   expect(b.capture()).toEqual(a.capture());
  }finally{a.free();b.free();}
 },120000);
 it('rejects corrupted typed or mismatched research records BEFORE Rapier restore',()=>{
  const a=new DevRuntime('adaptive','B0','yard',1183);
  try{
   for(let i=0;i<65;i++)a.step();
   const text=encodeLifeL1(a.capture());
   const record=JSON.parse(text);
   const wrong=(fn:(v:any)=>void)=>{
    const x=structuredClone(record);fn(x);
    expect(()=>decodeLifeL1(JSON.stringify(x))).toThrow();
   };
   wrong(x=>x.schemaVersion=2);
   wrong(x=>x.simHz=60);
   wrong(x=>x.checkpoint.shape='B1');
   wrong(x=>x.checkpoint.world.physics='');
   wrong(x=>x.checkpoint.world.physics='AAAA');
   wrong(x=>x.checkpoint.world.frame.retina.pop());
   wrong(x=>x.checkpoint.world.frame.touch=[0]);
   wrong(x=>x.checkpoint.world.pendingTouch=[0]);
   wrong(x=>x.checkpoint.resident.stats[0][0].sum=null);
   wrong(x=>x.checkpoint.resident.seed=-5);
   wrong(x=>x.checkpoint.world.frame.tick=68);
   wrong(x=>x.checkpoint.resident.lastDemand.turn=null);
   expect(()=>decodeLifeL1(text.slice(0,120))).toThrow();
   const ok=decodeLifeL1(text);expect(ok.shape).toBe('B0');
  }finally{a.free();}
 },120000);
});
