import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld,type Demand,type PrivateFrame} from '../../src/living-organism/world';

type Channel='retina'|'touch'|'proprio';
type PairResult={
  command:'push'|'off'; initialPrivateEqual:boolean;
  firstPrivateDivergence:Record<Channel,number|null>;
  firstHostActorDivergence:number|null;
  firstHostObjectDivergence:number|null;
  finalBodyX:{free:number;backstop:number};
  finalObjectX:{free:number;backstop:number};
  travel:{free:number;backstop:number};
  contactWindows:{free:number;backstop:number};
  cyanFrames:{free:number;backstop:number};
  steps:number;privateFramePairs:number;finite:boolean;
};
const MAX_TICKS=720;
const DRIVE:Demand={drive:.95,turn:0,gazeRate:0};
const ZERO:Demand={drive:0,turn:0,gazeRate:0};
const EPS=1e-4;
const BG:[number,number,number]=[.025,.04,.06];
const cyan=(f:PrivateFrame)=> {
  for(let i=0;i<f.retina.length;i+=3)
    if(f.retina[i]<.3 && f.retina[i+1]>.65 && f.retina[i+2]>.6)return true;
  return false;
};
const differs=(a:Float32Array,b:Float32Array)=>a.some((v,i)=>Math.abs(v-b[i])>EPS);
const proprioDiff=(a:PrivateFrame,b:PrivateFrame)=>
  (Object.keys(a.proprio) as (keyof typeof a.proprio)[])
    .some(k=>Math.abs(a.proprio[k]-b.proprio[k])>EPS);

function run(command:'push'|'off'):PairResult {
  const free=new LivingWorld(false),blocked=new LivingWorld(false);
  const freeDisk=free.addObject(3,0,.65,[.1,.85,.8]);
  const blockedDisk=blocked.addObject(3,0,.65,[.1,.85,.8]);
  // Invisible only as ordinary 96xRGB color evidence; still a real physical collider.
  blocked.addWall(5,0,.25,.85,BG);
  const worlds=[free,blocked] as const;
  try {
    const frames=worlds.map(w=>w.observe());
    const initialPrivateEqual =
      !differs(frames[0].retina,frames[1].retina)&&
      !differs(frames[0].touch,frames[1].touch)&&
      !proprioDiff(frames[0],frames[1]);
    const firstPrivateDivergence:Record<Channel,number|null>=
      {retina:null,touch:null,proprio:null};
    let firstHostActorDivergence:number|null=null;
    let firstHostObjectDivergence:number|null=null;
    const travel=[0,0],contactWindows=[0,0],cyanFrames=[0,0];
    let framePairs=0;
    let prev=worlds.map(w=>w.inspect().actor);
    const handles=[freeDisk,blockedDisk];
    const object= (w:LivingWorld,handle:number) =>{
      const r=w.inspect().objects.find(o=>o.handle===handle);
      if(!r)throw Error('Test object disappeared');return r;
    };
    for(let tick=1;tick<=MAX_TICKS;tick++) {
      const d=command==='push'?DRIVE:ZERO;
      for(const w of worlds)w.step(d);
      const now=worlds.map(w=>w.inspect().actor);
      for(let k=0;k<2;k++) {
        travel[k]+=Math.hypot(now[k].x-prev[k].x,now[k].y-prev[k].y);
      }
      prev=now;
      if(firstHostActorDivergence===null &&
        Math.hypot(now[0].x-now[1].x,now[0].y-now[1].y)>EPS)
        firstHostActorDivergence=tick;
      const obj=worlds.map((w,i)=>object(w,handles[i]));
      if(firstHostObjectDivergence===null &&
        Math.hypot(obj[0].x-obj[1].x,obj[0].y-obj[1].y)>EPS)
        firstHostObjectDivergence=tick;
      if(tick%4===0) {
        const f=worlds.map(w=>w.observe());
        framePairs++;
        if(firstPrivateDivergence.retina===null&&differs(f[0].retina,f[1].retina))
          firstPrivateDivergence.retina=tick;
        if(firstPrivateDivergence.touch===null&&differs(f[0].touch,f[1].touch))
          firstPrivateDivergence.touch=tick;
        if(firstPrivateDivergence.proprio===null&&proprioDiff(f[0],f[1]))
          firstPrivateDivergence.proprio=tick;
        for(let k=0;k<2;k++) {
          if(cyan(f[k]))cyanFrames[k]++;
          if(worlds[k].inspectContactSample().contacts.length)
            contactWindows[k]++;
        }
      }
    }
    const final=worlds.map(w=>w.inspect().actor);
    const obj=worlds.map((w,i)=>object(w,handles[i]));
    const vals=[...travel,...contactWindows,...cyanFrames,
      ...final.flatMap(a=>[a.x,a.y]),...obj.flatMap(o=>[o.x,o.y])];
    return {command,initialPrivateEqual,firstPrivateDivergence,
      firstHostActorDivergence,firstHostObjectDivergence,
      finalBodyX:{free:final[0].x,backstop:final[1].x},
      finalObjectX:{free:obj[0].x,backstop:obj[1].x},
      travel:{free:travel[0],backstop:travel[1]},
      contactWindows:{free:contactWindows[0],backstop:contactWindows[1]},
      cyanFrames:{free:cyanFrames[0],backstop:cyanFrames[1]},
      steps:MAX_TICKS,privateFramePairs:framePairs,finite:vals.every(Number.isFinite)};
  }finally{for(const w of worlds)w.free();}
}

describe('RB-AFF/A1 physical affordance: actor-private evidence of hidden constraint',()=>{
  beforeAll(initLivingWorld);
  it('reports real physical and private response to matched action, with no-motor control',()=>{
    const first=[run('off'),run('push')];
    const second=[run('off'),run('push')];
    expect(first).toEqual(second);
    expect(first.every(x=>x.initialPrivateEqual&&x.finite&&
      x.steps===720&&x.privateFramePairs===180)).toBe(true);
    // A stimulus can be physically different and still invisible to this sensor.
    // That is a VALID negative outcome; no PASS gate on specific divergence or distance.
    console.log('RB_AFF_A1_RESULT '+JSON.stringify({
      outcome:'discovery, not learned affordance or autonomous goal',
      deterministic:true,arms:first,
    }));
  },150000);
});
