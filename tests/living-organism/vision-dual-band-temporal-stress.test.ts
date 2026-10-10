import { beforeAll, describe, expect, it } from 'vitest';
import { E0_RAPIER as R } from '../../src/e0-body-seam';
import { LivingWorld, initLivingWorld } from '../../src/living-organism/world';
import { retinalAngle } from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/A4 adversarial TEMPORAL dual-band sensor; NOT native LivingWorld.
 * All variants cast precisely 96 12m RGB rays for each of six 30-Hz frames
 * from identical Rapier snapshot after host-independent event motion.
 * Host knows obstacle movement; focus selection only knows initial RGB cue.
 * No motion decision/learner and no claim of physical collision avoidance.
 */
const RAD=Math.PI/180;
const GREY=[.36,.41,.46] as const;
const RED=[.92,.12,.08] as const;
const CYAN=[.08,.88,.93] as const;
const ORANGE=[.9,.55,.13] as const;
const BACK=[.025,.04,.06] as const;
type Profile='wide96'|'focus96'|'dual80-16'|'dual80-16-shift'
  |'dual64-32'|'dual48-48';
const PROFILES:readonly Profile[]=['wide96','focus96',
 'dual80-16','dual80-16-shift','dual64-32','dual48-48'];
type Setup={eventBearing:number;eventRadius:number;duration:number};
type Frame={angles:number[];rgb:Float32Array;tick:number};
type Row={setup:Setup;profile:Profile;raycasts:number;
 firstEventTick:number|null;firstDetailTick:number|null;
 eventFrames:number;detailFrames:number;wrongFrames:number;sampledFrames:number};
const EVENT_BEARINGS=[-64,-62,-60,-58,-56,-54,-52,-50,-48];
const EVENT_RADII=[.12,.25,.45];
const DURATIONS=[1,2,3];
const FRAME_COUNT=6,EVENT_START=2;
const SPECIMENS:Setup[]=EVENT_BEARINGS.flatMap(eventBearing=>
 EVENT_RADII.flatMap(eventRadius=>DURATIONS.map(duration=>({
  eventBearing,eventRadius,duration,
 }))));
