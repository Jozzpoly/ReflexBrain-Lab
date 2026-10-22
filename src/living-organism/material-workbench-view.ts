import {initLivingWorld,LivingWorld,type Checkpoint,type Demand} from './world';
import {Occupant,type OccupantState} from './occupant';
import {E0_DT} from '../e0-body-seam';
await initLivingWorld();
type LabCheckpoint={world:Checkpoint;resident:OccupantState};
const $=<T extends HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const canvas=$<HTMLCanvasElement>('#field'),ctx=canvas.getContext('2d')!;
const retina=$<HTMLCanvasElement>('#retina'),rctx=retina.getContext('2d')!;
const status=$<HTMLElement>('#status'),events=$<HTMLElement>('#events');
let world=new LivingWorld(false),resident=new Occupant(),checkpoint:LabCheckpoint|null=null;
let paused=false,manual=false,follow=false,tool:'select'|'free'|'anchor'='select';
let selected:number|null=null,dragging:number|null=null,pan:{x:number;y:number}|null=null;
let cam={x:0,y:0},last=0,acc=0,dragLogTick=-1;
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
 world.setMaterialPartMode(o.handle,newMode);
 choosePart(o.handle);info('OWNER: #'+o.handle+' → '+(newMode==='anchored'?'kotwica':'swobodny'));
}
$('#toggle').addEventListener('click',changeMode);
$('#delete').addEventListener('click',()=>{
 if(selected===null)return;
 const n=selected;world.removeMaterialPart(n);choosePart(null);info('OWNER: usunięto #'+n);
});
$('#pause').addEventListener('click',()=>{
 paused=!paused;last=0;acc=0;keys.clear();$('#pause').textContent=paused?'Wznów':'Pauza';
});
$('#manual').addEventListener('click',()=>{
 manual=!manual;keys.clear();$('#manual').setAttribute('aria-pressed',String(manual));
 $('#manual').textContent=manual?'Oddaj sterowanie':'Przejmij ciało';info(manual?'OWNER przejął ciało':'OWNER oddał ciało autorskiemu odruchowi');
});
$('#follow').addEventListener('click',()=>{
 follow=!follow;$('#follow').setAttribute('aria-pressed',String(follow));
});
$('#save').addEventListener('click',()=>{
 checkpoint={world:world.captureCheckpoint(),resident:resident.capture()};
 $<HTMLButtonElement>('#restore').disabled=false;info('OWNER: zapisał stan fizyczny + odruch');
});
$('#restore').addEventListener('click',()=>{
 if(!checkpoint)return;world.restoreCheckpoint(checkpoint.world);
 resident.restore(checkpoint.resident);choosePart(null);keys.clear();acc=0;last=0;
 info('OWNER: odtworzył ten sam świat, ciało i pamięć odruchu');
});
$('#reset').addEventListener('click',()=>{
 world.free();world=new LivingWorld(false);resident=new Occupant();checkpoint=null;choosePart(null);
 $<HTMLButtonElement>('#restore').disabled=true;keys.clear();cam={x:0,y:0};last=0;acc=0;
 info('OWNER: nowy świat (świadomy reset)');
});
function dims(){
 const r=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 const w=Math.max(300,r.width),h=Math.max(195,r.height);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 }
 ctx.setTransform(dpr,0,0,dpr,0,0);
 return{w,h,scale:Math.min(47,Math.max(28,w/22))};
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
canvas.addEventListener('pointerdown',e=>{
 e.preventDefault();canvas.focus();
 const p=screenToWorld(e,dims()),hit=closest(p);
 if(tool==='select'){
  if(hit){choosePart(hit.handle);dragging=hit.handle;dragLogTick=world.inspect().tick;}
  else {choosePart(null);pan={x:p.x,y:p.y};}
 }else{
  const shape=shapes[$<HTMLSelectElement>('#shape').value as keyof typeof shapes]||shapes.beam;
  try{
   const id=world.addMaterialPart(p.x,p.y,shape.hx,shape.hy,tool==='anchor'?'anchored':'dynamic');
   choosePart(id);info('OWNER: utworzył #'+id+' '+tool+' / '+$<HTMLSelectElement>('#shape').value);
  }catch(err){info('Nie dodano: '+String(err));}
 }
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(e.buttons===0&&!e.pressure)return;
 const p=screenToWorld(e,dims());
 if(dragging!==null){
  world.moveMaterialPart(dragging,p.x,p.y);
 }else if(pan){
  cam.x+=pan.x-p.x;cam.y+=pan.y-p.y;
 }
});
const release=()=>{
 if(dragging!==null){
  info('OWNER: przemieścił materiał #'+dragging+' (ręczna translacja)');
 }
 dragging=null;pan=null;
};
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();if('wasdqe'.includes(k)&&k.length===1){
  e.preventDefault();keys.add(k);
 }
});
canvas.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('blur',()=>keys.clear());
for(const btn of document.querySelectorAll<HTMLButtonElement>('[data-hold]')){
 const k=btn.dataset.hold!;
 btn.addEventListener('pointerdown',e=>{e.preventDefault();manual=true;
  $<HTMLButtonElement>('#manual').setAttribute('aria-pressed','true');
  $('#manual').textContent='Oddaj sterowanie';keys.add(k);btn.setPointerCapture(e.pointerId);});
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
 selected,manual,paused,hasCheckpoint:checkpoint!==null
});
requestAnimationFrame(frame);
