import {initLivingWorld,LivingWorld,type BodyShape,type Demand} from './world';
import {Occupant} from './occupant';
import {E0_DT} from '../e0-body-seam';

type Unit={
  shape:BodyShape;world:LivingWorld;brain:Occupant;motor:Demand;
  canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;
  retina:HTMLCanvasElement;retinaCtx:CanvasRenderingContext2D;
  info:HTMLElement;cameraCenter:number;path:number;
  before:{x:number;y:number};touchWindows:number;materialTouched:number;
  visited:Set<string>;dragHandle:number|null;dragPointer:number|null;
};
const create=<T extends Element>(selector:string):T=>{
  const el=document.querySelector<T>(selector);
  if(!el)throw Error('Missing B1 field element '+selector);
  return el;
};
const runButton=create<HTMLButtonElement>('#run');
const pilotButton=create<HTMLButtonElement>('#pilot');
const time=create<HTMLElement>('#time');
const drive=create<HTMLInputElement>('#drive');
const turn=create<HTMLInputElement>('#turn');
const pressed=new Set<string>();
const round=(x:number)=>x.toFixed(2);
const scale=24;
const worldSpan=30;
const heightSpan=20;
const col=(rgb:number[])=>'rgb('+rgb.map(v=>Math.round(v*255)).join(',')+')';

