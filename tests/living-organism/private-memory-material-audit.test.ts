import {beforeAll,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {
  M1_FROZEN,runM1MemoryMaterialAudit,
} from '../../src/living-organism/private-memory-material-audit';
beforeAll(initLivingWorld);
it('locks the five World changes, genuine runtime fork time and continuation horizon',()=>{
 expect(M1_FROZEN.forkTick).toBe(80);
 expect(M1_FROZEN.continuationTicks).toBe(4800);
 expect(M1_FROZEN.shifts.map(s=>[s.label,s.x,s.y,s.relocated])).toEqual([
  ['rear-upper',-6,3,true],['rear-lower',-6,-3,true],
  ['front-lower',6,-3,true],['front-near',6,3,true],
  ['unchanged',5,3,false],
 ]);
});
it('executes paired whole-life private memory ablation with true World physical outcomes',()=>{
 const r=runM1MemoryMaterialAudit();
 expect(r.deterministic).toBe(true);
 expect(r.scenes).toHaveLength(5);
 expect(r.scenes.every(s=>s.exactCommonFork)).toBe(true);
 expect(['PASS','FAIL','INCONCLUSIVE']).toContain(r.scientific);
 console.log('RB_ORG_M1_RESULT '+JSON.stringify(r));
},180000);
