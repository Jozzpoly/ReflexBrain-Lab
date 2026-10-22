import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld} from '../../src/living-organism/world';
import {Occupant} from '../../src/living-organism/occupant';

beforeAll(initLivingWorld);
const still={drive:0,turn:0,gazeRate:0};
const wrap=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));

describe('R8 motor authority handoff: adverse prior-history check',()=>{
 it('measures unobserved manual-turn gap against restored authored heading; no life claim',()=>{
  const world=new LivingWorld(false),controller=new Occupant();
  try{
   for(let k=0;k<480;k++)world.step(controller.decide(world.observe()));
   const before=controller.capture(),beforeBody=world.inspect().actor;
   // Real physical Owner drive. This is external motor authority, not controller desire.
   for(let k=0;k<3600;k++)world.step({drive:0,turn:k<1800?-.9:.9,gazeRate:0});
   const afterFrame=world.observe(),afterBody=world.inspect().actor;
   const beforeReturn=controller.capture();
   const firstAutonomousDemand=controller.decide(afterFrame);
   const afterReturn=controller.capture();
   const falseSingleVelocityDelta=afterFrame.proprio.omega*(afterFrame.tick-before.lastTick!)/120;
   const realBodyRotation=wrap(afterBody.angle-beforeBody.angle);
   const stateRotation=wrap(afterReturn.heading-before.heading);
   const data={
    actorTimeBefore:before.lastTick,worldTimeAfter:afterFrame.tick,
    privateFramesSkipped:(afterFrame.tick-before.lastTick!)/4,
    beforeHeading:before.heading,afterHeading:afterReturn.heading,
    terminalAngularSpeed:afterFrame.proprio.omega,
    falseSingleVelocityDelta,realBodyRotation,stateRotation,
    relativeHeadingError:wrap(stateRotation-realBodyRotation),
    controllerWasPaused:beforeReturn.lastTick===before.lastTick,
    demand:firstAutonomousDemand};
   console.log('RB_R8_MANUAL_HANDOFF_DIAGNOSTIC '+JSON.stringify(data));
   expect(data.privateFramesSkipped).toBeGreaterThan(500);
   expect(data.controllerWasPaused).toBe(true);
   expect(data.actorTimeBefore).toBeLessThan(data.worldTimeAfter);
   expect([data.falseSingleVelocityDelta,data.realBodyRotation,data.relativeHeadingError].every(Number.isFinite)).toBe(true);
  }finally{world.free();}
 },120000);
});
