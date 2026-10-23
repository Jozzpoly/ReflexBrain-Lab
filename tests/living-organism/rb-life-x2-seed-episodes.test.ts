import {beforeAll,describe,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld} from '../../src/living-organism/world';
import {DevResident} from '../../src/living-organism/dev-resident';

beforeAll(initLivingWorld);
const parts=[
 [3.1,.2,.52,.55,'dynamic'],[5.2,-.6,.60,.60,'dynamic'],
 [4.2,2.5,1.15,.22,'dynamic'],[7.1,1.9,.22,1.15,'anchored'],
 [-2.4,2.3,.6,.55,'dynamic'],[-4.4,-1.8,1.15,.22,'anchored'],
 [1.1,-3.4,.22,1.15,'anchored']
] as const;
const seeds=[0x51babe,0x31415926,0x27182818,0xc001d00d] as const;
const cases=(['A-yard','B-mirror'] as const).flatMap(layout=>seeds.map(seed=>({layout,seed})));

function witness(layout:'A-yard'|'B-mirror',seed:number){
 const world=new LivingWorld(false,'B0'),resident=new DevResident('random',seed);
 try{
  for(const [x,y,hx,hy,mode] of parts)world.addMaterialPart(
   layout==='A-yard'?x:-x,layout==='A-yard'?y:y+.6,hx,hy,mode);
  const initial=world.inspect();
  const origin=new Map(initial.objects.map(o=>[o.handle,{x:o.x,y:o.y}]));
  const materialIDs=new Set(initial.objects.map(o=>o.handle));
  const lastContact=new Map<number,number>();
  const countBy30=[0,0,0,0],episodesBy30=[0,0,0,0],visibleBy30=[0,0,0,0];
  const lateDifferentHandles=new Set<number>();
  const affectedBy30=new Set<number>();
  let physicallyCountedSamples=0,lateRawContactRecords=0,lateIndependentEpisodes=0;
  let maxNewEpisodeGap=0,actorDistance=0;
  let lastActor={x:initial.actor.x,y:initial.actor.y};
  for(let tick=1;tick<=14400;tick++){
   world.step(resident.decide(world.observe()));
   if(tick%4===0){
    physicallyCountedSamples++;
    const sample=world.observe();
    const period=Math.min(3,Math.floor((tick-1)/3600));
    if(Array.from(sample.retina).some(x=>Math.abs(x-.74)<1e-4))visibleBy30[period]++;
    const contacts=world.inspectContactSample();
    if(contacts.tick!==tick)throw Error('missing proper contact sample');
    for(const c of contacts.contacts){
     if(!materialIDs.has(c.handle))continue;
     countBy30[period]++;
     const prior=lastContact.get(c.handle);
     if(tick>3600&&affectedBy30.has(c.handle)){
      lateRawContactRecords++;lateDifferentHandles.add(c.handle);
      if(prior===undefined||tick-prior>120){
       lateIndependentEpisodes++;episodesBy30[period]++;
       if(prior!==undefined)maxNewEpisodeGap=Math.max(maxNewEpisodeGap,tick-prior);
      }
     }
     lastContact.set(c.handle,tick);
    }
   }
   if(tick%120===0){
    const now=world.inspect();
    actorDistance+=Math.hypot(now.actor.x-lastActor.x,now.actor.y-lastActor.y);
    lastActor={x:now.actor.x,y:now.actor.y};
    if(tick===3600){
     for(const p of now.objects){
      const start=origin.get(p.handle)!;
      if(p.mode==='dynamic'&&Math.hypot(p.x-start.x,p.y-start.y)>=.20)
       affectedBy30.add(p.handle);
     }
    }
   }
  }
  const result={layout,seed:'0x'+seed.toString(16),totalSolverSteps:world.inspect().tick,
   sampledPrivateFrames:physicallyCountedSamples,earlyAlteredParts:affectedBy30.size,
   lateRawContactRecords,lateIndependentEpisodes,lateTouchedDifferentEarlyPartHandles:lateDifferentHandles.size,
   maxNewEpisodeGap,contactRecordsBy30:countBy30,episodesBy30,visibleBy30,
   actorTravelOneSecondApprox:+actorDistance.toFixed(3),motorChosen:resident.capture().chosen};
  console.log('RB_LIFE_X2_CASE '+JSON.stringify(result));
  expect(result.totalSolverSteps).toBe(14400);
  expect(result.sampledPrivateFrames).toBe(3600);
  expect(result.lateRawContactRecords).toBeGreaterThanOrEqual(result.lateIndependentEpisodes);
  expect(episodesBy30[0]).toBe(0);
  expect(result.earlyAlteredParts).toBeLessThanOrEqual(5);
  expect(Number.isFinite(result.actorTravelOneSecondApprox)).toBe(true);
  return result;
 }finally{world.free();}
}

describe('RB/LIFE-X2 held-fixed multi-seed independent contact episode audit',()=>{
 it.each(cases)('seed $seed on $layout',({layout,seed})=>{
  const result=witness(layout,seed);
  expect(result.layout).toBe(layout);
 },180000);
});
