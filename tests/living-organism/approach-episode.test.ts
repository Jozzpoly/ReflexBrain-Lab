import {beforeAll,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld} from '../../src/living-organism/world';
import {ApproachEpisode} from '../../src/living-organism/approach-episode';
beforeAll(initLivingWorld);
it('reaches a stationary fragment without prematurely abandoning progress',()=>{
 for(const history of [false,true]){
  const w=new LivingWorld(false);w.addObject(6,0,.6,[.1,.85,.8]);const c=new ApproachEpisode(history);
  for(let i=0;i<1200;i++)w.step(c.decide(w.observe()));
  expect(c.capture().mode).toBe('contact');expect(c.capture().abandonedTick).toBeNull();w.free();
 }
});
it('abandons unchanged appearance after actual commanded forward travel while reactive control keeps trying',()=>{
 for(const history of [false,true]){
  const w=new LivingWorld(false),h=w.addObject(6,0,.6,[.1,.85,.8]),c=new ApproachEpisode(history);
  for(let i=0;i<600;i++){
   const a=w.inspect().actor;w.moveObject(h,a.x+6,a.y);
   w.step(c.decide(w.observe()));
  }
  expect(c.capture().mode).toBe(history?'abandoned':'approach');
  expect(c.capture().abandonedTick!==null).toBe(history);w.free();
 }
});
it('does not infer commanded progress from external motion while observing missing evidence',()=>{
 const w=new LivingWorld(false),c=new ApproachEpisode(true);
 for(let i=0;i<300;i++)w.step(c.decide(w.observe()),{x:30,y:0});
 expect(c.capture().mode).toBe('observe');expect(c.capture().travel).toBe(0);w.free();
});
it('forks nonempty progress history and treats duplicate samples as no additional evidence',()=>{
 const w=new LivingWorld(false);w.addObject(6,0,.6,[.1,.85,.8]);const a=new ApproachEpisode(true);
 for(let i=0;i<48;i++)w.step(a.decide(w.observe()));
 const state=a.capture();expect(state.anchorExtent).not.toBeNull();expect(state.travel).toBeGreaterThan(0);
 const b=new ApproachEpisode(true);b.restore(state);a.decide(w.observe());
 const saved=a.capture();a.decide(w.observe());expect(a.capture()).toEqual(saved);
 b.decide(w.observe());
 for(let i=0;i<120;i++){const f=w.observe();expect(b.decide(f)).toEqual(a.decide(f));w.step(a.decide(f));}
 expect(b.capture()).toEqual(a.capture());w.free();
});
it('reconsiders a failed approach and eventually reaches a target within a separate 15-second recovery horizon',()=>{
 const w=new LivingWorld(false),h=w.addObject(6,0,.6,[.1,.85,.8]),c=new ApproachEpisode(true,true);
 let suspended=false;
 for(let i=0;i<1800;i++){
  w.moveObject(h,6+2.5*Math.min(i/120,2),0);
  const d=c.decide(w.observe());suspended ||= c.capture().mode==='paused';w.step(d);
 }
 expect(suspended).toBe(true);expect(c.capture().attempts).toBeGreaterThan(1);
 expect(c.capture().mode).toBe('contact');w.free();
});
it('restores an active suspension including its retry policy and deadline',()=>{
 const w=new LivingWorld(false),h=w.addObject(6,0,.6,[.1,.85,.8]),a=new ApproachEpisode(true,true);
 for(let i=0;i<160;i++){const p=w.inspect().actor;w.moveObject(h,p.x+6,p.y);w.step(a.decide(w.observe()));}
 expect(a.capture().mode).toBe('paused');
 const b=new ApproachEpisode(false);b.restore(a.capture());
 for(let i=0;i<280;i++){
  const p=w.inspect().actor;w.moveObject(h,p.x+6,p.y);
  const f=w.observe(),d=a.decide(f);expect(b.decide(f)).toEqual(d);w.step(d);
 }
 expect(b.capture()).toEqual(a.capture());expect(a.capture().attempts).toBeGreaterThan(1);w.free();
});
