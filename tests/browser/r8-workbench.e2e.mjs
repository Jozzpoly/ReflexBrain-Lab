import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='artifacts/r8-workbench';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
function attach(page){
 page.on('pageerror',x=>errors.push(x.message));
 page.on('console',x=>{if(x.type()==='error')errors.push('console: '+x.text())});
}
const audit=(p)=>p.evaluate(()=>window.__r8Audit());
const expect=(v,msg)=>{if(!v)throw Error('R8 browser QA: '+msg)};
try{
 const desktop=await browser.newPage({viewport:{width:1280,height:900}});
 attach(desktop);
 await desktop.goto('http://127.0.0.1:4187/probes/material-workbench-r8.html',{waitUntil:'networkidle'});
 await desktop.waitForFunction(()=>window.__r8Audit?.().tick>6,null,{timeout:25000});
 await desktop.locator('#pause').click();
 const initialScene=await audit(desktop);
 expect(initialScene.parts.length>=6,'Owner first contact starts empty');
 await desktop.locator('#scene').selectOption('open');await desktop.locator('#reset').click();
 const frozen=await audit(desktop);
 expect(frozen.parts.length===0,'empty mode must be actually empty');
 expect(frozen.paused,'pause did not stop');
 const c=desktop.locator('#field'),rect=await c.boundingBox();expect(rect,'no field canvas');
 const placeX=rect.x+rect.width*.73,placeY=rect.y+rect.height*.47;
 await desktop.locator('#toolFree').click();
 await desktop.locator('#shape').selectOption('beam');
 await desktop.mouse.click(placeX,placeY);
 let state=await audit(desktop);
 expect(state.parts.length===1&&state.parts[0].mode==='dynamic','part did not spawn via real pointer');
 const initial=state.parts[0],id=initial.handle;
 await desktop.locator('#zoomIn').click();await desktop.locator('#zoomOut').click();
 expect(Math.abs((await audit(desktop)).zoom-1)<.001,'camera zoom roundtrip drift');
 expect(state.privateKeys.join(',')==='tick,retina,touch,proprio'&&state.retinaLength===288,
  'private host World IDs or material mode escaped perception');
 const priorFrame=(await audit(desktop)).privateFrameTick;
 const priorRetina=(await audit(desktop)).retinaDigest;
 await desktop.locator('#toggle').click();
 state=await audit(desktop);
 expect(state.privateFrameTick===priorFrame&&state.retinaDigest===priorRetina,
  'paused OWNER mode change forged an actor sensory timestamp');
 expect(state.parts[0].handle===id&&state.parts[0].mode==='anchored','collider identity changed on anchor');
 await desktop.locator('#save').click();
 expect((await audit(desktop)).hasCheckpoint,'save missing');
 await desktop.locator('#toolSelect').click();
 const middle=await c.boundingBox();expect(middle,'canvas missing');
 // Camera still at (0,0), scale is min(47,max(28,w/22)).
 const scale=Math.min(47,Math.max(28,middle.width/22));
 const ox=middle.x+middle.width/2+initial.x*scale,oy=middle.y+middle.height/2-initial.y*scale;
 await desktop.mouse.move(ox,oy);await desktop.mouse.down();
 await desktop.mouse.move(ox+scale*1.7,oy-scale*.3,{steps:7});await desktop.mouse.up();
 state=await audit(desktop);
 expect(state.parts[0].x>initial.x+1.1,'Owner drag failed to affect actual material');
 expect(state.privateFrameTick===priorFrame&&state.retinaDigest===priorRetina,
  'paused OWNER drag leaked the new material into resident eye before clock advanced');
 await desktop.locator('#toggle').click();
 expect((await audit(desktop)).parts[0].mode==='dynamic','release failed');
 await desktop.locator('#restore').click();
 state=await audit(desktop);
 expect(state.parts.length===1&&state.parts[0].handle===id,'restore lost part identity');
 expect(state.parts[0].mode==='anchored','restore lost fixed body mode');
 expect(Math.abs(state.parts[0].x-initial.x)<1e-3,'restore lost actual physics pose');
 expect(state.tick===frozen.tick,'restore advanced timeline without physics');
 await desktop.screenshot({path:dir+'/01-restored-real-material.png',fullPage:true});
 // Add an independently shaped second part, then remove only first.
 await desktop.locator('#toolFree').click();
 await desktop.locator('#shape').selectOption('post');
 await desktop.mouse.click(rect.x+rect.width*.34,rect.y+rect.height*.60);
 state=await audit(desktop);expect(state.parts.length===2,'second part not independently created');
 await desktop.locator('#toolSelect').click();
 // Original beam is still at its original physical coordinate.
 await desktop.mouse.click(ox,oy);
 expect((await audit(desktop)).selected===id,'selection of original part failed');
 await desktop.locator('#delete').click();
 state=await audit(desktop);
 expect(state.parts.length===1&&state.parts[0].handle!==id,'part removal corrupted survivors');
 // Manual body still exercises physical Rapier world at 120 Hz.
 await desktop.locator('#manual').click();await desktop.locator('#pause').click();
 await desktop.locator('#field').focus();
 const t=state.tick;
 await desktop.keyboard.down('w');await desktop.waitForTimeout(420);
 await desktop.keyboard.up('w');
 await desktop.waitForFunction((before)=>window.__r8Audit().tick>=before+20,t,{timeout:12000});
 const resumed=await audit(desktop);
 expect(resumed.actor.x!==state.actor.x,'manual body never moved physically');
 await desktop.screenshot({path:dir+'/02-human-taking-over.png',fullPage:true});
 
// Verify that the actual hand-driven actor can CHANGE a material piece,
// not just move itself inside a colorful rendering.
 await desktop.locator('#pause').click(); // freeze before constructing new situation
 await desktop.locator('#reset').click(); // intentional Owner reset; manual mode retained
 await desktop.locator('#toolFree').click();
 await desktop.locator('#shape').selectOption('block');
 const fieldBox=await desktop.locator('#field').boundingBox();expect(fieldBox,'no browser physical box');
 const factor=Math.min(47,Math.max(28,fieldBox.width/22));
 await desktop.mouse.click(fieldBox.x+fieldBox.width/2+factor*2.8,
   fieldBox.y+fieldBox.height/2);
 const beforePush=await audit(desktop);
 expect(beforePush.parts.length===1&&beforePush.parts[0].mode==='dynamic','real push fixture absent');
 await desktop.locator('#pause').click();
 await desktop.locator('#field').focus();
 await desktop.keyboard.down('w');
 await desktop.waitForTimeout(1600);
 await desktop.keyboard.up('w');
 await desktop.locator('#pause').click();
 const afterPush=await audit(desktop);
 const actualMaterialPush=afterPush.parts[0].x-beforePush.parts[0].x;
 expect(actualMaterialPush>.35,'Chrome body force never moved real matter: '+actualMaterialPush);
 expect(afterPush.tick>beforePush.tick+90,'Chrome fixture missed real solver time');
 await desktop.screenshot({path:dir+'/04-actor-actually-moved-material.png',fullPage:true});
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 attach(mobile);
 await mobile.goto('http://127.0.0.1:4187/probes/material-workbench-r8.html',{waitUntil:'networkidle'});
 await mobile.waitForFunction(()=>window.__r8Audit?.().tick>3,null,{timeout:25000});
 await mobile.locator('#pause').click();
 expect((await audit(mobile)).parts.length>=6,'mobile landing starts empty');
 await mobile.locator('#scene').selectOption('open');await mobile.locator('#reset').click();
 for(const width of [390,320]){
  await mobile.setViewportSize({width,height:800});
  const size=await mobile.evaluate(()=>({doc:document.documentElement.scrollWidth,vw:innerWidth}));
  expect(size.doc<=size.vw+2,'horizontal UI overflow at '+width+': '+JSON.stringify(size));
  await mobile.screenshot({path:dir+'/mobile-'+width+'.png',fullPage:true});
 }
 await mobile.locator('#toolAnchor').tap();
 await mobile.locator('#field').scrollIntoViewIfNeeded();
 const r=await mobile.locator('#field').boundingBox();expect(r,'no mobile touch canvas');
 await mobile.touchscreen.tap(r.x+r.width*.64,r.y+r.height*.52);
 const touch=await audit(mobile);
 expect(touch.parts.length===1&&touch.parts[0].mode==='anchored','mobile tap did not create anchored material');
 await mobile.screenshot({path:dir+'/03-mobile-touched-material.png',fullPage:true});
 expect(errors.length===0,'unexpected real Chrome exceptions: '+JSON.stringify(errors));
 const result={verdict:'R8 ENGINEERING CHROME PASS; NO ORGANISM CLAIM',
  originalTick:frozen.tick,restoredTick:state.tick,
  retainedHandle:id,restoredPhysicalBodyType:true,addedSurvivorAfterRemove:true,
  manualActorMoved:true,actualMaterialPush,mobileAnchorPartCreated:true,mobileWidths:[390,320],
  privateFrameFields:frozen.privateKeys,errors};
 await writeFile(dir+'/result.json',JSON.stringify(result,null,2)+'\n');
 console.log('RB_R8_BROWSER '+JSON.stringify(result));
}finally{await browser.close();}
