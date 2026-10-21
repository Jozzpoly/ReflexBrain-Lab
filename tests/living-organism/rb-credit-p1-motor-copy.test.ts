import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld} from '../../src/living-organism/world';
import {MotorCopyCredit} from '../../src/living-organism/motor-copy-credit';

describe('RB-CREDIT/P1 — real actuator readback instead of host action-author label',()=>{
  beforeAll(initLivingWorld);
  it('distinguishes normal actuator vs reversed actuator with otherwise identical body histories',()=>{
    const normal=new LivingWorld(false),reversed=new LivingWorld(false);
    const inferredNormal=new MotorCopyCredit(),inferredReversed=new MotorCopyCredit();
    let sensoryMatches=0;
    try{
      // A: another controller chooses -0.8, no actuator fault; motor
      // telemetry before the actuator is -0.8.
      // B: resident chooses +0.8, hidden gain=-1 -> exactly same true torque
      // as A. Actor's pre-transducer motor telemetry is +0.8.
      // Neither learner gets the author identity or hidden gain.
      for(let t=0;t<480;t++){
        if(t%4===0){
          const fa=normal.observe(),fb=reversed.observe();
          expect(fb.retina).toEqual(fa.retina);
          expect(fb.proprio).toEqual(fa.proprio);
          expect(fb.touch).toEqual(fa.touch);
          inferredNormal.observe(fa);inferredReversed.observe(fb);
          sensoryMatches++;
        }
        normal.step({drive:0,turn:-.8,gazeRate:0});
        reversed.step({drive:0,turn:Math.max(-1,Math.min(1,.8*(-1))),gazeRate:0});
        inferredNormal.actuatorReadback(-.8);
        inferredReversed.actuatorReadback(+.8);
      }
      const fa=normal.observe(),fb=reversed.observe();
      expect(fb.retina).toEqual(fa.retina);
      expect(fb.proprio).toEqual(fa.proprio);
      expect(fb.touch).toEqual(fa.touch);
      inferredNormal.observe(fa);inferredReversed.observe(fb);
      sensoryMatches++;
      const a=inferredNormal.state(),b=inferredReversed.state();
      expect(a.accepted).toBe(120);expect(b.accepted).toBe(120);
      expect(a.gain).toBeGreaterThan(.95);
      expect(b.gain).toBeLessThan(-.95);
      console.log('RB_CREDIT_P1_RESULT '+JSON.stringify({
        legalMotorCopyIsNewSensor:true,
        doesNotConveyAuthorIdentity:true,
        commonPrivateRGBTouchProprioFrames:sensoryMatches,
        normalReadback:-.8,hiddenReverseReadback:+.8,
        actualWorldTurnBoth:-.8,
        inferredNormal:a,inferredReversed:b,
      }));
    }finally{normal.free();reversed.free();}
  },90000);
});
