import type {Demand,PrivateFrame} from './world';
import {visibleTurquoisePatches} from './retina-geometry';
export const FORECAST_SECONDS=.2;
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
function patch(f:PrivateFrame){const p=visibleTurquoisePatches(f.retina);return p.length===1&&!p[0].clipped?p[0]:null;}
export function sensoryFeatures(previous:PrivateFrame,current:PrivateFrame,demand:Demand):number[]|null{
 const a=patch(previous),b=patch(current),dt=(current.tick-previous.tick)/120;
 if(!a||!b||dt<=0)return null;
 const x=[wrap(b.bearing-a.bearing)/dt*FORECAST_SECONDS,Math.log(b.extent/a.extent)/dt*FORECAST_SECONDS,
  b.bearing,Math.log(b.extent),current.proprio.forward*FORECAST_SECONDS,current.proprio.lateral*FORECAST_SECONDS,
  current.proprio.omega*FORECAST_SECONDS,current.proprio.gaze,demand.drive,demand.turn,demand.gazeRate];
 return x.every(Number.isFinite)?x:null;
}
export function sensoryTarget(current:PrivateFrame,future:PrivateFrame):number[]|null{
 if(future.tick-current.tick!==FORECAST_SECONDS*120)return null;
 const a=patch(current),b=patch(future);if(!a||!b)return null;
 return [wrap(b.bearing-a.bearing),Math.log(b.extent/a.extent)];
}
