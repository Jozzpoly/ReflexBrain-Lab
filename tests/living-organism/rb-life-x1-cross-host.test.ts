import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld} from '../../src/living-organism/world';
import {Occupant} from '../../src/living-organism/occupant';
import {DevResident,type DevMode} from '../../src/living-organism/dev-resident';

beforeAll(initLivingWorld);

type Layout='A-yard'|'B-mirror';
type Policy='occupant'|DevMode;
const ORIGINAL=[
 [3.1,.2,.52,.55,'dynamic'],
 [5.2,-.6,.60,.60,'dynamic'],
 [4.2,2.5,1.15,.22,'dynamic'],
 [7.1,1.9,.22,1.15,'anchored'],
 [-2.4,2.3,.6,.55,'dynamic'],
 [-4.4,-1.8,1.15,.22,'anchored'],
 [1.1,-3.4,.22,1.15,'anchored']
] as const;
const layouts:Layout[]=['A-yard','B-mirror'];
const policies:Policy[]=['occupant','adaptive','frozen','random'];
const cases=layouts.flatMap(layout=>policies.map(policy=>({layout,policy})));
type Bucket={period:string;retinaFrames:number;touchFrames:number;
  physicalActorPartContactFrames:number;contactEvents:number;
  displacedMaterialTravel:number;actorTravel:number;
  lateContactEventsWithEarlyChanged:number};
const periods=['00-30','30-60','60-90','90-120'];
const bucket=():Bucket[]=>periods.map(period=>({period,retinaFrames:0,touchFrames:0,
  physicalActorPartContactFrames:0,contactEvents:0,displacedMaterialTravel:0,actorTravel:0,
  lateContactEventsWithEarlyChanged:0}));
function run(layout:Layout,policy:Policy){
 const world=new LivingWorld(false,'B0');
 const occupant=policy==='occupant'?new Occupant():null;
 const learner=policy==='occupant'?null:new DevResident(policy,0x51babe);
 const bins=bucket();
 try{
  for(const [x,y,hx,hy,mode] of ORIGINAL)
   world.addMaterialPart(layout==='B-mirror'?-x:x,layout==='B-mirror'?y+.6:y,hx,hy,mode);
  const start=world.inspect();
  const partIds=new Set(start.objects.map(o=>o.handle));
  const initial=new Map(start.objects.map(o=>[o.handle,{x:o.x,y:o.y}]));
  let lastParts=new Map(start.objects.map(o=>[o.handle,{x:o.x,y:o.y}]));
  let lastActor={x:start.actor.x,y:start.actor.y};
  let changedAt30=new Set<number>();
  let privateFrames=0,physicsSteps=0;
  let firstThirtyContactEvents=0,lateSelfAlteredContactEvents=0;
  let actorMaterialPartHandles=new Set<number>();
  for(let i=1;i<=14400;i++){
   const frame=world.observe();
   const demand=occupant?occupant.decide(frame):learner!.decide(frame);
   world.step(demand);
   physicsSteps++;
   const currentPeriod=Math.min(3,Math.floor((i-1)/3600));
   if(i%4===0){
    privateFrames++;
    const privateSample=world.observe();
    const b=bins[currentPeriod];
    if(Array.from(privateSample.retina).some(v=>Math.abs(v-.74)<1e-4))b.retinaFrames++;
    if(Array.from(privateSample.touch).some(v=>v>.001))b.touchFrames++;
    const contacts=world.inspectContactSample();
    if(contacts.tick!==i)throw Error('False legal contact sample clock');
    const partContacts=contacts.contacts.filter(c=>partIds.has(c.handle));
    if(partContacts.length)b.physicalActorPartContactFrames++;
    b.contactEvents+=partContacts.length;
    for(const contact of partContacts){
      actorMaterialPartHandles.add(contact.handle);
      if(i<=3600)firstThirtyContactEvents++;
      if(i>3600&&changedAt30.has(contact.handle)){
       lateSelfAlteredContactEvents++;
       b.lateContactEventsWithEarlyChanged++;
      }
    }
   }
   if(i%120===0){
    const now=world.inspect();
    const b=bins[currentPeriod];
    b.actorTravel+=Math.hypot(now.actor.x-lastActor.x,now.actor.y-lastActor.y);
    lastActor={x:now.actor.x,y:now.actor.y};
    for(const o of now.objects){
      const prev=lastParts.get(o.handle)!;
      if(o.mode==='dynamic')
       b.displacedMaterialTravel+=Math.hypot(o.x-prev.x,o.y-prev.y);
    }
    lastParts=new Map(now.objects.map(o=>[o.handle,{x:o.x,y:o.y}]));
    if(i===3600){
     changedAt30=new Set(now.objects.filter(o=>o.mode==='dynamic'&&
      Math.hypot(o.x-initial.get(o.handle)!.x,o.y-initial.get(o.handle)!.y)>=.20).map(o=>o.handle));
    }
   }
  }
  const state=learner?.capture();
  const result={
   layout,policy,physicalSteps:physicsSteps,privateFrames,partCount:start.objects.length,
   alteredByFirst30:changedAt30.size,
   firstThirtyContactEvents,lateSelfAlteredContactEvents,
   touchedUniqueParts:actorMaterialPartHandles.size,
   controllerUpdates:state?.learnedTrials??null,
   chosen:state?.chosen??null,
   finalActor:{x:world.inspect().actor.x,y:world.inspect().actor.y},
   bins:bins.map(b=>({...b,displacedMaterialTravel:+b.displacedMaterialTravel.toFixed(5),
    actorTravel:+b.actorTravel.toFixed(4)}))
  };
  console.log('RB_LIFE_X1_CASE '+JSON.stringify(result));
  expect(physicsSteps).toBe(14400);
  expect(world.inspect().tick).toBe(14400);
  expect(privateFrames).toBe(3600);
  expect(bins.every(b=>[b.displacedMaterialTravel,b.actorTravel,b.contactEvents].every(Number.isFinite))).toBe(true);
  expect(bins.reduce((acc,b)=>acc+b.contactEvents,0)).toBeGreaterThanOrEqual(lateSelfAlteredContactEvents);
  expect(result.alteredByFirst30).toBeLessThanOrEqual(5);
  return result;
 }finally{world.free();}
}
describe('RB/LIFE-X1 source-frozen 120s cross-host actor-private control audit',()=>{
 it.each(cases)('$layout / $policy: no claimed life PASS',({layout,policy})=>{
   const result=run(layout,policy);
   expect(result.policy).toBe(policy);
 },180000);
});
