import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const call=(...args)=>{
 const p=spawnSync(process.execPath,['scripts/life-l1-runner.mjs',...args],
  {encoding:'utf8',timeout:90000,maxBuffer:10*1024*1024});
 const line=p.stdout?.split('\n').find(s=>s.startsWith('RB_LIFE_L1_RUN '));
 return {status:p.status,stderr:p.stderr??'',stdout:p.stdout??'',
  result:line?JSON.parse(line.slice('RB_LIFE_L1_RUN '.length)):null};
};
const snap=(s)=>s.snapshot.checkpoint;
const read=async p=>JSON.parse(await readFile(p,'utf8'));

describe('LIFE/L1 independent process-restart physical + private continuity',()=>{
 it('creates a real saved life and resumes in a new OS process exactly as uninterrupted 120Hz physics',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'reflex-life-l1-'));
  try{
   for(const shape of ['B0','B1'])for(const layout of ['yard','shifted']){
    const base=join(dir,shape+'-'+layout);
    const n=call('new','--ticks','977','--output',base+'-initial.json',
      '--shape',shape,'--layout',layout,'--mode','adaptive','--seed','1183');
    expect(n.status,n.stderr).toBe(0);
    expect(n.result?.simulatedEndTick).toBe(977);
    const before=await read(base+'-initial.json');
    expect(snap(before).world.frame.tick).toBe(976);
    expect(before.controllerAuthority).toBe('auto');
    const resumed=call('resume','--ticks','1440','--input',base+'-initial.json',
      '--output',base+'-resumed.json');
    expect(resumed.status,resumed.stderr).toBe(0);
    expect(resumed.result?.simulatedStartTick).toBe(977);
    expect(resumed.result?.simulatedEndTick).toBe(2417);
    const uninterrupted=call('new','--ticks','2417','--output',base+'-reference.json',
      '--shape',shape,'--layout',layout,'--mode','adaptive','--seed','1183');
    expect(uninterrupted.status,uninterrupted.stderr).toBe(0);
    const after=await read(base+'-resumed.json');
    const reference=await read(base+'-reference.json');
    expect(after.lifeId).toBe(before.lifeId);
    expect(after.createdAt).toBe(before.createdAt);
    expect(after.physicsTicks).toBe(2417);
    expect(after.simulatedSeconds).toBe(2417/120);
    expect(snap(after)).toEqual(snap(reference));
    expect((await read(base+'-initial.json')).physicsTicks).toBe(977);
    console.log('RB_LIFE_L1_RESTART '+JSON.stringify({
     shape,layout,initialTicks:977,continuedTicks:1440,
     identicalCompleteCausalCheckpoint:true,
     priorCheckpointPreserved:true,
     savedPrivateLearnedTrials:snap(after).resident.learnedTrials,
     checkpointBytes:resumed.result?.checkpointBytes,
     wallRunMs:resumed.result?.wallRunMs,
    }));
   }
  }finally{await rm(dir,{recursive:true,force:true});}
 },180000);

 it('does not overwrite an existing valid life; rejects damaged, unsupported or mismatched snapshot',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'reflex-life-safety-'));
  try{
   const init=join(dir,'good.json'),occupied=join(dir,'occupied.json');
   const created=call('new','--ticks','120','--output',init);
   expect(created.status,created.stderr).toBe(0);
   const text=await readFile(init,'utf8');
   await writeFile(occupied,'KEEP EXISTING SAVE','utf8');
   const occupiedAttempt=call('resume','--ticks','4','--input',init,'--output',occupied);
   expect(occupiedAttempt.status).not.toBe(0);
   expect(await readFile(occupied,'utf8')).toBe('KEEP EXISTING SAVE');
   const second=call('new','--ticks','120','--output',init);
   expect(second.status).not.toBe(0);
   expect(await readFile(init,'utf8')).toBe(text);
   const corrupt=join(dir,'corrupt.json');
   await writeFile(corrupt,text.replace('"controllerAuthority":"auto"','"controllerAuthority":"manual"'));
   expect(call('resume','--ticks','4','--input',corrupt,
    '--output',join(dir,'nope.json')).status).not.toBe(0);
   const truncated=join(dir,'truncated.json');
   await writeFile(truncated,text.slice(0,100));
   expect(call('resume','--ticks','4','--input',truncated,
    '--output',join(dir,'nope2.json')).status).not.toBe(0);
   expect(call('resume','--ticks','4','--input',init,'--output',init).status).not.toBe(0);
   expect(call('new','--ticks','NaN','--output',join(dir,'invalid.json')).status).not.toBe(0);
   expect(call('new','--ticks','10000000000','--output',join(dir,'invalid.json')).status).not.toBe(0);
   // A wall-time gap without ticks is not extra life.
   await new Promise(resolve=>setTimeout(resolve,120));
   const resumed=call('resume','--ticks','4','--input',init,'--output',join(dir,'safe.json'));
   expect(resumed.status,resumed.stderr).toBe(0);
   expect(resumed.result?.simulatedStartTick).toBe(120);
   expect(resumed.result?.simulatedEndTick).toBe(124);
   expect(resumed.result?.simulatedDowntimeSeconds).toBe(0);
   expect(await readFile(init,'utf8')).toBe(text);
  }finally{await rm(dir,{recursive:true,force:true});}
 },180000);
});
