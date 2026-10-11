import fs from 'node:fs/promises';
import { chromium } from 'playwright-core';

const url=process.env.RB_OWNER_URL ??
  'http://127.0.0.1:4173/probes/material-organism.html';
const errors=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({
  viewport:{width:1512,height:1000},deviceScaleFactor:1,
});
page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
page.on('console',e=>{
  if(e.type()==='error')errors.push('console.error: '+e.text());
});
await fs.mkdir('artifacts/rb-owner',{recursive:true});
const pos=async()=>page.locator('#world').evaluate(el=>({
  actorX:Number(el.dataset.actorX),actorY:Number(el.dataset.actorY),
  targetX:Number(el.dataset.targetX),targetY:Number(el.dataset.targetY),
  tick:Number(el.dataset.worldTick),
}));
try{
  await page.goto(url,{waitUntil:'networkidle',timeout:30000});
  await page.locator('#world').waitFor({state:'visible'});
  await page.waitForFunction(()=>{
    const c=document.getElementById('world');
    const r=document.getElementById('retina');
    return Number(c?.dataset.worldTick)>25 &&
      r?.getContext('2d')?.getImageData(0,0,96,18).data.some(n=>n>0);
  },null,{timeout:15000});
  if(!/Działa bez Ownera/.test(await page.locator('#status').textContent()))
    throw Error('autonomous state did not start');
  const first=await pos();
  const initialGap=await page.locator('#gap').textContent();
  await page.screenshot({path:'artifacts/rb-owner/01-material-live.png',fullPage:true});

  // Pause must freeze real physics/world tick, not merely the status label.
  await page.locator('#pause').click();
  await page.waitForTimeout(120);
  const pausedAt=(await pos()).tick;
  await page.waitForTimeout(240);
  const frozenAt=(await pos()).tick;
  if(pausedAt!==frozenAt)throw Error('pause did not stop World physics');

  // One genuine host-only drag, no actor event notification.
  const beforeDrag=await pos();
  const r=await page.locator('#world').boundingBox();
  if(!r)throw Error('missing real world canvas');
  const start={x:r.x+(beforeDrag.targetX+11)/22*r.width,
    y:r.y+(7-beforeDrag.targetY)/14*r.height};
  await page.mouse.move(start.x,start.y);
  await page.mouse.down();
  await page.mouse.move(start.x+r.width*1.2/22,start.y-r.height*.6/14,
    {steps:10});
  await page.mouse.up();
  const afterDrag=await pos();
  const interventions=await page.locator('#interventions').textContent();
  if(interventions?.trim()!=='1')throw Error('World-only drag was not recorded');
  if(Math.hypot(afterDrag.targetX-beforeDrag.targetX,
    afterDrag.targetY-beforeDrag.targetY)<.1)
    throw Error('drag did not move physical target collider');
  await page.screenshot({path:'artifacts/rb-owner/02-physical-intervention.png',fullPage:true});

  await page.locator('#pause').click();
  await page.waitForFunction((old)=>Number(
    document.getElementById('world')?.dataset.worldTick)>old+10,
    frozenAt,{timeout:15000});
  // New controller selection must reset the physical world and action history.
  await page.locator('#mode').selectOption('cheap-cyan-chase');
  await page.waitForFunction(()=>Number(
    document.getElementById('world')?.dataset.worldTick)>10,
    null,{timeout:15000});
  if((await page.locator('#interventions').textContent())?.trim()!=='0')
    throw Error('old host intervention carried into competitor');
  await page.screenshot({path:'artifacts/rb-owner/03-cheap-control.png',fullPage:true});

  // World-only baseline + real manual takeover and release.
  await page.locator('#mode').selectOption('world-only');
  await page.locator('#manual').click();
  if((await page.locator('#manual').getAttribute('aria-pressed'))!=='true')
    throw Error('manual takeover was not activated');
  await page.locator('#world').focus();
  const beforeManual=await pos();
  await page.keyboard.down('w');
  await page.waitForTimeout(650);
  await page.keyboard.up('w');
  const afterManual=await pos();
  if(afterManual.actorX<=beforeManual.actorX+.03)
    throw Error('manual motor control did not physically move actor');
  await page.screenshot({path:'artifacts/rb-owner/04-manual-body.png',fullPage:true});
  await page.locator('#manual').click();
  if((await page.locator('#manual').getAttribute('aria-pressed'))!=='false')
    throw Error('manual release did not return body to local policy');
  if(!/Działa bez Ownera/.test(await page.locator('#status').textContent()))
    throw Error('body failed to return to autonomous baseline');
  if(errors.length)throw Error(JSON.stringify(errors));
  const result={
    verdict:'BROWSER_ENGINEERING_PASS',initialTick:first.tick,
    initialGap,pausedAt,frozenAt,
    targetDrag:{before:{x:beforeDrag.targetX,y:beforeDrag.targetY},
      after:{x:afterDrag.targetX,y:afterDrag.targetY}},
    competitorReset:true,manualBodyDeltaX:afterManual.actorX-beforeManual.actorX,
    releasedToLocalControl:true,consoleErrors:errors,screenshots:4,
  };
  await fs.writeFile('artifacts/rb-owner/browser-result.json',
    JSON.stringify(result,null,2)+'\n');
  console.log('RB_OWNER_BROWSER_RESULT '+JSON.stringify(result));
}finally{await browser.close();}
