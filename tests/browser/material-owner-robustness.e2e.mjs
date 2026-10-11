import fs from 'node:fs/promises';
import { chromium } from 'playwright-core';

const url=process.env.RB_OWNER_URL??'http://127.0.0.1:4174/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
const checks=[];
const wait=async(page,test,timeout=20000)=>page.waitForFunction(test,null,{timeout});
const read=page=>page.locator('#world').evaluate(c=>({
  tick:Number(c.dataset.worldTick),
  targetX:Number(c.dataset.targetX),targetY:Number(c.dataset.targetY),
  actorX:Number(c.dataset.actorX),actorY:Number(c.dataset.actorY),
}));
function watch(page){
  page.on('pageerror',e=>errors.push('pageerror '+String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text());});
}
const assert=(v,msg)=>{if(!v)throw Error(msg);};
const context=await browser.newContext({viewport:{width:1440,height:940}});
const page=await context.newPage();watch(page);
await fs.mkdir('artifacts/rb-robust',{recursive:true});
try{
  await page.goto(url,{waitUntil:'networkidle',timeout:30000});
  await wait(page,()=>Number(document.querySelector('#world')?.dataset.worldTick)>8);
  checks.push('real physics and private-retina start');
  await page.locator('#pause').click();
  await page.waitForTimeout(100);
  const t=(await read(page)).tick;
  await page.waitForTimeout(150);
  assert((await read(page)).tick===t,'physics advanced while paused');
  assert((await page.locator('#interventions').textContent()).trim()==='0',
    'ordinary pause incorrectly tainted the run');
  await page.locator('#microscope').uncheck();
  await page.locator('#speed').selectOption('4');
  assert((await page.locator('#interventions').textContent()).trim()==='0',
    'researcher lens or playback speed incorrectly marked an intervention');
  checks.push('pause and researcher-only controls are not interventions');

  const before=await read(page),rect=await page.locator('#world').boundingBox();
  assert(rect,'world bounding box not present');
  await page.mouse.move(rect.x+(before.targetX+11)/22*rect.width,
    rect.y+(7-before.targetY)/14*rect.height);
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width+250,rect.y-250,{steps:14});
  await page.mouse.up();
  const moved=await read(page);
  assert(moved.targetX<=9.101 && moved.targetX>=8.5 &&
    moved.targetY<=5.101 && moved.targetY>=4.5,
    'dragged physical target outside bounded material yard: '+JSON.stringify(moved));
  assert((await page.locator('#interventions').textContent()).trim()==='1',
    'physical intervention omitted from persistent provenance');
  assert((await page.locator('#phase').textContent()).includes('NIE'),
    'non-comparable intervention lacked visible warning');
  assert((await read(page)).tick===t,'pause violated by drag');
  checks.push('pointer capture and physics-boundary clamp while paused');

  await page.locator('#manual').click();
  assert((await page.locator('#interventions').textContent()).trim()==='2',
    'manual takeover not counted as a host intervention');
  await page.locator('#manual').click();
  assert((await page.locator('#interventions').textContent()).trim()==='2',
    'manual return erased experiment intervention provenance');
  assert((await page.locator('#phase').textContent()).includes('NIE'),
    'manual takeover taint did not persist when local brain regained control');
  checks.push('manual-control provenance persists after release');

  // A reset is a new world and new private brain. Check no old release/collider state.
  await page.locator('#reset').click();
  await wait(page,()=>Number(document.querySelector('#world')?.dataset.worldTick)>4);
  const fresh=await read(page);
  assert(Math.abs(fresh.targetX-2)<.001 && Math.abs(fresh.targetY+3)<.001,
    'reset did not restore original physical target');
  assert((await page.locator('#interventions').textContent()).trim()==='0',
    'reset did not clear intervention provenance');
  checks.push('reset creates fresh independent world and brain');

  // Interrupt full real-physics replay, check ability to resume without reset.
  await page.locator('#pause').click();
  await page.locator('#run60').click();
  await wait(page,()=>Number(document.querySelector('#world')?.dataset.worldTick)>150,25000);
  const fastInProgress=await page.locator('#run60').textContent();
  assert(/Przerwij/.test(fastInProgress),
    'full physics replay cannot be interrupted by Owner');
  await page.locator('#run60').click();
  await wait(page,()=>document.querySelector('#run60')?.textContent==='Przelicz do 60 s',25000);
  const stopped=await read(page);
  assert(stopped.tick<7200 && stopped.tick>150,'fast stop did not preserve intermediate physics tick');
  assert((await page.locator('#interventions').textContent()).trim()==='0',
    'pure time fast-forward incorrectly registered as host alteration');
  await page.locator('#run60').click();
  await wait(page,()=>Number(document.querySelector('#world')?.dataset.worldTick)===7200,90000);
  await wait(page,()=>document.querySelector('#run60')?.disabled===true,10000);
  const outcome=await read(page);
  const gap=Number((await page.locator('#gap').textContent()).replace('m','').trim());
  assert(Math.abs(outcome.targetX-9.2500)<.025&&Math.abs(gap-2.90)<.015,
    'interrupted+resumed full physical time differed from frozen S0');
  checks.push('cancel/resume full physics replay preserves identical source-science afterstate');
  await page.screenshot({path:'artifacts/rb-robust/01-interrupted-and-resumed.png',fullPage:true});

  // After 60s the true World can continue. The 60s *benchmark* cannot.
  await page.locator('#pause').click();
  await wait(page,()=>Number(document.querySelector('#world')?.dataset.worldTick)>7205,16000);
  assert((await page.locator('#phase').textContent()).includes('Poza zamrożonym oknem'),
    'later continuing life conflated with frozen 60-second outcome');
  checks.push('physical continuation and test-window boundary are distinct');
  await page.locator('#mode').selectOption('cheap-cyan-chase');
  await wait(page,()=>Number(document.querySelector('#world')?.dataset.worldTick)>10,16000);
  assert((await page.locator('#interventions').textContent()).trim()==='0',
    'controller switching inherited old intervention');
  assert((await page.locator('#mode').inputValue())==='cheap-cyan-chase',
    'controller change did not take effect');
  checks.push('mode switching after long play resets to fair independent comparator');

  // Deliberately stress UI lifecycle without ever altering model/world rules.
  for(let i=0;i<7;i++){
    await page.locator('#mode').selectOption(['world-only','cheap-cyan-chase',
      'private-material-concern'][i%3]);
    await page.locator('#reset').click();
    await page.locator('#pause').click();
    await page.locator('#pause').click();
    await wait(page,()=>Number(document.querySelector('#world')?.dataset.worldTick)>2,10000);
    const p=await read(page);
    assert(Number.isFinite(p.actorX)&&Number.isFinite(p.targetX),
      'nonfinite after reset/mode cycle '+i);
  }
  checks.push('seven mixed independent restarts and pause/resume cycles');

  // Small/mobile-width viewport is a viewer/readability test, not mobile full
  // game functionality. Page must not horizontally overflow.
  for(const [width,height] of [[900,900],[390,844],[320,720]]){
    await page.setViewportSize({width,height});
    const sizes=await page.evaluate(()=>({
      body:document.documentElement.scrollWidth,viewport:window.innerWidth,
      canvas:document.getElementById('world').getBoundingClientRect().width,
    }));
    assert(sizes.body<=sizes.viewport+2,
      'horizontal overflow at '+width+': '+JSON.stringify(sizes));
    assert(sizes.canvas>=180&&sizes.canvas<=sizes.viewport,
      'world canvas unreadably collapsed at '+width);
    await page.locator('#world').scrollIntoViewIfNeeded();
    await page.screenshot({path:`artifacts/rb-robust/viewport-${width}.png`,fullPage:true});
  }
  checks.push('desktop, tablet, 390px and 320px viewports: no horizontal overflow');
  assert(errors.length===0,'browser errors: '+JSON.stringify(errors));
  const result={verdict:'ENGINEERING_ROBUSTNESS_PASS',
    assertions:checks,finalGap:gap,interruptedAtTick:stopped.tick,
    resumedAtTick:outcome.tick,viewports:[900,390,320],
    errors,physicalS0Unchanged:true};
  await fs.writeFile('artifacts/rb-robust/result.json',JSON.stringify(result,null,2)+'\n');
  console.log('RB_OWNER_ROBUSTNESS_RESULT '+JSON.stringify(result));
}finally{await browser.close();}
