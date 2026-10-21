import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld,type BodyShape,type Demand} from '../../src/living-organism/world';

const MOTOR:Demand={drive:.7,turn:0,gazeRate:0};
const ZERO:Demand={drive:0,turn:0,gazeRate:0};
type Scenario={name:string;shape:BodyShape;corridor:boolean;heading:number;protocol:'motor'|'off'|'host-force'};
const CASES:Scenario[]=[
  {name:'narrow-B0-motor',shape:'B0',corridor:true,heading:0,protocol:'motor'},
  {name:'narrow-B1-aligned-motor',shape:'B1',corridor:true,heading:0,protocol:'motor'},
  {name:'open-B0-motor',shape:'B0',corridor:false,heading:0,protocol:'motor'},
  {name:'open-B1-motor',shape:'B1',corridor:false,heading:0,protocol:'motor'},
  {name:'narrow-B0-no-motor',shape:'B0',corridor:true,heading:0,protocol:'off'},
  {name:'narrow-B1-no-motor',shape:'B1',corridor:true,heading:0,protocol:'off'},
  {name:'narrow-B0-external-X',shape:'B0',corridor:true,heading:0,protocol:'host-force'},
  {name:'narrow-B1-aligned-external-X',shape:'B1',corridor:true,heading:0,protocol:'host-force'},
  {name:'narrow-B1-transverse-external-X',shape:'B1',corridor:true,heading:Math.PI/2,protocol:'host-force'},
];
const TICKS=1200; // 10 simulated seconds at 120Hz
function run(s:Scenario){
  const w=new LivingWorld(false,s.shape,s.heading);
  // The corridor along X, from x3 to x7; 1.7m clear width.
  // This is a deliberate morphology discriminator, not a natural habitat.
  if(s.corridor){
    w.addWall(5,1.65,2,.8,[.4,.4,.45]); // inner y=+0.85
    w.addWall(5,-1.65,2,.8,[.4,.4,.45]);// inner y=-0.85
  }
  const objHandle=w.addObject(9,0,.55,[.1,.85,.8]);
  let frames=0,touchFrames=0,cyanFrames=0,contacts=0;
  let minSpeed=Infinity,maxSpeed=0,path=0,prev=w.inspect().actor;
  let firstObjMovement:number|null=null;
  let firstBeyondCorridor:number|null=null;
  try{
    for(let i=0;i<TICKS;i++){
      if(i%4===0){
        const frame=w.observe();
        frames++;
        if(Array.from(frame.touch).some(t=>t>0))touchFrames++;
        for(let k=0;k<frame.retina.length;k+=3)
          if(frame.retina[k]<.3&&frame.retina[k+1]>.65&&frame.retina[k+2]>.6){
            cyanFrames++;break;
          }
      }
      if(s.protocol==='motor')w.step(MOTOR);
      else if(s.protocol==='host-force')w.step(ZERO,{x:20,y:0});
      else w.step(ZERO);
      const state=w.inspect();
      const a=state.actor;
      const v=Math.hypot(a.vx,a.vy);
      minSpeed=Math.min(minSpeed,v);
      maxSpeed=Math.max(maxSpeed,v);
      path+=Math.hypot(a.x-prev.x,a.y-prev.y);
      prev=a;
      if(a.x>7.8 &&firstBeyondCorridor===null)firstBeyondCorridor=i+1;
      if((i+1)%4===0)contacts+=Number(w.inspectContactSample().contacts.length>0);
      const obj=state.objects.find(o=>o.handle===objHandle);
      if(!obj)throw Error('Lost actual material body');
      if(Math.hypot(obj.x-9,obj.y)>.05&&firstObjMovement===null)
        firstObjMovement=i+1;
    }
    const a=w.inspect().actor;
    const obj=w.inspect().objects.find(o=>o.handle===objHandle)!;
    const arr=[path,a.x,a.y,obj.x,obj.y,minSpeed,maxSpeed];
    return {
      ...s,ticks:TICKS,frames,actorX:a.x,actorY:a.y,
      travel:path,minSpeed,maxSpeed,contacts,touchFrames,cyanFrames,
      objectFinalX:obj.x,objectFinalY:obj.y,
      objectDisplacement:Math.hypot(obj.x-9,obj.y),
      firstBeyondCorridor,firstObjMovement,finite:arr.every(Number.isFinite)
    };
  }finally{w.free();}
}
describe('RB-BODY/B1 — oriented actual Rapier contact morphology feasibility',()=>{
  beforeAll(initLivingWorld);
  it('runs nine real material trials and preserves pre-frozen physical outcomes',()=>{
    const results=CASES.map(run);
    expect(results).toHaveLength(9);
    expect(results.every(r=>r.frames===300&&r.ticks===TICKS&&r.finite)).toBe(true);
    // The manufactured narrow gap may or may not physically discriminate.
    // A morphology advantage is an OBSERVATION, not a guaranteed test gate.
    console.log('RB_BODY_B1_RESULT '+JSON.stringify({
      scope:'research geometry feasibility only, not actor learning or autonomy',
      caveat:'transverse B1 host-X case uses external host force; not its own motor',
      trials:results,
    }));
  },240000);
  it('checkpoint restores an asymmetric body only into the same morphology',()=>{
    const a=new LivingWorld(false,'B1'),b=new LivingWorld(false,'B1');
    const c=new LivingWorld(false,'B0');
    try{
      a.addObject(3,0,.6,[.1,.85,.8]);
      for(let i=0;i<240;i++)a.step({drive:.5,turn:.15,gazeRate:0});
      b.restoreCheckpoint(a.captureCheckpoint());
      for(let i=0;i<360;i++){
        a.step({drive:.7,turn:-.12,gazeRate:.2});
        b.step({drive:.7,turn:-.12,gazeRate:.2});
      }
      expect(b.inspect()).toEqual(a.inspect());
      expect(b.observe()).toEqual(a.observe());
      expect(()=>c.restoreCheckpoint(a.captureCheckpoint())).toThrow('mismatch');
    }finally{a.free();b.free();c.free();}
  },120000);
  it('rejects historical B0 checkpoint without bodyShape when the destination claims B1',()=>{
    const original=new LivingWorld(false,'B0');
    const b0=new LivingWorld(false,'B0');
    const b1=new LivingWorld(false,'B1');
    try{
      original.addObject(3,0,.55,[.1,.85,.8]);
      for(let i=0;i<8;i++)original.step({drive:.4,turn:.2,gazeRate:0});
      const historical=original.captureCheckpoint();
      delete historical.bodyShape; // version:3 produced before morphology existed
      expect(historical.version).toBe(3);
      expect(()=>b1.restoreCheckpoint(historical)).toThrow(/morphology mismatch/i);
      expect(()=>b0.restoreCheckpoint(historical)).not.toThrow();
      expect(b0.inspect()).toEqual(original.inspect());
      // A valid B1 checkpoint still remains valid on B1; no destructive migration.
    }finally{original.free();b0.free();b1.free();}
  },120000);

});
