import {beforeAll,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld,type PrivateFrame} from '../../src/living-organism/world';
import {PrivateVision} from '../../src/living-organism/private-vision';
beforeAll(initLivingWorld);
it('keeps single-image size-distance ambiguity unresolved',()=>{
 const w=new LivingWorld(false);w.addObject(6,0,.6,[.1,.85,.8]);
 const v=new PrivateVision();v.observe(w.observe());
 expect(v.capture().estimate).toBeNull();w.free();
});
it('derives different tentative distances from actual motion and identical initial images',()=>{
 const distances=[];
 for(const [distance,radius] of [[3,.3],[6,.6]]){
  const w=new LivingWorld(false);w.addObject(distance,0,radius,[.1,.85,.8]);const v=new PrivateVision();v.observe(w.observe());
  for(let i=0;i<60;i++){w.step({drive:0,turn:0,gazeRate:0},{x:0,y:30});v.observe(w.observe());}
  const e=v.capture().estimate;expect(e).not.toBeNull();
  const actual=Math.hypot(distance-w.inspect().actor.x,w.inspect().actor.y);
  expect(Math.abs(e!.distance-actual)/actual).toBeLessThan(.25);
  expect(e!.assumption).toBe('stationary-fragment');distances.push(e!.distance);w.free();
 }
 expect(distances[1]).toBeGreaterThan(distances[0]+1);
});
it('does not gain depth from rotation without translational baseline',()=>{
 const w=new LivingWorld(false);w.addObject(6,0,.6,[.1,.85,.8]);const v=new PrivateVision();
 for(let i=0;i<40;i++){w.step({drive:0,turn:0,gazeRate:.5});v.observe(w.observe());}
 expect(v.capture().estimate).toBeNull();w.free();
});
it('drops correspondence when similar simultaneous fragments make selection ambiguous',()=>{
 const w=new LivingWorld(false);w.addObject(6,0,.6,[.1,.85,.8]);const v=new PrivateVision();v.observe(w.observe());
 w.addObject(4,3,.6,[.1,.85,.8]);for(let i=0;i<4;i++)w.step({drive:0,turn:0,gazeRate:0});v.observe(w.observe());
 expect(v.capture().reason).toBe('ambiguous');expect(v.capture().estimate).toBeNull();w.free();
});
it('restores private evidence exactly and ignores repeat reads of a sample',()=>{
 const w=new LivingWorld(false);w.addObject(6,0,.6,[.1,.85,.8]);const a=new PrivateVision();
 for(let i=0;i<30;i++){w.step({drive:0,turn:0,gazeRate:0},{x:0,y:30});a.observe(w.observe());}
 const b=new PrivateVision();b.restore(a.capture());const old=a.capture();a.observe(w.observe());expect(a.capture()).toEqual(old);
 for(let i=0;i<30;i++){w.step({drive:0,turn:0,gazeRate:0},{x:0,y:30});const f=w.observe();a.observe(f);b.observe(f);}
 expect(b.capture()).toEqual(a.capture());w.free();
});
it('rebuilds evidence after a sudden visual displacement instead of poisoning the next hypothesis',()=>{
 const w=new LivingWorld(false),h=w.addObject(6,0,.6,[.1,.85,.8]),v=new PrivateVision();v.observe(w.observe());
 for(let i=0;i<60;i++){w.step({drive:0,turn:0,gazeRate:0},{x:0,y:30});v.observe(w.observe());}
 expect(v.capture().estimate).not.toBeNull();w.moveObject(h,6,4);
 for(let i=0;i<4;i++){w.step({drive:0,turn:0,gazeRate:0},{x:0,y:30});v.observe(w.observe());}
 expect(v.capture().estimate).toBeNull();expect(v.capture().reason).toBe('inconsistent');
 for(let i=0;i<60;i++){w.step({drive:0,turn:0,gazeRate:0},{x:0,y:30});v.observe(w.observe());}
 const e=v.capture().estimate,body=w.inspect().actor;
 expect(e).not.toBeNull();expect(Math.abs(e!.distance-Math.hypot(6-body.x,4-body.y))).toBeLessThan(1);
 w.free();
});
