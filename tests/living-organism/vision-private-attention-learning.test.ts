import {beforeAll,describe,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld,type PrivateFrame,type Demand} from '../../src/living-organism/world';
import {ApproachEpisode} from '../../src/living-organism/approach-episode';
import {visibleTurquoisePatches} from '../../src/living-organism/retina-geometry';

/**
 * RB-VISION/B4 -- actual private-outcome-based ATTENTION LEARNING, not a
 * fixed condition->look table.
 *
 * A small contextual bandit learns just two eye strategies by experiencing
 * contact/touch, elapsed time and *issued eye motor commands*. The reward
 * contains no host "target reacquired", XY, scenario identity, body World
 * ID, object side, relocation flag, or goal label.
 *
 * All visual decisions get real existing 96-RGB native LivingWorld frames,
 * the same authored ApproachEpisode movement, and the same 120Hz Rapier.
 * The bandit transfers statistics across independent physical trials; that
 * laboratory reset is NOT continuous one-life learning or learned motivation.
 *
 * Test SCOUT only. It must lose where the private representation aliases
 * valuable unseen novelty with true absence.
 */
type Scenario={
 id:string;
 initiallyVisible:boolean;
 after:'front'|'rear-left'|'rear-right'|'absent';
};
type Context='currently-seen'|'previously-seen-now-missing'|'never-seen';
type Eye='hold'|'sweep';
type Trial={
 id:string;context:Context;eye:Eye;
 contact:boolean;touchTick:number|null;elapsed:number;
 gazeEffort:number;reward:number;firstNewSight:number|null;
 firstFrame:number[];decisionFrame:number[];bodyTravel:number;
};
const HORIZON=1200;
const RGB_T=[.1,.85,.8] as const;
const IDLE:Demand={drive:0,turn:0,gazeRate:0};
function targetSeen(f:PrivateFrame):boolean{
 return visibleTurquoisePatches(f.retina).some(p=>!p.clipped);
}
function context(first:PrivateFrame,decision:PrivateFrame):Context{
 if(targetSeen(decision))return 'currently-seen';
 if(targetSeen(first))return 'previously-seen-now-missing';
 return 'never-seen';
}
function scenarioWorld(s:Scenario):{
 w:LivingWorld;approach:ApproachEpisode;
 first:PrivateFrame;decision:PrivateFrame;ctx:Context
}{
 const w=new LivingWorld(false);
 const initial=s.initiallyVisible?[7,0]:
  s.after==='rear-left'?[-3,5]:
  s.after==='rear-right'?[-3,-5]:[100,100];
 const target=w.addObject(initial[0],initial[1],.62,[...RGB_T]);
 const approach=new ApproachEpisode(true,true);
 const first=w.observe();
 // This is a real lawful encounter processed by the SAME living motor's
 // private perception before the World changes, not a fabricated memory.
 approach.decide(first);
 if(s.initiallyVisible){
  if(s.after==='rear-left')w.moveObject(target,-3,5);
  if(s.after==='rear-right')w.moveObject(target,-3,-5);
  if(s.after==='absent')w.moveObject(target,100,100);
 }
 for(let i=0;i<4;i++)w.step(IDLE);
 const decision=w.observe();
 return {w,approach,first,decision,ctx:context(first,decision)};
}
function runTrial(s:Scenario,eye:Eye):Trial{
 const {w,approach,first,decision,ctx}=scenarioWorld(s);
 let dir=1,frameId=-1,stepDemand:Demand=IDLE;
 let effort=0,elapsed=0,firstNewSight:number|null=null;
 let lastXY=w.inspect().actor,bodyTravel=0;
 try{
  for(let i=0;i<HORIZON;i++){
   const f=w.observe();
   if(frameId!==f.tick){
    frameId=f.tick;
    const base=approach.decide(f);
    if(i>0&&firstNewSight===null&&targetSeen(f))firstNewSight=f.tick;
    if(eye==='hold'||targetSeen(f)){
     stepDemand={...base,gazeRate:targetSeen(f)?
      Math.max(-1,Math.min(1,-f.proprio.gaze)):0};
    }else{
     if(f.proprio.gaze>=1.48)dir=-1;
     if(f.proprio.gaze<=-1.48)dir=1;
     stepDemand={...base,gazeRate:.95*dir};
    }
   }
   effort+=Math.abs(stepDemand.gazeRate)/120;
   w.step(stepDemand);
   elapsed++;
   const p=w.inspect().actor;
   bodyTravel+=Math.hypot(p.x-lastXY.x,p.y-lastXY.y);
   lastXY=p;
   if(approach.capture().mode==='contact')break;
  }
  const privateState=approach.capture();
  // Material completion comes only from the actor's own touch signal;
  // even an unrelated collision would be erroneously rewarding -- a known
  // sensor/task limitation, not World target identification.
  const contact=privateState.mode==='contact';
  const contactTick=privateState.contactTick;
  const reward=(contact?1-.2*elapsed/HORIZON:0)-.03*effort;
  return {
   id:s.id,context:ctx,eye,contact,touchTick:contactTick,
   elapsed,gazeEffort:effort,reward,
   firstNewSight,
   firstFrame:Array.from(first.retina),
   decisionFrame:Array.from(decision.retina),
   bodyTravel,
  };
 }finally{w.free();}
}
const CONTEXTS:Context[]=['currently-seen',
 'previously-seen-now-missing','never-seen'];
