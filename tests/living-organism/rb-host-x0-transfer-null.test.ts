import { beforeAll, describe, expect, it } from 'vitest';
import { initLivingWorld, LivingWorld, type Demand } from '../../src/living-organism/world';
import { Occupant } from '../../src/living-organism/occupant';
import { createWorldD0 } from '../../src/living-organism/world-ecology-d0';
import { createWorldD1 } from '../../src/living-organism/world-ecology-d1';
import { visibleTurquoisePatches } from '../../src/living-organism/retina-geometry';

/**
 * RB-HOST/X0 — descriptive full-World transfer null, not organism qualification.
 * Frozen details in docs/competence-runs/RB-HOST-X0_ARMED_2026-10-20.md.
 * Actor motor authority NEVER receives host inspect(), handles or world coords.
 */
const TICKS = 7200;
const ZERO: Demand = {drive:0,turn:0,gazeRate:0};
type Scene = 'S0'|'D0'|'D1';
type Arm = 'no-actor-motor'|'cheap-forward'|'frozen-occupant';
const rounded = (n:number) => Math.round(n * 10000) / 10000;

function create(scene: Scene): LivingWorld {
  if(scene==='S0') return new LivingWorld(true);
  if(scene==='D0') return createWorldD0(true).world;
  return createWorldD1(true).world;
}
function run(scene:Scene,arm:Arm) {
  const w=create(scene);
  const brain=arm==='frozen-occupant'?new Occupant():null;
  const pBy15s=[0,0,0,0],cyanBy15s=[0,0,0,0];
  const contactBy15s=[0,0,0,0],driveBy15s=[0,0,0,0];
  const modes:Record<string,number>={};
  const cells=new Set<string>();
  const before=w.inspect().objects.map(o=>({kind:o.kind,x:o.x,y:o.y}));
  let prev=w.inspect().actor,travel=0,maxRadius=0;
  let frames=0,materialTouches=0;
  let firstCyan:number|null=null,firstMaterialTouch:number|null=null;
  let cmd:Demand=ZERO;
  try {
    for(let i=0;i<TICKS;i++){
      const q=Math.min(3,Math.floor(i/(TICKS/4)));
      if(i%4===0) {
        const f=w.observe();
        frames++;
        if(visibleTurquoisePatches(f.retina).length) {
          cyanBy15s[q]++;
          if(firstCyan===null)firstCyan=f.tick;
        }
        cmd=brain?brain.decide(f):
          arm==='cheap-forward'?{drive:.12,turn:0,gazeRate:0}:ZERO;
        if(cmd.drive>.1)driveBy15s[q]++;
        if(brain){const m=brain.capture().mode;modes[m]=(modes[m]??0)+1;}
        const p=w.inspect().actor;
        cells.add(String(Math.floor(p.x/2))+':'+String(Math.floor(p.y/2)));
      }
      w.step(cmd);
      const a=w.inspect().actor;
      const d=Math.hypot(a.x-prev.x,a.y-prev.y);
      travel+=d;pBy15s[q]+=d;
      maxRadius=Math.max(maxRadius,Math.hypot(a.x,a.y));
      prev=a;
      if(i%4===3){
        const events=w.inspectContactSample();
        if(events.contacts.length){
          contactBy15s[q]++;
          const objs=w.inspect().objects;
          if(events.contacts.some(c=>objs.some(o=>o.handle===c.handle&&o.kind==='object'))){
            materialTouches++;
            if(firstMaterialTouch===null)firstMaterialTouch=events.tick;
          }
        }
      }
    }
    const after=w.inspect();
    const material=after.objects.flatMap((o,i)=>
      o.kind==='wall'?[]:[{kind:o.kind,
        displacementFromOwnStart:rounded(Math.hypot(o.x-before[i].x,o.y-before[i].y)),
        finalX:rounded(o.x),finalY:rounded(o.y)}]);
    return {scene,arm,tick:after.tick,frames,path:rounded(travel),
      pathBy15s:pBy15s.map(rounded),
      maxRadius:rounded(maxRadius),
      finalActor:{x:rounded(after.actor.x),y:rounded(after.actor.y)},
      visited2mCells:cells.size,
      cyanFramesBy15s,contactWindowsBy15s:contactBy15s,
      positiveDriveFramesBy15s:driveBy15s,
      movableContactWindows:materialTouches,firstCyanTick:firstCyan,
      firstPhysicalMaterialContactTick:firstMaterialTouch,
      authoredModes:modes,material,
      finite:[travel,maxRadius,after.actor.x,after.actor.y,...pBy15s].every(Number.isFinite)};
  }finally{w.free();}
}
describe('RB-HOST/X0 — native Occupant transfer S0/D0/D1, descriptive null',()=>{
  beforeAll(initLivingWorld);
  it('executes 9 uninterrupted physical lives without tuning the policy or scene',()=>{
    const runs=(['S0','D0','D1'] as const).flatMap(scene=>
      (['no-actor-motor','cheap-forward','frozen-occupant'] as const)
        .map(arm=>run(scene,arm)));
    expect(runs).toHaveLength(9);
    expect(runs.every(r=>r.finite&&r.tick===7200&&r.frames===1800)).toBe(true);
    // Deliberately NO expected progress, area, contact or life threshold.
    // Unappealing behaviour is a valid result and must not be 'fixed' here.
    console.log('RB_HOST_X0_RESULT '+JSON.stringify({contract:'frozen 2026-10-20',
      caveat:'nonfactorial host feasibility; no goal/learning/autonomy qualification',
      runs}));
  },240000);
});
