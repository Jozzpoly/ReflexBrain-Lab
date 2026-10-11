import {LivingWorld,type Demand} from './world';
import {createWorldD0} from './world-ecology-d0';

type XY={x:number;y:number};
export type D1Scenario={
  world:LivingWorld;
  loadMaterialHandle:number;
  railHandle:number|null;
  gateHandle:number;
  plateHandle:number;
};
const OCHRE:[number,number,number]=[.88,.57,.19];
const INDIGO:[number,number,number]=[.74,.31,.83];
const GATE:[number,number,number]=[.82,.62,.25];

/**
 * D1 consciously composes with D0 rather than redesigning the whole map.
 * Plate: near east upper lane, same space as a periodic independent rail.
 * Gate: physical blocker of D0 upper crossing. Its x translation is powered
 * by the true overlap-plate signal, NOT a global timer or scenario phase.
 *
 * The lone loose mass is a separate way of sustaining pressure for as long
 * as it physically remains on the plate; its identity is not privileged.
 */
export function createWorldD1(railEnabled=true):D1Scenario{
  const s=createWorldD0(false),world=s.world;
  try{
    const {plateHandle,gateHandle}=world.addLoadCoupledGate(
      12.7,11.5,1.25,1,
      8,6.5,.48,2.45,3.8,GATE,
    );
    const loadMaterialHandle=world.addObject(18,13,.85,OCHRE);
    const railHandle=railEnabled?
      world.addRailMover(10,11.5,.7,INDIGO,10,16,2.6):null;
    return{world,plateHandle,gateHandle,loadMaterialHandle,railHandle};
  }catch(e){world.free();throw e;}
}
type GateSample={
  tick:number;loaded:boolean;loadCount:number;
  gateX:number;gateY:number;railX:number|null;
};
const EMPTY:Demand={drive:0,turn:0,gazeRate:0};
export type D1TemporalRun={
  railEnabled:boolean;
  tick:number;
  transitions:number;
  gateClearEntryTicks:number[];
  gateShutEntryTicks:number[];
  loadedEntryTicks:number[];
  freeBodyPosition:XY;
  last:GateSample;
  samples:GateSample[];
  uniquePrivateFrames:number;
};
export function runWorldD1(railEnabled=true,ticks=21600):D1TemporalRun{
  const s=createWorldD1(railEnabled),world=s.world;
  try{
    const samples:GateSample[]=[];
    let uniquePrivateFrames=0,lastPrivate=-1;
    let prevLoad=false,prevClear=false,prevShut=true;
    const loadedEntryTicks:number[]=[];
    const gateClearEntryTicks:number[]=[];
    const gateShutEntryTicks:number[]=[];
    for(let i=0;i<ticks;i++){
      const p=world.observe();
      if(p.tick!==lastPrivate){lastPrivate=p.tick;uniquePrivateFrames++;}
      world.step(EMPTY);
      const g=world.inspectGateLink();
      if(!g)throw Error('D1 link disappeared');
      const clear=g.gatePosition.x>11.1;
      const shut=g.gatePosition.x<8.8;
      if(g.loaded&&!prevLoad)loadedEntryTicks.push(i+1);
      if(clear&&!prevClear)gateClearEntryTicks.push(i+1);
      if(shut&&!prevShut)gateShutEntryTicks.push(i+1);
      prevLoad=g.loaded;prevClear=clear;prevShut=shut;
      if(i%12===11||i===ticks-1){
        const rail=s.railHandle===null?null:
          world.inspect().objects.find(o=>o.handle===s.railHandle);
        samples.push({
          tick:i+1,loaded:g.loaded,loadCount:g.lastLoadCount,
          gateX:g.gatePosition.x,gateY:g.gatePosition.y,
          railX:rail?.x??null,
        });
      }
    }
    const last=samples[samples.length-1];
    const a=world.inspect().actor;
    return{railEnabled,tick:ticks,transitions:world.inspectGateLink()!.loadTransitions,
      gateClearEntryTicks,gateShutEntryTicks,loadedEntryTicks,
      samples,last,freeBodyPosition:{x:a.x,y:a.y},uniquePrivateFrames};
  }finally{world.free();}
}

