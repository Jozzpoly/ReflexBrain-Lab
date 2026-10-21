import fs from 'node:fs/promises';
import {chromium} from 'playwright-core';
const URL=process.env.RB_ODEV_URL??'http://127.0.0.1:4179/probes/dev-resident-v0.html';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1420,height:950},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const check=(c,m)=>{if(!c)throw Error(m);};
const out='artifacts/odev-v0';
const read=()=>page.locator('#world').evaluate(e=>({
 tick:Number(e.dataset.tick),x:Number(e.dataset.actorX),y:Number(e.dataset.actorY),
 targetX:Number(e.dataset.targetX),targetY:Number(e.dataset.targetY),
 camX:Number(e.dataset.camX),camY:Number(e.dataset.camY),
 manual:e.dataset.authority==='manual',
 retina:e.dataset.retinaStatus,learned:Number(e.dataset.learned)
}));
await fs.mkdir(out,{recursive:true});
try{
 await page.goto(URL,{waitUntil:'networkidle',timeout:30000});
 await page.waitForFunction(()=>Number(document.querySelector('#world')?.dataset.tick)>30,
  null,{timeout:20000});
 await page.screenshot({path:out+'/01-single-resident.png',fullPage:true});
 await page.locator('#pause').click();
 const begin=await read();
 check(begin.tick>0&&Number.isFinite(begin.targetX),'real body/matter not rendered');
 await page.locator('#save').click();
 const rect=await page.locator('#world').boundingBox();check(rect,'no real canvas');
 const sx=rect.x+(.5+(begin.targetX-begin.camX)/30)*rect.width;
 const sy=rect.y+(.5-(begin.targetY-begin.camY)/20)*rect.height;
 await page.mouse.move(sx,sy);await page.mouse.down();
 await page.mouse.move(sx+rect.width/30*1.5,sy-rect.height/20*.5,{steps:8});await page.mouse.up();
 const dragged=await read();
 const draggedD=Math.hypot(dragged.targetX-begin.targetX,dragged.targetY-begin.targetY);
 check(draggedD>.5,'drag did not change actual Rapier body');
 check(dragged.tick===begin.tick,'paused World advanced physics while drag');
 check(dragged.retina==='pre-intervention','actor's old retina improperly presented as current World');
 await page.screenshot({path:out+'/02-host-intervention-while-paused.png',fullPage:true});
 await page.locator('#restore').click();
 const restored=await read();
 check(restored.tick===begin.tick&&Math.hypot(restored.targetX-begin.targetX,restored.targetY-begin.targetY)<.001,'body/matter checkpoint failed');
 check(restored.retina==='delivered','actor retinal history not restored');
 await page.locator('#takeover').click();
 check((await read()).manual,'manual authority unavailable');
 await page.locator('#drive').evaluate(e=>{e.value='80';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#pause').click();
 const beforeMotor=await read();
 await page.waitForTimeout(700);
 const afterMotor=await read();
 check(afterMotor.x>beforeMotor.x+.05,'manual self motor did not move real actor');
 await page.locator('#drive').evaluate(e=>{e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#takeover').click();
 check(!(await read()).manual,'autonomy not restored');
 await page.screenshot({path:out+'/03-owner-takeover-release.png',fullPage:true});
 await page.locator('#pause').click();
 for(const [width,height] of [[900,850],[390,844],[320,700]]){
  await page.setViewportSize({width,height});
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth}));
  check(dims.scroll<=dims.width+2,'mobile horizontal overflow '+width);
  await page.screenshot({path:out+'/width-'+width+'.png',fullPage:true});
 }
 // Real touch input in an explicitly emulated mobile Chrome context.
 const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 let touchDistance=0;
 try{
  const mobile=await mobileContext.newPage();mobile.on('pageerror',e=>errors.push(String(e)));
  await mobile.goto(URL,{waitUntil:'networkidle',timeout:30000});
  await mobile.waitForFunction(()=>Number(document.querySelector('#world')?.dataset.tick)>20,
   null,{timeout:20000});
  await mobile.locator('#pause').click();await mobile.locator('#world').scrollIntoViewIfNeeded();
  const inf=await mobile.locator('#world').evaluate(e=>({tick:Number(e.dataset.tick),
   targetX:Number(e.dataset.targetX),targetY:Number(e.dataset.targetY),
   camX:Number(e.dataset.camX),camY:Number(e.dataset.camY)}));
  const b=await mobile.locator('#world').boundingBox();check(b,'mobile canvas absent');
  // Mobile World span: 18 x 12 units.
  const mx=b.x+(.5+(inf.targetX-inf.camX)/18)*b.width;
  const my=b.y+(.5-(inf.targetY-inf.camY)/12)*b.height;
  const session=await mobile.context().newCDPSession(mobile);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:mx,y:my}]});
  for(let k=1;k<=8;k++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',
   touchPoints:[{id:1,x:mx+k*b.width/18*1.0/8,y:my-k*b.height/12*.6/8}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const end=await mobile.locator('#world').evaluate(e=>({
   tick:Number(e.dataset.tick),targetX:Number(e.dataset.targetX),targetY:Number(e.dataset.targetY),
   retina:e.dataset.retinaStatus
  }));
  touchDistance=Math.hypot(end.targetX-inf.targetX,end.targetY-inf.targetY);
  check(touchDistance>.3&&end.tick===inf.tick&&end.retina==='pre-intervention',
   'mobile actual touch did not preserve physical/sensory boundary');
  await mobile.screenshot({path:out+'/04-real-touch.png',fullPage:true});
 }finally{await mobileContext.close();}
 check(errors.length===0,'browser errors '+JSON.stringify(errors));
 const result={scope:'engineering UI only; no cognition product PASS',
  initial:begin,dragged,restored,manualDisplacement:afterMotor.x-beforeMotor.x,
  changedMaterialDistance:draggedD,touchDistance,errors};
 console.log('RB_ODEV_V0_CHROME '+JSON.stringify(result));
 await fs.writeFile(out+'/result.json',JSON.stringify(result,null,2)+'\n');
}finally{await browser.close();}
