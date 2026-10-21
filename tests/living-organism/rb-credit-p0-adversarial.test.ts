import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld,type Demand} from '../../src/living-organism/world';
import {MotorCredit} from '../../src/living-organism/credit-pilot';

const base=(turn:number):Demand=>({drive:0,turn,gazeRate:0});
describe('RB-CREDIT/P0 — adversarial own/executed credit separation',()=>{
  beforeAll(initLivingWorld);
  it('shows naive intended-action learner hallucinates inverted steering during manual takeover',()=>{
    const w=new LivingWorld(false);
    const gated=new MotorCredit('sign-only');
    const naive=new MotorCredit('sign-only');
    let samples=0;
    try{
      // Real Rapier actuator is UNCHANGED and accepts turn=-0.8.
      // Resident hypothetical motor intention is +0.8, but host replaces it.
      // Only a bad training seam falsely calls the intention the executed action.
      for(let t=0;t<480;t++){
        if(t%4===0){
          const f=w.observe();
          gated.observe(f);naive.observe(f);samples++;
        }
        const applied=-.8;
        w.step(base(applied));
        gated.motorExecuted(applied,false); // actor did NOT issue this motor
        naive.motorExecuted(+.8,true);      // incorrectly credited a hypothetical command
      }
      const f=w.observe();gated.observe(f);naive.observe(f);samples++;
      expect(gated.state().accepted).toBe(0);
      expect(gated.state().gain).toBe(1);
      expect(gated.state().refusedOverride).toBeGreaterThan(0);
      expect(naive.state().accepted).toBeGreaterThan(0);
      expect(naive.state().gain).toBeLessThan(-.95);
      console.log('RB_CREDIT_ADVERSE '+JSON.stringify({
        trueWorldMotor:'turn=-0.8, no sign reversal',
        hypotheticalActorIntention:'turn=+0.8',
        samples,gated:gated.state(),naive:naive.state(),
        actualFinalOmega:f.proprio.omega,
      }));
    }finally{w.free();}
  },90000);

  it('exhibits identical private physics under different motor authorship',()=>{
    const ownWorld=new LivingWorld(false),overrideWorld=new LivingWorld(false);
    const own=new MotorCredit('sign-only'),notOwn=new MotorCredit('sign-only');
    let privateMatchCount=0;
    try{
      for(let t=0;t<480;t++){
        if(t%4===0){
          const a=ownWorld.observe(),b=overrideWorld.observe();
          expect(b.proprio).toEqual(a.proprio);
          expect(b.retina).toEqual(a.retina);
          expect(b.touch).toEqual(a.touch);
          privateMatchCount++;
          own.observe(a);notOwn.observe(b);
        }
        // The physical actuator performs EXACTLY the same command in both.
        // What differs is only a host-owned external provenance fact.
        ownWorld.step(base(.8));overrideWorld.step(base(.8));
        own.motorExecuted(.8,true);
        notOwn.motorExecuted(.8,false);
      }
      const a=ownWorld.observe(),b=overrideWorld.observe();
      expect(b.proprio).toEqual(a.proprio);
      expect(b.retina).toEqual(a.retina);
      expect(b.touch).toEqual(a.touch);
      own.observe(a);notOwn.observe(b);privateMatchCount++;
      expect(own.state().accepted).toBeGreaterThan(0);
      expect(notOwn.state().accepted).toBe(0);
      expect(notOwn.state().refusedOverride).toBeGreaterThan(0);
      console.log('RB_CREDIT_AUTHORSHIP_ALIAS '+JSON.stringify({
        samePrivateFrames:privateMatchCount,
        ownAccepted:own.state().accepted,overrideAccepted:notOwn.state().accepted,
        ownGain:own.state().gain,overrideGain:notOwn.state().gain,
      }));
    }finally{ownWorld.free();overrideWorld.free();}
  },90000);
});
