import {beforeAll,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld} from '../../src/living-organism/world';
import {Occupant} from '../../src/living-organism/occupant';
beforeAll(initLivingWorld);
function seen(gazeDegrees:number,distance=6){
 const w=new LivingWorld(false);w.addObject(distance,0,.6,[.1,.85,.8]);
 const steps=Math.round(Math.abs(gazeDegrees)*Math.PI/180/(3/120));
 for(let i=0;i<steps;i++)w.step({drive:0,turn:0,gazeRate:Math.sign(gazeDegrees)});
 while(w.inspect().tick%4!==0)w.step({drive:0,turn:0,gazeRate:0});
 const frame=w.observe();w.free();return frame;
}
it('does not stop at a distant object just because gaze places it in the dense retinal centre',()=>{
 for(const gaze of [-60,-30,0,30,60]){
  const o=new Occupant(),d=o.decide(seen(gaze));
  expect(d.drive).toBeGreaterThan(0);
  expect(Math.abs(d.turn)).toBeLessThan(.1);
 }
});
it('gives the same close inspection decision in central and peripheral views',()=>{
 for(const gaze of [-60,0,60])expect(new Occupant().decide(seen(gaze,2)).drive).toBe(0);
});
it('marks a field-edge fragment as clipped rather than a complete silhouette',async()=>{
 const {visibleTurquoisePatches}=await import('../../src/living-organism/retina-geometry');
 const retina=new Float32Array(288);for(let i=80;i<96;i++)retina.set([.1,.85,.8],i*3);
 const patches=visibleTurquoisePatches(retina);
 expect(patches).toHaveLength(1);expect(patches[0].clipped).toBe(true);
 const o=new Occupant();const f=seen(0);f.retina=retina;
 o.decide(f);expect(o.capture().closeSince).toBeNull();
});
it('keeps an occluding gap between visible fragments instead of inventing a whole object',async()=>{
 const {visibleTurquoisePatches}=await import('../../src/living-organism/retina-geometry');
 const retina=new Float32Array(288);
 for(const [first,last] of [[25,35],[50,60]])for(let i=first;i<=last;i++)retina.set([.1,.85,.8],i*3);
 const patches=visibleTurquoisePatches(retina);
 expect(patches).toHaveLength(2);
 expect(patches.every(p=>!p.clipped)).toBe(true);
});
it('selects the angularly larger peripheral patch instead of the more densely sampled central patch',()=>{
 const w=new LivingWorld(false);w.addObject(6,0,.6,[.1,.85,.8]);
 const angle=40*Math.PI/180;w.addObject(4*Math.cos(angle),4*Math.sin(angle),.6,[.1,.85,.8]);
 expect(new Occupant().decide(w.observe()).turn).toBeGreaterThan(.8);w.free();
});
