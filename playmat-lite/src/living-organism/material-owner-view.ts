import { E0_DT } from '../e0-body-seam';
import { initLivingWorld, type Demand, type LivingWorld } from './world';
import {
  MaterialConcern, CheapChase, createMaterialScenario, type MaterialMode,
} from './material-relation-scout';

const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=get<HTMLCanvasElement>('world'),ctx=canvas.getContext('2d')!;
const retina=get<HTMLCanvasElement>('retina'),rctx=retina.getContext('2d')!;
const modeInput=get<HTMLSelectElement>('mode'),speedInput=get<HTMLSelectElement>('speed');
const pauseButton=get<HTMLButtonElement>('pause');
const fastButton=get<HTMLButtonElement>('run60');
const manualButton=get<HTMLButtonElement>('manual');
const microscopeInput=get<HTMLInputElement>('microscope');
const keys=new Set<string>();
const validKeys=new Set(['w','a','s','d','q','e']);
const toX=(x:number)=>(x+11)/22*canvas.width;
const toY=(y:number)=>(7-y)/14*canvas.height;
const worldX=(x:number)=>(x/canvas.width)*22-11;
const worldY=(y:number)=>7-(y/canvas.height)*14;
const unit=canvas.width/22;

type Controller=MaterialConcern|CheapChase|null;
type HostScenario=ReturnType<typeof createMaterialScenario>;
type Session={
  scenario:HostScenario;
  controller:Controller;
  mode:MaterialMode;
  issued:Demand;
  lastBrainSample:number;
  lastContactSample:number;
  targetContactWindows:number;
  intervened:number;
  initialGap:number;
};
const gap=(s:Session):number=>{
  const snapshot=s.scenario.world.inspect();
  const target=snapshot.objects.find(o=>o.handle===s.scenario.targetHandle)!;
  const dock=snapshot.objects.find(o=>o.handle===s.scenario.dockHandle)!;
  // Host-only trace for browser evidence; never passed as local brain input.
  canvas.dataset.targetX=String(target.x);
  canvas.dataset.targetY=String(target.y);
  canvas.dataset.actorX=String(snapshot.actor.x);
  canvas.dataset.actorY=String(snapshot.actor.y);
  canvas.dataset.worldTick=String(snapshot.tick);
  // Researcher-only *coarse* surface proxy, not actual collider-to-collider separation.
  return Math.max(0,Math.hypot(target.x-dock.x,target.y-dock.y)-.55-.5);
};
function makeSession(mode:MaterialMode):Session{
  const scenario=createMaterialScenario();
  const controller=mode==='private-material-concern'?new MaterialConcern():
    mode==='cheap-cyan-chase'?new CheapChase():null;
  const session:Session={scenario,controller,mode,
    issued:{drive:0,turn:0,gazeRate:0},
    lastBrainSample:-1,lastContactSample:-1,targetContactWindows:0,
    intervened:0,initialGap:0};
  session.initialGap=gap(session);
  return session;
}
await initLivingWorld();
let s=makeSession(modeInput.value as MaterialMode);
let paused=false,manual=false,fastForward=false,stopFast=false,lastTime=0,accumulator=0;
let runtimeError:string|null=null;
let drag:{handle:number;moved:boolean}|null=null;

function reset(mode=s.mode){
  s.scenario.world.free();
  s=makeSession(mode);
  firstError=false;
  paused=false;manual=false;runtimeError=null;stopFast=false;
  lastTime=0;accumulator=0;drag=null;
  keys.clear();
  pauseButton.textContent='Pauza';
  fastButton.textContent='Przelicz do 60 s';fastButton.disabled=false;
  manualButton.textContent='Przejmij ciało';
  manualButton.setAttribute('aria-pressed','false');
  update();
}
modeInput.addEventListener('change',()=>reset(modeInput.value as MaterialMode));
get<HTMLButtonElement>('reset').addEventListener('click',()=>reset());
pauseButton.addEventListener('click',()=>{
  paused=!paused;lastTime=0;accumulator=0;keys.clear();
  pauseButton.textContent=paused?'Wznów':'Pauza';update();
});
manualButton.addEventListener('click',()=>{
  manual=!manual;keys.clear();
  if(manual)s.intervened++; // Owner takeover permanently invalidates source baseline.
  manualButton.textContent=manual?'Oddaj ciało':'Przejmij ciało';
  manualButton.setAttribute('aria-pressed',String(manual));
  canvas.focus();fastButton.disabled=manual;update();
});
speedInput.addEventListener('change',()=>{lastTime=0;accumulator=0;});
fastButton.addEventListener('click',()=>{
  if(fastForward){stopFast=true;fastButton.textContent='Zatrzymywanie…';return;}
  void fastForwardTo60();
});
function handleKey(e:KeyboardEvent,pressed:boolean){
  const key=e.key.toLowerCase();
  if(!validKeys.has(key) || e.target!==canvas || !manual)return;
  e.preventDefault();
  if(pressed)keys.add(key);else keys.delete(key);
}
canvas.addEventListener('keydown',e=>handleKey(e,true));
canvas.addEventListener('keyup',e=>handleKey(e,false));
canvas.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{
  keys.clear();accumulator=0;lastTime=0;
  if(document.hidden&&fastForward)stopFast=true;
});
function pointer(e:PointerEvent){
  const r=canvas.getBoundingClientRect();
  return {x:worldX((e.clientX-r.left)/r.width*canvas.width),
    y:worldY((e.clientY-r.top)/r.height*canvas.height)};
}
canvas.addEventListener('pointerdown',e=>{
  canvas.focus();
  if(e.button!==0||fastForward)return;
  const p=pointer(e),objects=s.scenario.world.inspect().objects;
  const candidate=objects.filter(o=>o.kind==='object')
    .sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))
    .find(o=>Math.hypot(o.x-p.x,o.y-p.y)<=Math.max(o.hx,.25));
  if(!candidate)return;
  drag={handle:candidate.handle,moved:false};
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(!drag)return;
  const p=pointer(e);
  // Owner dragging remains inside the material yard instead of
  // permanently teleporting a ball outside its visible walls.
  const object=s.scenario.world.inspect().objects.find(o=>o.handle===drag!.handle);
  if(!object)return;
  const px=Math.max(-9.65+object.hx,Math.min(9.65-object.hx,p.x));
  const py=Math.max(-5.65+object.hy,Math.min(5.65-object.hy,p.y));
  s.scenario.world.moveObject(drag.handle,px,py);
  drag.moved=true;
});
const release=()=>{
  if(drag?.moved)s.intervened++;
  drag=null;update();
};
canvas.addEventListener('pointerup',release);
canvas.addEventListener('pointercancel',release);

