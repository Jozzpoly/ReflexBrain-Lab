import {beforeAll,expect,it} from 'vitest';
import {LivingRuntime} from '../../src/living-organism/runtime';
import {initLivingWorld} from '../../src/living-organism/world';
beforeAll(initLivingWorld);
it('keeps reaching new places after its visible concern is removed, instead of circling the same cells',()=>{
 const r=new LivingRuntime();
 for(let i=0;i<7200;i++)r.step();
 for(const o of r.inspect().objects)if(o.color[1]>.65&&o.color[2]>.6&&o.color[0]<.3)r.world.moveObject(o.handle,100,100);
 const cells=new Set<string>();let firstMinute=0;
 for(let i=0;i<28800;i++){
  r.step();const a=r.inspect().actor;
  cells.add(`${Math.floor(a.x)},${Math.floor(a.y)}`);
  if(i===7199)firstMinute=cells.size;
 }
 // Host-only metric. No cell coordinates are supplied to the controller.
 expect(cells.size-firstMinute).toBeGreaterThan(8);
 r.free();
},30000);
