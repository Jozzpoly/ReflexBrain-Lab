import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const dest=resolve('artifacts/life-l2-r3');
await mkdir(dest,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],metrics={};
const url='http://127.0.0.1:4187/probes/life-l2-situated.html';
const read=page=>page.locator('#world').evaluate(e=>({
 tick:Number(e.dataset.tick),actorX:Number(e.dataset.actorX),
 actorY:Number(e.dataset.actorY),objectX:Number(e.dataset.objectX),
 objectY:Number(e.dataset.objectY),centerX:Number(e.dataset.centerX),
 centerY:Number(e.dataset.centerY),authority:e.dataset.authority,
 mode:e.dataset.mode,manualFrames:Number(e.dataset.manualFrames),
 habit:Number(e.dataset.habit),interventionSeen:e.dataset.interventionSeen
}));
try{
 const page=await browser.newPage({viewport:{width:1100,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>Number(document.querySelector('#world')?.dataset.tick)>20);
 await page.locator('#pause').click();
 const start=await read(page);
 if(start.tick<=20||!Number.isFinite(start.objectX))throw Error('Missing real body/object in R3 Chrome');
 const stable=await read(page);
 await page.waitForTimeout(130);
 if((await read(page)).tick!==stable.tick)throw Error('Pause did not freeze real World');
 await page.locator('#snapshot').click();
 const box=await page.locator('#world').boundingBox();
 if(!box)throw Error('No physical canvas');
 const span=37,vSpan=span*600/900;
 const x=box.x+(.5+(start.objectX-start.centerX)/span)*box.width;
 const y=box.y+(.5-(start.objectY-start.centerY)/vSpan)*box.height;
 if(x<box.x||x>box.x+box.width||y<box.y||y>box.y+box.height)
  throw Error('Cannot honestly drag object outside camera');
 await page.mouse.move(x,y);
 await page.mouse.down();
 await page.mouse.move(x+box.width/span*1.3,y-box.height/vSpan*.5,{steps:8});
 await page.mouse.up();
 await page.waitForFunction(before=>Math.abs(Number(document.querySelector('#world')?.dataset.objectX)-before)>.6,start.objectX);
 const altered=await read(page);
 if(altered.tick!==start.tick||altered.interventionSeen!=='no')
  throw Error('Host drag did not preserve actor-private pre-intervention evidence');
 await page.screenshot({path:join(dest,'01-paused-material-intervention.png'),fullPage:true});
 await page.locator('#restore').click();
 const restored=await read(page);
 if(restored.tick!==start.tick||Math.abs(restored.objectX-start.objectX)>.001)
  throw Error('Checkpoint did not restore material and time');
 await page.locator('#pause').click();
 await page.waitForFunction(t=>Number(document.querySelector('#world')?.dataset.tick)>t+15,start.tick);
 const continued=await read(page);
 if(continued.interventionSeen!=='yes')throw Error('Private sensor freshness not restored');
 await page.locator('#pause').click();
 await page.locator('#takeover').click();
 if((await read(page)).authority!=='manual')throw Error('Manual authority unavailable');
 const manualStart=await read(page);
 await page.locator('#drive').evaluate(e=>{e.value='75';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#pause').click();
 await page.waitForFunction(n=>Number(document.querySelector('#world')?.dataset.manualFrames)>n+2,manualStart.manualFrames);
 await page.locator('#pause').click();
 const manualEnd=await read(page);
 if(manualEnd.manualFrames<=manualStart.manualFrames)
  throw Error('Manual provenance was not recorded');
 await page.locator('#takeover').click();
 if((await read(page)).authority!=='auto')throw Error('Manual body was not returned');
 await page.screenshot({path:join(dest,'02-same-body-after-takeover.png'),fullPage:true});
 metrics.desktop={start,altered,restored,continued,manualEnd};

 await page.locator('#mode').selectOption('frozen');
 await page.locator('#restart').click();
 await page.waitForFunction(()=>Number(document.querySelector('#world')?.dataset.tick)>12);
 const frozen=await read(page);
 if(frozen.mode!=='frozen'||frozen.habit!==0)throw Error('Frozen independent specimen not launched');
 metrics.frozen=frozen;

 const phone=await browser.newPage({viewport:{width:390,height:840},
  deviceScaleFactor:1,isMobile:true,hasTouch:true});
 phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(url,{waitUntil:'networkidle'});
 await phone.waitForFunction(()=>Number(document.querySelector('#world')?.dataset.tick)>20);
 await phone.locator('#pause').tap();
 const mobilePaused=await read(phone);
 await phone.waitForTimeout(130);
 if((await read(phone)).tick!==mobilePaused.tick)throw Error('Mobile pause failed');
 await phone.locator('#takeover').tap();
 if((await read(phone)).authority!=='manual')throw Error('Mobile manual toggle failed');
 await phone.screenshot({path:join(dest,'03-phone-real-world.png'),fullPage:true});
 metrics.mobile=await read(phone);
 await phone.close();
 if(errors.length)throw Error('Uncaught browser errors: '+errors.join(' | '));
 metrics.status='PASS_BROWSER_ONLY_NOT_OWNER_PASS';
 console.log('RB_L2_R3_BROWSER '+JSON.stringify(metrics));
}finally{
 await writeFile(join(dest,'browser-result.json'),JSON.stringify({errors,metrics},null,2));
 await browser.close();
}