async function fastForwardTo60(){
  if(fastForward||manual||runtimeError||s.scenario.world.inspect().tick>=7200)return;
  fastForward=true;stopFast=false;paused=true;keys.clear();accumulator=0;lastTime=0;
  const controls=[pauseButton,manualButton,modeInput,speedInput,get<HTMLButtonElement>('reset')];
  for(const input of controls)input.disabled=true;
  fastButton.textContent='Przerwij przeliczanie';
  try{
    while(s.scenario.world.inspect().tick<7200&&!stopFast){
      const count=Math.min(120,7200-s.scenario.world.inspect().tick);
      for(let i=0;i<count;i++)step();
      if(!stopFast)fastButton.textContent='Przerwij · '+Math.round(s.scenario.world.inspect().tick/72)+'%';
      update();
      // A macrotask yield continues reliably even if RAF is temporarily throttled.
      await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
  }catch(error){
    runtimeError='Błąd fizyki podczas przeliczania';
    console.error('fast-forward simulation failed',error);
  }
  finally{
    fastForward=false;stopFast=false;paused=true;lastTime=0;accumulator=0;
    for(const input of controls)input.disabled=false;
    fastButton.disabled=s.scenario.world.inspect().tick>=7200;
    fastButton.textContent=fastButton.disabled?'60 s przeliczone':'Przelicz do 60 s';
    pauseButton.textContent='Wznów';
    update();
  }
}
function step(){
  const w=s.scenario.world;
  const f=w.observe();
  if(f.tick!==s.lastBrainSample){
    s.lastBrainSample=f.tick;
    // Actor receives ONLY private RGB/touch/proprio; all collider handles
    // below remain in the viewer's research-only host world.
    s.issued=s.controller?.decide(f)??{drive:0,turn:0,gazeRate:0};
  }
  const manualDemand:Demand={drive:Number(keys.has('w'))-Number(keys.has('s')),
    turn:Number(keys.has('a'))-Number(keys.has('d')),
    gazeRate:Number(keys.has('q'))-Number(keys.has('e'))};
  w.step(manual?manualDemand:s.issued);
  const sample=w.inspectContactSample();
  if(sample.tick!==s.lastContactSample){
    s.lastContactSample=sample.tick;
    if(sample.contacts.some(c=>c.handle===s.scenario.targetHandle))
      s.targetContactWindows++;
  }
}
function color(c:readonly number[]):string{
  return 'rgb('+c.map(x=>Math.round(Math.max(0,Math.min(1,x))*255)).join(',')+')';
}
function drawWorld(){
  const snapshot=s.scenario.world.inspect(),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='#1b3342';ctx.lineWidth=1;
  for(let i=-10;i<=10;i+=2){
    ctx.beginPath();ctx.moveTo(toX(i),0);ctx.lineTo(toX(i),h);ctx.stroke();
  }
  for(let i=-6;i<=6;i+=2){
    ctx.beginPath();ctx.moveTo(0,toY(i));ctx.lineTo(w,toY(i));ctx.stroke();
  }
  const target=snapshot.objects.find(o=>o.handle===s.scenario.targetHandle)!;
  const dock=snapshot.objects.find(o=>o.handle===s.scenario.dockHandle)!;
  if(microscopeInput.checked){
    ctx.beginPath();ctx.moveTo(toX(target.x),toY(target.y));
    ctx.lineTo(toX(dock.x),toY(dock.y));
    ctx.setLineDash([9,7]);ctx.strokeStyle='#d8a15b';ctx.lineWidth=2;ctx.stroke();
    ctx.setLineDash([]);
  }
  for(const o of snapshot.objects){
    ctx.save();
    ctx.translate(toX(o.x),toY(o.y));
    ctx.rotate(-o.angle);ctx.fillStyle=color(o.color);
    if(o.kind==='object'){
      ctx.beginPath();ctx.arc(0,0,o.hx*unit,0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillRect(-o.hx*unit,-o.hy*unit,2*o.hx*unit,2*o.hy*unit);
    }
    const amberLookalike=o.kind==='object' && o.handle!==s.scenario.targetHandle &&
      o.color[0]>.75&&o.color[1]>.45&&o.color[1]<.8&&o.color[2]<.35;
    if(microscopeInput.checked&&(o.handle===s.scenario.targetHandle ||
      o.handle===s.scenario.dockHandle || amberLookalike)){
      ctx.fillStyle='#f3f7f9';ctx.textAlign='center';
      ctx.font='600 15px system-ui';
      ctx.fillText(o.handle===s.scenario.targetHandle?'RZECZ':
        o.handle===s.scenario.dockHandle?'DOK':'PODOBNY KOLOR',0,-o.hy*unit-12);
    }
    ctx.restore();
  }
  const a=snapshot.actor;
  ctx.fillStyle='#5d97d5';ctx.beginPath();
  ctx.arc(toX(a.x),toY(a.y),unit,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e3f0fa';ctx.lineWidth=3;ctx.beginPath();
  ctx.moveTo(toX(a.x),toY(a.y));
  ctx.lineTo(toX(a.x+1.25*Math.cos(a.angle)),toY(a.y+1.25*Math.sin(a.angle)));
  ctx.stroke();
  ctx.strokeStyle='#64d7cb';ctx.lineWidth=2;ctx.beginPath();
  ctx.moveTo(toX(a.x),toY(a.y));
  ctx.lineTo(toX(a.x+2.3*Math.cos(a.angle+snapshot.gaze)),
    toY(a.y+2.3*Math.sin(a.angle+snapshot.gaze)));
  ctx.stroke();
}
function drawRetina(){
  const f=s.scenario.world.observe();
  for(let i=0;i<96;i++){
    rctx.fillStyle=color([f.retina[i*3],f.retina[i*3+1],f.retina[i*3+2]]);
    rctx.fillRect(i,0,1,18);
  }
}
function update(){
  const host=s.scenario.world.inspect(),f=s.scenario.world.observe();
  const currentGap=gap(s),change=currentGap-s.initialGap;
  get<HTMLElement>('gap').textContent=currentGap.toFixed(2)+' m';
  get<HTMLElement>('tick').textContent=(host.tick/120).toFixed(1)+' s';
  get<HTMLElement>('change').textContent=(change>=0?'+':'')+change.toFixed(2)+' m';
  get<HTMLElement>('change').style.color=change>0.01?'#e7a9a3':change<-.01?'#a4e0c5':'#efcfaa';
  get<HTMLElement>('contacts').textContent=String(s.targetContactWindows)+' próbek';
  get<HTMLElement>('interventions').textContent=String(s.intervened);
  const state=s.controller?.state();
  const privateText=[
    'private frame tick: '+f.tick,
    'proprio forward: '+f.proprio.forward.toFixed(3),
    'proprio omega: '+f.proprio.omega.toFixed(3),
    'touch sectors: '+Array.from(f.touch).map(n=>n.toFixed(1)).join(' | '),
    'local control: '+(s.mode==='private-material-concern'?'target→dock':s.mode==='cheap-cyan-chase'?'visible cyan':'off'),
    'private state: '+JSON.stringify(state??'no decision process',null,1),
  ].join('\n');
  get<HTMLElement>('private').textContent=privateText;
  get<HTMLElement>('status').textContent=runtimeError??(fastForward?'Przeliczanie wszystkich kroków fizyki':
    document.hidden?'Karta ukryta — symulacja stoi':
    paused?'Pauza':manual?'Ciało pod kontrolą Ownera':'Działa bez Ownera');
  get<HTMLElement>('phase').textContent=s.intervened>0?
    'Interwencje Ownera: wynik NIE jest porównywalny z S0':
    host.tick>7200?'Poza zamrożonym oknem 60 s · swobodna kontynuacja':
    'Czysty start · bez interwencji Ownera';
  drawWorld();drawRetina();
}
let firstError=false;
function frame(ts:number){
  try{
    if(!lastTime)lastTime=ts;
    if(!paused&&!fastForward&&!document.hidden){
      const dt=Math.max(0,Math.min(.075,(ts-lastTime)/1000));
      accumulator+=dt*Number(speedInput.value);
      let n=0;
      while(accumulator>=E0_DT && n<50){step();accumulator-=E0_DT;n++;}
    }
    lastTime=ts;
    update();
  }catch(error){
    if(!firstError){
      firstError=true;runtimeError='Błąd symulacji — użyj „Nowy identyczny świat”';
      console.error(error);
    }
    paused=true;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
