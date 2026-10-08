import { beforeAll, describe, expect, it } from 'vitest';
import { LivingWorld, initLivingWorld } from '../../src/living-organism/world';
import { E0_DT, E0_LINEAR_DAMPING } from '../../src/e0-body-seam';

beforeAll(initLivingWorld);
describe('continuous sensory world', () => {
  it('sums motor and external force without deleting either', () => {
    const w = new LivingWorld(false);
    w.step({drive:1,turn:0,gazeRate:0}, {x:0,y:120});
    expect(w.inspect().actor.vx).toBeGreaterThan(0);
    expect(w.inspect().actor.vy).toBeCloseTo(1/(1+E0_DT*E0_LINEAR_DAMPING),5);
    w.free();
  });
  it('does not leave an external force active on later steps', () => {
    const w = new LivingWorld(false);
    w.step({drive:0,turn:0,gazeRate:0},{x:0,y:120});
    const first = w.inspect().actor.vy;
    w.step({drive:0,turn:0,gazeRate:0});
    expect(w.inspect().actor.vy).toBeLessThanOrEqual(first);
    w.free();
  });
  it('rejects nonfinite input before changing clock', () => {
    const w = new LivingWorld(false);
    expect(()=>w.step({drive:NaN,turn:0,gazeRate:0})).toThrow();
    expect(w.observe().tick).toBe(0);
    w.free();
  });
  it('does not reveal movement behind the actor', () => {
    const w = new LivingWorld(false);
    const h=w.addObject(-3,0,.4,[1,0,0]);
    const before=Array.from(w.observe().retina);
    w.moveObject(h,-4,1);
    expect(Array.from(w.observe().retina)).toEqual(before);
    w.free();
  });
  it('sees a partially occluded edge rather than only object centre', () => {
    const w = new LivingWorld(false);
    w.addObject(4,0,.8,[1,0,0]);
    w.addWall(2,0,.08,.15,[.2,.2,.2]);
    const f=w.observe();
    expect(Array.from(f.retina).filter((v,i)=>i%3===0&&v===1).length).toBeGreaterThan(0);
    expect(f.retina.length).toBe(288);
    w.free();
  });
  it('changes the retinal view by turning gaze without rotating body', () => {
    const w = new LivingWorld(false);
    w.addObject(3,0,.5,[1,0,0]);
    const before=Array.from(w.observe().retina);
    for(let i=0;i<50;i++)w.step({drive:0,turn:0,gazeRate:1});
    expect(Array.from(w.observe().retina)).not.toEqual(before);
    expect(w.inspect().actor.angle).toBe(0);
    w.free();
  });
  it('restores time, gaze and next physical trajectory exactly', () => {
    const a = new LivingWorld(true);
    for(let i=0;i<40;i++)a.step({drive:.5,turn:.2,gazeRate:.4});
    const cp=a.captureCheckpoint();
    const b = new LivingWorld(false);
    b.restoreCheckpoint(cp);
    expect(b.inspect()).toEqual(a.inspect());
    for(let i=0;i<240;i++){
      a.step({drive:.5,turn:-.2,gazeRate:0});
      b.step({drive:.5,turn:-.2,gazeRate:0});
    }
    expect(b.inspect()).toEqual(a.inspect());
    expect(b.observe()).toEqual(a.observe());
    a.free();b.free();
  });
  it('observation does not advance time or mutate physics', () => {
    const w=new LivingWorld(true);
    const before=w.captureCheckpoint();
    w.observe();w.observe();
    expect(w.captureCheckpoint()).toEqual(before);
    w.free();
  });
});
