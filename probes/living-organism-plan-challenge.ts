import {LivingRuntime} from '../src/living-organism/runtime';
import {LivingWorld,initLivingWorld} from '../src/living-organism/world';
import {Occupant} from '../src/living-organism/occupant';
import {mkdirSync,writeFileSync} from 'node:fs';
await initLivingWorld();
const gazeChecks=[];
for(const degrees of [0,30,60]){
 const w=new LivingWorld(false);w.addObject(6,0,.6,[.1,.85,.8]);
 const steps=Math.round(degrees*Math.PI/180/(3/120));
 for(let i=0;i<steps;i++)w.step({drive:0,turn:0,gazeRate:1});
 while(w.inspect().tick%4!==0)w.step({drive:0,turn:0,gazeRate:0});
 const f=w.observe(),indices=[];
 for(let i=0;i<96;i++)if(f.retina[i*3+1]>.65)indices.push(i);
 const o=new Occupant(),d=o.decide(f);
 gazeChecks.push({gazeDegrees:f.proprio.gaze*180/Math.PI,matchedPixels:indices.length,physicalTargetDistance:6,targetRadius:.6,physicalAngularExtentDegrees:2*Math.asin(.6/6)*180/Math.PI,demand:d,privateMode:o.capture().mode});w.free();
}
const ablations=[];
for(const seed of [1,42,0x6d2b79f5])for(const ablateDirection of [false,true]){
 const r=new LivingRuntime();const initial=r.occupant.capture();initial.randomState=seed;r.occupant.restore(initial);
 const counts:Record<string,number>={},cells=new Set<string>();let distance=0,last=r.inspect().actor;
 for(let i=0;i<21600;i++){
  const state=r.occupant.capture();
  if(ablateDirection&&r.observe().tick!==state.lastTick)r.occupant.restore({...state,lastDirection:null,lastSeenTick:null});
  r.step();const a=r.inspect().actor,s=r.occupant.capture();distance+=Math.hypot(a.x-last.x,a.y-last.y);last=a;
  cells.add(`${Math.floor(a.x)},${Math.floor(a.y)}`);counts[s.mode]=(counts[s.mode]??0)+1;
 }
 ablations.push({seed,ablateDirection,simulatedSeconds:180,visitedCells:cells.size,distance,counts});r.free();
}
const result={sourceCommit:'d3f0ae509561b534e2a87fa0ce382788edc7e3cb',scope:'One physical scene; three controller seeds. Host metrics and interventions never supplied as observations.',gazeChecks,ablations};
mkdirSync('evidence/living-organism',{recursive:true});writeFileSync('evidence/living-organism/plan-challenge.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
