import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld,type BodyShape,type Demand} from '../../src/living-organism/world';
import {Occupant} from '../../src/living-organism/occupant';

const ZERO:Demand={drive:0,turn:0,gazeRate:0};
const CONSTANT:Demand={drive:.7,turn:0,gazeRate:0};
type Arm='no-motor'|'constant'|'old-occupant';
function make(shape:BodyShape){
  const w=new LivingWorld(false,shape);
  w.addWall(5,1.65,2,.8,[.4,.4,.45]);
  w.addWall(5,-1.65,2,.8,[.4,.4,.45]);
  const target=w.addObject(9,0,.55,[.1,.85,.8]);
  w.addObject(11,3,.9,[.75,.54,.25]);
  w.addRailMover(-4,-4.5,.65,[.6,.35,.9],-7,0,2);
  return {w,target};
}
function run(shape:BodyShape,arm:Arm){
  const {w,target}=make(shape);
  const resident=arm==='old-occupant'?new Occupant():null;
  let motor=ZERO,prev=w.inspect().actor,travel=0;
  const timeBins=[0,0,0,0];
  let privateFrames=0,seenCyan=0,materialWindows=0;
  const modes:Record<string,number>={};
  const cells=new Set<string>();
  let firstTargetMove:number|null=null,firstGateCross:number|null=null;
  const initialObjects=w.inspect().objects.map(x=>({handle:x.handle,x:x.x,y:x.y}));
  try{
    for(let i=0;i<7200;i++){
      if(i%4===0){
        const f=w.observe();privateFrames++;
        if(f.retina.some((v,k)=>k%3===1&&v>.65))seenCyan++;
        motor=resident?resident.decide(f):arm==='constant'?CONSTANT:ZERO;
        if(resident){const m=resident.capture().mode;modes[m]=(modes[m]||0)+1;}
        const pos=w.inspect().actor;
        cells.add(Math.floor(pos.x/2)+':'+Math.floor(pos.y/2));
      }
      w.step(motor);
      const p=w.inspect().actor;
      const d=Math.hypot(p.x-prev.x,p.y-prev.y);
      travel+=d;timeBins[Math.min(3,Math.floor(i/1800))]+=d;prev=p;
      if(p.x>7.8&&firstGateCross===null)firstGateCross=i+1;
      if((i+1)%4===0){
        const c=w.inspectContactSample();
        const ids=new Set(w.inspect().objects.filter(o=>o.kind==='object').map(o=>o.handle));
        if(c.contacts.some(c=>ids.has(c.handle)))materialWindows++;
      }
      if(firstTargetMove===null){
        const o=w.inspect().objects.find(o=>o.handle===target)!;
        if(Math.hypot(o.x-9,o.y)>.05)firstTargetMove=i+1;
      }
    }
    const result=w.inspect();
    const targets=result.objects.filter(x=>x.kind==='object').map(x=>({
      initial:initialObjects.find(y=>y.handle===x.handle)!,
      color:x.color,finalX:x.x,finalY:x.y,
      displacement:Math.hypot(x.x-initialObjects.find(y=>y.handle===x.handle)!.x,
        x.y-initialObjects.find(y=>y.handle===x.handle)!.y),
    }));
    return {shape,arm,actualWorldTicks:result.tick,privateFrames,
      travel,pathQuarter:timeBins,visited2mCells:cells.size,
      firstTargetMove,firstGateCross,materialWindows,seenCyan,
      modes,finalActor:result.actor,
      physicalTargets:targets,finite:[travel,...timeBins,result.actor.x,result.actor.y]
        .every(Number.isFinite)};
  }finally{w.free();}
}
describe('RB-BODY/B1 — actual unchanged Occupant in larger material geometry',()=>{
  beforeAll(initLivingWorld);
  it('observes 60s in both bodies with independent ecology and cheap controls',()=>{
    const rows=(['B0','B1'] as const).flatMap(shape=>
      (['no-motor','constant','old-occupant'] as const).map(arm=>run(shape,arm)));
    expect(rows).toHaveLength(6);
    expect(rows.every(r=>r.actualWorldTicks===7200&&r.privateFrames===1800&&r.finite)).toBe(true);
    // No behavioral, goal, or training qualification threshold.
    console.log('RB_BODY_B1_LIVED_RESULT '+JSON.stringify({rows,conclusion:
      'description only: authored color policy, not learned material history'}));
  },240000);
});
