import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,type Demand} from '../../src/living-organism/world';
import {CreditPilot,type CreditMode} from '../../src/living-organism/credit-pilot';

const TICKS=3600; // 30 real seconds @120Hz
const FLIP=900; // host transducer changes only, no knowledge injected
const MANUAL_START=1200,MANUAL_END=1800;
const OVERRIDE:Demand={drive:.55,turn:.8,gazeRate:.25};
type Arm='fixed'|'learned'|'learned-with-takeover';
type Outcome={arm:Arm;steps:number;privateFrames:number;
  path:number;lastActor:{x:number;y:number;angle:number};
  visualCyanFrames:number;contactWindows:number;
  modeCounts:Record<string,number>;
  motor:{
    gain:number;accepted:number;refusedOverride:number;refusedWeak:number;
    trainingAtManualStart:number|null;trainingAtManualEnd:number|null;
    trainingAfterManual:number|null;firstNegativeTick:number|null;
  };finite:boolean;};

function run(arm:Arm):Outcome{
  const mode:CreditMode=arm==='fixed'?'fixed':'sign-only';
  const p=new CreditPilot(mode);
  let travel=0,previous=p.inspect().actor,privateFrames=0;
  let cyan=0,contacts=0;
  let lastFrame=-1;
  let atManualStart:number|null=null,atManualEnd:number|null=null;
  let afterManual:number|null=null,firstNegativeTick:number|null=null;
  const counts:Record<string,number>={};
  try{
    for(let tick=0;tick<TICKS;tick++){
      const takeover=arm==='learned-with-takeover'&&
        tick>=MANUAL_START&&tick<MANUAL_END;
      if(tick===MANUAL_START)atManualStart=p.credit.state().accepted;
      if(tick===MANUAL_END)atManualEnd=p.credit.state().accepted;
      const frame=p.world.observe();
      if(frame.tick!==lastFrame){
        lastFrame=frame.tick;privateFrames++;
        for(let i=0;i<frame.retina.length;i+=3){
          if(frame.retina[i]<.3&&frame.retina[i+1]>.65&&frame.retina[i+2]>.6){cyan++;break;}
        }
        const modeNow=p.occupant.capture().mode;
        counts[modeNow]=(counts[modeNow]??0)+1;
      }
      p.step(takeover?OVERRIDE:null,tick<FLIP?1:-1);
      if(firstNegativeTick===null&&p.credit.state().gain<0)firstNegativeTick=tick+1;
      const a=p.inspect().actor;
      travel+=Math.hypot(a.x-previous.x,a.y-previous.y);
      previous=a;
      if((tick+1)%4===0&&p.world.inspectContactSample().contacts.length)contacts++;
      if(tick===MANUAL_END+120)afterManual=p.credit.state().accepted;
    }
    const a=p.inspect().actor,c=p.credit.state();
    return {arm,steps:TICKS,privateFrames,path:travel,
      lastActor:{x:a.x,y:a.y,angle:a.angle},
      visualCyanFrames:cyan,contactWindows:contacts,modeCounts:counts,
      motor:{gain:c.gain,accepted:c.accepted,
        refusedOverride:c.refusedOverride,refusedWeak:c.refusedWeak,
        trainingAtManualStart:atManualStart,trainingAtManualEnd:atManualEnd,
        trainingAfterManual:afterManual,firstNegativeTick},
      finite:[travel,a.x,a.y,a.angle,c.gain].every(Number.isFinite)};
  }finally{p.free();}
}
describe('RB-CREDIT/P0 — uninterrupted resident and truthful motor credit',()=>{
  beforeAll(initLivingWorld);
  it('runs full native physics with fixed, trained and Owner-takeover histories',()=>{
    const rows:(Outcome)[]=(['fixed','learned','learned-with-takeover'] as Arm[]).map(run);
    expect(rows.every(x=>x.finite&&x.steps===3600&&x.privateFrames===900)).toBe(true);
    expect(rows[0].motor.accepted).toBe(0);
    expect(rows[0].motor.gain).toBe(1);
    expect(rows[2].motor.trainingAtManualEnd).toBe(rows[2].motor.trainingAtManualStart);
    expect(rows[2].motor.refusedOverride).toBeGreaterThan(0);
    // No assert for 'life', cyan contacts or advantage over frozen Occupant.
    // Sign learning is an OL0 donor; its performance is descriptive only.
    console.log('RB_CREDIT_P0_RESULT '+JSON.stringify(rows));
  },240000);
  it('restores the full resident, vision, mid-window credit and physics exactly',()=>{
    const first=new CreditPilot('sign-only');
    const second=new CreditPilot('sign-only');
    try{
      for(let t=0;t<1039;t++)first.step(t>=400&&t<580?OVERRIDE:null,t<700?1:-1);
      second.restore(first.capture());
      for(let t=1039;t<1789;t++){
        const manual=t%135>=40&&t%135<55?OVERRIDE:null;
        const gain=t<1240?-1:1;
        first.step(manual,gain);second.step(manual,gain);
      }
      expect(second.inspect()).toEqual(first.inspect());
      expect(second.occupant.capture()).toEqual(first.occupant.capture());
      expect(second.vision.capture()).toEqual(first.vision.capture());
      expect(second.credit.state()).toEqual(first.credit.state());
      expect(second.capture().world.physics).toEqual(first.capture().world.physics);
    }finally{first.free();second.free();}
  },180000);
});
