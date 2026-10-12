import {beforeAll,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {MATERIAL_SLICE,runMaterialRelationSlice}
  from '../../src/living-organism/material-relation-scout';
beforeAll(initLivingWorld);
it('keeps a full minute of one unchanged continuing physical world in each of 3 arms',()=>{
  expect(MATERIAL_SLICE.ticks).toBe(7200);
  expect(MATERIAL_SLICE.modes).toEqual([
    'world-only','cheap-cyan-chase','private-material-concern',
  ]);
});
it('characterizes actual World material displacement through purely RGB/proprio actor',()=>{
  const result=runMaterialRelationSlice();
  expect(result.status).toBe('ENGINEERING_DISCOVERY_ONLY');
  expect(result.deterministic).toBe(true);
  expect(result.results).toHaveLength(3);
  expect(result.results.every(r=>r.ticks===7200&&r.finite)).toBe(true);
  // 120Hz physics/30Hz sensor: repeated cached frames count only once.
  expect(result.results.every(r=>r.visibleTargetFrames<=1800 && r.visibleDockFrames<=1800)).toBe(true);
  expect(result.results.every(r=>r.targetStart && r.targetEnd && r.dockEnd)).toBe(true);
  // Deliberately NO success assertion for material restoration: this is a
  // discovery/specimen audit, not a CI rubric that silently makes science pass.
  console.log('RB_MATERIAL_S0_RESULT '+JSON.stringify(result));
},180000);
