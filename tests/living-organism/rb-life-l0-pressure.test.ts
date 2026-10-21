import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,type BodyShape} from '../../src/living-organism/world';
import {DevRuntime,type DevLayout} from '../../src/living-organism/dev-runtime';
import type {DevMode} from '../../src/living-organism/dev-resident';

type Arm={shape:BodyShape;layout:DevLayout;mode:DevMode};
const arms:Arm[]=[
 {shape:'B1',layout:'yard',mode:'adaptive'},
 {shape:'B1',layout:'yard',mode:'frozen'},
 {shape:'B1',layout:'shifted',mode:'adaptive'},
 {shape:'B1',layout:'shifted',mode:'frozen'},
 {shape:'B0',layout:'yard',mode:'adaptive'},
 {shape:'B0',layout:'shifted',mode:'adaptive'},
];
const TICKS=14400; // 120s World time, 120Hz.
function audit(arm:Arm) {
 const r=new DevRuntime(arm.mode,arm.shape,arm.layout,1183);
 const start=r.world.inspect();
 const loose=new Set(start.objects.filter(o=>o.kind==='object'&&
  o.handle!==r.hostMoverHandle).map(o=>o.handle));
 const walls=new Set(start.objects.filter(o=>o.kind!=='object').map(o=>o.handle));
 const begin=new Map(start.objects.filter(o=>loose.has(o.handle)).map(o=>[o.handle,{x:o.x,y:o.y}]));
 const windowRows=[];
 let prev=start.actor;
 let totalContact=0,totalActorTouch=0;
 let neverSeenVisual=0;
 const totalCases=new Set<string>();
 let totalPath=0,totalStalls=0;
 const snapshots=[];
 let quarterPath=0,quarterStall=0,quarterVision=0,quarterTouches=0,quarterContacts=0;
 let wall=0,looseContact=0,mover=0,unknown=0;
 const episodes=new Map<number,number>();
 const lastContactWindow=new Map<number,number>();
 const contactRuns=new Map<number,number>();
 try {
  for(let t=1;t<=TICKS;t++){
   const decision=r.resident.capture();
   const currentDemand=decision.lastDemand;
   r.step();
   const w=r.world.inspect(),a=w.actor;
   const stepPath=Math.hypot(a.x-prev.x,a.y-prev.y);
   totalPath+=stepPath;quarterPath+=stepPath;prev=a;
   if(t%4===0){
    const f=r.world.observe();
    const visual=f.retina.some((v,i)=>Math.abs(v-([.025,.04,.06][i%3]))>1e-4);
    quarterVision+=Number(visual);
    neverSeenVisual+=Number(!visual);
    if(Array.from(f.touch).some(v=>Math.abs(v)>.005)){
     totalActorTouch++;quarterTouches++;
    }
    const movement=Math.hypot(a.vx,a.vy);
    const stall=movement<.15&&currentDemand.drive>.25;
    quarterStall+=Number(stall);totalStalls+=Number(stall);
    totalCases.add(Math.floor(a.x/4)+':'+Math.floor(a.y/4));
    const c=r.world.inspectContactSample();
    let any=false;
    for(const e of c.contacts){
     any=true;
     if(walls.has(e.handle))wall++;
     else if(loose.has(e.handle))looseContact++;
     else if(e.handle===r.hostMoverHandle)mover++;
     else unknown++;
     const last=lastContactWindow.get(e.handle);
     if(last===undefined||t-last>8)contactRuns.set(e.handle,(contactRuns.get(e.handle)||0)+1);
     lastContactWindow.set(e.handle,t);
     episodes.set(e.handle,(episodes.get(e.handle)||0)+1);
    }
    totalContact+=Number(any);quarterContacts+=Number(any);
    if(t%3600===0){
     const materialNow=r.world.inspect().objects.filter(o=>loose.has(o.handle));
     const materialMotion=materialNow.reduce((sum,o)=>{
      const p=begin.get(o.handle)!;
      return sum+Math.hypot(o.x-p.x,o.y-p.y);
     },0);
     windowRows.push({
      quarter:t/3600,path:quarterPath,visitedCellsSoFar:totalCases.size,
      visibleNonbackground:quarterVision,privateTouchWindows:quarterTouches,
      hostContactWindows:quarterContacts,positiveDriveStallWindows:quarterStall,
      accumulatedLooseBodyDisplacement:materialMotion
     });
     quarterPath=0;quarterStall=0;quarterVision=0;quarterTouches=0;quarterContacts=0;
     snapshots.push({tick:t,learned:r.resident.capture().learnedTrials,
      chosen:r.resident.capture().chosen});
    }
   }
  }
  const s=r.resident.capture();
  return {...arm,frames:TICKS/4,totalPath,visited4mCells:totalCases.size,
   hostContactWindows:totalContact,privateTouchWindows:totalActorTouch,
   positiveDriveStallWindows:totalStalls,
   retinaOnlyBackgroundWindows:neverSeenVisual,
   sampledHostContactEvents:{walls:wall,looseBodies:looseContact,mover,unknown},
   distinctMaterialContacts:[...episodes.entries()].filter(([handle])=>loose.has(handle)).length,
   repeatedLooseBodyContactEpisodes:[...contactRuns.entries()]
    .filter(([handle])=>loose.has(handle)).reduce((s,[,n])=>s+n,0),
   finalLearner:{trials:s.trials,learned:s.learnedTrials,chosen:s.chosen,
    scored:s.stats.map(row=>row.map(x=>({n:x.count,mean:x.count?x.sum/x.count:null})))},
   quarters:windowRows,snapshots,finite:[totalPath,wall,looseContact,mover].every(Number.isFinite)};
 }finally{r.free();}
}
describe('RB-LIFE/L0 — ordinary 120-second lived pressure, no prescribed task action',()=>{
 beforeAll(initLivingWorld);
 it('audits independent matter and recurrent physical contact without turning World information into actor labels',()=>{
  const rows=arms.map(audit);
  expect(rows).toHaveLength(6);
  expect(rows.every(x=>x.frames===3600&&x.quarters.length===4&&x.finite)).toBe(true);
  expect(rows.every(x=>x.sampledHostContactEvents.unknown===0)).toBe(true);
  expect(rows.filter(x=>x.mode==='adaptive').every(x=>x.finalLearner.learned>0)).toBe(true);
  expect(rows.filter(x=>x.mode==='frozen').every(x=>x.finalLearner.learned===0)).toBe(true);
  console.log('RB_LIFE_L0_RESULT '+JSON.stringify({scope:'descriptive real World activity, NOT learned meaning',rows}));
 },240000);
});
