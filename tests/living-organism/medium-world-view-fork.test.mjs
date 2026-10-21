/* Medium W — bounded real-Rapier falsifier, stacked on LIFE/L1 exact commit.
 * Distinguishes (1) two observer lenses on one actual physical authority
 * from (2) independent restored runtimes and (3) distinct OS process resumes
 * that retain the same lifeId. Does NOT demonstrate a multi-window UI or RPC.
 * No production code, private artifacts, host identity contract or deploy.
 */
import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {initLivingWorld} from '../../src/living-organism/world';
import {DevRuntime} from '../../src/living-organism/dev-runtime';

const realObject=runtime=>runtime.world.inspect().objects.find(o=>o.kind==='object');
const lifeFile=async path=>JSON.parse(await readFile(path,'utf8'));
const runL1=(...args)=>{
 const p=spawnSync(process.execPath,['scripts/life-l1-runner.mjs',...args],{
  encoding:'utf8',timeout:90000,maxBuffer:10_000_000
 });
 expect(p.status,p.stderr).toBe(0);
 return p;
};

describe('MEDIUM/W — actual physical authority versus view / continuation / fork',()=>{
 it('two independent host-only lenses observe one live Rapier World and one intervention',async()=>{
  await initLivingWorld();
  const runtime=new DevRuntime('adaptive','B0','yard',1183);
  try{
   const lensA=()=>runtime.world.inspect();
   const lensB=()=>runtime.world.inspect();
   const before=lensA(),target=before.objects.find(o=>o.kind==='object');
   expect(target).toBeDefined();
   const initialX=target.x, initialY=target.y;
   expect(lensB()).toEqual(before);
   // An observer snapshot is not the physical authority.
   before.objects.find(o=>o.handle===target.handle).x=9999;
   expect(lensB().objects.find(o=>o.handle===target.handle).x).toBeCloseTo(initialX,8);
   // One host-side physical mutation; both lenses now see it at the SAME tick.
   runtime.world.moveObject(target.handle,initialX+1.25,initialY-.6);
   const a=lensA().objects.find(o=>o.handle===target.handle);
   const b=lensB().objects.find(o=>o.handle===target.handle);
   expect(a.x).toBeCloseTo(initialX+1.25,6);
   expect(a.y).toBeCloseTo(initialY-.6,6);
   expect(b).toEqual(a);
   expect(lensA().tick).toBe(before.tick);
   expect(lensB().tick).toBe(before.tick);
  }finally{runtime.free();}
 });

 it('one exact checkpoint restored into two runtimes creates two independent worlds',async()=>{
  await initLivingWorld();
  const donor=new DevRuntime('adaptive','B0','yard',1183);
  let left,right;
  try{
   for(let i=0;i<16;i++)donor.step();
   const checkpoint=donor.capture();
   left=new DevRuntime(checkpoint.mode,checkpoint.shape,checkpoint.layout);
   right=new DevRuntime(checkpoint.mode,checkpoint.shape,checkpoint.layout);
   left.restore(checkpoint);right.restore(checkpoint);
   expect(left.world.inspect()).toEqual(right.world.inspect());
   const target=realObject(left),rightBefore=realObject(right);
   expect(target).toBeDefined();
   left.world.moveObject(target.handle,target.x+2,target.y);
   const leftAfter=realObject(left),rightAfter=realObject(right);
   expect(leftAfter.x).toBeCloseTo(target.x+2,6);
   expect(rightAfter.x).toBeCloseTo(rightBefore.x,8);
   expect(leftAfter.x).not.toBeCloseTo(rightAfter.x,5);
   expect(left.world.inspect().tick).toBe(right.world.inspect().tick);
   left.step();
   expect(left.world.inspect().tick).toBe(right.world.inspect().tick+1);
  }finally{left?.free();right?.free();donor.free();}
 });

 it('two separate process resumes retain LIFE identity but create independent futures',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'medium-world-fork-'));
  try{
   const base=join(dir,'base.json'),a=join(dir,'a.json'),b=join(dir,'b.json');
   runL1('new','--ticks','40','--output',base,'--shape','B0',
    '--layout','yard','--mode','adaptive','--seed','1183');
   const originalText=await readFile(base,'utf8');
   runL1('resume','--ticks','20','--input',base,'--output',a);
   runL1('resume','--ticks','31','--input',base,'--output',b);
   const source=await lifeFile(base),left=await lifeFile(a),right=await lifeFile(b);
   expect(left.lifeId).toBe(source.lifeId);
   expect(right.lifeId).toBe(source.lifeId);
   expect(left.createdAt).toBe(right.createdAt);
   expect(source.physicsTicks).toBe(40);
   expect(left.physicsTicks).toBe(60);
   expect(right.physicsTicks).toBe(71);
   expect(left.snapshot.checkpoint.world.tick).not.toBe(right.snapshot.checkpoint.world.tick);
   expect(await readFile(base,'utf8')).toBe(originalText);
  }finally{await rm(dir,{recursive:true,force:true});}
 },180000);
});