const EYES:Eye[]=['hold','sweep'];
class PrivateOutcomeLearner{
 readonly count:Record<Context,Record<Eye,number>>={
  'currently-seen':{hold:0,sweep:0},
  'previously-seen-now-missing':{hold:0,sweep:0},
  'never-seen':{hold:0,sweep:0},
 };
 readonly mean:Record<Context,Record<Eye,number>>={
  'currently-seen':{hold:0,sweep:0},
  'previously-seen-now-missing':{hold:0,sweep:0},
  'never-seen':{hold:0,sweep:0},
 };
 private random=0x7bbf223d;
 private unit():number{
  let x=this.random;x^=x<<13;x^=x>>>17;x^=x<<5;
  this.random=x>>>0;return this.random/4294967296;
 }
 choice(ctx:Context,training=false):Eye{
  const n=this.count[ctx];
  // Controlled initial experience of both eye actions; unlike an
  // authored relevance rule, the eventual preference comes from reward.
  if(training&&n.hold<2)return 'hold';
  if(training&&n.sweep<2)return 'sweep';
  if(training&&this.unit()<.24)
   return this.unit()<.5?'hold':'sweep';
  if(this.mean[ctx].hold===this.mean[ctx].sweep)
   return 'hold'; // conservative tie, not encoded target relevance.
  return this.mean[ctx].sweep>this.mean[ctx].hold?'sweep':'hold';
 }
 fork():PrivateOutcomeLearner{
  const clone=new PrivateOutcomeLearner();
  clone.random=this.random;
  for(const ctx of CONTEXTS){
   for(const eye of EYES){
    clone.count[ctx][eye]=this.count[ctx][eye];
    clone.mean[ctx][eye]=this.mean[ctx][eye];
   }
  }
  return clone;
 }
 update(t:Trial){
  const n=++this.count[t.context][t.eye];
  const old=this.mean[t.context][t.eye];
  this.mean[t.context][t.eye]=old+(t.reward-old)/n;
 }
 snapshot(){
  return CONTEXTS.map(ctx=>({
   context:ctx,holdN:this.count[ctx].hold,
   sweepN:this.count[ctx].sweep,
   holdValue:+this.mean[ctx].hold.toFixed(4),
   sweepValue:+this.mean[ctx].sweep.toFixed(4),
   selected:this.choice(ctx),
  }));
 }
}
function e(id:string,initiallyVisible:boolean,after:Scenario['after']):Scenario{
 return {id,initiallyVisible,after};
}
const TRAIN:Scenario[]=[
 ...Array.from({length:8},(_,i)=>e('training-front-'+i,true,'front')),
 ...Array.from({length:6},(_,i)=>e('training-left-'+i,true,'rear-left')),
 ...Array.from({length:6},(_,i)=>e('training-right-'+i,true,'rear-right')),
 ...Array.from({length:12},(_,i)=>e('training-empty-'+i,false,'absent')),
];
const HELD:Scenario[]=[
 e('held-front',true,'front'),
 e('held-left',true,'rear-left'),e('held-right',true,'rear-right'),
 e('held-empty',false,'absent'),
 e('held-novel-left',false,'rear-left'),
 e('held-novel-right',false,'rear-right'),
 e('held-lost-forever',true,'absent'),
];
function summary(trials:Trial[]){
 return {
  scenarios:trials.length,
  contacts:trials.filter(t=>t.contact).length,
  meanReward:trials.reduce((s,t)=>s+t.reward,0)/trials.length,
  meanEffort:trials.reduce((s,t)=>s+t.gazeEffort,0)/trials.length,
  meanDuration:trials.reduce((s,t)=>s+t.elapsed,0)/trials.length,
 };
}
beforeAll(initLivingWorld);
describe('RB-VISION/B4 learn whether looking pays from actor-private touch/clock/eye effort',()=>{
 it('learns an eye preference WITHOUT host reward labels; compares held-out strong policies',()=>{
  const learner=new PrivateOutcomeLearner();
  const history:Trial[]=[];
  // Interleave environment types in a fixed PERMUTATION to avoid encoding a
  // blockwise curriculum in the chosen strategy. The list is a training
  // environment supply, NEVER an input to bandit.choice.
  const permuted=[...TRAIN].sort((a,b)=>{
   const hash=(s:string)=>[...s].reduce((n,c)=>
    ((n*33)^(c.charCodeAt(0)))>>>0,0);
   return hash(a.id)-hash(b.id);
  });
  for(const s of permuted){
   const trialState=scenarioWorld(s);
   const ctx=trialState.ctx;
   trialState.w.free();
   const action=learner.choice(ctx,true);
   const t=runTrial(s,action);
   expect(t.context).toBe(ctx);
   learner.update(t);history.push(t);
  }
  const policies=['learner','always-sweep','never-scan',
   'history-gate'] as const;
  const evaluation=HELD.flatMap(s=>policies.map(policy=>{
   const pre=scenarioWorld(s),ctx=pre.ctx;pre.w.free();
   const action:Eye=policy==='learner'?learner.choice(ctx):
    policy==='always-sweep'?'sweep':
    policy==='never-scan'?'hold':
    ctx==='previously-seen-now-missing'?'sweep':'hold';
   const trial=runTrial(s,action);
   return {policy,...trial};
  }));
  const standings=policies.map(policy=>({
   policy,...summary(evaluation.filter(x=>x.policy===policy)),
  }));
  console.log('RB_VISION_B4_TRAIN '+JSON.stringify({
   exposure:history.length,learned:learner.snapshot(),
   train:summary(history),
  }));
  console.log('RB_VISION_B4_HELD '+JSON.stringify({
   standings,perScene:evaluation.map(x=>({
    id:x.id,policy:x.policy,context:x.context,action:x.eye,
    contact:x.contact,time:x.elapsed,
    reward:+x.reward.toFixed(4),
    gazeEffort:+x.gazeEffort.toFixed(3),
   })),
  }));
  expect(history.length).toBe(32);
  expect(evaluation.length).toBe(28);
  expect(learner.count['never-seen'].hold).toBeGreaterThan(0);
  expect(learner.count['never-seen'].sweep).toBeGreaterThan(0);
  expect(history.every(t=>Number.isFinite(t.reward))).toBe(true);
  // Explicit no-history generality test: if it cannot distinguish
  // two identical lawful histories, do not promote "learned value".
  const absent=evaluation.find(x=>x.policy==='learner'&&x.id==='held-empty')!;
  const unseen=evaluation.find(x=>x.policy==='learner'&&x.id==='held-novel-left')!;
  expect(absent.context).toBe(unseen.context);
  expect(absent.firstFrame).toEqual(unseen.firstFrame);
  expect(absent.decisionFrame).toEqual(unseen.decisionFrame);
  expect(absent.eye).toBe(unseen.eye);

  // Same policy at deployment, now the WORLD distribution changes:
  // an unseen useful object is common even when the actor never had a
  // prior target. No such hidden setting or label reaches either learner.
  // One competitor exploits past statistics greedily and can freeze
  // itself out of experiencing any counterevidence. The other continues
  // bounded exploratory trials and can discover different consequences.
  const greedy=learner.fork(),adaptive=learner.fork();
  const shift=Array.from({length:36},(_,i)=>e(
   'novelty-shift-'+i,false,
   i%6===0?'absent':i%2===0?'rear-left':'rear-right',
  ));
  const shiftRecords:{kind:string;t:Trial}[]=[];
  for(const s of shift){
   const pre=scenarioWorld(s),ctx=pre.ctx;pre.w.free();
   for(const [kind,model,explore] of [
    ['greedy',greedy,false],['adaptive',adaptive,true],
   ] as const){
    const eye=model.choice(ctx,explore);
    const t=runTrial(s,eye);
    model.update(t);
    shiftRecords.push({kind,t});
   }
   // Strong unlearned challengers on EXACT same held-out worlds:
   // always scanning and a cheap scheduled occasional scan, both
   // without privileged knowledge of which trial contains a target.
   shiftRecords.push({kind:'always',
    t:runTrial(s,'sweep')});
   shiftRecords.push({kind:'periodic3',
    t:runTrial(s,shift.indexOf(s)%3===0?'sweep':'hold')});
  }
  const afterShift=shiftRecords.map(x=>x.t);
  const shiftSummary=['greedy','adaptive','always','periodic3'].map(kind=>{
   const r=shiftRecords.filter(x=>x.kind===kind).map(x=>x.t);
   return {kind,...summary(r),activeScans:r.filter(x=>x.eye==='sweep').length,
    finalChoice:kind==='greedy'?greedy.choice('never-seen'):
     kind==='adaptive'?adaptive.choice('never-seen'):null,
   };
  });
  console.log('RB_VISION_B5_DISTRIBUTION_SHIFT '+JSON.stringify({
   before:learner.snapshot(),
   after:{greedy:greedy.snapshot(),adaptive:adaptive.snapshot()},
   totals:shiftSummary,
   chronology:shiftRecords.filter(x=>x.kind==='adaptive').map(x=>({
    id:x.t.id,eye:x.t.eye,touch:x.t.contact,
    reward:+x.t.reward.toFixed(3),
   })),
  }));
  expect(afterShift.length).toBe(144);
  expect(shiftRecords.filter(x=>x.kind==='greedy')
   .every(x=>x.t.eye==='hold')).toBe(true);
  const reverser=adaptive.fork();
  const reversal=Array.from({length:12},(_,i)=>{
   const scene=e('reverse-rare-'+i,false,'absent');
   const choice=reverser.choice('never-seen',true);
   const t=runTrial(scene,choice);reverser.update(t);
   return t;
  });
  console.log('RB_VISION_B5_REVERSE_SHIFT '+JSON.stringify({
   noNoveltyEpisodes:reversal.length,
   activeScans:reversal.filter(x=>x.eye==='sweep').length,
   unnecessaryGaze:reversal.reduce((s,x)=>s+x.gazeEffort,0),
   selectedAfter:reverser.choice('never-seen'),
   valuesAfter:reverser.snapshot().find(x=>x.context==='never-seen'),
  }));
  // Adaptive can learn only after actual sampled contact; no "novelty
  // probability" is leaked from the generating host scenario labels.
 },120000);
 it('shows a real same-RGB information alias with opposite value for active looking',()=>{
  const absent=e('exact-absent',false,'absent');
  const novel=e('exact-unseen',false,'rear-left');
  const outcomes=[absent,novel].flatMap(s=>
   EYES.map(eye=>runTrial(s,eye)));
  const absentHold=outcomes[0],absentScan=outcomes[1],
   novelHold=outcomes[2],novelScan=outcomes[3];
  expect(absentHold.firstFrame).toEqual(novelHold.firstFrame);
  expect(absentHold.decisionFrame).toEqual(novelHold.decisionFrame);
  expect(absentHold.context).toBe('never-seen');
  expect(novelHold.context).toBe('never-seen');
  expect(absentHold.reward).toBeGreaterThan(absentScan.reward);
  expect(novelScan.reward).toBeGreaterThan(novelHold.reward);
  expect(novelScan.contact).toBe(true);
  expect(novelHold.contact).toBe(false);
  console.log('RB_VISION_B4_NOVELTY_ALIAS '+JSON.stringify({
   sameHistory:true,empty:{hold:absentHold.reward,scan:absentScan.reward},
   unseenObject:{hold:novelHold.reward,scan:novelScan.reward,
    scanContact:novelScan.touchTick},
  }));
 },30000);

 it('proves even OWN prior concern does not reveal whether a lost object still exists',()=>{
  const stillSomewhere=e('same-history-moved',true,'rear-right');
  const nowGone=e('same-history-gone',true,'absent');
  const moved=[...EYES.map(eye=>runTrial(stillSomewhere,eye))];
  const gone=[...EYES.map(eye=>runTrial(nowGone,eye))];
  expect(moved[0].context).toBe('previously-seen-now-missing');
  expect(gone[0].context).toBe(moved[0].context);
  expect(moved[0].firstFrame).toEqual(gone[0].firstFrame);
  expect(moved[0].decisionFrame).toEqual(gone[0].decisionFrame);
  expect(moved[1].reward).toBeGreaterThan(moved[0].reward);
  expect(gone[0].reward).toBeGreaterThan(gone[1].reward);
  console.log('RB_VISION_B4_LOST_MATTER_ALIAS '+JSON.stringify({
   samePrivateHistory:true,
   foundElsewhere:{hold:moved[0].reward,sweep:moved[1].reward,
    touch:moved[1].touchTick},
   trulyGone:{hold:gone[0].reward,sweep:gone[1].reward},
  }));
 },30000);

});
