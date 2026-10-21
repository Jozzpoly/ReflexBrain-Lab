#!/usr/bin/env node
// Bounded source-executed LIFE/L1 time-budget study, not a life/AI quality test.
import {spawnSync} from 'node:child_process';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const dir='artifacts/life-l1';
await mkdir(dir,{recursive:true});
const execute=(args)=>{
 const processRun=spawnSync(process.execPath,['scripts/life-l1-runner.mjs',...args],
  {encoding:'utf8',timeout:300000,maxBuffer:20*1024*1024});
 if(processRun.status!==0)throw Error('LIFE benchmark process failed: '+processRun.stderr);
 const record=processRun.stdout.split('\n').find(s=>s.startsWith('RB_LIFE_L1_RUN '));
 if(!record)throw Error('No measured physical run');
 return JSON.parse(record.slice('RB_LIFE_L1_RUN '.length));
};
const initial=execute(['new','--ticks','36000','--output',join(dir,'life-at-five-minutes.json'),
 '--shape','B1','--layout','yard','--mode','adaptive','--seed','1183']);
const resumed=execute(['resume','--ticks','36000','--input',join(dir,'life-at-five-minutes.json'),
 '--output',join(dir,'life-at-ten-minutes.json')]);
const a=JSON.parse(await readFile(join(dir,'life-at-five-minutes.json'),'utf8'));
const b=JSON.parse(await readFile(join(dir,'life-at-ten-minutes.json'),'utf8'));
if(initial.simulatedEndTick!==36000||resumed.simulatedStartTick!==36000||
 resumed.simulatedEndTick!==72000||a.lifeId!==b.lifeId||b.physicsTicks!==72000||
 b.snapshot.checkpoint.resident.learnedTrials<a.snapshot.checkpoint.resident.learnedTrials)
 throw Error('LIFE 10-minute causal time/identity preservation failed');
const [s1,s2]=await Promise.all([
 stat(join(dir,'life-at-five-minutes.json')),
 stat(join(dir,'life-at-ten-minutes.json'))]);
const ratio=s2.size/s1.size;
// This same fixed-size V0 resident should not accumulate a full memory frame per tick.
if(ratio>1.5)throw Error('Checkpoint storage grew unexpectedly: '+ratio.toFixed(2));
const summary={
 test:'LIFE/L1 engineering throughput only, not a scientifically qualified organism',
 donorSha:initial.donorSha,lifeId:a.lifeId,
 simulatedMinutes:10,physicsSteps:72000,distinctProcesses:2,
 firstSegment:initial,secondSegment:resumed,
 checkpointBytesAfter5min:s1.size,checkpointBytesAfter10min:s2.size,
 checkpointSizeRatio:ratio,
 measuredPhysicsStepsPerWallSecond:
   72000/((initial.wallRunMs+resumed.wallRunMs)/1000),
 actualComputeWallSeconds:(initial.wallRunMs+resumed.wallRunMs)/1000,
 projectedOneHourWallSeconds:
   432000/((72000/((initial.wallRunMs+resumed.wallRunMs)/1000))),
 interpretation:'time projection for current V0 and hardware only; does not validate meaningful life, long-term stability or storage durability',
};
await writeFile(join(dir,'benchmark-result.json'),JSON.stringify(summary,null,2)+'\n');
console.log('RB_LIFE_L1_10MIN '+JSON.stringify(summary));
