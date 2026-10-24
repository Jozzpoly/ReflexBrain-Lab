/* RB-LIFE/P96: exact upstream LIFE code, isolated native-source probe.
 * Scientific outcomes printed, NEVER asserted positive.
 * Host-only selection of largest acquired somatic effect is biased by design.
 */
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Simulation} from '../../../external/life/src/sim/simulation';
import {PLASTIC_STRIDE} from '../../../external/life/src/sim/brain/brain';

const cfg={seed:56433,worldSize:1024,gridSize:64,initialPopulation:1200,maxPopulation:2400};
const warmup=600,horizon=240;
const parent=new Simulation(cfg);
for(let t=0;t<warmup;t++)parent.step();
if(parent.tick!==warmup)throw Error('source did not advance to frozen fork tick');
const snapshot=parent.serialize() as Record<string,any>;

function fork():Simulation{
 const s=new Simulation(cfg);s.restore(snapshot);
 if(s.tick!==parent.tick || s.pop.livingCount!==parent.pop.livingCount)throw Error('restore tick/living mismatch');
 return s;
}
type Arr=ArrayBufferView & {buffer:ArrayBufferLike;byteOffset:number;byteLength:number};
function digest(s:Simulation){
 const p=s.pop;const h=createHash('sha256');
 h.update(String(s.tick));h.update(String(p.livingCount));h.update(String(p.count));
 const arrays:Arr[]=[
  p.alive,p.id,p.x,p.y,p.vx,p.vy,p.heading,p.energy,p.health,p.age,p.reward,
  p.genome,p.brain,p.plastic,p.context,p.model,p.mem.x,p.mem.y,p.mem.valence,
  s.world.vegetation,s.world.carrion,s.world.signal0,s.world.signal1
 ];
 for(const a of arrays){h.update(String(a.byteLength));h.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));}
 h.update(JSON.stringify(s.serialize().rngState));
 return h.digest('hex');
}
const baseDigest=digest(parent);
const source=parent.pop;
let selected=-1,bestNorm=0;
for(let i=0;i<source.count;i++){
 if(!source.alive[i]||source.plasticity[i]<=0)continue;
 let norm=0;const off=source.plasticOffset(i);
 for(let k=0;k<PLASTIC_STRIDE;k++)norm+=Math.abs(source.plastic[off+k]);
 if(norm>bestNorm){selected=i;bestNorm=norm;}
}
const control=fork(),twin=fork(),ablate=fork(),pause=fork();
const all=[control,twin,ablate,pause];
if(all.some(s=>digest(s)!==baseDigest))throw Error('independent source restore failed initial full-state fingerprint equality');

function person(s:Simulation,id:number){
 const p=s.pop;let i=-1;
 for(let k=0;k<p.count;k++)if(p.alive[k]&&p.id[k]===id){i=k;break;}
 if(i<0)return {alive:false,id};
 return {alive:true,id,x:p.x[i],y:p.y[i],vx:p.vx[i],vy:p.vy[i],heading:p.heading[i],
  energy:p.energy[i],health:p.health[i],plantEaten:p.plantEaten[i],meatEaten:p.meatEaten[i],
  preyEaten:p.preyEaten[i],children:p.children[i],generation:p.generation[i],
  plasticity:p.plasticity[i],age:p.age[i]};
}
function difference(a:ReturnType<typeof person>,b:ReturnType<typeof person>){
 if(!a.alive||!b.alive)return a.alive!==b.alive?1:null;
 return Math.hypot(a.x-b.x,a.y-b.y,a.vx-b.vx,a.vy-b.vy,a.heading-b.heading);
}
const result:Record<string,unknown>={
 status:'INCONCLUSIVE',originalRepo:'dominikvytisk/life-simulation',
 pinnedSha:'92f6b7aa359ce4fff0b725d282654cc930452da5',
 cfg,warmup,horizon,
 populationAtFork:source.livingCount,
 selectedBy:'largest total absolute acquired somatic output-layer weights among living plasticity-positive residents (biased upper-bound)'
};
if(selected>=0 && bestNorm>0){
 const id=source.id[selected];
 const sourceAtFork=person(control,id);
 result.selectedId=id;result.selectedSlot=selected;result.initialPlasticL1=bestNorm;
 result.initialState=sourceAtFork;
 const o=ablate.pop.plasticOffset(selected);
 ablate.pop.plastic.fill(0,o,o+PLASTIC_STRIDE);
 pause.pop.plasticity[selected]=0;
 if(digest(control)!==digest(twin))throw Error('control and untouched twin differ BEFORE continuation');
 const traces:Record<string,unknown>[]=[];
 let firstPhysicalB:null|number=null,firstPhysicalC:null|number=null,
 firstLifeOutcomeB:null|number=null,firstLifeOutcomeC:null|number=null;
 for(let k=1;k<=horizon;k++){
  for(const s of all)s.step();
  const orig=person(control,id),bp=person(ablate,id),cp=person(pause,id);
  const diffB=difference(orig,bp),diffC=difference(orig,cp);
  if(firstPhysicalB===null&&diffB!==null&&diffB>1e-6)firstPhysicalB=control.tick;
  if(firstPhysicalC===null&&diffC!==null&&diffC>1e-6)firstPhysicalC=control.tick;
  const lifeDiff=(a:typeof orig,b:typeof orig)=>a.alive!==b.alive||
   (a.alive&&b.alive&&(a.energy!==b.energy||a.health!==b.health||a.plantEaten!==b.plantEaten
   ||a.meatEaten!==b.meatEaten||a.preyEaten!==b.preyEaten||a.children!==b.children));
  if(firstLifeOutcomeB===null&&lifeDiff(orig,bp))firstLifeOutcomeB=control.tick;
  if(firstLifeOutcomeC===null&&lifeDiff(orig,cp))firstLifeOutcomeC=control.tick;
  if([1,30,60,120,240].includes(k))traces.push({sourceTick:control.tick,
    intact:orig,ablate:bp,pausedPlasticity:cp,physicalGapB:diffB,physicalGapC:diffC,
    population:{intact:control.pop.livingCount,ablate:ablate.pop.livingCount,paused:pause.pop.livingCount}});
 }
 const twinMatches=digest(control)===digest(twin);
 if(!twinMatches)throw Error('unmodified control and twin diverged: source clone integrity invalid');
 result.status='EXPERIMENT_COMPLETED_NOT_LIFE_PROOF';
 result.twinExactDigestMatch=true;
 result.firstMotorAndPoseDivergenceTick={ablation:firstPhysicalB,pausedRate:firstPhysicalC};
 result.firstEnergyHealthOrActionCounterDivergenceTick={ablation:firstLifeOutcomeB,pausedRate:firstLifeOutcomeC};
 result.trajectories=traces;
 result.finalWorldDigests={intact:digest(control),ablated:digest(ablate),pausedRate:digest(pause),untouchedTwin:digest(twin)};
 result.scopeNote='Ablation changes one focal actor somatic output weights; rest of world causally follows. Movement/fitness differences are not automatically meaningful semantic learning; single biased focal and short future, non-geometric vegetation only.';
}else{
 result.reason='No surviving organism with acquired nonzero somatic plastic weights in this frozen world/seed/tick; no reroll.';
}
mkdirSync('research/donors/life/results',{recursive:true});
writeFileSync('research/donors/life/results/P96_RESULT.json',JSON.stringify(result,null,2)+'\n');
console.log('RB_LIFE_P96_RESULT '+JSON.stringify(result));
