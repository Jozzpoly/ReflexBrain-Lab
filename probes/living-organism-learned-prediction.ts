import {LivingWorld,initLivingWorld,type Demand} from '../src/living-organism/world';
import {PrivateVision} from '../src/living-organism/private-vision';
import {visibleTurquoisePatches} from '../src/living-organism/retina-geometry';
import {SensoryRegressor} from '../src/living-organism/sensory-regressor';
import {sensoryFeatures,sensoryTarget} from '../src/living-organism/sensory-features';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
await initLivingWorld();
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
const families=['static','lateral','receding','observer-correlated','reversal','occlusion','similar','motor-change','external-push'] as const;
type Family=typeof families[number];
type Example={episode:string;family:Family;split:'train'|'test'|'stress';tick:number;input:number[];output:number[];geometry:number[]|null};
const examples:Example[]=[],episodes=[];
for(const split of ['train','test','stress'] as const)for(const family of families){
 if(split==='train'&&families.indexOf(family)>=4)continue;
 if(split==='test'&&families.indexOf(family)>=7)continue;
 if(split==='stress'&&families.indexOf(family)<7)continue;
 for(let seed=0;seed<(split==='train'?6:3);seed++){
  const id=`${split}:${family}:${seed}`,distance=split==='train'?4+seed:5.5+seed*1.5;
  const radius=split==='train'?.4+.04*seed:.5+.08*seed;
  const angle=split==='train'?-.25+seed*.1:-.2+seed*.2;
  const speed=split==='train'?.15+seed*.08:.2+seed*.15;
  const drive=split==='train'?.1+.03*(seed%3):.12+.025*seed;
  const x=distance*Math.cos(angle),y=distance*Math.sin(angle),w=new LivingWorld(false),v=new PrivateVision();
  const h=w.addObject(x,y,radius,[.1,.85,.8]);
  const extra=family==='occlusion'||family==='similar'?w.addObject(100,100,.5,family==='occlusion'?[.8,.2,.2]:[.1,.85,.8]):null;
  const frames=[];v.observe(w.observe());
  function record(d:Demand){const f=w.observe();v.observe(f);frames.push({f,d,state:v.capture()});}
  const demand=(t:number):Demand=>family==='motor-change'&&t>=4?{drive:.2,turn:.18,gazeRate:-.22}:{drive,turn:.03*Math.sin(t*.7+seed),gazeRate:.08*Math.cos(t*.4+seed)};
  record(demand(0));
  for(let i=0;i<960;i++){
   const t=i/120,a=w.inspect().actor;
   if(family==='lateral')w.moveObject(h,x,y+speed*t);
   if(family==='receding')w.moveObject(h,x+speed*t,y);
   if(family==='observer-correlated')w.moveObject(h,x+a.x,y+a.y);
   if(family==='reversal')w.moveObject(h,x,y+speed*(t<=4?t:8-t));
   if(extra!==null){
    if(family==='occlusion')w.moveObject(extra,t>=2.5&&t<4?2.5:100,t>=2.5&&t<4?0:100);
    else w.moveObject(extra,t>=3?x:100,t>=3?y+1.5:100);
   }
   w.step(demand(t),family==='external-push'&&t>=3&&t<3.4?{x:0,y:15}:{x:0,y:0});if((i+1)%4===0)record(demand((i+1)/120));
  }
  const rows:Example[]=[];let masked=0;
  for(let i=1;i+6<frames.length;i++){
   const current=frames[i],previous=frames[i-1],future=frames[i+6];
   const input=sensoryFeatures(previous.f,current.f,current.d),output=sensoryTarget(current.f,future.f);
   // Reject windows with an intervening discontinuity; correspondence still isn't identity.
   const continuous=frames.slice(i-1,i+7).every(({f})=>{const p=visibleTurquoisePatches(f.retina);return p.length===1&&!p[0].clipped;});
   if(!input||!output||!continuous){masked++;continue;}
   const estimate=current.state.estimate,p=current.state.pose,pr=current.f.proprio;
   const appearance=visibleTurquoisePatches(current.f.retina)[0];let geometry:number[]|null=null;
   if(estimate){
    const mid=p.heading+pr.omega*.1;
    const px=p.x+(pr.forward*Math.cos(mid)-pr.lateral*Math.sin(mid))*.2;
    const py=p.y+(pr.forward*Math.sin(mid)+pr.lateral*Math.cos(mid))*.2;
    const gaze=Math.max(-Math.PI/2,Math.min(Math.PI/2,pr.gaze+current.d.gazeRate*3*.2));
    const bearing=wrap(Math.atan2(estimate.y-py,estimate.x-px)-p.heading-pr.omega*.2-gaze);
    const nextRange=Math.hypot(estimate.x-px,estimate.y-py),inferredRadius=estimate.distance*Math.sin(appearance.extent/2);
    const extent=2*Math.asin(Math.min(1,inferredRadius/Math.max(nextRange,1e-6)));
    geometry=[wrap(bearing-appearance.bearing),Math.log(extent/appearance.extent)];
   }
   rows.push({episode:id,family,split,tick:current.f.tick,input,output,geometry});
  }
  episodes.push({id,family,split,distance,radius,angle,speed,drive,examples:rows.length,masked,
   dataSha256:createHash('sha256').update(JSON.stringify(rows)).digest('hex')});examples.push(...rows);w.free();
 }
}
const train=examples.filter(e=>e.split==='train'),test=examples.filter(e=>e.split==='test'),stress=examples.filter(e=>e.split==='stress');
const model=new SensoryRegressor();model.fit(train);
const noHistory=new SensoryRegressor();noHistory.fit(train.map(r=>({input:r.input.slice(2),output:r.output})));
const appearanceHistory=new SensoryRegressor();appearanceHistory.fit(train.map(r=>({input:r.input.slice(0,4),output:r.output})));
const names=['hold','velocity','bodyGaze','ridge','ridgeNoHistory','ridgeAppearanceHistory','geometryOrHold'] as const;
function metrics(rows:Example[]){
 const sums=Object.fromEntries(names.map(n=>[n,[0,0]])) as Record<typeof names[number],number[]>;
 for(const row of rows){
  const gaze=row.input[7],nextGaze=Math.max(-Math.PI/2,Math.min(Math.PI/2,gaze+row.input[10]*.6));
  const predictions={hold:[0,0],velocity:row.input.slice(0,2),bodyGaze:[-row.input[6]-(nextGaze-gaze),0],ridge:model.predict(row.input),ridgeNoHistory:noHistory.predict(row.input.slice(2)),ridgeAppearanceHistory:appearanceHistory.predict(row.input.slice(0,4)),geometryOrHold:row.geometry??[0,0]};
  for(const name of names){sums[name][0]+=Math.abs(wrap(predictions[name][0]-row.output[0]));sums[name][1]+=Math.abs(predictions[name][1]-row.output[1]);}
 }
 return {examples:rows.length,geometryAvailable:rows.filter(r=>r.geometry!==null).length,
  mae:rows.length?Object.fromEntries(names.map(n=>[n,{bearingRad:sums[n][0]/rows.length,logExtent:sums[n][1]/rows.length}])):null};
}
const result={scope:'Offline learned ridge baseline, not NN, not motor policy. 0.2s appearance prediction conditional on single unclipped continuous fragments. Labels are future private retina; no host XY/IDs/range. Parameters fixed before evaluation; whole episodes split. OOD families reversal/occlusion/similar appear only in test. geometryOrHold uses stationary point and inferred size; otherwise unchanged appearance. Metrics do not qualify visibility prediction, identity, action value or life.',
 settings:{lambda:.001,horizonTicks:24,episodeTicks:960,featureCount:11,ablationAddedAfterFirstEvaluation:true,stressAddedAfterFirstEvaluation:true},episodes,train:metrics(train),test:metrics(test),stress:metrics(stress),
 testWithGeometry:metrics(test.filter(r=>r.geometry!==null)),
 byFamily:Object.fromEntries(families.map(f=>[f,metrics([...test,...stress].filter(r=>r.family===f))])),
 byEpisode:Object.fromEntries(episodes.filter(e=>e.split!=='train').map(e=>[e.id,metrics(examples.filter(r=>r.episode===e.id))])),
 model:model.capture(),ablationModels:{noHistory:noHistory.capture(),appearanceHistory:appearanceHistory.capture()}};
writeFileSync('evidence/living-organism/learned-prediction.json',JSON.stringify(result,null,2)+'\n');
writeFileSync('evidence/living-organism/sensory-regressor-weights.json',JSON.stringify(model.capture(),null,2)+'\n');
console.log(JSON.stringify({train:result.train,test:result.test,stress:result.stress,testWithGeometry:result.testWithGeometry,byFamily:result.byFamily},null,2));
