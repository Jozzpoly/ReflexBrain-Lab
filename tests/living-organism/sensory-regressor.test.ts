import {expect,it} from 'vitest';
import {SensoryRegressor} from '../../src/living-organism/sensory-regressor';
it('learns sensory changes and predicts an input not used during fit',()=>{
 const samples=Array.from({length:21},(_,i)=>{const x=(i-10)/10;return {input:[x],output:[2*x+.3,-x+.2]};});
 const m=new SensoryRegressor();m.fit(samples);
 const p=m.predict([.37]);expect(p[0]).toBeCloseTo(1.04,2);expect(p[1]).toBeCloseTo(-.17,2);
});
it('restores trained coefficients without mutable aliasing',()=>{
 const a=new SensoryRegressor();a.fit([{input:[0],output:[1,2]},{input:[1],output:[3,4]}]);
 const cp=a.capture(),b=new SensoryRegressor();b.restore(cp);
 const expected=a.predict([.5]);cp.weights[0][0]=999;cp.mean[0]=999;
 expect(a.predict([.5])).toEqual(expected);expect(b.predict([.5])).toEqual(expected);
});
it('rejects absent training, nonfinite samples and mismatched feature shapes',()=>{
 const m=new SensoryRegressor();expect(()=>m.predict([1])).toThrow();expect(()=>m.fit([])).toThrow();
 expect(()=>m.fit([{input:[NaN],output:[0,0]}])).toThrow();
 m.fit([{input:[1],output:[1,1]}]);expect(()=>m.predict([1,2])).toThrow();
});
it('rejects invalid restored weights rather than returning nonfinite forecasts',()=>{
 const m=new SensoryRegressor();m.fit([{input:[1],output:[1,1]}]);const cp=m.capture();cp.weights[0][0]=NaN;
 expect(()=>m.restore(cp)).toThrow();
});
