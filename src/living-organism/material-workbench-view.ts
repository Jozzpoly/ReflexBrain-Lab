import {initLivingWorld,LivingWorld,type Checkpoint,type Demand} from './world';
import {Occupant,type OccupantState} from './occupant';
import {E0_DT} from '../e0-body-seam';
import {encodeR8Save,decodeR8Save} from './r8-save';
await initLivingWorld();
type LabCheckpoint={world:Checkpoint;resident:OccupantState};
const $=<T extends HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const canvas=$<HTMLCanvasElement>('#field'),ctx=canvas.getContext('2d')!;
const retina=$<HTMLCanvasElement>('#retina'),rctx=retina.getContext('2d')!;
const status=$<HTMLElement>('#status'),events=$<HTMLElement>('#events');
let world=new LivingWorld(false),resident=new Occupant(),checkpoint:LabCheckpoint|null=null;
type SceneName='encounter'|'open';
let scene:SceneName='encounter';
const seed=(w:LivingWorld,preset:SceneName)=>{
 if(preset==='open')return;
 // Author-supplied material only. No organism-built construction.
 const items=[
 [3.1,.2,.52,.55,'dynamic'],[5.2,-.6,.60,.60,'dynamic'],
 [4.2,2.5,1.15,.22,'dynamic'],[7.1,1.9,.22,1.15,'anchored'],
 [-2.4,2.3,.6,.55,'dynamic'],[-4.4,-1.8,1.15,.22,'anchored'],
 [1.1,-3.4,.22,1.15,'anchored']
 ] as const;
 for(const [x,y,hx,hy,mode] of items)w.addMaterialPart(x,y,hx,hy,mode);
};
seed(world,scene);
let paused=false,manual=false,follow=true,tool:'select'|'free'|'anchor'='select';
let selected:number|null=null,dragging:number|null=null,pan:{x:number;y:number}|null=null;
let dragMoved=false;
const activePointers=new Map<number,{x:number;y:number}>();
let pendingTap:{id:number,x:number;y:number;worldX:number;worldY:number}|null=null;
let gestureWasMulti=false,pinchDistance=0;
let cam={x:0,y:0},last=0,acc=0,zoom=1;
const undo:LabCheckpoint[]=[];
const remember=()=>{undo.push({world:world.captureCheckpoint(),resident:resident.capture()});if(undo.length>20)undo.shift();};
const zoomBy=(factor:number)=>{zoom=Math.max(.45,Math.min(3.5,zoom*factor));};
const cameraReset=()=>{const a=world.inspect().actor;cam={x:a.x,y:a.y};};
const keys=new Set<string>();
const shapes={beam:{hx:1.15,hy:.22},post:{hx:.22,hy:1.15},block:{hx:.6,hy:.6}} as const;
const safe=(n:number)=>Number.isFinite(n)?n.toFixed(2):'—';
const info=(msg:string)=>{const e=document.createElement('div');e.textContent='t'+world.inspect().tick+': '+msg;events.prepend(e);while(events.children.length>22)events.lastElementChild?.remove();};
info('R8: otwarty świat bez klatki. Wszystkie modyfikacje części są OWNER.');
function choosePart(handle:number|null){
 selected=handle;
 const obj=world.inspect().objects.find(x=>x.handle===handle&&x.kind==='part');
 $('#chosen').textContent=obj?'#'+handle+' · '+obj.mode:'—';
 $<HTMLButtonElement>('#toggle').disabled=!obj;
 $<HTMLButtonElement>('#delete').disabled=!obj;
}
function chooseTool(t:typeof tool){
 tool=t;
 for(const name of ['Select','Free','Anchor'] as const)
  $<HTMLButtonElement>('#tool'+name).setAttribute('aria-pressed',String(t===name.toLowerCase()||(name==='Select'&&t==='select')||(name==='Anchor'&&t==='anchor')));
}
chooseTool('select');
$('#toolSelect').addEventListener('click',()=>chooseTool('select'));
$('#toolFree').addEventListener('click',()=>chooseTool('free'));
$('#toolAnchor').addEventListener('click',()=>chooseTool('anchor'));
function changeMode(){
 const o=world.inspect().objects.find(x=>x.handle===selected&&x.kind==='part');
 if(!o)return;
 const newMode=o.mode==='anchored'?'dynamic':'anchored';
 remember();world.setMaterialPartMode(o.handle,newMode);
 choosePart(o.handle);info('OWNER: #'+o.handle+' → '+(newMode==='anchored'?'kotwica':'swobodny'));
}
$('#toggle').addEventListener('click',changeMode);
$('#delete').addEventListener('click',()=>{
 if(selected===null)return;
 const n=selected;remember();world.removeMaterialPart(n);choosePart(null);info('OWNER: usunięto #'+n);
});
$('#pause').addEventListener('click',()=>{
 paused=!paused;last=0;acc=0;keys.clear();$('#pause').textContent=paused?'Wznów':'Pauza';
});
$('#manual').addEventListener('click',()=>{
 manual=!manual;keys.clear();$('#manual').setAttribute('aria-pressed',String(manual));
 $('#manual').textContent=manual?'Oddaj sterowanie':'Przejmij ciało';info(manual?'OWNER przejął ciało':'OWNER oddał ciało autorskiemu odruchowi');
});
$('#undo').addEventListener('click',()=>{
 const before=undo.pop();if(!before)return;
 world.restoreCheckpoint(before.world);resident.restore(before.resident);
 paused=true;$('#pause').textContent='Wznów';
 choosePart(null);keys.clear();acc=0;last=0;
 info('OWNER: przywrócono stan SPRZED edycji — cofnięty również czas, świat zatrzymany');
});
$('#zoomIn').addEventListener('click',()=>zoomBy(1.28));
$('#zoomOut').addEventListener('click',()=>zoomBy(1/1.28));
$('#center').addEventListener('click',()=>{
 cameraReset();follow=true;$('#follow').setAttribute('aria-pressed','true');
});
$('#follow').addEventListener('click',()=>{
 follow=!follow;$('#follow').setAttribute('aria-pressed',String(follow));
});
$('#save').addEventListener('click',()=>{
 checkpoint={world:world.captureCheckpoint(),resident:resident.capture()};
 $<HTMLButtonElement>('#restore').disabled=false;info('OWNER: zapisał stan fizyczny + odruch');
});
$('#export').addEventListener('click',()=>{
 try{
  const content=encodeR8Save({world:world.captureCheckpoint(),resident:resident.capture(),scene});
  const blob=new Blob([content],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;
  link.download='ReflexBrain-R8-'+world.inspect().tick+'.json';
  document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),5000);
  info('OWNER: wyeksportował plik całego świata do zachowania i podzielenia się');
 }catch(e){info('Nie zapisano pliku: '+String(e));}
});
$('#import').addEventListener('click',()=>$<HTMLInputElement>('#importFile').click());
$<HTMLInputElement>('#importFile').addEventListener('change',async()=>{
 const input=$<HTMLInputElement>('#importFile'),file=input.files?.[0];input.value='';
 if(!file)return;
 if(file.size>8000000){info('Nie wczytano: plik zbyt duży');return;}
 let staged:LivingWorld|null=null;
 try{
  const cp=decodeR8Save(await file.text());
  staged=new LivingWorld(false);
  staged.restoreCheckpoint(cp.world); // verify Rapier actually can recover material
  const newResident=new Occupant();
  newResident.restore(cp.resident);
  const old=world;world=staged;staged=null;resident=newResident;old.free();
  scene=cp.scene;$<HTMLSelectElement>('#scene').value=scene;
  checkpoint=null;undo.length=0;dragging=null;pan=null;choosePart(null);keys.clear();
  $<HTMLButtonElement>('#restore').disabled=true;
  paused=true;manual=false;$('#pause').textContent='Wznów';
  $<HTMLButtonElement>('#manual').setAttribute('aria-pressed','false');
  $('#manual').textContent='Przejmij ciało';
  follow=false;$<HTMLButtonElement>('#follow').setAttribute('aria-pressed','false');
  zoom=1;cameraReset();last=0;acc=0;events.textContent='';
  info('OWNER: wczytał prawdziwy plik R8 — fizyka, części i historia sterownika; pauza');
 }catch(e){if(staged)staged.free();info('Nie wczytano pliku: '+String(e));}
});
$('#restore').addEventListener('click',()=>{
 if(!checkpoint)return;world.restoreCheckpoint(checkpoint.world);undo.length=0;
 resident.restore(checkpoint.resident);choosePart(null);keys.clear();acc=0;last=0;
 paused=true;$('#pause').textContent='Wznów';
 info('OWNER: odtworzył ten sam świat i odruch — fizyka zatrzymana do decyzji');
});
$('#reset').addEventListener('click',()=>{
 world.free();world=new LivingWorld(false);resident=new Occupant();checkpoint=null;undo.length=0;choosePart(null);
 scene=$<HTMLSelectElement>('#scene').value as SceneName;
 seed(world,scene);
 $<HTMLButtonElement>('#restore').disabled=true;keys.clear();cam={x:0,y:0};zoom=1;last=0;acc=0;
 info('OWNER: nowy świat (świadomy reset)');
});
function dims(){
 const r=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 const w=Math.max(300,r.width),h=Math.max(195,r.height);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 }
 ctx.setTransform(dpr,0,0,dpr,0,0);
 return{w,h,scale:Math.min(47,Math.max(28,w/22))*zoom};
}
function screenToWorld(e:PointerEvent,d:ReturnType<typeof dims>){
 const r=canvas.getBoundingClientRect();
 return{x:cam.x+(e.clientX-r.left-d.w/2)/d.scale,
        y:cam.y-(e.clientY-r.top-d.h/2)/d.scale};
}
function closest(p:{x:number;y:number}){
 return [...world.inspect().objects].reverse().find(o=>o.kind==='part'&&
   Math.abs(p.x-o.x)<o.hx+.08&&Math.abs(p.y-o.y)<o.hy+.08);
}
function addOwnerPart(x:number,y:number){
 const shape=shapes[$<HTMLSelectElement>('#shape').value as keyof typeof shapes]||shapes.beam;
 try{
  // Intentional OWNER-authored creation; disallow accidental intersection
  // with the same physical actor, not a hidden actor-centric score.
  const actor=world.inspect().actor;
  const dx=Math.max(0,Math.abs(x-actor.x)-shape.hx);
  const dy=Math.max(0,Math.abs(y-actor.y)-shape.hy);
  if(Math.hypot(dx,dy)<1.05)throw Error('Za blisko ciała — postaw dalej, potem przeciągnij');
  if(world.inspect().objects.filter(o=>o.kind==='part').length>=64)
    throw Error('Limit 64 części — usuń niepotrzebną');
  remember();
  const id=world.addMaterialPart(x,y,shape.hx,shape.hy,tool==='anchor'?'anchored':'dynamic');
  choosePart(id);
  info('OWNER: utworzył #'+id+' '+tool+' / '+$<HTMLSelectElement>('#shape').value);
 }catch(err){info('Nie dodano: '+String(err));}
}
canvas.addEventListener('pointerdown',e=>{
 e.preventDefault();canvas.focus();
 activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 canvas.setPointerCapture(e.pointerId);
 if(activePointers.size>=2){
  // Two fingers always mean camera manipulation, not a second placement.
  gestureWasMulti=true;pendingTap=null;dragging=null;dragMoved=false;pan=null;
  const pts=[...activePointers.values()];
  pinchDistance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  follow=false;$('#follow').setAttribute('aria-pressed','false');
  return;
 }
 const p=screenToWorld(e,dims()),hit=closest(p);
 if(tool==='select'){
  if(hit){choosePart(hit.handle);dragging=hit.handle;dragMoved=false;}
  else{choosePart(null);pan={x:p.x,y:p.y};
   follow=false;$('#follow').setAttribute('aria-pressed','false');}
 }else if(e.pointerType==='touch'){
  // Defer placement until an actual tap completes. This allows two-finger
  // zoom or one-finger scroll attempts WITHOUT spawning accidental solids.
  pendingTap={id:e.pointerId,x:e.clientX,y:e.clientY,worldX:p.x,worldY:p.y};
 }else addOwnerPart(p.x,p.y);
});
canvas.addEventListener('pointermove',e=>{
 if(!activePointers.has(e.pointerId))return;
 activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(activePointers.size>=2){
  const pts=[...activePointers.values()],d=dims();
  const mx=(pts[0].x+pts[1].x)/2,my=(pts[0].y+pts[1].y)/2;
  const dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  if(pinchDistance>4&&dist>4){
   const oldPoint=screenToWorld({clientX:mx,clientY:my} as PointerEvent,d);
   zoomBy(dist/pinchDistance);
   const newPoint=screenToWorld({clientX:mx,clientY:my} as PointerEvent,dims());
   cam.x+=oldPoint.x-newPoint.x;cam.y+=oldPoint.y-newPoint.y;
  }
  pinchDistance=dist;return;
 }
 if(e.buttons===0&&!e.pressure)return;
 if(pendingTap){
  if(Math.hypot(e.clientX-pendingTap.x,e.clientY-pendingTap.y)>12)pendingTap=null;
  return;
 }
 if(gestureWasMulti)return;
 const p=screenToWorld(e,dims());
 if(dragging!==null){
  const obj=world.inspect().objects.find(o=>o.handle===dragging);
  if(!obj)return;
  if(!dragMoved&&Math.hypot(p.x-obj.x,p.y-obj.y)<.10)return;
  if(!dragMoved){remember();dragMoved=true;}
  world.moveMaterialPart(dragging,p.x,p.y);
 }else if(pan){cam.x+=pan.x-p.x;cam.y+=pan.y-p.y;}
});
canvas.addEventListener('wheel',e=>{
 e.preventDefault();
 // Zoom around the point under the cursor, not an unrelated screen center.
 const oldPoint=screenToWorld(e,dims());
 zoomBy(e.deltaY>0?1/1.16:1.16);
 const newPoint=screenToWorld(e,dims());
 cam.x+=oldPoint.x-newPoint.x;cam.y+=oldPoint.y-newPoint.y;
},{passive:false});
function release(e:PointerEvent){
 if(pendingTap?.id===e.pointerId&&!gestureWasMulti&&e.type==='pointerup')
  addOwnerPart(pendingTap.worldX,pendingTap.worldY);
 pendingTap=null;
 if(dragging!==null&&dragMoved)info('OWNER: przemieścił materiał #'+dragging+' (ręczna translacja)');
 dragging=null;dragMoved=false;pan=null;
 activePointers.delete(e.pointerId);
 if(activePointers.size===0){gestureWasMulti=false;pinchDistance=0;}
}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
function enterManual(){
 if(!manual){
  manual=true;
  $<HTMLButtonElement>('#manual').setAttribute('aria-pressed','true');
  $('#manual').textContent='Oddaj sterowanie';
  info('OWNER: ręczne sterowanie ciałem, nie ruch sztucznego mózgu');
 }
 // Physical body-control intent must not be silently swallowed by pause:
 // pressing a steering key resumes world time exactly once.
 if(paused){
  paused=false;last=0;acc=0;
  $('#pause').textContent='Pauza';
  info('OWNER: wznawia prawdziwy czas fizyczny sterowaniem');
 }
}
// Keyboard works even when the canvas isn't focused. Avoid swallowing
// letters in future real text inputs and select controls.
document.addEventListener('keydown',e=>{
 const target=e.target;
 if(target instanceof HTMLElement &&
   (['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable))return;
 const k=e.key.toLowerCase();
 if(k.length===1&&'wasdqe'.includes(k)){
  e.preventDefault();enterManual();keys.add(k);
 }
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
for(const btn of document.querySelectorAll<HTMLButtonElement>('[data-hold]')){
 const k=btn.dataset.hold!;
 btn.addEventListener('pointerdown',e=>{e.preventDefault();enterManual();keys.add(k);btn.setPointerCapture(e.pointerId);});
 const up=()=>keys.delete(k);btn.addEventListener('pointerup',up);
 btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);
}
document.addEventListener('visibilitychange',()=>{keys.clear();last=0;acc=0;});
function render(){
 const d=dims(),{w,h,scale:s}=d;
 if(follow){const a=world.inspect().actor;cam.x=a.x;cam.y=a.y;}
 const X=(x:number)=>w/2+(x-cam.x)*s,Y=(y:number)=>h/2-(y-cam.y)*s;
 ctx.fillStyle='#081522';ctx.fillRect(0,0,w,h);
 const nx=Math.ceil(w/s/2)+1,ny=Math.ceil(h/s/2)+1;
 ctx.strokeStyle='#182e40';ctx.lineWidth=.8;
 for(let x=Math.floor(cam.x)-nx;x<=Math.ceil(cam.x)+nx;x++){ctx.beginPath();ctx.moveTo(X(x),0);ctx.lineTo(X(x),h);ctx.stroke();}
 for(let y=Math.floor(cam.y)-ny;y<=Math.ceil(cam.y)+ny;y++){ctx.beginPath();ctx.moveTo(0,Y(y));ctx.lineTo(w,Y(y));ctx.stroke();}
 const state=world.inspect(),f=world.observe();
 for(const o of state.objects){
  if(o.kind!=='part')continue;
  ctx.save();ctx.translate(X(o.x),Y(o.y));ctx.rotate(-o.angle);
  ctx.fillStyle=o.mode==='anchored'?'#ae844b':'#4a9d9f';
  ctx.fillRect(-o.hx*s,-o.hy*s,o.hx*2*s,o.hy*2*s);
  ctx.strokeStyle=o.handle===selected?'#fff1b8':'#223548';ctx.lineWidth=o.handle===selected?3:1.5;
  ctx.strokeRect(-o.hx*s,-o.hy*s,o.hx*2*s,o.hy*2*s);
  if(o.mode==='anchored'){ctx.fillStyle='rgba(255,255,255,.26)';ctx.fillRect(-o.hx*s,-o.hy*s,o.hx*2*s,.08*s);}
  ctx.restore();
 }
 ctx.fillStyle='#83aaf0';ctx.beginPath();ctx.arc(X(state.actor.x),Y(state.actor.y),s,0,Math.PI*2);ctx.fill();
 ctx.lineWidth=2;ctx.strokeStyle='#f5fcff';ctx.beginPath();ctx.moveTo(X(state.actor.x),Y(state.actor.y));
 ctx.lineTo(X(state.actor.x+Math.cos(state.actor.angle)*1.2),Y(state.actor.y+Math.sin(state.actor.angle)*1.2));ctx.stroke();
 ctx.strokeStyle='#70e1ce';ctx.beginPath();ctx.moveTo(X(state.actor.x),Y(state.actor.y));
 ctx.lineTo(X(state.actor.x+Math.cos(state.actor.angle+state.gaze)*2.8),Y(state.actor.y+Math.sin(state.actor.angle+state.gaze)*2.8));ctx.stroke();
 for(let i=0;i<96;i++){
  rctx.fillStyle='rgb('+Array.from(f.retina.slice(i*3,i*3+3)).map(v=>Math.round(v*255)).join(',')+')';
  rctx.fillRect(i,0,1,12);
 }
 $('#tick').textContent=state.tick+' / '+(state.tick/120).toFixed(1)+' s';
 $('#count').textContent=String(state.objects.filter(o=>o.kind==='part').length);
 const o=state.objects.find(x=>x.handle===selected&&x.kind==='part');
 $('#chosen').textContent=o?'#'+o.handle+' '+o.mode:'—';
 $('#actorMode').textContent=manual?'OWNER / ręczne':'Autorski odruch';
 $('#motion').textContent=safe(f.proprio.forward)+' / '+safe(f.proprio.omega);
 status.textContent=(paused?'PAUZA':manual?'OWNER steruje':'Odruch autorski')+' · '+(document.hidden?'karta ukryta':'realna fizyka');
}
function frame(t:number){
 if(!last)last=t;
 if(!paused&&!document.hidden){
  acc+=Math.min(.06,(t-last)/1000);let n=0;
  while(acc>=E0_DT&&n<12){
   const observation=world.observe();
   const demand:Demand=manual?
    {drive:Number(keys.has('w'))-Number(keys.has('s')),
     turn:Number(keys.has('a'))-Number(keys.has('d')),
     gazeRate:Number(keys.has('q'))-Number(keys.has('e'))}:resident.decide(observation);
   world.step(demand);
   acc-=E0_DT;n++;
  }
 }
 last=t;render();requestAnimationFrame(frame);
}
(window as unknown as {__r8Audit:()=>unknown}).__r8Audit=()=>({
 tick:world.inspect().tick,actor:world.inspect().actor,
 parts:world.inspect().objects.filter(o=>o.kind==='part'),
 privateKeys:Object.keys(world.observe()),retinaLength:world.observe().retina.length,
 privateFrameTick:world.observe().tick,
 retinaDigest:Array.from(world.observe().retina).map(x=>Math.round(x*255)).join(','),
 selected,manual,paused,cam:{...cam},zoom,scene,undoCount:undo.length,hasCheckpoint:checkpoint!==null
});
requestAnimationFrame(frame);
