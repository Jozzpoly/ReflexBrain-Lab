import {chromium} from 'playwright-core';
import {spawnSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const out=resolve('artifacts/life-l1-return');
await mkdir(out,{recursive:true});
const lifePath=join(out,'fixture-from-real-node.json');
const p=spawnSync(process.execPath,['scripts/life-l1-runner.mjs','new','--ticks','1201',
 '--shape','B0','--layout','shifted','--mode','adaptive','--seed','1183','--output',lifePath],
 {encoding:'utf8',timeout:60000,maxBuffer:5_000_000});
if(p.status!==0)throw Error('Real Node life fixture failed: '+p.stderr);
const cp=JSON.parse(await readFile(lifePath,'utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1100,height:880}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4182/probes/dev-resident-v0.html',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>Number(document.querySelector('#world')?.dataset.tick)>15);
 await page.locator('#life-file').setInputFiles(lifePath);
 await page.waitForFunction(()=>document.querySelector('#life-message')?.textContent?.includes('Wczytano to samo życie'),null,{timeout:30000});
 const load=await page.locator('#world').evaluate(el=>({
  tick:Number(el.dataset.tick),learned:Number(el.dataset.learned),
  shape:document.querySelector('#body')?.value,
  layout:document.querySelector('#layout')?.value,
  mode:document.querySelector('#mode')?.value,
  id:el.dataset.lifeId
 }));
 if(load.tick!==1201||load.learned!==cp.snapshot.checkpoint.resident.learnedTrials||
    load.shape!=='B0'||load.layout!=='shifted'||load.mode!=='adaptive'||load.id!==cp.lifeId)
  throw Error('Browser did not recover full LIFE identity and history '+JSON.stringify(load));
 const initialTick=load.tick;
 await page.waitForTimeout(250);
 const pausedTick=Number(await page.locator('#world').getAttribute('data-tick'));
 if(pausedTick!==initialTick)throw Error('Import invented simulation time without permission');
 await page.screenshot({path:join(out,'01-same-life-imported-paused.png'),fullPage:true});
 // A corrupt file must never replace the current recovered organism.
 const corrupt=JSON.stringify({...cp,controllerAuthority:'manual'});
 const corruptPath=join(out,'corrupt.json');
 await writeFile(corruptPath,corrupt);
 await page.locator('#life-file').setInputFiles(corruptPath);
 await page.waitForFunction(()=>document.querySelector('#life-message')?.textContent?.includes('Nie wczytano'),null,{timeout:30000});
 const afterFailure=await page.locator('#world').evaluate(el=>({tick:Number(el.dataset.tick),id:el.dataset.lifeId}));
 if(afterFailure.tick!==initialTick||afterFailure.id!==cp.lifeId)
  throw Error('Invalid checkpoint replaced the living body');
 await page.locator('#pause').click();
 await page.waitForFunction((t)=>Number(document.querySelector('#world')?.dataset.tick)>t,initialTick,{timeout:10000});
 const laterTick=Number(await page.locator('#world').getAttribute('data-tick'));
 await page.locator('#pause').click();
 if(laterTick<=initialTick)throw Error('Resumed imported life did not experience further frames');
 await page.screenshot({path:join(out,'02-same-life-resumed.png'),fullPage:true});
 // Owner occupies the same body; manual authority must not become an authored
 // motor command in resident experience. The exported file returns to Node.
 await page.locator('#takeover').click();
 await page.waitForFunction(()=>document.querySelector('#world')?.dataset.authority==='manual');
 await page.locator('#export-life').click();
 await page.waitForFunction(()=>document.querySelector('#life-message')?.textContent?.includes('Oddaj ciało'));
 await page.locator('#drive').evaluate(e=>{e.value='85';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#pause').click();
 await page.waitForTimeout(650);
 await page.locator('#pause').click();
 await page.locator('#drive').evaluate(e=>{e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#takeover').click();
 await page.waitForFunction(()=>document.querySelector('#world')?.dataset.authority==='auto');
 const ownerEnd=await page.locator('#world').evaluate(e=>({
  tick:Number(e.dataset.tick),x:Number(e.dataset.actorX),y:Number(e.dataset.actorY),
  lifeId:e.dataset.lifeId,
 }));
 const downloadPromise=page.waitForEvent('download',{timeout:30000});
 await page.locator('#export-life').click();
 const download=await downloadPromise;
 const ownerFile=join(out,'after-owner-continued-life.json');
 await download.saveAs(ownerFile);
 const ownerRecord=JSON.parse(await readFile(ownerFile,'utf8'));
 if(ownerRecord.lifeId!==cp.lifeId||ownerRecord.physicsTicks!==ownerEnd.tick||
    ownerRecord.snapshot.checkpoint.resident.manualFrames<=cp.snapshot.checkpoint.resident.manualFrames||
    ownerRecord.snapshot.checkpoint.world.physics===cp.snapshot.checkpoint.world.physics)
  throw Error('Owner export lost real body/authority/world continuity');
 const nextFile=join(out,'node-continued-after-owner.json');
 const resumed=spawnSync(process.execPath,['scripts/life-l1-runner.mjs','resume',
  '--ticks','240','--input',ownerFile,'--output',nextFile],
  {encoding:'utf8',timeout:60000,maxBuffer:5_000_000});
 if(resumed.status!==0)throw Error('Node refused browser Owner-exported life: '+resumed.stderr);
 const continued=JSON.parse(await readFile(nextFile,'utf8'));
 if(continued.lifeId!==cp.lifeId||continued.physicsTicks!==ownerRecord.physicsTicks+240||
   continued.snapshot.checkpoint.resident.manualFrames!==ownerRecord.snapshot.checkpoint.resident.manualFrames)
  throw Error('Browser→Node continuity or legal authorship violated');
 await page.screenshot({path:join(out,'03-owner-exported-and-returned-to-node.png'),fullPage:true});
 console.log('RB_LIFE_L1_BROWSER_ROUNDTRIP '+JSON.stringify({
  originalTick:initialTick,browserOwnerTick:ownerEnd.tick,nodeContinuedTick:continued.physicsTicks,
  unchangedLifeId:continued.lifeId===cp.lifeId,
  ownerManualFrames:ownerRecord.snapshot.checkpoint.resident.manualFrames,
  checkedIntegrityByNode:true,checkpointBytes:(await readFile(ownerFile)).length,
  scope:'engineering cross-runtime biography only, not learned agency'}));
 if(errors.length)throw Error('Browser errors '+JSON.stringify(errors));
 const result={scope:'real Chrome research microscope, no organism PASS',lifeId:cp.lifeId,
  importedTicks:initialTick,resumedTick:laterTick,privateTrials:load.learned,
  invalidFileRejected:true,errors};
 console.log('RB_LIFE_L1_BROWSER_RETURN '+JSON.stringify(result));
 await writeFile(join(out,'result.json'),JSON.stringify(result,null,2));
}finally{await browser.close();}
