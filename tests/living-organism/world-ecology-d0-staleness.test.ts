import {beforeAll,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {runWorldD0} from '../../src/living-organism/world-ecology-d0';
beforeAll(initLivingWorld);
it('WORLD-D0 temporal red-team: does material pressure persist beyond one early collision?',()=>{
  const t60=runWorldD0(true,7200);
  const t180=runWorldD0(true,21600);
  const changedAgain=Math.hypot(t180.targetEnd.x-t60.targetEnd.x,
    t180.targetEnd.y-t60.targetEnd.y);
  expect(t180.finite).toBe(true);
  expect(t180.tick).toBe(21600);
  expect(t180.privateFrameCount).toBe(5400);
  console.log('RB_WORLD_D0_TEMPORAL_REDCHECK '+JSON.stringify({
    at60:t60.targetEnd,at180:t180.targetEnd,
    extraMaterialDisplacementAfterFirstMinute:changedAgain,
    recurrentMaterialPressureDemonstrated:changedAgain>.1,
    limitation:'one loose material and one repeating rail, no full ecological feedback'
  }));
},180000);
