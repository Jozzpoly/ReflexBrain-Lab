import { LivingWorld,type Demand,type PrivateFrame } from './world';
import { retinalAngle,visibleTurquoisePatches } from './retina-geometry';

export type MaterialMode='world-only'|'cheap-cyan-chase'|'private-material-concern';
export type MaterialRun={
  mode:MaterialMode;
  ticks:number;
  startCenterDistance:number;
  endCenterDistance:number;
  initialSurfaceGap:number;
  finalSurfaceGap:number;
  targetDisplacement:number;
  actorPath:number;
  targetContactWindows:number;
  visibleTargetFrames:number;
  visibleDockFrames:number;
  finalPrivateState:unknown;
  finite:boolean;
};
export type MaterialSurvey={
  status:'ENGINEERING_DISCOVERY_ONLY';
  deterministic:boolean;
  actorCausalDisplacement:Record<MaterialMode,number>;
  results:MaterialRun[];
  notes:string[];
};
const MAX_TICKS=7200;
const DT=1/120;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const wrap=(v:number)=>Math.atan2(Math.sin(v),Math.cos(v));
type Point={x:number;y:number};
type Patch={bearing:number;extent:number;clipped:boolean};
function amberPatches(retina:Float32Array):Patch[]{
  const result:Patch[]=[];
  for(let i=0;i<96;i++){
    const colored=(j:number)=>retina[j*3]>.75&&retina[j*3+1]>.45&&retina[j*3+1]<.8&&retina[j*3+2]<.35;
    if(!colored(i))continue;
    const start=i;while(i+1<96&&colored(i+1))i++;
    const from=retinalAngle(start/96*2-1);
    const to=retinalAngle((i+1)/96*2-1);
    result.push({bearing:(from+to)/2,extent:to-from,clipped:start===0||i===95});
  }
  return result;
}
function vectorFromPatch(p:Patch, radius:number):Point|null{
  if(p.clipped||p.extent<.018)return null;
  // This size is an AUTHORED visual prior, not World-state access.
  const d=clamp(radius/Math.sin(p.extent/2),.5,12);
  return{x:d*Math.cos(p.bearing),y:d*Math.sin(p.bearing)};
}
function localToPrivate(body:Point,heading:number,v:Point):Point{
  return{x:body.x+Math.cos(heading)*v.x-Math.sin(heading)*v.y,
    y:body.y+Math.sin(heading)*v.x+Math.cos(heading)*v.y};
}
function privateToLocal(body:Point,heading:number,p:Point):Point{
  const x=p.x-body.x,y=p.y-body.y;
  return{x:Math.cos(heading)*x+Math.sin(heading)*y,
    y:-Math.sin(heading)*x+Math.cos(heading)*y};
}
class MaterialConcern {
  private tick:number|null=null;
  private heading=0;
  private position:Point={x:0,y:0};
  private seenTarget:{p:Point;tick:number}|null=null;
  private seenDock:{p:Point;tick:number}|null=null;
  private modes:Record<string,number>={};
  private lastDemand:Demand={drive:0,turn:0,gazeRate:0};
  private readonly maxMemoryAge=600;
  decide(f:PrivateFrame):Demand{
    if(this.tick!==null&&f.tick<=this.tick)return {...this.lastDemand};
    const dt=this.tick===null?0:(f.tick-this.tick)*DT;
    this.tick=f.tick;
    this.heading=wrap(this.heading+f.proprio.omega*dt);
    this.position={
      x:this.position.x+(f.proprio.forward*Math.cos(this.heading)-f.proprio.lateral*Math.sin(this.heading))*dt,
      y:this.position.y+(f.proprio.forward*Math.sin(this.heading)+f.proprio.lateral*Math.cos(this.heading))*dt,
    };
    const cyan=visibleTurquoisePatches(f.retina).sort((a,b)=>b.extent-a.extent)[0];
    const amber=amberPatches(f.retina).sort((a,b)=>b.extent-a.extent)[0];
    if(cyan){
      const candidate=vectorFromPatch(cyan,.55);
      if(candidate){
        const v=localToPrivate(this.position,this.heading,
          {x:candidate.x*Math.cos(f.proprio.gaze)-candidate.y*Math.sin(f.proprio.gaze),
            y:candidate.x*Math.sin(f.proprio.gaze)+candidate.y*Math.cos(f.proprio.gaze)});
        this.seenTarget={p:v,tick:f.tick};
      }
    }
    if(amber){
      const candidate=vectorFromPatch(amber,.5);
      if(candidate){
        const v=localToPrivate(this.position,this.heading,
          {x:candidate.x*Math.cos(f.proprio.gaze)-candidate.y*Math.sin(f.proprio.gaze),
            y:candidate.x*Math.sin(f.proprio.gaze)+candidate.y*Math.cos(f.proprio.gaze)});
        this.seenDock={p:v,tick:f.tick};
      }
    }
    if(this.seenTarget&&f.tick-this.seenTarget.tick>this.maxMemoryAge)this.seenTarget=null;
    if(this.seenDock&&f.tick-this.seenDock.tick>this.maxMemoryAge)this.seenDock=null;
    let mode='look',desired=0,drive=0;
    if(this.seenTarget&&this.seenDock){
      const t=privateToLocal(this.position,this.heading,this.seenTarget.p);
      const dock=privateToLocal(this.position,this.heading,this.seenDock.p);
      const delta={x:dock.x-t.x,y:dock.y-t.y};
      const dist=Math.hypot(delta.x,delta.y);
      if(dist<1.3){
        mode='monitor'; desired=0;drive=0;
      }else{
        const unit={x:delta.x/dist,y:delta.y/dist};
        const behind={x:t.x-unit.x*1.75,y:t.y-unit.y*1.75};
        if(Math.hypot(behind.x,behind.y)>.6){
          mode='reposition';desired=Math.atan2(behind.y,behind.x);
          drive=Math.abs(desired)<.3?.6:.15;
        }else{
          mode='push';desired=Math.atan2(t.y,t.x);
          drive=Math.abs(desired)<.32?.85:.13;
        }
      }
    }else{
      mode='reacquire';desired=this.seenTarget?
        Math.atan2(privateToLocal(this.position,this.heading,this.seenTarget.p).y,
          privateToLocal(this.position,this.heading,this.seenTarget.p).x) : .8;
      drive=this.seenTarget?.1:0;
    }
    // No touch collider identity; physical touch can only oppose generic drive.
    const touch=Math.max(...f.touch);
    if(touch>.2 && mode==='reposition')drive=0;
    const turn=clamp(desired*1.8-f.proprio.omega*.4,-1,1);
    this.modes[mode]=(this.modes[mode]||0)+1;
    this.lastDemand={drive,turn,gazeRate:0};
    return {...this.lastDemand};
  }
  state(){return{lastTick:this.tick,heading:this.heading,position:this.position,
    seenTargetAge:this.seenTarget?this.tick!-this.seenTarget.tick:null,
    seenDockAge:this.seenDock?this.tick!-this.seenDock.tick:null,modes:this.modes,
    valid:[this.heading,this.position.x,this.position.y].every(Number.isFinite)};}
}
class CheapChase{
  private lastTick:number|null=null;
  private demand:Demand={drive:0,turn:0,gazeRate:0};
  decide(f:PrivateFrame):Demand{
    if(this.lastTick===f.tick)return {...this.demand};
    this.lastTick=f.tick;
    const p=visibleTurquoisePatches(f.retina).sort((a,b)=>b.extent-a.extent)[0];
    const bearing=p?.bearing??.65;
    this.demand={drive:p?(Math.abs(bearing)<.3?.65:.08):.03,
      turn:clamp(bearing*1.8-f.proprio.omega*.4,-1,1),gazeRate:0};
    return {...this.demand};
  }
  state(){return{lastTick:this.lastTick,demand:this.demand};}
}
function simulate(mode:MaterialMode):MaterialRun {
  const world=new LivingWorld(true);
  try{
    // Same physical seed for each arm. Existing two turquoise lookalikes
    // removed before the autonomous run starts, not during actor life.
    const originalCyan=world.inspect().objects.filter(o=>o.kind==='object' &&
      o.color[0]<.3&&o.color[1]>.65&&o.color[2]>.6);
    for(let i=0;i<originalCyan.length;i++){
      world.moveObject(originalCyan[i].handle,50+2*i,50);
    }
    const target=world.addObject(2,-3,.55,[.1,.85,.8]);
    const dock=world.addWall(5.5,-4,.5,.25,[.95,.65,.15]);
    const get=(id:number)=>world.inspect().objects.find(o=>o.handle===id)!;
    const initialT=get(target),initialD=get(dock);
    const startCenterDistance=Math.hypot(initialT.x-initialD.x,initialT.y-initialD.y);
    const radius=.55;
    const initialSurfaceGap=Math.max(0,startCenterDistance-radius-.5);
    const brain=mode==='private-material-concern'?new MaterialConcern():
      mode==='cheap-cyan-chase'?new CheapChase():null;
    let issued:Demand={drive:0,turn:0,gazeRate:0};
    let visibleTargetFrames=0,visibleDockFrames=0;
    let targetContactWindows=0,actorPath=0;
    let last=world.inspect().actor;
    let finite=true;
    for(let tick=0;tick<MAX_TICKS;tick++){
      const f=world.observe();
      if(f.tick%4===0){
        if(visibleTurquoisePatches(f.retina).length)visibleTargetFrames++;
        if(amberPatches(f.retina).length)visibleDockFrames++;
        issued=brain?brain.decide(f):{drive:0,turn:0,gazeRate:0};
      }
      world.step(issued);
      const host=world.inspect(),a=host.actor;
      actorPath+=Math.hypot(a.x-last.x,a.y-last.y);
      last=a;
      finite &&=[a.x,a.y,a.vx,a.vy].every(Number.isFinite);
      const contact=world.inspectContactSample();
      if(contact.tick===host.tick&&contact.contacts.some(c=>c.handle===target))
        targetContactWindows++;
    }
    const finalT=get(target),finalD=get(dock);
    const endCenterDistance=Math.hypot(finalT.x-finalD.x,finalT.y-finalD.y);
    return{mode,ticks:MAX_TICKS,startCenterDistance,endCenterDistance,
      initialSurfaceGap,finalSurfaceGap:Math.max(0,endCenterDistance-radius-.5),
      targetDisplacement:Math.hypot(finalT.x-initialT.x,finalT.y-initialT.y),
      actorPath,targetContactWindows,visibleTargetFrames,visibleDockFrames,
      finalPrivateState:brain?.state()??null,finite};
  }finally{world.free();}
}
function runOnce():MaterialRun[]{return (['world-only','cheap-cyan-chase',
  'private-material-concern'] as MaterialMode[]).map(simulate);}
