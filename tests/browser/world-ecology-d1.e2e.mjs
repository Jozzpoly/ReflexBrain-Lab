import fs from 'node:fs/promises';
import {chromium} from 'playwright-core';
const url=process.env.RB_WORLD_D1_URL??'http://127.0.0.1:4175/probes/world-ecology-d1.html';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
const assert=(v,msg)=>{if(!v)throw Error(msg);};
const read=()=>page.locator('#world').evaluate(c=>({
 tick:Number(c.dataset.tick),gateX:Number(c.dataset.gateX),
 loaded:c.dataset.plateLoaded==='true',
 materialX:Number(c.dataset.trackedX),materialY:Number(c.dataset.trackedY),
 actorX:Number(c.dataset.actorX),actorY:Number(c.dataset.actorY),
}));
const wait=code=>page.waitForFunction(code,null,{timeout:30000});
const coord=(rect,x,y)=>({x:rect.x+(x+26)/52*rect.width,y:rect.y+(16.25-y)/32.5*rect.height});
await fs.mkdir('artifacts/world-d1',{recursive:true});
try{
 await page.goto(url,{waitUntil:'networkidle',timeout:30000});
 await wait('Number(document.querySelector("#world")?.dataset.tick)>12');
 const initial=await read();
 assert(initial.gateX<8.2&&initial.actorX===0,'bad D1 physical start');
 await page.screenshot({path:'artifacts/world-d1/01-initial.png',fullPage:true});
 await wait('Number(document.querySelector("#world")?.dataset.gateX)>11.1');
 const open1=await read();
 await wait('Number(document.querySelector("#world")?.dataset.gateX)<8.8');
 const shut=await read();
 await wait('Number(document.querySelector("#world")?.dataset.gateX)>11.1');
 const open2=await read();
 assert(open1.tick<shut.tick&&shut.tick<open2.tick,'repeated rail/gate pressure not witnessed');
 assert(Math.abs(open2.actorX)<.001,'actor moved without demand');
 await page.screenshot({path:'artifacts/world-d1/02-independent-second-opening.png',fullPage:true});
 await page.locator('#rail').selectOption('off');
 await wait('Number(document.querySelector("#world")?.dataset.tick)>12');
 const staticW=await read();
 assert(staticW.gateX<8.2,'no-rail World opens the gate');
 await page.locator('#pause').click();
 await page.locator('#world').scrollIntoViewIfNeeded();
 let rect=await page.locator('#world').boundingBox();assert(rect,'no canvas rect');
 let a=coord(rect,staticW.materialX,staticW.materialY),b=coord(rect,12.7,11.5);
 await page.mouse.move(a.x,a.y);await page.mouse.down();
 await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();
 const massOn=await read();
 assert(Math.hypot(massOn.materialX-12.7,massOn.materialY-11.5)<.3,
    'real material drag onto plate failed: '+JSON.stringify(massOn));
 await page.locator('#pause').click();
 await wait('Number(document.querySelector("#world")?.dataset.gateX)>11.1');
 const held=await read();
 assert(held.loaded,'mass pressure did not load plate');
 await page.screenshot({path:'artifacts/world-d1/03-material-holds.png',fullPage:true});
 const jpeg=await page.screenshot({type:'jpeg',quality:44,fullPage:false});
 console.log('RB_WORLD_D1_SCREEN_JPEG '+jpeg.toString('base64'));
 await fs.writeFile('artifacts/world-d1/03-material-holds.jpg',jpeg);
 await page.locator('#pause').click();
 await page.locator('#world').scrollIntoViewIfNeeded();
 rect=await page.locator('#world').boundingBox();assert(rect,'no canvas after pause');
 a=coord(rect,massOn.materialX,massOn.materialY);b=coord(rect,18,13);
 await page.mouse.move(a.x,a.y);await page.mouse.down();
 await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();
 await page.locator('#pause').click();
 await wait('Number(document.querySelector("#world")?.dataset.gateX)<8.8');
 const released=await read();
 assert(!released.loaded,'gate stayed pressure-loaded after material left');
 await page.screenshot({path:'artifacts/world-d1/04-unloaded-closed.png',fullPage:true});
 for(const [width,height] of [[900,900],[390,844],[320,720]]){
   await page.setViewportSize({width,height});
   const w=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert(w.document<=w.viewport+2,'horizontal overflow '+JSON.stringify(w));
   await page.screenshot({path:'artifacts/world-d1/viewport-'+width+'.png',fullPage:true});
 }
 assert(errors.length===0,'Chrome errors '+JSON.stringify(errors));
 const result={verdict:'WORLD_D1_BROWSER_ENGINEERING_PASS',railOpenTicks:[open1.tick,open2.tick],
   intermediateClosedTick:shut.tick,heldGateX:held.gateX,releasedGateX:released.gateX,
   manuallyLoaded:true,manuallyRemoved:true,actorAutonomy:false,
   responsiveWidths:[900,390,320],errors};
 await fs.writeFile('artifacts/world-d1/result.json',JSON.stringify(result,null,2)+'\n');
 console.log('RB_WORLD_D1_BROWSER_RESULT '+JSON.stringify(result));
}finally{await browser.close();}
