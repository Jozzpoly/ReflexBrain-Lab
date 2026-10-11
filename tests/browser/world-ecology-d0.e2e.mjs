import fs from 'node:fs/promises';
import {chromium} from 'playwright-core';

const url=process.env.RB_WORLD_D0_URL??'http://127.0.0.1:4173/probes/world-ecology-d0.html';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
page.on('console',e=>{if(e.type()==='error')errors.push('console: '+e.text());});
const snap=()=>page.locator('#world').evaluate(el=>({
  tick:Number(el.dataset.tick),
  actorX:Number(el.dataset.actorX),actorY:Number(el.dataset.actorY),
  x:Number(el.dataset.trackedX),y:Number(el.dataset.trackedY),
}));
const check=(bool,msg)=>{if(!bool)throw Error(msg);};
await fs.mkdir('artifacts/world-d0',{recursive:true});
try{
  await page.goto(url,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Number(document.querySelector('#world')?.dataset.tick)>12,
    null,{timeout:18000});
  await page.waitForFunction(()=>{
    const c=document.getElementById('retina');
    return c?.getContext('2d')?.getImageData(0,0,96,15).data.some(x=>x>0);
  },null,{timeout:15000});
  const initial=await snap();
  check(Math.abs(initial.x-15)<.001 && Math.abs(initial.y+10)<.001,
    'D0 physical source scene missing');
  await page.screenshot({path:'artifacts/world-d0/01-world-start.png',fullPage:true});

  // No actor inputs: physical process must nevertheless change material.
  await page.waitForFunction(()=>Number(document.querySelector('#world')?.dataset.tick)>420,
    null,{timeout:30000});
  const autonomous=await snap();
  check(autonomous.x>15.2,'autonomous rail did not displace material in browser');
  check(Math.abs(autonomous.actorX)<.001,'focal actor moved without commands');
  await page.screenshot({path:'artifacts/world-d0/02-world-alone.png',fullPage:true});

  await page.locator('#pause').click();
  await page.waitForTimeout(90);
  const frozenPhysical=await snap(),frozen=frozenPhysical.tick;
  await page.waitForTimeout(150);
  check((await snap()).tick===frozen,'pause failed on real World');
  const rect=await page.locator('#world').boundingBox();
  check(rect,'missing World canvas');
  // Material pointer drag: Owner-only, no hidden semantic World message.
  const x=rect.x+(frozenPhysical.x+26)/52*rect.width;
  const y=rect.y+(16.25-frozenPhysical.y)/32.5*rect.height;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+rect.width/52,y-rect.height/32.5,{steps:8});
  await page.mouse.up();
  try{
    await page.waitForFunction(
      ({x,y})=>{
        const c=document.querySelector('#world');
        const nx=Number(c?.dataset.trackedX),ny=Number(c?.dataset.trackedY);
        return Math.hypot(nx-x,ny-y)>.35;
      },{x:frozenPhysical.x,y:frozenPhysical.y},{timeout:1700});
  }catch(e){
    console.log('RB_WORLD_D0_DRAG_DIAG '+JSON.stringify({
      rect,cursorStart:{x,y},pausedActor:frozenPhysical,
      measuredAfter:await snap(),status:await page.locator('#private').textContent(),
    }));
    throw Error('True host material drag did not move tracked physical target');
  }
  const moved=await snap();
  check((await page.locator('#private').textContent()).includes('Interwencje badacza: '),
    'Owner intervention is not visible in specimen');
  await page.screenshot({path:'artifacts/world-d0/03-owner-world-change.png',fullPage:true});
  await page.locator('#reset').click();
  await page.waitForFunction(()=>Number(document.querySelector('#world')?.dataset.tick)>12,
    null,{timeout:12000});

  // The autonomous mechanism is separately disableable as an ecology control.
  await page.locator('#rail').selectOption('off');
  await page.waitForFunction(()=>Number(document.querySelector('#world')?.dataset.tick)>100,
    null,{timeout:18000});
  const staticWorld=await snap();
  check(Math.abs(staticWorld.x-15)<.005,'ecology-off control moved material');
  await page.screenshot({path:'artifacts/world-d0/04-static-control.png',fullPage:true});

  // Real force-based body control; NOT research oracle/brain.
  await page.locator('#world').focus();
  const before=await snap();
  await page.keyboard.down('w');await page.waitForTimeout(750);await page.keyboard.up('w');
  const driven=await snap();
  check(driven.actorX>before.actorX+.05,'manual drive did not move true Rapier body');
  await page.locator('#camera').click();
  check((await page.locator('#camera').textContent())?.includes('śledź ciało'),
    'camera follow mode not selectable');
  await page.screenshot({path:'artifacts/world-d0/05-manual-body.png',fullPage:true});

  for(const [width,height] of [[900,900],[390,844],[320,720]]){
    await page.setViewportSize({width,height});
    const d=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:window.innerWidth}));
    check(d.width<=d.viewport+2,'horizontal overflow at '+width+': '+JSON.stringify(d));
    await page.screenshot({path:'artifacts/world-d0/viewport-'+width+'.png',fullPage:true});
  }
  check(errors.length===0,'Chromium errors '+JSON.stringify(errors));
  const result={verdict:'WORLD_D0_BROWSER_ENGINEERING_PASS',
    timeStart:initial.tick,timeAutonomy:autonomous.tick,
    movedMaterial:autonomous.x-15,
    stoppedAt:frozen,manualActorDelta:driven.actorX-before.actorX,
    staticControlX:staticWorld.x,screenWidths:[900,390,320],
    semanticOrganismQualified:false,errors,screenshots:8};
  await fs.writeFile('artifacts/world-d0/result.json',JSON.stringify(result,null,2)+'\n');
  console.log('RB_WORLD_D0_BROWSER_RESULT '+JSON.stringify(result));
}finally{await browser.close();}
