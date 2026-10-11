import {initLivingWorld, type Demand} from './world';
import {D0_ZONES} from './world-ecology-d0';
import {createWorldD1} from './world-ecology-d1';
import {E0_DT} from '../e0-body-seam';

const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=el<HTMLCanvasElement>('world'),ctx=canvas.getContext('2d')!;
const retina=el<HTMLCanvasElement>('retina'),rctx=retina.getContext('2d')!;
const status=el<HTMLElement>('status'),material=el<HTMLElement>('material');
const time=el<HTMLElement>('time'),info=el<HTMLElement>('private');
const plateLoad=el<HTMLElement>('plateLoad');
const pauseButton=el<HTMLButtonElement>('pause');
const cameraButton=el<HTMLButtonElement>('camera');
const speed=el<HTMLSelectElement>('speed'),rail=el<HTMLSelectElement>('rail');
const keys=new Set<string>();
const validKeys=new Set(['w','a','s','d','q','e']);
await initLivingWorld();
let scene=createWorldD1(true);
let paused=false,follow=false,dragging:number|null=null,interventions=0;
let last=0,acc=0;
const tracked=()=>scene.loadMaterialHandle;
const targetStart=()=>({x:18,y:13});
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const lens=()=>{
  const h=scene.world.inspect();
  return {
    centerX:follow?h.actor.x:0,centerY:follow?h.actor.y:0,
    scale:canvas.width/(follow?26:52),
  };
};
const screen=(x:number,y:number,l=lens())=>({
  x:canvas.width/2+(x-l.centerX)*l.scale,
  y:canvas.height/2-(y-l.centerY)*l.scale,
});
const worldPoint=(clientX:number,clientY:number)=>{
  const r=canvas.getBoundingClientRect();
  const p={x:(clientX-r.left)/r.width*canvas.width,
    y:(clientY-r.top)/r.height*canvas.height};
  const l=lens();
  return{x:l.centerX+(p.x-canvas.width/2)/l.scale,
    y:l.centerY-(p.y-canvas.height/2)/l.scale};
};
function reset(){
  scene.world.free();
  scene=createWorldD1(rail.value==='on');
  keys.clear();dragging=null;acc=0;last=0;paused=false;interventions=0;
  pauseButton.textContent='Pauza';
}
el<HTMLButtonElement>('reset').addEventListener('click',reset);
rail.addEventListener('change',reset);
speed.addEventListener('change',()=>{last=0;acc=0;});
pauseButton.addEventListener('click',()=>{
  paused=!paused;keys.clear();acc=0;last=0;
  pauseButton.textContent=paused?'Wznów':'Pauza';
});
cameraButton.addEventListener('click',()=>{
  follow=!follow;cameraButton.textContent=follow?'Kamera: śledź ciało':'Kamera: całość';
});
canvas.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if(validKeys.has(key)){e.preventDefault();keys.add(key);}
});
canvas.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{keys.clear();last=0;acc=0;});
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  e.preventDefault(); // avoid native pointer focus/scroll before hit testing
  // Focusing a mostly-below-fold canvas may scroll the document between
  // pointerdown and coordinate conversion. Keep the original geometry.
  const p=worldPoint(e.clientX,e.clientY);
  canvas.focus({preventScroll:true});
  canvas.dataset.pointerWorldX=String(p.x);
  canvas.dataset.pointerWorldY=String(p.y);
  const s=scene.world.inspect();
  const candidate=s.objects.filter(o=>o.kind==='object')
    .sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))
    .find(o=>Math.hypot(o.x-p.x,o.y-p.y)<=o.hx);
  canvas.dataset.selectedHandle=candidate?String(candidate.handle):'none';
  if(candidate){dragging=candidate.handle;canvas.setPointerCapture(e.pointerId);}
});
canvas.addEventListener('pointermove',e=>{
  if(dragging===null)return;
  const p=worldPoint(e.clientX,e.clientY);
  scene.world.moveObject(dragging,p.x,p.y);interventions++;
});
const release=()=>{dragging=null;};
canvas.addEventListener('pointerup',release);
canvas.addEventListener('pointercancel',release);
function tick(){
  const command:Demand={
    drive:Number(keys.has('w'))-Number(keys.has('s')),
    turn:Number(keys.has('a'))-Number(keys.has('d')),
    gazeRate:Number(keys.has('q'))-Number(keys.has('e')),
  };
  scene.world.step(command);
}
function color(rgb:readonly number[]){
  return 'rgb('+rgb.map(n=>Math.round(clamp(n,0,1)*255)).join(',')+')';
}
function draw(){
  const s=scene.world.inspect(),f=scene.world.observe(),l=lens();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.lineWidth=1;ctx.strokeStyle='#183441';
  const minX=l.centerX-canvas.width/l.scale/2,maxX=l.centerX+canvas.width/l.scale/2;
  const minY=l.centerY-canvas.height/l.scale/2,maxY=l.centerY+canvas.height/l.scale/2;
  for(let x=Math.floor(minX/2)*2;x<=maxX;x+=2){
    const a=screen(x,minY,l),b=screen(x,maxY,l);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  for(let y=Math.floor(minY/2)*2;y<=maxY;y+=2){
    const a=screen(minX,y,l),b=screen(maxX,y,l);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  ctx.font='500 18px system-ui';ctx.fillStyle='#436170';
  for(const z of D0_ZONES){
    const p=screen(z.center.x,z.center.y-11,l);
    ctx.fillText(z.label,p.x-55,p.y);
  }
  const gate=scene.world.inspectGateLink();
  if(!gate)throw Error('D1 physics gate not installed');
  // Researcher-only annotation: plate sensor is not an occluding 2D object,
  // and this cause indicator is NEVER included in actor private retina.
  const plate=screen(gate.platePosition.x,gate.platePosition.y,l);
  ctx.strokeStyle=gate.loaded?'#89eed0':'#be8d4b';
  ctx.lineWidth=3;ctx.strokeRect(plate.x-1.25*l.scale,plate.y-1*l.scale,2.5*l.scale,2*l.scale);
  ctx.setLineDash([5,6]);ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(plate.x,plate.y);
  const gp=screen(gate.gatePosition.x,gate.gatePosition.y,l);
  ctx.lineTo(gp.x,gp.y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  for(const o of s.objects){
    const pos=screen(o.x,o.y,l);
    ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(-o.angle);
    ctx.fillStyle=color(o.color);
    if(o.kind!=='object'){ctx.fillRect(-o.hx*l.scale,-o.hy*l.scale,2*o.hx*l.scale,2*o.hy*l.scale);}
    else{
      ctx.beginPath();ctx.arc(0,0,o.hx*l.scale,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#edf5f9';ctx.globalAlpha=.22;ctx.lineWidth=1.5;ctx.stroke();
    }
    ctx.restore();
  }
  const a=s.actor,p=screen(a.x,a.y,l);
  ctx.fillStyle='#66a6dd';ctx.beginPath();ctx.arc(p.x,p.y,l.scale,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e4f6ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(p.x,p.y);
  ctx.lineTo(p.x+Math.cos(a.angle)*1.5*l.scale,p.y-Math.sin(a.angle)*1.5*l.scale);ctx.stroke();
  ctx.strokeStyle='#6be1bd';ctx.beginPath();ctx.moveTo(p.x,p.y);
  ctx.lineTo(p.x+Math.cos(a.angle+s.gaze)*3*l.scale,p.y-Math.sin(a.angle+s.gaze)*3*l.scale);ctx.stroke();
  for(let i=0;i<96;i++){
    rctx.fillStyle=color([f.retina[3*i],f.retina[3*i+1],f.retina[3*i+2]]);
    rctx.fillRect(i,0,1,15);
  }
  const target=s.objects.find(o=>o.handle===tracked());
  if(!target)throw Error('Lost tracked World material');
  const displacement=Math.hypot(target.x-targetStart().x,target.y-targetStart().y);
  material.textContent=(gate.gatePosition.x-8).toFixed(2)+' / 3.80 j.';
  plateLoad.textContent=gate.loaded?'Obciążona ('+gate.lastLoadCount+')':'Wolna';
  time.textContent=(s.tick/120).toFixed(1)+' s';
  info.textContent='Prywatna klatka: '+f.tick+
    '\nPrędkość własna: '+f.proprio.forward.toFixed(2)+
    '\nObrót: '+f.proprio.omega.toFixed(2)+
    '\nWzrok: '+(f.proprio.gaze*180/Math.PI).toFixed(0)+'°'+
    '\nDotyk: '+Array.from(f.touch).map(x=>x.toFixed(1)).join(' ')+
    '\nInterwencje badacza: '+interventions;
  status.textContent=(document.hidden?'Karta ukryta':
    paused?'Pauza':'Fizyka działa bez aktora autonomicznego');
  canvas.dataset.tick=String(s.tick);
  canvas.dataset.actorX=String(a.x);
  canvas.dataset.actorY=String(a.y);
  canvas.dataset.trackedX=String(target.x);
  canvas.dataset.trackedY=String(target.y);
  canvas.dataset.gateX=String(gate.gatePosition.x);
  canvas.dataset.plateLoaded=String(gate.loaded);
  canvas.dataset.plateCount=String(gate.lastLoadCount);
  canvas.dataset.materialDisplacement=String(displacement);
}
function frame(ts:number){
  if(!last)last=ts;
  if(!document.hidden&&!paused){
    acc+=Math.min(.07,(ts-last)/1000)*Number(speed.value);
    let budget=0;
    while(acc>=E0_DT&&budget<25){tick();acc-=E0_DT;budget++;}
  }
  last=ts;
  draw();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
