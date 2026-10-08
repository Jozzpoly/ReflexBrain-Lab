import {beforeAll,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld} from '../../src/living-organism/world';
beforeAll(initLivingWorld);
import {TouchInterruption} from '../../src/living-organism/touch-interruption';
import type {PrivateFrame,Demand} from '../../src/living-organism/world';
const frame=(tick:number,contact=0):PrivateFrame=>({tick,retina:new Float32Array(288),touch:Float32Array.from([contact,0,0,0,0,0,0,0]),proprio:{forward:0,lateral:0,omega:0,gaze:0}});
const forward:Demand={drive:.12,turn:.04,gazeRate:.1},zero={drive:0,turn:0,gazeRate:0};
it('interrupts an active command on touch and resumes fresh intent after the contact expires',()=>{
 const c=new TouchInterruption();expect(c.decide(frame(0),forward)).toEqual(forward);
 expect(c.decide(frame(4,.1),forward)).toEqual(zero);expect(c.capture().mode).toBe('quiet');
 expect(c.decide(frame(60),forward)).toEqual(zero);
 const changed={drive:.08,turn:-.06,gazeRate:0};expect(c.decide(frame(64),changed)).toEqual(changed);expect(c.capture().resumptions).toBe(1);
});
it('withdraws after persistent contact and permits resumption after a quiet interval',()=>{
 const c=new TouchInterruption();c.decide(frame(0),forward);c.decide(frame(4,.1),forward);c.decide(frame(60,.1),forward);
 expect(c.decide(frame(64,.1),forward).drive).toBe(-.12);expect(c.capture().mode).toBe('backoff');
 expect(c.decide(frame(104),forward).drive).toBe(-.12);expect(c.decide(frame(108),forward)).toEqual(zero);
 expect(c.decide(frame(168),forward)).toEqual(forward);expect(c.capture().mode).toBe('active');
});
it('backs away in the opposite direction when the interrupted command was reverse',()=>{
 const c=new TouchInterruption(),reverse={drive:-.2,turn:0,gazeRate:0};c.decide(frame(0),reverse);c.decide(frame(4,.2),reverse);
 expect(c.decide(frame(64,.2),reverse).drive).toBe(.12);
});
it('does not charge the same sensory sample twice or let upstream mutate the cached command',()=>{
 const c=new TouchInterruption();c.decide(frame(0),forward);const d=c.decide(frame(4,.1),forward),state=c.capture();d.drive=1;
 expect(c.decide(frame(4,.2),forward)).toEqual(zero);expect(c.capture()).toEqual(state);
});
it('restores a partial backoff without sharing mutable state',()=>{
 const a=new TouchInterruption();a.decide(frame(0),forward);a.decide(frame(4,.1),forward);a.decide(frame(64,.1),forward);
 const saved=a.capture(),b=new TouchInterruption();b.restore(saved);saved.demand.drive=1;
 for(const t of [80,108,120,168,172])expect(b.decide(frame(t),forward)).toEqual(a.decide(frame(t),forward));expect(b.capture()).toEqual(a.capture());
});

it('continues an actual physical contact interruption exactly after restoring a fork',()=>{
 const w=new LivingWorld(false),a=new TouchInterruption();w.addObject(2,0,.5,[.1,.85,.8]);
 for(let i=0;i<600&&a.capture().mode==='active';i++)w.step(a.decide(w.observe(),forward));
 expect(a.capture().mode).toBe('quiet');
 for(let i=0;i<24;i++)w.step(a.decide(w.observe(),forward));
 expect(a.capture().mode).toBe('quiet');
 const fork=new LivingWorld(false),b=new TouchInterruption();fork.restoreCheckpoint(w.captureCheckpoint());b.restore(a.capture());
 for(let i=0;i<180;i++){
  expect(fork.observe()).toEqual(w.observe());const d=a.decide(w.observe(),forward);expect(b.decide(fork.observe(),forward)).toEqual(d);
  w.step(d);fork.step(d);
 }
 expect(b.capture()).toEqual(a.capture());expect(fork.inspectContactSample()).toEqual(w.inspectContactSample());w.free();fork.free();
});
const directionalFrame=(tick:number,sector:number):PrivateFrame=>{const f=frame(tick);f.touch[sector]=.1;return f;};
it('can cancel withdrawal when a new touch arrives from the opposite body sector',()=>{
 const c=new TouchInterruption(true);c.decide(frame(0),forward);c.decide(directionalFrame(4,4),forward);
 expect(c.decide(directionalFrame(64,4),forward).drive).toBe(-.12);
 expect(c.decide(directionalFrame(68,0),forward)).toEqual(zero);expect(c.capture().cancellations).toBe(1);expect(c.capture().mode).toBe('quiet');
});
it('does not cancel withdrawal merely because the original contact continues',()=>{
 const c=new TouchInterruption(true);c.decide(frame(0),forward);c.decide(directionalFrame(4,4),forward);c.decide(directionalFrame(64,4),forward);
 expect(c.decide(directionalFrame(68,4),forward).drive).toBe(-.12);expect(c.capture().cancellations).toBe(0);
});
it('restores the withdrawal cancellation policy and remembered contact sector',()=>{
 const a=new TouchInterruption(true);a.decide(frame(0),forward);a.decide(directionalFrame(4,4),forward);a.decide(directionalFrame(64,4),forward);
 const b=new TouchInterruption(false);b.restore(a.capture());expect(b.decide(directionalFrame(68,0),forward)).toEqual(zero);expect(b.capture().cancelOppositeTouch).toBe(true);
});
