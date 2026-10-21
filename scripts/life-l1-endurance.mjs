#!/usr/bin/env node
// LIFE/L1 long run: 2 hours of **simulated** physics split by a real process stop.
import {spawnSync} from 'node:child_process';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const dir='artifacts/life-l1-endurance';
await mkdir(dir,{recursive:true});
function segment(args) {
 const p=spawnSync(process.execPath,['scripts/life-l1-runner.mjs',...args],
  {encoding:'utf8',timeout:240000,maxBuffer:10_000_000});
 if(p.status!==0)throw Error('LIFE L1 endurance failed: '+p.stderr);
 const entry=p.stdout.split('\n').find(x=>x.startsWith('RB_LIFE_L1_RUN '));
 if(!entry)throw Error('LIFE runtime result missing');
 return JSON.parse(entry.slice('RB_LIFE_L1_RUN '.length));
}
const path1=join(dir,'same-life-after-one-hour.json');
const path2=join(dir,'same-life-after-two-hours.json');
const first=segment(['new','--ticks','432000','--output',path1,
 '--shape','B1','--layout','yard','--mode','adaptive','--seed','1183']);
const second=segment(['resume','--ticks','432000','--input',path1,'--output',path2]);
const a=JSON.parse(await readFile(path1,'utf8'));
const b=JSON.parse(await readFile(path2,'utf8'));
const [bytes1,bytes2]=await Promise.all([stat(path1),stat(path2)]);
if(first.simulatedEndTick!==432000||second.simulatedStartTick!==432000||
 second.simulatedEndTick!==864000||b.physicsTicks!==864000||
 a.lifeId!==b.lifeId||a.createdAt!==b.createdAt||
 b.snapshot.checkpoint.resident.learnedTrials<a.snapshot.checkpoint.resident.learnedTrials||
 bytes2.size>bytes1.size*1.5)throw Error('LIFE two-hour continuity/storage assertion failed');
const aggregateMinuteAudit=segment=>{
 const bins=segment.hostOneSecondAudit?.bins??[];
 return {
  sampledMinutes:bins.length,
  sampledLooseBodyPath:bins.reduce((s,b)=>s+b.looseSampledPath,0),
  minutesWithDetectedLooseMotion:bins.filter(b=>b.looseMovingSamples>0).length,
  oneSecondSamplesWithLooseMotion:bins.reduce((s,b)=>s+b.looseMovingSamples,0),
  sampledActorPath:bins.reduce((s,b)=>s+b.actorSampledPath,0),
  lastTenMinutes:bins.slice(-10).map(b=>({
   minute:b.simMinuteIndex,loosePath:b.looseSampledPath,
   sampledMovementSeconds:b.looseMovingSamples,
   actorPath:b.actorSampledPath,chosen:b.chosen,
  })),
 };
};
const summary={
 scope:'engineering lifespan endurance of known mechanical ODEV V0, not life quality',
 simulatedHours:2,physicsSteps:864000,distinctProcesses:2,
 identityPreserved:true,
 measuredPhysicsComputeSeconds:(first.wallRunMs+second.wallRunMs)/1000,
 checkpointBytesOneHour:bytes1.size,checkpointBytesTwoHours:bytes2.size,
 checkpointSizeRatio:bytes2.size/bytes1.size,
 firstHour:{learnedTrials:first.learnedTrials,
  hostOnlyLooseNetDisplacement:first.hostOnlyLooseNetDisplacementExcludingMover,
  hostOnlyActorNetMovement:first.hostOnlyActorNetMovement,
  hostOnlyMovedLooseBodies:first.hostOnlyLooseObjectsMovedBeyond10cm,
  sampledRssBytes:first.sampledMaxRssBytes,chosen:first.chosenActions,
  coarse4mPositionSamples:first.coarse4mPositionSamples,
  minuteAudit:aggregateMinuteAudit(first)},
 secondHour:{learnedTrials:second.learnedTrials,
  hostOnlyLooseNetDisplacement:second.hostOnlyLooseNetDisplacementExcludingMover,
  hostOnlyActorNetMovement:second.hostOnlyActorNetMovement,
  hostOnlyMovedLooseBodies:second.hostOnlyLooseObjectsMovedBeyond10cm,
  sampledRssBytes:second.sampledMaxRssBytes,chosen:second.chosenActions,
  coarse4mPositionSamples:second.coarse4mPositionSamples,
  minuteAudit:aggregateMinuteAudit(second)},
 caveats:[
  'Process STOP did not simulate experiences while no physics was executing.',
  'Old V0 is an authored mobility probe, not a qualified living organism.',
  'Segment loose-matter movement means net movement since each hour start, NOT cumulative interaction volume.',
  'The supplementary 1-second microscope sums detected changes and may miss motion that returns inside each second.',
  'Long simulation time does not imply rich material biography or meaningful autonomously acquired concerns.',
  'This is one deterministic biography; no population statistic or general stability guarantee.'],
};
await writeFile(join(dir,'two-hour-result.json'),JSON.stringify(summary,null,2)+'\n');
console.log('RB_LIFE_L1_TWO_HOUR '+JSON.stringify(summary));
