import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld} from '../../src/living-organism/world';
beforeAll(initLivingWorld);
const forward={drive:1,turn:0,gazeRate:0};
const still={drive:0,turn:0,gazeRate:0};
const part=(w:LivingWorld,handle:number)=>w.inspect().objects.find(x=>x.handle===handle)!;
const tick=(w:LivingWorld,n:number,d=still)=>{for(let i=0;i<n;i++)w.step(d);};
describe('R8 early material workbench — physical, no actor learning claim',()=>{
  it('one collider changes Rapier body mode without replacing its ID, then checkpoint restores it',()=>{
    const w=new LivingWorld(false);
    try{
      const id=w.addMaterialPart(2.7,0,.55,.9,'anchored');
      const q=w.observe();
      expect(q.retina.length).toBe(288);
      expect(Object.keys(q)).toEqual(['tick','retina','touch','proprio']);
      const start=part(w,id);
      expect(start.mode).toBe('anchored');
      w.setMaterialPartMode(id,'dynamic');
      expect(part(w,id).mode).toBe('dynamic');
      tick(w,80,forward);
      const before=w.captureCheckpoint();
      expect(before.surfaces.find(x=>x.handle===id)?.mode).toBe('dynamic');
      expect(before.physics.length).toBeGreaterThan(300);
      const ref=JSON.stringify(w.inspect());
      w.setMaterialPartMode(id,'anchored');
      w.moveMaterialPart(id,8,5);
      w.restoreCheckpoint(before);
      expect(JSON.stringify(w.inspect())).toBe(ref);
      expect(part(w,id).mode).toBe('dynamic');
      w.setMaterialPartMode(id,'anchored');
      expect(part(w,id).handle).toBe(id);
      expect(part(w,id).mode).toBe('anchored');
      w.setMaterialPartMode(id,'dynamic');
      expect(part(w,id).handle).toBe(id);
    }finally{w.free();}
  });
  it('physically anchored and mobile parts have distinct consequences under SAME motor',()=>{
    const run=(mode:'anchored'|'dynamic')=>{
      const w=new LivingWorld(false);
      try{
        const id=w.addMaterialPart(2.8,0,.55,.75,mode);
        const x0=part(w,id).x;
        const retina0=Array.from(w.observe().retina);
        tick(w,360,forward);
        const a=w.inspect();
        return {displacement:Math.hypot(part(w,id).x-x0,part(w,id).y),
          actorX:a.actor.x,retina0,finalRetina:Array.from(w.observe().retina),
          mode:part(w,id).mode,clock:a.tick};
      }finally{w.free();}
    };
    const anchored=run('anchored'),dynamic=run('dynamic');
    console.log('RB_R8_MATERIAL_CONTRAST '+JSON.stringify({
      anchored:{displacement:anchored.displacement,actorX:anchored.actorX},
      dynamic:{displacement:dynamic.displacement,actorX:dynamic.actorX}}));
    expect(anchored.clock).toBe(360);
    expect(dynamic.clock).toBe(360);
    expect(anchored.displacement).toBeLessThan(1e-6);
    expect(dynamic.displacement).toBeGreaterThan(.25);
    expect(anchored.retina0).toEqual(dynamic.retina0);
    expect(anchored.actorX).not.toBeCloseTo(dynamic.actorX,2);
  });
  it('snapshot replay keeps authored modifications and lawful private observations exact',()=>{
    const w=new LivingWorld(false);
    try{
      const a=w.addMaterialPart(3,1,.7,.45,'dynamic');
      const b=w.addMaterialPart(-2,-1,.3,1.4,'anchored');
      tick(w,140,forward);
      w.setMaterialPartMode(a,'anchored');
      w.moveMaterialPart(b,-1.4,-.5);
      const cp=w.captureCheckpoint();
      const go=()=>{
        tick(w,304,{drive:.4,turn:.2,gazeRate:-.1});
        return {inspect:w.inspect(),retina:Array.from(w.observe().retina),
          touch:Array.from(w.observe().touch),physics:Array.from(w.captureCheckpoint().physics)};
      };
      const first=go();
      w.restoreCheckpoint(cp);
      const second=go();
      expect(second).toEqual(first);
      expect(second.inspect.tick).toBe(444);
      expect(part(w,a).mode).toBe('anchored');
      expect(part(w,b).handle).toBe(b);
      w.removeMaterialPart(a);
      expect(w.inspect().objects.some(x=>x.handle===a)).toBe(false);
      expect(part(w,b).mode).toBe('anchored');
      expect(w.observe().retina.length).toBe(288);
    }finally{w.free();}
  });
});
