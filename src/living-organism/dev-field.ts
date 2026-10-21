import {initLivingWorld,type Demand,type BodyShape} from './world';
import {DevRuntime,type DevCheckpoint,type DevLayout} from './dev-runtime';
import type {DevMode} from './dev-resident';
import {E0_DT} from '../e0-body-seam';
import {importLifeL1} from './life-l1-browser-import';

const el=<T extends HTMLElement>(id:string)=>{const x=document.getElementById(id);if(!x)throw Error('Missing '+id);return x as T};
const canvas=el<HTMLCanvasElement>('world'),eye=el<HTMLCanvasElement>('eye');
const ctx=canvas.getContext('2d')!,eyeCtx=eye.getContext('2d')!;
const pauseButton=el<HTMLButtonElement>('pause'),takeButton=el<HTMLButtonElement>('takeover');
const restoreButton=el<HTMLButtonElement>('restore');
const modeSelect=el<HTMLSelectElement>('mode'),bodySelect=el<HTMLSelectElement>('body'),layoutSelect=el<HTMLSelectElement>('layout');
const driveSlider=el<HTMLInputElement>('drive'),turnSlider=el<HTMLInputElement>('turn');
const details=el<HTMLDivElement>('details'),status=el<HTMLSpanElement>('status');
const lifeFile=el<HTMLInputElement>('life-file'),lifeMessage=el<HTMLElement>('life-message');
const keys=new Set<string>();
let runtime:DevRuntime|null=null,manual=false,paused=false,lastTime=0,acc=0;
let saved:null|{cp:DevCheckpoint;manual:boolean;paused:boolean;drive:string;turn:string;retinaEditTick:number|null}=null;
let retinaEditTick:number|null=null,dragHandle:number|null=null,dragPointer:number|null=null;
let importedLifeId:string|null=null;
const color=(rgb:number[])=>'rgb('+rgb.map(v=>Math.round(v*255)).join(',')+')';
const fmt=(n:number)=>n.toFixed(2);
const span=()=>window.innerWidth<600?18:30;
const px=()=>canvas.width/span();
const hSpan=()=>canvas.height/px();
let center={x:0,y:0};
const sx=(x:number)=>(x-center.x)*px()+canvas.width/2;
const sy=(y:number)=>(center.y-y)*px()+canvas.height/2;
const fromMouse=(e:PointerEvent)=>{
 const r=canvas.getBoundingClientRect();
 return {x:center.x+((e.clientX-r.left)/r.width-.5)*span(),
 y:center.y+(.5-(e.clientY-r.top)/r.height)*hSpan()};
};
const motor=():Demand=>{
 const v=(up:string,down:string)=>Number(keys.has(up))-Number(keys.has(down));
 return {drive:Math.max(-1,Math.min(1,v('w','s')+Number(driveSlider.value)/100)),
  turn:Math.max(-1,Math.min(1,v('a','d')+Number(turnSlider.value)/100)),
  gazeRate:v('q','e')};
};
function reset(){
 runtime?.free();
 runtime=new DevRuntime(modeSelect.value as DevMode,bodySelect.value as BodyShape,layoutSelect.value as DevLayout);
 manual=false;paused=false;acc=0;lastTime=0;keys.clear();
 dragHandle=null;dragPointer=null;retinaEditTick=null;importedLifeId=null;
 lifeMessage.textContent='Nowe życie lokalne — bez zewnętrznego zapisu.';
 driveSlider.value='0';turnSlider.value='0';saved=null;restoreButton.disabled=true;
 pauseButton.textContent='Pauza';takeButton.textContent='Przejmij';
 draw();
}
const draw=()=>{
 if(!runtime)return;
 const f=runtime.world.observe(),w=runtime.world.inspect(),s=runtime.resident.capture();
 center={x:w.actor.x,y:w.actor.y};
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#071923';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.strokeStyle='#14313d';ctx.lineWidth=1;
 for(let gx=Math.floor(center.x-span()/2);gx<center.x+span()/2;gx++){
  ctx.beginPath();ctx.moveTo(sx(gx),0);ctx.lineTo(sx(gx),canvas.height);ctx.stroke();
 }
 for(let gy=Math.floor(center.y-hSpan()/2);gy<center.y+hSpan()/2;gy++){
  ctx.beginPath();ctx.moveTo(0,sy(gy));ctx.lineTo(canvas.width,sy(gy));ctx.stroke();
 }
 for(const o of w.objects){
  ctx.save();ctx.translate(sx(o.x),sy(o.y));ctx.rotate(-o.angle);ctx.fillStyle=color(o.color);
  if(o.kind==='object'){ctx.beginPath();ctx.arc(0,0,o.hx*px(),0,Math.PI*2);ctx.fill();}
  else ctx.fillRect(-o.hx*px(),-o.hy*px(),o.hx*px()*2,o.hy*px()*2);
  ctx.restore();
 }
 const a=w.actor;
 ctx.save();ctx.translate(sx(a.x),sy(a.y));ctx.rotate(-a.angle);
 ctx.beginPath();
 if(runtime.shape==='B1')ctx.roundRect(-1.3*px(),-.65*px(),2.6*px(),1.3*px(),.65*px());
 else ctx.arc(0,0,px(),0,Math.PI*2);
 ctx.fillStyle='#6dddbb';ctx.strokeStyle='#eafff9';ctx.lineWidth=2.5;
 ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1.2*px(),0);ctx.stroke();
 ctx.restore();
 ctx.strokeStyle='#f5d98c';ctx.lineWidth=2;ctx.beginPath();
 ctx.moveTo(sx(a.x),sy(a.y));
 ctx.lineTo(sx(a.x+2*Math.cos(a.angle+w.gaze)),sy(a.y+2*Math.sin(a.angle+w.gaze)));ctx.stroke();
 for(let i=0;i<96;i++){eyeCtx.fillStyle=color(Array.from(f.retina.slice(i*3,i*3+3)));eyeCtx.fillRect(i,0,1,eye.height);}
 const last=s.active?.maneuver??'—';
 const result=s.lastResult===null?'brak':fmt(s.lastResult);
 details.textContent='Ostatnia komenda: '+(last)+' · wynik prywatnej próby: '+result+
  '\nproprio: forward '+fmt(f.proprio.forward)+' lateral '+fmt(f.proprio.lateral)+
  ' omega '+fmt(f.proprio.omega)+
  '\n'+(retinaEditTick===null?'Siatkówka: ostatnia dostarczona klatka 30 Hz':
   'UWAGA: obraz sprzed ingerencji Ownera — aktor jeszcze nie widział zmiany');
 el<HTMLElement>('time').textContent=fmt(w.tick/120)+' s';
 el<HTMLElement>('trials').textContent=String(s.trials);
 el<HTMLElement>('learned').textContent=String(s.learnedTrials);
 el<HTMLElement>('authority').textContent=manual?'RĘCZNIE':'AUTO';
 status.textContent=(paused?'Pauza':'Fizyka działa')+
  ' · '+runtime.shape+' / '+runtime.layout+' / '+runtime.mode;
 const target=w.objects.find(o=>o.kind==='object'&&o.color[1]>.8&&o.color[2]>.6);
 canvas.dataset.tick=String(w.tick);
 canvas.dataset.targetX=String(target?.x??NaN);
 canvas.dataset.targetY=String(target?.y??NaN);
 canvas.dataset.actorX=String(a.x);canvas.dataset.actorY=String(a.y);
 canvas.dataset.camX=String(center.x);canvas.dataset.camY=String(center.y);
 canvas.dataset.authority=manual?'manual':'auto';
 canvas.dataset.retinaStatus=retinaEditTick===null?'delivered':'pre-intervention';
 canvas.dataset.learned=String(s.learnedTrials);
 canvas.dataset.lifeId=importedLifeId??'';
};
function loop(now:number){
 if(!lastTime)lastTime=now;
 if(!paused&&!document.hidden&&runtime){
  acc+=Math.min(.075,(now-lastTime)/1000);
  let limit=0;
  while(acc>=E0_DT&&limit++<12){
   runtime.step(manual?motor():null);acc-=E0_DT;
   if(retinaEditTick!==null&&runtime.world.observe().tick>retinaEditTick)retinaEditTick=null;
  }
 }
 lastTime=now;draw();requestAnimationFrame(loop);
}
canvas.addEventListener('pointerdown',e=>{
 if(!runtime)return;
 const at=fromMouse(e),items=runtime.world.inspect().objects;
 const item=items.find(o=>o.kind==='object'&&Math.hypot(o.x-at.x,o.y-at.y)<o.hx+.3);
 if(!item)return;
 dragHandle=item.handle;dragPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!runtime||dragHandle===null||dragPointer!==e.pointerId)return;
 const at=fromMouse(e);runtime.world.moveObject(dragHandle,at.x,at.y);
 retinaEditTick=runtime.world.inspect().tick;
});
for(const event of ['pointercancel','pointerup','lostpointercapture'])canvas.addEventListener(event,()=>{
 dragHandle=null;dragPointer=null;
});
/** A paused, researcher-owned import; actor never sees host timestamps, hashes or life ID. */
lifeFile.addEventListener('change',async()=>{
 const file=lifeFile.files?.[0];if(!file)return;
 const beforePause=paused;
 paused=true;acc=0;lastTime=0;
 pauseButton.textContent='Wznów';
 lifeMessage.textContent='Sprawdzam integralność biografii…';
 try{
  if(file.size>28_000_000)throw Error('Plik jest za duży');
  const loaded=await importLifeL1(await file.text());
  const cp=loaded.checkpoint;
  const next=new DevRuntime(cp.mode,cp.shape,cp.layout);
  try{next.restore(cp);}catch(e){next.free();throw e;}
  runtime?.free();runtime=next;
  modeSelect.value=cp.mode;bodySelect.value=cp.shape;layoutSelect.value=cp.layout;
  importedLifeId=loaded.lifeId;
  manual=false;pressedReset();
  retinaEditTick=null;dragHandle=null;dragPointer=null;
  saved=null;restoreButton.disabled=true;
  lifeMessage.textContent='Wczytano to samo życie · '+(loaded.simulatedSeconds/3600).toFixed(2)+
   ' h symulacji · ID '+loaded.lifeId.slice(0,8)+
   ' · teraz PAUZA. Wznów lub przejmij ciało.';
  draw();
 }catch(e){
  paused=beforePause;
  pauseButton.textContent=paused?'Wznów':'Pauza';
  lifeMessage.textContent='Nie wczytano pliku: '+(e instanceof Error?e.message:String(e));
 }finally{lifeFile.value='';}
});
function pressedReset(){
 keys.clear();driveSlider.value='0';turnSlider.value='0';
 takeButton.textContent='Przejmij';
}

