import { LivingWorld, initLivingWorld, type Checkpoint } from './world';
import { E0_DT } from '../e0-body-seam';
const canvas=document.querySelector<HTMLCanvasElement>('#world')!;
const ctx=canvas.getContext('2d')!;
const retina=document.querySelector<HTMLCanvasElement>('#retina')!;
const rctx=retina.getContext('2d')!;
const status=document.querySelector<HTMLElement>('#status')!;
const info=document.querySelector<HTMLElement>('#private')!;
await initLivingWorld();
let world=new LivingWorld(),paused=false,last=0,acc=0,checkpoint:Checkpoint|null=null;
const keys=new Set<string>();
const x=(v:number)=>(v+11)/22*canvas.width,y=(v:number)=>(7-v)/14*canvas.height;
const point=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*22-11,y:7-(e.clientY-r.top)/r.height*14};};
let dragging:number|null=null;
canvas.addEventListener('pointerdown',e=>{
  canvas.focus();const p=point(e),s=world.inspect();
  const hit=s.objects.find(o=>o.kind==='object'&&Math.hypot(o.x-p.x,o.y-p.y)<o.hx);
  if(hit){dragging=hit.handle;canvas.setPointerCapture(e.pointerId);}
});
canvas.addEventListener('pointermove',e=>{if(dragging!==null){const p=point(e);world.moveObject(dragging,p.x,p.y);}});
const release=()=>{dragging=null;};
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('keydown',e=>{if(['w','a','s','d','q','e'].includes(e.key.toLowerCase())){e.preventDefault();keys.add(e.key.toLowerCase());}});
canvas.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
canvas.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{keys.clear();last=0;acc=0;});
document.querySelector('#pause')!.addEventListener('click',()=>{paused=!paused;keys.clear();last=0;acc=0;document.querySelector('#pause')!.textContent=paused?'Wznów':'Pauza';});
document.querySelector('#save')!.addEventListener('click',()=>{checkpoint=world.captureCheckpoint();document.querySelector<HTMLButtonElement>('#restore')!.disabled=false;});
document.querySelector('#restore')!.addEventListener('click',()=>{if(checkpoint){world.restoreCheckpoint(checkpoint);last=0;acc=0;keys.clear();}});
document.querySelector('#reset')!.addEventListener('click',()=>{world.free();world=new LivingWorld();checkpoint=null;document.querySelector<HTMLButtonElement>('#restore')!.disabled=true;last=0;acc=0;keys.clear();});
function draw(){
  const s=world.inspect(),f=world.observe();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#1c3040';ctx.lineWidth=1;
  for(let i=-10;i<=10;i++){ctx.beginPath();ctx.moveTo(x(i),y(-6));ctx.lineTo(x(i),y(6));ctx.stroke();}
  for(let i=-6;i<=6;i++){ctx.beginPath();ctx.moveTo(x(-10),y(i));ctx.lineTo(x(10),y(i));ctx.stroke();}
  for(const o of s.objects){
    ctx.save();ctx.translate(x(o.x),y(o.y));ctx.rotate(-o.angle);ctx.fillStyle='rgb('+o.color.map(c=>Math.round(c*255)).join(',')+')';
    if(o.kind==='object'){ctx.beginPath();ctx.arc(0,0,o.hx/22*canvas.width,0,Math.PI*2);ctx.fill();}
    else ctx.fillRect(-o.hx/22*canvas.width,-o.hy/14*canvas.height,o.hx*2/22*canvas.width,o.hy*2/14*canvas.height);
    ctx.restore();
  }
  const a=s.actor;
  ctx.fillStyle='#5c94d2';ctx.beginPath();ctx.arc(x(a.x),y(a.y),canvas.width/22,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#d9e7fb';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x(a.x),y(a.y));ctx.lineTo(x(a.x+Math.cos(a.angle)),y(a.y+Math.sin(a.angle)));ctx.stroke();
  ctx.strokeStyle='#72dfc8';ctx.beginPath();ctx.moveTo(x(a.x),y(a.y));ctx.lineTo(x(a.x+2*Math.cos(a.angle+s.gaze)),y(a.y+2*Math.sin(a.angle+s.gaze)));ctx.stroke();
  for(let i=0;i<96;i++){rctx.fillStyle='rgb('+Array.from(f.retina.slice(i*3,i*3+3)).map(v=>Math.round(v*255)).join(',')+')';rctx.fillRect(i,0,1,16);}
  info.textContent='Krok: '+f.tick+'\nWzrok: '+(f.proprio.gaze*180/Math.PI).toFixed(1)+'°\nRuch własny: '+f.proprio.forward.toFixed(2)+'\nObrót: '+f.proprio.omega.toFixed(2)+'\nDotyk: '+Array.from(f.touch).map(x=>x.toFixed(2)).join(' ');
  status.textContent=(document.hidden?'Zawieszona karta':paused?'Pauza':'Sterowanie ręczne')+' · '+(s.tick/120).toFixed(1)+' s symulacji';
}
function frame(ts:number){
  if(!last)last=ts;
  if(!paused&&!document.hidden){acc+=Math.min(.08,(ts-last)/1000);let n=0;while(acc>=E0_DT&&n++<12){
    world.step({drive:Number(keys.has('w'))-Number(keys.has('s')),turn:Number(keys.has('a'))-Number(keys.has('d')),gazeRate:Number(keys.has('q'))-Number(keys.has('e'))});acc-=E0_DT;
  }}
  last=ts;draw();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
