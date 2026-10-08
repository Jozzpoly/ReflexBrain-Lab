import {beforeAll,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld} from '../../src/living-organism/world';
beforeAll(initLivingWorld);
const idle={drive:0,turn:0,gazeRate:0};
it('attributes physical contact to the obstacle and not a nearby intended target',()=>{
 const w=new LivingWorld(false),obstacle=w.addObject(1.35,0,.4,[1,0,0]),target=w.addObject(0,1.62,.6,[.1,.85,.8]);
 for(let i=0;i<4;i++)w.step({drive:1,turn:0,gazeRate:0});
 const sample=w.inspectContactSample();expect(sample.tick).toBe(w.observe().tick);
 expect(sample.contacts.some(c=>c.handle===obstacle&&c.impulse>0)).toBe(true);
 expect(sample.contacts.some(c=>c.handle===target)).toBe(false);
 const host=w.inspect(),object=host.objects.find(o=>o.handle===target)!;
 expect(Math.hypot(object.x-host.actor.x,object.y-host.actor.y)).toBeLessThanOrEqual(1.63);
 expect(Object.keys(w.observe()).sort()).toEqual(['proprio','retina','tick','touch']);w.free();
});
it('retains an ended collision in the aligned sample and clears the following sample',()=>{
 const w=new LivingWorld(false),h=w.addObject(1.35,0,.4,[1,0,0]);
 w.observe();w.step({drive:1,turn:0,gazeRate:0});w.moveObject(h,5,5);
 expect(w.inspectContactSample()).toEqual({tick:0,contacts:[]});
 for(let i=0;i<3;i++)w.step(idle);
 const sample=w.inspectContactSample();expect(sample.tick).toBe(4);
 expect(sample.contacts.some(c=>c.handle===h&&c.tick===1&&c.impulse>0)).toBe(true);
 sample.contacts.length=0;expect(w.inspectContactSample().contacts.length).toBeGreaterThan(0);
 for(let i=0;i<4;i++)w.step(idle);
 expect(w.inspectContactSample()).toEqual({tick:8,contacts:[]});w.free();
});
it('restores a partially collected contact window and continues exact host and private evidence',()=>{
 const a=new LivingWorld(false),h=a.addObject(1.35,0,.4,[1,0,0]);
 a.observe();a.step({drive:1,turn:0,gazeRate:0});a.moveObject(h,5,5);
 const cp=a.captureCheckpoint();expect(cp.version).toBe(3);
 const b=new LivingWorld(false);b.restoreCheckpoint(cp);
 expect(cp.pendingContactEvents.length).toBeGreaterThan(0);
 cp.pendingContactEvents[0].impulse=-1; // Mutating caller data must not rewrite either world.
 for(let i=0;i<7;i++){a.step(idle);b.step(idle);expect(b.inspectContactSample()).toEqual(a.inspectContactSample());expect(b.observe()).toEqual(a.observe());}
 a.free();b.free();
});
