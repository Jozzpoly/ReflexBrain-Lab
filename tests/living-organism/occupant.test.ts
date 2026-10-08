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
 it('reacts to a contact sample and then resumes the visual concern',()=>{
  const o=new Occupant(),f=frame(0,48);f.touch[0]=1;
  expect(o.decide(f).drive).toBeLessThan(0);
  for(let tick=4;tick<=80;tick+=4)o.decide(frame(tick,48));
  expect(o.capture().mode).toBe('approach');
 });
 it('finishes sustained close inspection and explores despite the same visible patch',()=>{
  const o=new Occupant();
  for(let tick=0;tick<=360;tick+=4){const f=frame(tick,null);for(let i=34;i<=61;i++)f.retina.set([.1,.85,.8],i*3);o.decide(f);}
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
