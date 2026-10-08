import { describe,expect,it } from 'vitest';
import { Occupant } from '../../src/living-organism/occupant';
import type { PrivateFrame } from '../../src/living-organism/world';
function frame(tick:number,index:number|null):PrivateFrame{
 const retina=new Float32Array(288);
 if(index!==null)for(let j=index-2;j<=index+2;j++)retina.set([.1,.85,.8],j*3);
 return {tick,retina,touch:new Float32Array(8),proprio:{forward:0,lateral:0,omega:0,gaze:0}};
}
describe('private authored continuation',()=>{
 it('different lived visual histories change the same later empty-image action',()=>{
  const left=new Occupant(),right=new Occupant();
  left.decide(frame(0,20));right.decide(frame(0,75));
  expect(left.decide(frame(4,null)).turn).toBeLessThan(0);
  expect(right.decide(frame(4,null)).turn).toBeGreaterThan(0);
 });
 it('does not advance private time from repeated reads of the same sample',()=>{
  const o=new Occupant();o.decide(frame(0,30));
  const state=o.capture();o.decide(frame(0,null));
  expect(o.capture()).toEqual(state);
 });
 it('forgets an old direction after its bounded search window',()=>{
  const o=new Occupant();o.decide(frame(0,30));
  for(let tick=4;tick<=400;tick+=4)o.decide(frame(tick,null));
  expect(o.capture().lastDirection).toBeNull();
  expect(o.capture().mode).toBe('explore');
 });
 it('retreats from frontal contact and then resumes the visual concern',()=>{
  const o=new Occupant(),f=frame(0,48);f.touch[4]=1;
  expect(o.decide(f).drive).toBeLessThan(0);
  for(let tick=4;tick<=80;tick+=4)o.decide(frame(tick,48));
  expect(o.capture().mode).toBe('approach');
 });
 it('finishes sustained close inspection and explores despite the same visible patch',()=>{
  const o=new Occupant();
  for(let tick=0;tick<=360;tick+=4){const f=frame(tick,null);for(let i=26;i<=69;i++)f.retina.set([.1,.85,.8],i*3);o.decide(f);}
  expect(o.capture().mode).toBe('explore');
  expect(o.capture().demand.drive).toBeGreaterThan(0);
  const restored=new Occupant();restored.restore(o.capture());
  const f=frame(364,48);expect(restored.decide(f)).toEqual(o.decide(f));
 });
 it('restores private state and pending demand without gaining world knowledge',()=>{
  const a=new Occupant();a.decide(frame(0,25));a.decide(frame(4,null));
  const b=new Occupant();b.restore(a.capture());
  expect(b.decide(frame(8,null))).toEqual(a.decide(frame(8,null)));
 });
});
it('explores in travelled legs rather than continuously steering around a circle',()=>{
 const o=new Occupant();
 const f=(tick:number,forward=0,omega=0):PrivateFrame=>({tick,retina:new Float32Array(288),touch:new Float32Array(8),proprio:{forward,lateral:0,omega,gaze:0}});
 expect(o.decide(f(0)).turn).toBe(0);
 // Elapsed time alone cannot complete a travelled leg.
 for(let tick=4;tick<=1600;tick+=4)expect(o.decide(f(tick)).turn).toBe(0);
 let demand=o.decide(f(1604,1));
 for(let tick=1608;tick<=2600;tick+=4)demand=o.decide(f(tick,1));
 expect(Math.abs(demand.turn)).toBeGreaterThan(.1);
 const sign=Math.sign(demand.turn);
 // Rotation sensed by the body, rather than a fixed timer, ends the turn.
 for(let tick=2604;tick<=3400;tick+=4)demand=o.decide(f(tick,0,sign));
 expect(demand.turn).toBe(0);
 expect(demand.drive).toBeGreaterThan(0);
 const b=new Occupant();b.restore(o.capture());
 expect(b.decide(f(3404,1))).toEqual(o.decide(f(3404,1)));
});
it('moves away from rear contact instead of backing into it, and steers away from the contacted side',()=>{
 const f=(sector:number):PrivateFrame=>{const touch=new Float32Array(8);touch[sector]=1;return {tick:0,retina:new Float32Array(288),touch,proprio:{forward:0,lateral:0,omega:0,gaze:0}};};
 const frontLeft=new Occupant(),rearRight=new Occupant();
 const a=frontLeft.decide(f(4)),b=rearRight.decide(f(0));
 expect(a.drive).toBeLessThan(0);expect(a.turn).toBeLessThan(0);
 expect(b.drive).toBeGreaterThan(0);expect(b.turn).toBeGreaterThan(0);
 const restore=new Occupant();restore.restore(rearRight.capture());
 const empty=f(0);empty.tick=4;empty.touch.fill(0);
 expect(restore.decide(empty)).toEqual(rearRight.decide(empty));
 expect(rearRight.capture().demand.drive).toBeGreaterThan(0);
});
it('does not accumulate full revolutions of turn debt after opposite manual rotation',()=>{
 const o=new Occupant();
 const f=(tick:number,forward:number,omega:number):PrivateFrame=>({tick,retina:new Float32Array(288),touch:new Float32Array(8),proprio:{forward,lateral:0,omega,gaze:0}});
 o.decide(f(0,0,0));let d=o.decide(f(4,1,0));
 let tick=4;
 while(tick<900&&d.turn===0){tick+=4;d=o.decide(f(tick,1,0));}
 expect(Math.abs(d.turn)).toBeGreaterThan(0);
 const opposite=-Math.sign(d.turn);
 for(let i=0;i<240;i++){tick+=4;d=o.decide(f(tick,0,opposite));}
 // A restored controller must recover just as the original does.
 const restored=new Occupant();restored.restore(o.capture());
 for(let i=0;i<120;i++){tick+=4;const sample=f(tick,0,d.turn*2);d=o.decide(sample);expect(restored.decide(sample)).toEqual(d);}
 expect(d.turn).toBe(0);expect(d.drive).toBeGreaterThan(0);
});