export function runMaterialRelationSlice():MaterialSurvey {
  const results=runOnce(),repeat=runOnce();
  const deterministic=JSON.stringify(results)===JSON.stringify(repeat);
  const worldOnly=results[0].targetDisplacement;
  const actorCausalDisplacement=Object.fromEntries(results.map(r=>
    [r.mode,r.targetDisplacement-worldOnly])) as Record<MaterialMode,number>;
  const notes:string[]=[];
  if(results.some(r=>!r.finite))notes.push('Nonfinite World state');
  if(results.some(r=>r.visibleTargetFrames===0||r.visibleDockFrames===0))
    notes.push('The chosen native RGB camera could not see one legal color cue');
  if(results[2].targetContactWindows===0)
    notes.push('No actual target contact from authored material concern');
  if(results[2].finalSurfaceGap>=Math.min(results[0].finalSurfaceGap,results[1].finalSurfaceGap))
    notes.push('Material relation did not improve over strongest cheap World control');
  if(!deterministic)notes.push('Non-deterministic replay');
  return{status:'ENGINEERING_DISCOVERY_ONLY',deterministic,
    actorCausalDisplacement,results,notes};
}
export const MATERIAL_SLICE={ticks:MAX_TICKS,modes:
  ['world-only','cheap-cyan-chase','private-material-concern'] as const};
