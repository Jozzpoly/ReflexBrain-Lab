import {beforeAll,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {LivingRuntime} from '../../src/living-organism/runtime';
beforeAll(initLivingWorld);
it('continues physical and private state identically after an autonomous fork',()=>{
 const a=new LivingRuntime();
 for(let i=0;i<123;i++)a.step();
 const b=new LivingRuntime();b.restore(a.capture());
 for(let i=0;i<600;i++){a.step();b.step();}
 expect(b.inspect()).toEqual(a.inspect());expect(b.occupant.capture()).toEqual(a.occupant.capture());
 a.free();b.free();
});
it('observes embodied manual movement without resetting private history on release',()=>{
 const a=new LivingRuntime();a.step();
 const first=a.occupant.capture();
 for(let i=0;i<80;i++)a.step({drive:.6,turn:.4,gazeRate:.2});
 const controlled=a.occupant.capture();
 expect(controlled.lastTick).toBeGreaterThan(first.lastTick!);
 expect(controlled.heading).not.toBe(first.heading);
 a.step();
 expect(a.occupant.capture().lastTick).toBeGreaterThanOrEqual(controlled.lastTick!);
 a.free();
});
it('uses actual rear contact from the world to choose a forward escape',()=>{
 const r=new LivingRuntime();r.world.addObject(-1.35,-.3,.4,[1,0,0]);
 for(let i=0;i<4;i++)r.world.step({drive:0,turn:0,gazeRate:0},{x:-30,y:-6.66});
 expect(r.observe().touch[0]).toBeGreaterThan(0);
 r.step();expect(r.occupant.capture().mode).toBe('yield');
 expect(r.occupant.capture().demand.drive).toBeGreaterThan(0);
 r.free();
});
