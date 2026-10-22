import {chromium} from 'playwright-core';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
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
 const initialPreview=await desktop.screenshot({type:'jpeg',quality:28,fullPage:false});
 console.log('RB_R8_OWNER_FIRST_DESKTOP_JPEG '+initialPreview.toString('base64'));
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
 await desktop.locator('#rotateR').click();
 state=await audit(desktop);
 expect(state.parts[0].handle===id&&Math.abs(state.parts[0].angle-Math.PI/12)<.001,
   'rotate changed collider identity or failed true Rapier rotation');
 await desktop.locator('#rotateL').click();
 expect(Math.abs((await audit(desktop)).parts[0].angle)<.001,'inverse rotation failed');
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
 await desktop.locator('#undo').click();
 const undone=await audit(desktop);
 expect(undone.parts.length===2&&undone.parts.some(x=>x.handle===id),
   'Undo failed to restore the same physical deleted body');
 await desktop.mouse.click(ox,oy);
 expect((await audit(desktop)).selected===id,'Undo reselect failed');
 await desktop.locator('#delete').click();

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

// Undo is TIME TRAVEL, not just a cosmetic editor operation. It must
// visibly PAUSE the full World on its older real solver tick.
 await desktop.locator('#pause').click();
 const undoBase=await audit(desktop);
 await desktop.locator('#toolFree').click();
 await desktop.mouse.click(placeX,placeY);
 let authored=await audit(desktop);
 expect(authored.parts.length>=2,'failed to place item for undo');
 await desktop.locator('#undo').click();
 const timeTravelResult=await audit(desktop);
 expect(timeTravelResult.paused&&timeTravelResult.tick===undoBase.tick,
  'undo did not pause the entire restored physical timeline');
 expect(timeTravelResult.parts.length===undoBase.parts.length,
  'undo failed to restore material identity at old tick');

 
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
 // One complete external, safely restorable WORLD across browser contexts.
 // No save-control click is sufficient: inspect downloaded bytes in Node and
 // load into a separate fresh page, after mutating the original world.
 const expectedExport=await audit(desktop);
 const downloadPromise=desktop.waitForEvent('download',{timeout:15000});
 await desktop.locator('#export').click();
 const downloaded=await downloadPromise;
 const filePath=dir+'/owner-material-world.json';
 await downloaded.saveAs(filePath);
 const bytes=await readFile(filePath,'utf8'),parsed=JSON.parse(bytes);
 expect(parsed.format==='reflexbrain-r8-workbench'&&parsed.world.physics.length>100,
  'download missing actual Rapier bytes or identity');
 const importPage=await browser.newPage({viewport:{width:1000,height:790}});
 attach(importPage);
 await importPage.goto('http://127.0.0.1:4187/probes/material-workbench-r8.html',{waitUntil:'networkidle'});
 await importPage.waitForFunction(()=>window.__r8Audit?.().tick>8);
 await importPage.locator('#importFile').setInputFiles(filePath);
 await importPage.waitForFunction(t=>window.__r8Audit()?.tick===t&&window.__r8Audit()?.paused,
   expectedExport.tick,{timeout:15000});
 const imported=await audit(importPage);
 expect(JSON.stringify(imported.parts)===JSON.stringify(expectedExport.parts),
  'external import changed material physics and identity');
 expect(imported.privateFrameTick===expectedExport.privateFrameTick,
  'external import invented different private sensory time');
 // A forged or broken file is REJECTED while the recovered real World survives.
 const corruptPath=dir+'/corrupt-r8.json';
 await writeFile(corruptPath,bytes.replace('"ownerAuthored":true','"ownerAuthored":false'));
 await importPage.locator('#importFile').setInputFiles(corruptPath);
 await importPage.waitForFunction(()=>document.querySelector('#events')?.textContent?.includes('Nie wczytano'));
 const afterBad=await audit(importPage);
 expect(JSON.stringify(afterBad.parts)===JSON.stringify(imported.parts)&&afterBad.tick===imported.tick,
  'malformed Owner file destroyed an existing real world');
 await importPage.screenshot({path:dir+'/05-imported-on-fresh-browser-page.png',fullPage:true});
 await importPage.close();

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
 // Two-finger pinch on an editor tool must zoom CAMERA, never create parts.
 const zoomBefore=await audit(mobile);
 const pinch=await mobile.context().newCDPSession(mobile);
 const tips=(delta)=>[
  {id:1,x:r.x+r.width*.5-delta,y:r.y+r.height*.36,radiusX:6,radiusY:6,force:1},
  {id:2,x:r.x+r.width*.5+delta,y:r.y+r.height*.36,radiusX:6,radiusY:6,force:1}
 ];
 await pinch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:tips(20)});
 for(let d=25;d<=65;d+=8)
  await pinch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:tips(d)});
 await pinch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const zoomAfter=await audit(mobile);
 expect(zoomAfter.parts.length===0,'pinch accidentally created material while editor tool was active');
 expect(zoomAfter.zoom>zoomBefore.zoom*1.3,
  'true two-finger zoom failed: '+JSON.stringify({before:zoomBefore.zoom,after:zoomAfter.zoom}));
 // The pinch has correctly shifted the camera. Return to a new EMPTY stage
 // before asserting that screen centre is the physical actor; otherwise the
 // test assumes a false post-pinch camera origin.
 await mobile.locator('#reset').tap();
 await mobile.locator('#field').scrollIntoViewIfNeeded();
 const freshRect=await mobile.locator('#field').boundingBox();
 expect(freshRect,'mobile field lost bounds after zoom/reset scrolling');
 const neutral=await audit(mobile);
 expect(neutral.parts.length===0&&Math.abs(neutral.zoom-1)<.001,
  'new empty stage did not reset multi-touch camera');
 // Never silently spawn an authored solid intersecting the actual resident.
 await mobile.touchscreen.tap(freshRect.x+freshRect.width*.50,
   freshRect.y+freshRect.height*.50);
 expect((await audit(mobile)).parts.length===0,'unsafe overlapping part created on the actor');
 await mobile.touchscreen.tap(freshRect.x+freshRect.width*.80,
   freshRect.y+freshRect.height*.52);
 const touch=await audit(mobile);
 expect(touch.parts.length===1&&touch.parts[0].mode==='anchored','mobile tap did not create anchored material');
 // Not only "tap works": touch drag should move the EXACT physical collider.
 await mobile.locator('#toolSelect').tap();
 const viewport=await mobile.locator('#field').boundingBox();expect(viewport,'no drag viewport');
 const firstTouch=await audit(mobile);
 const scaleMobile=Math.min(47,Math.max(28,viewport.width/22))*firstTouch.zoom;
 const firstPart=firstTouch.parts[0];
 const sx=viewport.x+viewport.width/2+(firstPart.x-firstTouch.cam.x)*scaleMobile;
 const sy=viewport.y+viewport.height/2-(firstPart.y-firstTouch.cam.y)*scaleMobile;
 const cdp=await mobile.context().newCDPSession(mobile);
 const point=(x,y)=>[{x,y,id:1,radiusX:6,radiusY:6,force:1}];
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:point(sx,sy)});
 for(let i=1;i<=8;i++)
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:point(sx+45*i/8,sy-12*i/8)});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const dragged=await audit(mobile);
 expect(dragged.parts[0].handle===firstPart.handle&&dragged.parts[0].x>firstPart.x+.8,
   'mobile DRAG did not move persistent part: '+JSON.stringify({before:firstPart,after:dragged.parts[0]}));
 // Driving with the overlay must visibly act on the same body, without
 // scrolling page or touching the world editor.
 // Start from a known PAUSED state. The actual on-screen control
 // should resume simulation, acquire manual authority, and move real Rapier.
 if(!(await audit(mobile)).paused)await mobile.locator('#pause').tap();
 const actorBefore=await audit(mobile);
 expect(actorBefore.paused,'touch-drive precondition: world should be paused');
 const mobileUp=mobile.locator('.touch-drive [data-hold="w"]');
 await mobileUp.scrollIntoViewIfNeeded();
 const br=await mobileUp.boundingBox();expect(br,'on-world touch control absent');
 const cd=await mobile.context().newCDPSession(mobile);
 await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:point(br.x+br.width/2,br.y+br.height/2)});
 await mobile.waitForTimeout(510);
 await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const actorAfter=await audit(mobile);
 await mobile.locator('#pause').tap();
 expect(actorAfter.manual&&!actorAfter.paused&&
  actorAfter.tick>actorBefore.tick+12&&actorAfter.actor.x>actorBefore.actor.x+.05,
  'in-world touchscreen vehicle control did not move the physical body: '+JSON.stringify({before:actorBefore,after:actorAfter,button:br}));
 const mobilePreview=await mobile.screenshot({type:'jpeg',quality:27,fullPage:false});
 console.log('RB_R8_MOBILE_PREVIEW_JPEG '+mobilePreview.toString('base64'));
 await mobile.screenshot({path:dir+'/03-mobile-touched-material.png',fullPage:true});
 expect(errors.length===0,'unexpected real Chrome exceptions: '+JSON.stringify(errors));
 const result={verdict:'R8 ENGINEERING CHROME PASS; NO ORGANISM CLAIM',
  originalTick:frozen.tick,restoredTick:state.tick,
  retainedHandle:id,restoredPhysicalBodyType:true,addedSurvivorAfterRemove:true,
  manualActorMoved:true,actualMaterialPush,externalFileRoundtrip:true,rejectsCorruptImport:true,mobileAnchorPartCreated:true,mobileDragMoved:true,mobileOverlayDrive:true,mobilePinchNoGhostParts:true,mobileWidths:[390,320],
  privateFrameFields:frozen.privateKeys,errors};
 await writeFile(dir+'/result.json',JSON.stringify(result,null,2)+'\n');
 console.log('RB_R8_BROWSER '+JSON.stringify(result));
}finally{await browser.close();}