let units:Unit[]=[];
let paused=false,manual=false,clock=0,acc=0;
function makeWorld(shape:BodyShape){
  const w=new LivingWorld(false,shape);
  // Same simple lawful matter field: one narrow passable corridor for the
  // aligned B1 body, alternative open space around it, loose material and a
  // genuinely autonomous physical rail body. No author-scripted objectives.
  w.addWall(5,1.65,2,.8,[.4,.4,.45]);
  w.addWall(5,-1.65,2,.8,[.4,.4,.45]);
  w.addObject(9,0,.55,[.1,.85,.8]);
  w.addObject(11,3,.9,[.75,.54,.25]);
  w.addRailMover(-4,-4.5,.65,[.6,.35,.9],-7,0,2);
  return w;
}
function make(i:number,shape:BodyShape):Unit{
  const canvas=create<HTMLCanvasElement>('#world'+i);
  const retina=create<HTMLCanvasElement>('#eye'+i);
  const world=makeWorld(shape);
  return {
    shape,world,brain:new Occupant(),motor:{drive:0,turn:0,gazeRate:0},
    canvas,ctx:canvas.getContext('2d')!,
    retina,retinaCtx:retina.getContext('2d')!,
    info:create<HTMLElement>('#stat'+i),cameraCenter:8,path:0,
    before:{x:0,y:0},touchWindows:0,materialTouched:0,
    visited:new Set<string>(),dragHandle:null,dragPointer:null
  };
}
function reset(){
  for(const u of units)u.world.free();
  units=[make(0,'B0'),make(1,'B1')];
  acc=0;clock=0;pressed.clear();drive.value='0';turn.value='0';
  installPointerHandlers();
  paint();
}
function sx(u:Unit,x:number){return (x-(u.cameraCenter-worldSpan/2))*scale;}
function sy(y:number){return (heightSpan/2-y)*scale;}
function fromPointer(u:Unit,e:PointerEvent){
  const r=u.canvas.getBoundingClientRect();
  const fx=(e.clientX-r.left)/r.width,fy=(e.clientY-r.top)/r.height;
  return {x:u.cameraCenter-worldSpan/2+fx*worldSpan,y:heightSpan/2-fy*heightSpan};
}
function installPointerHandlers(){
  // Assign once: the handlers read current Units to survive reset.
  if(installPointerHandlers.installed)return;
  installPointerHandlers.installed=true;
  for(let i=0;i<2;i++){
    const canvas=create<HTMLCanvasElement>('#world'+i);
    canvas.addEventListener('pointerdown',e=>{
      const u=units[i],p=fromPointer(u,e);
      const obj=u.world.inspect().objects.find(o=>
        o.kind==='object'&&Math.hypot(o.x-p.x,o.y-p.y)<=o.hx+0.30);
      if(obj){u.dragHandle=obj.handle;u.dragPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);}
    });
    canvas.addEventListener('pointermove',e=>{
      const u=units[i];if(u.dragHandle===null||u.dragPointer!==e.pointerId)return;
      const p=fromPointer(u,e);
      u.world.moveObject(u.dragHandle,p.x,p.y);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])
      canvas.addEventListener(type,()=>{units[i].dragHandle=null;units[i].dragPointer=null;});
  }
}
installPointerHandlers.installed=false;
function pilotCommand():Demand{
  const n=(up:string,down:string)=>Number(pressed.has(up))-Number(pressed.has(down));
  return {drive:Math.max(-1,Math.min(1,n('w','s')+Number(drive.value)/100)),
    turn:Math.max(-1,Math.min(1,n('a','d')+Number(turn.value)/100)),
    gazeRate:n('q','e')};
}
function step(){
  const cmd=pilotCommand();
  for(const u of units){
    const w=u.world;
    const f=w.observe();
    if(w.inspect().tick%4===0){
      const proposed=u.brain.decide(f);
      u.motor=manual?cmd:proposed;
      const pos=w.inspect().actor;
      u.visited.add(Math.floor(pos.x/2)+':'+Math.floor(pos.y/2));
    }else if(manual){u.motor=cmd;}
    w.step(u.motor);
    const pos=w.inspect().actor;
    u.path+=Math.hypot(pos.x-u.before.x,pos.y-u.before.y);
    u.before={x:pos.x,y:pos.y};
    if(w.inspect().tick%4===0){
      const c=w.inspectContactSample();
      if(c.contacts.length)u.touchWindows++;
      const handles=new Set(w.inspect().objects.filter(o=>o.kind==='object').map(o=>o.handle));
      if(c.contacts.some(e=>handles.has(e.handle)))u.materialTouched++;
    }
  }
}
function paint(){
  for(const u of units){
    const {ctx,canvas,retinaCtx,retina}=u;
    const s=u.world.inspect(),f=u.world.observe();
    u.cameraCenter=Math.max(8,s.actor.x);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#091923';ctx.fillRect(0,0,canvas.width,canvas.height);
    const left=u.cameraCenter-worldSpan/2;
    ctx.strokeStyle='#1b3442';ctx.lineWidth=1;
    for(let x=Math.floor(left);x<=left+worldSpan;x++){
      ctx.beginPath();ctx.moveTo(sx(u,x),0);ctx.lineTo(sx(u,x),canvas.height);ctx.stroke();
    }
    for(let y=-10;y<=10;y++){
      ctx.beginPath();ctx.moveTo(0,sy(y));ctx.lineTo(canvas.width,sy(y));ctx.stroke();
    }
    for(const o of s.objects){
      ctx.save();ctx.translate(sx(u,o.x),sy(o.y));ctx.rotate(-o.angle);
      ctx.fillStyle=col(o.color);
      if(o.kind==='object'){
        ctx.beginPath();ctx.arc(0,0,o.hx*scale,0,Math.PI*2);ctx.fill();
      }else{ctx.fillRect(-o.hx*scale,-o.hy*scale,2*o.hx*scale,2*o.hy*scale);}
      ctx.restore();
    }
    const a=s.actor;
    ctx.save();ctx.translate(sx(u,a.x),sy(a.y));ctx.rotate(-a.angle);
    ctx.fillStyle=u.shape==='B0'?'#69a6e4':'#71d6a5';
    ctx.strokeStyle='#f0fbff';ctx.lineWidth=2;
    ctx.beginPath();
    if(u.shape==='B0')ctx.arc(0,0,scale,0,Math.PI*2);
    else ctx.roundRect(-1.3*scale,-.65*scale,2.6*scale,1.3*scale,.65*scale);
    ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1.2*scale,0);ctx.stroke();
    ctx.restore();
    ctx.strokeStyle='#ffdc8b';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(sx(u,a.x),sy(a.y));
    ctx.lineTo(sx(u,a.x+2*Math.cos(a.angle+s.gaze)),
      sy(a.y+2*Math.sin(a.angle+s.gaze)));ctx.stroke();
    for(let k=0;k<96;k++){
      const rgb=Array.from(f.retina.slice(3*k,3*k+3));
      retinaCtx.fillStyle=col(rgb);retinaCtx.fillRect(k,0,1,retina.height);
    }
    // Research-only host microscope exports, never consumed by Occupant.
    const target=s.objects.find(o=>o.kind==='object'&&o.color[1]>.8&&o.color[2]>.6);
    u.canvas.dataset.tick=String(s.tick);
    u.canvas.dataset.actorX=String(a.x);
    u.canvas.dataset.actorY=String(a.y);
    u.canvas.dataset.cameraCenter=String(u.cameraCenter);
    u.canvas.dataset.targetX=String(target?.x??NaN);
    u.canvas.dataset.targetY=String(target?.y??NaN);
    u.canvas.dataset.dragHandle=String(u.dragHandle??'');
    u.canvas.dataset.manual=String(manual);
    const mode=u.brain.capture().mode;
    const touches=Array.from(f.touch).reduce((p,x)=>p+x,0);
    u.info.textContent=
      'Świat: '+round(s.tick/120)+'s · tryb: '+(manual?'RĘCZNIE':'AUTO / '+mode)+'\n'+
      'Pozycja ('+round(a.x)+', '+round(a.y)+') · ślad '+round(u.path)+'\n'+
      'Kontakt z materią: '+u.materialTouched+' okien · dotyk '+round(touches)+
      ' · pola 2m: '+u.visited.size;
  }
  time.textContent=(document.hidden?'Ukryta karta':paused?'Zatrzymane':manual?'Sterowanie ręczne':'Stary autorski Occupant')+
    ' · '+round(units[0]?.world.inspect().tick/120||0)+' s fizyki';
}
function loop(timestamp:number){
  if(!clock)clock=timestamp;
  if(!paused&&!document.hidden){
    acc+=Math.min(.09,(timestamp-clock)/1000);
    let steps=0;
    while(acc>=E0_DT&&steps++<13){step();acc-=E0_DT;}
  }
  clock=timestamp;paint();requestAnimationFrame(loop);
}
runButton.addEventListener('click',()=>{
  paused=!paused;acc=0;clock=0;runButton.textContent=paused?'Wznów':'Pauza';
});
pilotButton.addEventListener('click',()=>{
  manual=!manual;pressed.clear();drive.value='0';turn.value='0';
  pilotButton.textContent=manual?'Oddaj oba ciała':'Przejmij oba ciała';
});
create<HTMLButtonElement>('#reset').addEventListener('click',reset);
document.addEventListener('keydown',e=>{
  if(['w','a','s','d','q','e'].includes(e.key.toLowerCase())){
    if(document.activeElement?.tagName!=='INPUT'){e.preventDefault();pressed.add(e.key.toLowerCase());}
  }
});
document.addEventListener('keyup',e=>pressed.delete(e.key.toLowerCase()));
document.addEventListener('visibilitychange',()=>{
  pressed.clear();clock=0;acc=0;
});
window.addEventListener('blur',()=>pressed.clear());

await initLivingWorld();reset();requestAnimationFrame(loop);
