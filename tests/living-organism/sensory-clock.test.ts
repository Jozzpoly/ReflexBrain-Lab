import { beforeAll, expect, it } from 'vitest';
import { LivingWorld, initLivingWorld } from '../../src/living-organism/world';
beforeAll(initLivingWorld);
const idle={drive:0,turn:0,gazeRate:0};
it('publishes one private frame every four physical steps',()=>{
 const w=new LivingWorld(false);
 expect(w.observe().tick).toBe(0);
 for(let i=1;i<=3;i++){w.step(idle);expect(w.observe().tick).toBe(0);}
 w.step(idle);expect(w.observe().tick).toBe(4);w.free();
});
it('retains a transient collision until the next sensory sample',()=>{
 const w=new LivingWorld(false);
 const h=w.addObject(1.35,0,.4,[1,0,0]);
 w.observe();w.step({drive:1,turn:0,gazeRate:0});
 w.moveObject(h,5,5);
 for(let i=0;i<3;i++)w.step(idle);
 expect(Array.from(w.observe().touch).reduce((a,b)=>a+b,0)).toBeGreaterThan(0);
 for(let i=0;i<4;i++)w.step(idle);
 expect(Array.from(w.observe().touch).reduce((a,b)=>a+b,0)).toBe(0);
 w.free();
});
it('restores a partially collected sensory interval',()=>{
 const a=new LivingWorld(false);
 a.addObject(1.35,0,.4,[1,0,0]);a.observe();
 a.step({drive:1,turn:0,gazeRate:.5});
 const b=new LivingWorld(false);b.restoreCheckpoint(a.captureCheckpoint());
 expect(b.observe()).toEqual(a.observe());
 for(let i=0;i<7;i++){a.step(idle);b.step(idle);expect(b.observe()).toEqual(a.observe());}
 a.free();b.free();
});
it('runs an independent material process while the actor is idle',()=>{
 const w=new LivingWorld(true);
 const before=w.inspect();
 for(let i=0;i<120;i++)w.step(idle);
 const after=w.inspect();
 expect(after.objects.some((o,i)=>Math.hypot(o.x-before.objects[i].x,o.y-before.objects[i].y)>1)).toBe(true);
 expect(Math.hypot(after.actor.x,after.actor.y)).toBeLessThan(.01);
 w.free();
});