export type D1InterventionRun={
  positions:number[];
  loaded:boolean[];
  timeSteps:number[];
  transitions:number;
  actorStayedStill:boolean;
};
export function runD1MaterialIntervention():D1InterventionRun {
  const s=createWorldD1(false),w=s.world;
  try{
    const positions:number[]=[];
    const loaded:boolean[]=[];
    const timeSteps:number[]=[];
    let actorStayedStill=true;
    const sampleAfter=(ticks:number)=>{
      for(let t=0;t<ticks;t++){
        w.step(EMPTY);
        const a=w.inspect().actor;
        if(Math.hypot(a.x,a.y)>.001)actorStayedStill=false;
      }
      const g=w.inspectGateLink()!;
      positions.push(g.gatePosition.x);
      loaded.push(g.loaded);
      timeSteps.push(w.inspect().tick);
    };
    sampleAfter(360); // no plate load
    w.moveObject(s.loadMaterialHandle,12.7,11.5);sampleAfter(360);
    w.moveObject(s.loadMaterialHandle,18,13);sampleAfter(360);
    w.moveObject(s.loadMaterialHandle,12.7,11.5);sampleAfter(360);
    w.moveObject(s.loadMaterialHandle,18,13);sampleAfter(360);
    return{positions,loaded,timeSteps,
      transitions:w.inspectGateLink()!.loadTransitions,actorStayedStill};
  }finally{w.free();}
}

export type D1RouteRun={
  plateHeld:boolean;
  crossingTick:number|null;
  firstGateOpenTick:number|null;
  finalActor:XY;
  finalGateX:number;
};
export function runD1UpperRoute(plateHeld:boolean,maxTicks=3600):D1RouteRun {
  const s=createWorldD1(false),w=s.world;
  let crossingTick:number|null=null,firstGateOpenTick:number|null=null;
  const points=[{x:3,y:6.5},{x:9.8,y:6.5}];
  let index=0;
  const clamp=(v:number)=>Math.max(-1,Math.min(1,v));
  const wrap=(v:number)=>Math.atan2(Math.sin(v),Math.cos(v));
  try{
    if(plateHeld)w.moveObject(s.loadMaterialHandle,12.7,11.5);
    for(let t=0;t<360;t++)w.step(EMPTY); // ordinary mechanics settle, no instant gate teleport
    for(let t=0;t<maxTicks;t++){
      const h=w.inspect(),p=h.actor,goal=points[index];
      if(Math.hypot(p.x-goal.x,p.y-goal.y)<1.25&&index===0)index=1;
      const g=points[index];
      const angleError=wrap(Math.atan2(g.y-p.y,g.x-p.x)-p.angle);
      const frame=w.observe();
      const d:Demand={
        drive:Math.abs(angleError)<.5?.78:.05,
        turn:clamp(angleError*2-frame.proprio.omega*.75),
        gazeRate:0,
      };
      w.step(d);
      const now=w.inspect().actor;
      const gate=w.inspectGateLink()!;
      if(firstGateOpenTick===null&&gate.gatePosition.x>11.1)firstGateOpenTick=w.inspect().tick;
      // Must cross actual central lane, not leave via a side path around divider.
      if(crossingTick===null&&now.x>9.45&&Math.abs(now.y-6.5)<1.45){
        crossingTick=w.inspect().tick;break;
      }
    }
    const a=w.inspect().actor;
    return{plateHeld,crossingTick,firstGateOpenTick,
      finalActor:{x:a.x,y:a.y},finalGateX:w.inspectGateLink()!.gatePosition.x};
  }finally{w.free();}
}
