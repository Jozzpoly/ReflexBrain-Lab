import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';

describe('LIFE/L1 process-independent real Rapier host',()=>{
 it('initializes actual World+resident in a separate Node process',()=>{
  const p=spawnSync(process.execPath,['scripts/life-l1-runner.mjs','smoke'],
   {encoding:'utf8',timeout:60000});
  expect(p.status,p.stderr).toBe(0);
  const line=p.stdout.split('\n').find(x=>x.startsWith('RB_LIFE_L1_SMOKE '));
  expect(line).toBeDefined();
  const data=JSON.parse(line!.slice('RB_LIFE_L1_SMOKE '.length));
  expect(data.physicsTicks).toBe(480);
  expect(data.retinaLength).toBe(288);
  expect(data.learnedTrials).toBeGreaterThan(0);
  expect(data.rapierSnapshotBytes).toBeGreaterThan(100);
 },90000);
});
