import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld} from '../../src/living-organism/world';

beforeAll(initLivingWorld);
const forward={drive:1,turn:0,gazeRate:0};
type Mode='dynamic'|'anchored';

function run(mode:Mode,farYOffset=0){
 const w=new LivingWorld(false);
 try{
  const near=w.addMaterialPart(2.6,0,.55,.55,mode);
  const far=w.addMaterialPart(4.15,farYOffset,.55,.55,'dynamic');
  let firstFarMotion:null|{tick:number;nearX:number;farX:number;actorX:number;directActorGap:number}=null;
  let nearMoved=false;
  const trace:{tick:number;actorX:number;nearX:number;farX:number}[]=[];
  for(let i=0;i<720;i++){
   w.step(forward);
   const state=w.inspect(),p=state.objects.find(o=>o.handle===near)!,q=state.objects.find(o=>o.handle===far)!;
   if(Math.abs(p.x-2.6)>.04)nearMoved=true;
   if(Math.abs(q.x-4.15)>.012&&firstFarMotion===null){
    firstFarMotion={tick:state.tick,nearX:p.x,farX:q.x,actorX:state.actor.x,
      // Positive gap: the actor body has not touched the far part.
      directActorGap:(q.x-q.hx)-(state.actor.x+1)};
   }
   if(state.tick%120===0)trace.push({tick:state.tick,actorX:state.actor.x,nearX:p.x,farX:q.x});
  }
  return {mode,farYOffset,nearMoved,firstFarMotion,trace,tick:w.inspect().tick};
 }finally{w.free();}
}

describe('R8 open matter: compositional contact causal challenge, not life',()=>{
 it('a near movable part mediates a world effect inaccessible through the same fixed near part',()=>{
  const free=run('dynamic');
  const fixed=run('anchored');
  console.log('RB_R8_INDIRECT_CONTACT '+JSON.stringify({free,fixed}));
  expect(free.tick).toBe(720);
  expect(fixed.tick).toBe(720);
  expect(free.nearMoved).toBe(true);
  expect(free.firstFarMotion).not.toBeNull();
  expect(free.firstFarMotion!.directActorGap).toBeGreaterThan(.025);
  expect(fixed.nearMoved).toBe(false);
  expect(fixed.firstFarMotion).toBeNull();
 });
 it('the same movable near body cannot transmit its forward push to a geometrically separate far part',()=>{
  const apart=run('dynamic',2.4);
  console.log('RB_R8_OFF_AXIS_NEGATIVE '+JSON.stringify(apart));
  expect(apart.nearMoved).toBe(true);
  expect(apart.firstFarMotion).toBeNull();
  expect(apart.tick).toBe(720);
 });
});