function eyeAngles(profile:Profile,focus:number,frameIndex:number):number[]{
 const bins=(n:number,half:number,center:number,offset=0)=>
  Array.from({length:n},(_,i)=>center+(
   -half+(i+.5)*half*2/n+offset)*RAD);
 if(profile==='wide96')return bins(96,80,0);
 if(profile==='focus96')return Array.from({length:96},(_,i)=>{
  const u=(i+.5)/96*2-1;
  return focus+retinalAngle(u);
 });
 const focused=profile.startsWith('dual80')?80:
  profile==='dual64-32'?64:48;
 const peripheral=96-focused;
 const shift=profile==='dual80-16-shift'?
  frameIndex%2===0?-2.5:2.5:0;
 return [...bins(focused,9,focus),...bins(peripheral,80,0,shift)];
}
function perceive(cp:ReturnType<LivingWorld['captureCheckpoint']>,
 angles:number[]):Frame{
 const world=R.World.restoreSnapshot(cp.physics);
 if(!world)throw Error('A4 could not restore real physics');
 try {
  const body=world.getRigidBody(cp.actorHandle);
  if(!body)throw Error('A4 actor body missing');
  const pos=body.translation(),heading=body.rotation();
  const rgb=new Float32Array(angles.length*3);
  for(let i=0;i<angles.length;i++){
   const a=heading+angles[i];
   const ray=new R.Ray(pos,{x:Math.cos(a),y:Math.sin(a)});
   let min=12,color:readonly number[]=BACK;
   for(const surface of cp.surfaces){
    const co=world.getCollider(surface.handle);
    const range=co.castRay(ray,12,true);
    if(range>=0&&range<min){min=range;color=surface.color;}
   }
   rgb.set(color,3*i);
  }
  return {angles,rgb,tick:cp.tick};
 }finally{world.free();}
}
function matches(frame:Frame,color:readonly number[]):number[]{
 const out:number[]=[];
 for(let i=0;i<frame.angles.length;i++){
  if(Math.abs(frame.rgb[3*i]-color[0])<.035
    &&Math.abs(frame.rgb[3*i+1]-color[1])<.035
    &&Math.abs(frame.rgb[3*i+2]-color[2])<.035)out.push(i);
 }
 return out;
}
function classify(frame:Frame):'red-left'|'cyan-left'|null {
 const red=matches(frame,RED),cyan=matches(frame,CYAN);
 if(red.length<2||cyan.length<2)return null;
 const center=(h:number[])=>h.reduce((sum,i)=>
  sum+frame.angles[i],0)/h.length;
 const d=center(red)-center(cyan);
 if(Math.abs(d)<.25*RAD)return null;
 return d<0?'red-left':'cyan-left';
}
function build(spec:Setup){
 const world=new LivingWorld(false);
 const a=48*RAD,range=9.8,near=range-.78;
 world.addObject(range*Math.cos(a),range*Math.sin(a),.85,[...GREY]);
 world.addObject(near*Math.cos((48-.79)*RAD),
  near*Math.sin((48-.79)*RAD),.072,[...RED]);
 world.addObject(near*Math.cos((48+.79)*RAD),
  near*Math.sin((48+.79)*RAD),.072,[...CYAN]);
 const orange=world.addObject(-24,-24,spec.eventRadius,[...ORANGE]);
 return {world,orange};
}
function runOne(spec:Setup):Row[]{
 const {world:w,orange}=build(spec);
 try {
  const first=w.captureCheckpoint();
  const initial=perceive(first,eyeAngles('focus96',0,0));
  const cues=matches(initial,GREY);
  if(cues.length===0)throw Error('A4 lacks lawful coarse gray preview');
  const focus=cues.reduce((sum,i)=>sum+initial.angles[i],0)/cues.length;
  const data=PROFILES.map(profile=>({
   setup:spec,profile,raycasts:0,firstEventTick:null,
   firstDetailTick:null,eventFrames:0,detailFrames:0,
   wrongFrames:0,sampledFrames:0,
  } as Row));
  // All strategies see the same independently moved orange object,
  // same actor pose and same fixed two-part distant pattern.
  for(let f=0;f<FRAME_COUNT;f++){
   const visible=f>=EVENT_START&&f<EVENT_START+spec.duration;
   if(visible){
    const bearing=spec.eventBearing*RAD,range=6;
    w.moveObject(orange,range*Math.cos(bearing),
      range*Math.sin(bearing));
   }else w.moveObject(orange,-24,-24);
   for(let j=0;j<4;j++)w.step({drive:0,turn:0,gazeRate:0});
   const cp=w.captureCheckpoint();
   for(const row of data){
    const angles=eyeAngles(row.profile,focus,f);
    const frame=perceive(cp,angles);
    row.raycasts+=angles.length;
    row.sampledFrames++;
    const sawEvent=matches(frame,ORANGE).length>0;
    const result=classify(frame);
    if(sawEvent&&row.firstEventTick===null)
      row.firstEventTick=frame.tick;
    if(sawEvent)row.eventFrames++;
    if(result==='red-left'){
      row.detailFrames++;
      if(row.firstDetailTick===null)row.firstDetailTick=frame.tick;
    }else if(result!==null)row.wrongFrames++;
   }
  }
  return data;
 }finally{w.free();}
}
function summary(rows:Row[]){
 return PROFILES.map(profile=>{
  const a=rows.filter(x=>x.profile===profile);
  return {profile,n:a.length,
   alertCaught:a.filter(x=>x.firstEventTick!==null).length,
   detailsCaught:a.filter(x=>x.firstDetailTick!==null).length,
   bothCaught:a.filter(x=>x.firstEventTick!==null
     &&x.firstDetailTick!==null).length,
   wrong:a.reduce((s,x)=>s+x.wrongFrames,0),
   meanEventFrames:a.reduce((s,x)=>s+x.eventFrames,0)/a.length,
   meanDetailFrames:a.reduce((s,x)=>s+x.detailFrames,0)/a.length,
   budgetPerCase:a[0]?.raycasts,
  };
 });
}
beforeAll(initLivingWorld);
describe('RB-VISION/A4 moving brief peripheral appearance vs detailed focus',()=>{
 it('runs adversarial fleeting-object schedules and qualifies the sampling budget',()=>{
  const rows=SPECIMENS.flatMap(runOne);
  const stats=summary(rows);
  expect(rows.length).toBe(SPECIMENS.length*PROFILES.length);
  expect(rows.every(r=>r.raycasts===576&&r.sampledFrames===6)).toBe(true);
  expect(rows.every(r=>r.wrongFrames===0)).toBe(true);
  console.log('RB_VISION_A4_TEMPORAL '+JSON.stringify(stats));
  expect(stats.some(x=>x.profile==='dual80-16'
    &&x.alertCaught<x.n)).toBe(true);
  expect(stats.some(x=>x.profile==='dual80-16-shift'
    &&x.alertCaught>0)).toBe(true);
 },120000);
 it('finds strong physical-ray counterexamples to 16 peripheral sentinels',()=>{
  const examples=[-60,-62,-58].map(eventBearing=>
   runOne({eventBearing,eventRadius:.12,duration:1}));
  const found=examples.some(batch=>{
    const wide=batch.find(x=>x.profile==='wide96')!;
    const split=batch.find(x=>x.profile==='dual80-16')!;
    return wide.firstEventTick!==null&&split.firstEventTick===null;
  });
  expect(found).toBe(true);
 },30000);
});