el<HTMLButtonElement>('restart').addEventListener('click',reset);
pauseButton.addEventListener('click',()=>{paused=!paused;lastTime=0;acc=0;pauseButton.textContent=paused?'Wznów':'Pauza';});
takeButton.addEventListener('click',()=>{
 manual=!manual;keys.clear();driveSlider.value='0';turnSlider.value='0';
 takeButton.textContent=manual?'Oddaj ciało':'Przejmij';
});
el<HTMLButtonElement>('save').addEventListener('click',()=>{
 if(!runtime)return;
 saved={cp:runtime.capture(),manual,paused,drive:driveSlider.value,
  turn:turnSlider.value,retinaEditTick};
 restoreButton.disabled=false;
});
restoreButton.addEventListener('click',()=>{
 if(!runtime||!saved)return;
 if(saved.cp.shape!==runtime.shape||saved.cp.layout!==runtime.layout||saved.cp.mode!==runtime.mode)
  throw Error('Saved world belongs to different experimental run');
 runtime.restore(saved.cp);manual=saved.manual;paused=saved.paused;
 driveSlider.value=saved.drive;turnSlider.value=saved.turn;
 retinaEditTick=saved.retinaEditTick;keys.clear();
 pauseButton.textContent=paused?'Wznów':'Pauza';
 takeButton.textContent=manual?'Oddaj ciało':'Przejmij';
 acc=0;lastTime=0;draw();
});
document.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(['w','a','s','d','q','e'].includes(k)&&document.activeElement?.tagName!=='INPUT'){
  keys.add(k);e.preventDefault();
 }
});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{acc=0;lastTime=0;keys.clear();});
await initLivingWorld();
reset();
requestAnimationFrame(loop);
