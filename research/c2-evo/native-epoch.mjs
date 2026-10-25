// Research-only observer; real EVO source is cloned temporarily in CI at a pinned SHA.
// No donor code is imported into the ReflexBrain repository or modified by this script.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const {createWorld,stepWorld}=await import(pathToFileURL(resolve(process.argv[2])).href);
const config={seed:'reflexbrain-c2-20261025',worldSize:600,gridResolution:32,initialPopulation:60,foodAbundance:1,mutationRate:0.05,climate:'temperate'};
const A=createWorld(config),B=createWorld(config),N=1200;
const sha=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
function state(w){
 return {tick:w.tick,rng:w.rng.state(),actors:[...w.organisms.values()].sort((a,b)=>a.id-b.id).map(x=>({id:x.id,parent:x.parentId,x:x.x,y:x.y,age:x.age,energy:x.energy,health:x.health,alive:x.alive,foodEaten:x.foodEaten,kills:x.kills,offspring:x.offspringIds.length,genome:x.genome})),
  food:[...w.food.items.values()].sort((a,b)=>a.id-b.id),genealogy:[...w.genealogy.values()].sort((a,b)=>a.id-b.id).map(g=>({id:g.id,parent:g.parentId,birth:g.birthTick,death:g.deathTick,cause:g.causeOfDeath})),
  births:w.totalBirths,deaths:w.totalDeaths};
}
assert.equal(sha(state(A)),sha(state(B)),'native seeded worlds initially differ');
const actors=new Map(),kills=[],bornCarcasses=[],qualifiedEaters=[],uncertainDisappearance=[],checkpoints=[];
let multiEvents=0,foodKillSame=0,foodBirthSame=0,killBirthSame=0,expired=0,disappeared=0;
for(let t=1;t<=N;t++){
 const oldOrg=new Map([...A.organisms.values()].map(o=>[o.id,{food:o.foodEaten,kills:o.kills,children:o.offspringIds.length}]));
 const oldFood=new Map(A.food.items),priorDeath=new Set([...A.genealogy.values()].filter(g=>g.deathTick!==null).map(g=>g.id));
 stepWorld(A,1);stepWorld(B,1);
 if(t===1||t%100===0||t===N){
  const h=sha(state(A));assert.equal(h,sha(state(B)),'observation/noninterference mismatch at native tick '+t);
  checkpoints.push({tick:t,alive:A.organisms.size,births:A.totalBirths,deaths:A.totalDeaths,food:A.food.items.size,observedHash:h});
 }
 const eaters=[];
 for(const o of A.organisms.values()){
  const before=oldOrg.get(o.id);if(!before)continue;
  const food=o.foodEaten>before.food,attack=o.kills>before.kills,birth=o.offspringIds.length>before.children;
  if(food)eaters.push(o.id);
  if(food&&attack)foodKillSame++;
  if(food&&birth)foodBirthSame++;
  if(attack&&birth)killBirthSame++;
  if(Number(food)+Number(attack)+Number(birth)>1)multiEvents++;
  if(food||attack||birth){
   const r=actors.get(o.id)||{id:o.id,food:0,kills:0,births:0};r.food+=Number(food);r.kills+=Number(attack);r.births+=Number(birth);actors.set(o.id,r);
  }
 }
 for(const g of A.genealogy.values())if(g.deathTick!==null&&!priorDeath.has(g.id)&&String(g.causeOfDeath||'').startsWith('killed by'))
  kills.push({tick:t,id:g.id,cause:g.causeOfDeath});
 for(const f of A.food.items.values())if(f.kind==='carcass'&&!oldFood.has(f.id))
  bornCarcasses.push({tick:t,id:f.id,expiresAt:f.expiresAtTick,energy:f.energy});
 const gone=[...oldFood.values()].filter(f=>!A.food.items.has(f.id));
 for(const f of gone)if(f.kind==='carcass'){
  if(t>=f.expiresAtTick){expired++;continue;}
  disappeared++;
  if(gone.length===1&&eaters.length===1)qualifiedEaters.push({tick:t,carcass:f.id,eater:eaters[0]});
  else uncertainDisappearance.push({tick:t,carcass:f.id,allLost:gone.length,allEaters:eaters.length});
 }
}
const actions=[...actors.values()];
console.log('RB_C2_EVO_NATIVE_EPOCH '+JSON.stringify({
 source:'Ayanokoji12786/EVO',sourceSHA:'106f2dd478945debae0e03b237ba7e610a6d80ca',originalUnmodified:true,config,steps:N,independentTwinMatched:true,
 summary:{naturalKills:kills.length,distinctKilledBy: new Set(kills.map(k=>k.cause)).size,sourceCarcassesBorn:bornCarcasses.length,sourceCarcassesExpired:expired,nonExpiryCarcassDisappeared:disappeared,uniquelyAttributableCarcassConsumption:qualifiedEaters.length,ambiguousCarcassDisappearances:uncertainDisappearance.length,actorCountWithFoodAndKill:actions.filter(o=>o.food>0&&o.kills>0).length,actorCountWithFoodAndBirth:actions.filter(o=>o.food>0&&o.births>0).length,sameTickMultipleEffects:multiEvents,sameTickFoodKill:foodKillSame,sameTickFoodBirth:foodBirthSame,sameTickKillBirth:killBirthSame,finalPopulation:A.organisms.size,finalBirths:A.totalBirths,finalDeaths:A.totalDeaths},
 firstKills:kills.slice(0,15),firstCarcasses:bornCarcasses.slice(0,15),firstQualifiedCarcassEaters:qualifiedEaters.slice(0,15),firstAmbiguous:uncertainDisappearance.slice(0,8),checkpoints,
 limits:'One precommitted unforced epoch. Corpse consumption inferred only if exactly one food disappears and one organism eats in the native tick. Global actor policy may perform actions without a costly choice; no learned meaning, predator initiative or special scavenging strategy qualified. Twin digest includes substantial observed state and RNG state but not all internal hidden state or cached Gaussian.'
}));
