import fs from 'node:fs/promises';
import {chromium} from 'playwright-core';

const URL=process.env.RB_B1_URL??'http://127.0.0.1:4177/probes/b1-material-field.html';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
const out='artifacts/b1-material-field';
const check=(v,m)=>{if(!v)throw Error(m);};
const snap=i=>page.locator('#world'+i).evaluate(el=>({
  tick:Number(el.dataset.tick),actorX:Number(el.dataset.actorX),actorY:Number(el.dataset.actorY),
  targetX:Number(el.dataset.targetX),targetY:Number(el.dataset.targetY),
  cameraCenter:Number(el.dataset.cameraCenter),dragHandle:el.dataset.dragHandle,
  manual:el.dataset.manual==='true'
}));
await fs.mkdir(out,{recursive:true});
try{
  await page.goto(URL,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Number(document.querySelector('#world0')?.dataset.tick)>30 &&
    Number(document.querySelector('#world1')?.dataset.tick)>30,null,{timeout:20000});
  // Atomically read both panel clocks. Two awaited cross-page evaluations
  // could straddle an animation frame and falsely diagnose a sync defect.
  const simultaneously=await page.evaluate(()=>[0,1].map(i=>{
    const c=document.querySelector('#world'+i);
    return {tick:Number(c?.dataset.tick),actorX:Number(c?.dataset.actorX),
      targetX:Number(c?.dataset.targetX),targetY:Number(c?.dataset.targetY),
      cameraCenter:Number(c?.dataset.cameraCenter)};
  }));
  const initial0=simultaneously[0],initial1=simultaneously[1];
  check(initial0.tick===initial1.tick,
    'paired Worlds actually have unsynchronized atomic physics clocks: '+
    JSON.stringify(simultaneously));
  check(Math.abs(initial0.targetX-9)<.01&&Math.abs(initial1.targetX-9)<.01,
    'actual physical cyan targets missing');
  check(Number.isFinite(initial1.actorX),'missing B1 actor');
  await page.screenshot({path:out+'/01-dual-world.png',fullPage:true});
  // Real manual authority uses the same command to both different bodies.
  await page.locator('#pilot').click();
  const before0=await snap(0),before1=await snap(1);
  await page.locator('#drive').evaluate(el=>{el.value='75';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForTimeout(520);
  await page.locator('#drive').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const driven0=await snap(0),driven1=await snap(1);
  check(driven0.actorX>before0.actorX+.06,'B0 did not move under common motor authority');
  check(driven1.actorX>before1.actorX+.06,'B1 did not move under common motor authority');
  check(driven0.manual&&driven1.manual,'manual authority not displayed honestly');
  await page.screenshot({path:out+'/02-manual-bodies.png',fullPage:true});

  await page.locator('#run').click();
  const paused=await snap(1);
  await page.waitForTimeout(200);
  check((await snap(1)).tick===paused.tick,'pause did not freeze real World');
  const canvas=page.locator('#world1');
  await canvas.scrollIntoViewIfNeeded();
  const rect=await canvas.boundingBox();
  check(rect,'B1 canvas missing');
  await page.locator('#save').click();
  check(!(await page.locator('#restore').isDisabled()),'reversible fork unavailable');
  const start=await snap(1);
  const sx=rect.x+(start.targetX-(start.cameraCenter-15))/30*rect.width;
  const sy=rect.y+(10-start.targetY)/20*rect.height;
  await page.mouse.move(sx,sy);
  await page.mouse.down();
  await page.mouse.move(sx-rect.width/30*1.5,sy-rect.height/20*1.2,{steps:8});
  await page.mouse.up();
  const dragged=await snap(1);
  check(Math.hypot(dragged.targetX-start.targetX,dragged.targetY-start.targetY)>.5,
    'Owner physical object drag did not change actual B1 world');
  const unperturbed=await snap(0);
  check(Math.abs(unperturbed.targetX-initial0.targetX)<.1,
    'independent B0 World was changed by B1-only intervention');
  await page.screenshot({path:out+'/03-after-one-world-intervention.png',fullPage:true});
  await page.locator('#restore').click();
  const restored=await snap(1);
  check(Math.hypot(restored.targetX-start.targetX,restored.targetY-start.targetY)<.001 &&
    restored.tick===start.tick,
    'B1 checkpoint failed to restore exact prior material state');
  const bothRestored=await snap(0);
  check(bothRestored.tick===start.tick,'counterfactual restored only one World');
  await page.screenshot({path:out+'/04-full-world-counterfactual-restore.png',fullPage:true});
  // Repeat the same isolated intervention after restoration, so the
  // remaining autonomy test still examines a world actually changed by Owner.
  await canvas.scrollIntoViewIfNeeded();
  const repeat=await canvas.boundingBox();
  check(repeat,'canvas missing after restore');
  const ox=repeat.x+(restored.targetX-(restored.cameraCenter-15))/30*repeat.width;
  const oy=repeat.y+(10-restored.targetY)/20*repeat.height;
  await page.mouse.move(ox,oy);await page.mouse.down();
  await page.mouse.move(ox-repeat.width/30*1.5,oy-repeat.height/20*1.2,{steps:8});
  await page.mouse.up();
  const repeated=await snap(1);
  check(Math.hypot(repeated.targetX-start.targetX,repeated.targetY-start.targetY)>.5,
    'repeat intervention after checkpoint failed');

  await page.locator('#run').click();
  await page.locator('#pilot').click(); // autonomous scripted old Occupant returns
  await page.waitForFunction(n=>Number(document.querySelector('#world1')?.dataset.tick)>n+60,
    dragged.tick,{timeout:18000});
  const autonomic=await snap(1);
  check(!autonomic.manual,'old authored autonomous controller failed to regain authority');
  await page.screenshot({path:out+'/04-after-return-to-auto.png',fullPage:true});

  for(const [width,height] of [[900,900],[390,844],[320,720]]){
    await page.setViewportSize({width,height});
    const geometry=await page.evaluate(()=>({
      pageWidth:document.documentElement.scrollWidth,
      viewportWidth:window.innerWidth,
    }));
    check(geometry.pageWidth<=geometry.viewportWidth+2,
      'horizontal overflow '+width+': '+JSON.stringify(geometry));
    await page.screenshot({path:out+'/viewport-'+width+'.png',fullPage:true});
  }
  check(errors.length===0,'Browser JS errors '+JSON.stringify(errors));
  const result={
    verdict:'B1_MATERIAL_BROWSER_ENGINEERING_PASS',
    oldOccupantLearned:false,bodyShapeWasChanged:true,
    identicalManualInputBoth:true,isolatedMaterialIntervention:true,
    materialDragDistance:Math.hypot(dragged.targetX-start.targetX,dragged.targetY-start.targetY),
    manualDeltas:{B0:driven0.actorX-before0.actorX,B1:driven1.actorX-before1.actorX},
    beforeAndAfter:{initial0,initial1,dragged,restored,autonomic},
    mobileWidths:[900,390,320],errors,
  };
  await fs.writeFile(out+'/result.json',JSON.stringify(result,null,2)+'\n');
  console.log('RB_B1_BROWSER_RESULT '+JSON.stringify(result));
}finally{await browser.close();}
