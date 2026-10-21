import {initLivingWorld,type Demand} from './world';
import {SituatedRuntime,type SituatedCheckpoint} from './life-l2-situated-runtime';
import type {SituatedMode} from './life-l2-situated-resident';
import {E0_DT} from '../e0-body-seam';

const el=<T extends HTMLElement>(id:string)=>{const n=document.getElementById(id);if(!n)throw Error('Missing '+id);return n as T};
const canvas=el<HTMLCanvasElement>('world'),ctx=canvas.getContext('2d')!;
const eye=el<HTMLCanvasElement>('eye'),eyeCtx=eye.getContext('2d')!;
const pause=el<HTMLButtonElement>('pause'),take=el<HTMLButtonElement>('takeover'),restore=el<HTMLButtonElement>('restore');
const mode=el<HTMLSelectElement>('mode'),drive=el<HTMLInputElement>('drive'),turn=el<HTMLInputElement>('turn');
const keys=new Set<string>();let rt:SituatedRuntime|null=null;
let stopped=false,manual=false,saved:SituatedCheckpoint|null=null;
let lastTime=0,acc=0,lastInterventionTick:number|null=null;
let dragged:number|null=null,pointer:number|null=null;
const fmt=(v:number)=>v.toFixed(2);
const rgb=(c:number[])=>'rgb('+c.map(x=>Math.round(x*255)).join(',')+')';
const clamp=(n:number)=>Math.max(-1,Math.min(1,n));
const span=()=>window.innerWidth<600?20:37;
const scale=()=>canvas.width/span();
const vSpan=()=>canvas.height/scale();
let center={x:0,y:0};
const sx=(x:number)=>(x-center.x)*scale()+canvas.width*.5;
const sy=(y:number)=>(center.y-y)*scale()+canvas.height*.5;
function toWorld(e:PointerEvent){
 const r=canvas.getBoundingClientRect();
 return {x:center.x+((e.clientX-r.left)/r.width-.5)*span(),
  y:center.y+(.5-(e.clientY-r.top)/r.height)*vSpan()};
}
const manualMotor=():Demand=>{
 const value=(up:string,down:string)=>Number(keys.has(up))-Number(keys.has(down));
 return {drive:clamp(value('w','s')+Number(drive.value)/100),
  turn:clamp(value('a','d')+Number(turn.value)/100),gazeRate:0};
};
function reset(){
 rt?.free();rt=new SituatedRuntime(mode.value as SituatedMode);
 stopped=false;manual=false;saved=null;lastInterventionTick=null;
 acc=0;lastTime=0;keys.clear();dragged=null;pointer=null;
 drive.value='0';turn.value='0';restore.disabled=true;
 pause.textContent='Pauza';take.textContent='Przejmij ciało';draw();
}
const draw=()=>{
 if(!rt)return;
 const world=rt.world.inspect(),f=rt.world.observe(),s=rt.resident.capture();
 center={x:world.actor.x,y:world.actor.y};
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#071c29';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.strokeStyle='#164051';ctx.lineWidth=1;
 for(let x=Math.floor(center.x-span()/2);x<center.x+span()/2;x++){
  ctx.beginPath();ctx.moveTo(sx(x),0);ctx.lineTo(sx(x),canvas.height);ctx.stroke();
 }
 for(let y=Math.floor(center.y-vSpan()/2);y<center.y+vSpan()/2;y++){
  ctx.beginPath();ctx.moveTo(0,sy(y));ctx.lineTo(canvas.width,sy(y));ctx.stroke();
 }
 for(const o of world.objects){
  ctx.save();ctx.translate(sx(o.x),sy(o.y));ctx.rotate(-o.angle);
  ctx.fillStyle=rgb(o.color);
  if(o.kind==='object'){ctx.beginPath();ctx.arc(0,0,o.hx*scale(),0,Math.PI*2);ctx.fill();}
  else ctx.fillRect(-o.hx*scale(),-o.hy*scale(),2*o.hx*scale(),2*o.hy*scale());
  ctx.restore();
 }
 const a=world.actor;
 ctx.save();ctx.translate(sx(a.x),sy(a.y));ctx.rotate(-a.angle);
 ctx.beginPath();ctx.roundRect(-1.3*scale(),-.65*scale(),2.6*scale(),1.3*scale(),.6*scale());
 ctx.fillStyle='#76dbb9';ctx.fill();ctx.strokeStyle='#eefff9';ctx.lineWidth=2.5;ctx.stroke();
 ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1.4*scale(),0);ctx.stroke();
 ctx.restore();
 ctx.strokeStyle='#edcd83';ctx.lineWidth=2;ctx.beginPath();
 ctx.moveTo(sx(a.x),sy(a.y));
 ctx.lineTo(sx(a.x+3*Math.cos(a.angle+world.gaze)),sy(a.y+3*Math.sin(a.angle+world.gaze)));ctx.stroke();
 for(let i=0;i<96;i++){eyeCtx.fillStyle=rgb(Array.from(f.retina.subarray(i*3,i*3+3)));
  eyeCtx.fillRect(i,0,1,eye.height);}
 el<HTMLElement>('clock').textContent=fmt(world.tick/120)+' s';
 el<HTMLElement>('learned').textContent=String(s.habitUpdates);
 el<HTMLElement>('contacts').textContent=String(s.touchEpisodes);
 el<HTMLElement>('authority').textContent=manual?'RĘCZNIE':'AUTO';
 el<HTMLElement>('readout').textContent='Nawyk kontaktowy '+fmt(s.habit)+
  ' · zmiana kierunku wynikająca ze wzroku '+fmt(s.lastVisualTurn)+
  '\nPercepcja lokalna [L '+fmt(s.currentVisual.left)+', C '+fmt(s.currentVisual.middle)+', P '+fmt(s.currentVisual.right)+
  '] · ciało [forward '+fmt(f.proprio.forward)+', ω '+fmt(f.proprio.omega)+']'+
  '\n'+(lastInterventionTick!==null&&f.tick<=lastInterventionTick?
   'OBRAZ SPRZED FIZYCZNEJ INGERENCJI — mieszkaniec jeszcze jej nie zobaczył':
   'Siatkówka: ostatnia realna klatka 30 Hz')+
  (stopped?' · PAUZA':'');
 canvas.dataset.tick=String(world.tick);
 canvas.dataset.actorX=String(a.x);canvas.dataset.actorY=String(a.y);
 canvas.dataset.mode=rt.mode;canvas.dataset.authority=manual?'manual':'auto';
 canvas.dataset.habit=String(s.habit);
 canvas.dataset.interventionSeen=lastInterventionTick===null||f.tick>lastInterventionTick?'yes':'no';
 canvas.dataset.centerX=String(center.x);canvas.dataset.centerY=String(center.y);
};
function animate(t:number){
 if(!lastTime)lastTime=t;
 if(rt&&!stopped&&!document.hidden){
  acc+=Math.min(.075,(t-lastTime)/1000);
  for(let i=0;i<12&&acc>=E0_DT;i++){
   rt.step(manual?manualMotor():null);acc-=E0_DT;
   if(lastInterventionTick!==null&&rt.world.observe().tick>lastInterventionTick)
    lastInterventionTick=null;
  }
 }
 lastTime=t;draw();requestAnimationFrame(animate);
}
canvas.addEventListener('pointerdown',e=>{
 if(!rt)return;
 const p=toWorld(e);
 const objects=rt.world.inspect().objects;
 const item=objects.filter(o=>o.kind==='object')
  .find(o=>Math.hypot(o.x-p.x,o.y-p.y)<o.hx+.35);
 if(!item)return;
 dragged=item.handle;pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!rt||dragged===null||pointer!==e.pointerId)return;
 const p=toWorld(e);
 rt.world.moveObject(dragged,p.x,p.y);
 lastInterventionTick=rt.world.inspect().tick;
});
for(const name of ['pointercancel','pointerup','lostpointercapture'])
 canvas.addEventListener(name,()=>{dragged=null;pointer=null;});
pause.addEventListener('click',()=>{
 stopped=!stopped;acc=0;lastTime=0;pause.textContent=stopped?'Wznów':'Pauza';draw();
});
take.addEventListener('click',()=>{
 manual=!manual;keys.clear();drive.value='0';turn.value='0';
 take.textContent=manual?'Oddaj ciało':'Przejmij ciało';draw();
});
el<HTMLButtonElement>('restart').addEventListener('click',reset);
el<HTMLButtonElement>('snapshot').addEventListener('click',()=>{
 if(!rt)return;saved=rt.capture();restore.disabled=false;
});
restore.addEventListener('click',()=>{
 if(!rt||!saved)return;
 rt.restore(saved);manual=false;keys.clear();drive.value='0';turn.value='0';
 lastInterventionTick=null;acc=0;lastTime=0;take.textContent='Przejmij ciało';draw();
});
document.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(['w','a','s','d'].includes(k)&&document.activeElement?.tagName!=='INPUT'){
  keys.add(k);e.preventDefault();
 }
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{lastTime=0;acc=0;keys.clear();});
await initLivingWorld();reset();requestAnimationFrame(animate);
