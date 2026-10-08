import {beforeAll,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld} from '../../src/living-organism/world';
import {sensoryFeatures,sensoryTarget} from '../../src/living-organism/sensory-features';
beforeAll(initLivingWorld);
it('builds a sensory example only from separate comparable samples',()=>{
 const w=new LivingWorld(false);w.addObject(6,0,.6,[.1,.85,.8]);const first=w.observe(),d={drive:.25,turn:0,gazeRate:0};
 expect(sensoryFeatures(first,first,d)).toBeNull();
 for(let i=0;i<4;i++)w.step(d);
 const current=w.observe(),x=sensoryFeatures(first,current,d);expect(x).not.toBeNull();expect(x).toHaveLength(11);
 for(let i=0;i<24;i++)w.step(d);
 expect(sensoryTarget(current,w.observe())).toHaveLength(2);w.free();
});
it('rejects labels from a different forecast horizon',()=>{
 const w=new LivingWorld(false);w.addObject(6,0,.6,[.1,.85,.8]);const f=w.observe();
 expect(sensoryTarget(f,{...f,tick:4})).toBeNull();
 expect(sensoryTarget(f,f)).toBeNull();w.free();
});
it('masks missing or ambiguous appearances instead of assigning invented targets',()=>{
 const w=new LivingWorld(false),f=w.observe(),d={drive:0,turn:0,gazeRate:0};
 expect(sensoryFeatures(f,{...f,tick:4},d)).toBeNull();
 w.addObject(6,0,.6,[.1,.85,.8]);const visible=w.observe();
 w.addObject(4,2,.4,[.1,.85,.8]);const ambiguous=w.observe();
 expect(sensoryTarget(visible,ambiguous)).toBeNull();w.free();
});
