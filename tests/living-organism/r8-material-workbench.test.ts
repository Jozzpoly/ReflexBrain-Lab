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
  it('OWNER edits while paused never backdate the resident 30Hz retina frame',()=>{
    const w=new LivingWorld(false);
    try{
      tick(w,5,still);
      const old=w.observe();
      expect(old.tick).toBe(4);
      const retinalOld=Array.from(old.retina);
      const id=w.addMaterialPart(4,0,.6,.6,'anchored');
      w.moveMaterialPart(id,3.5,0);
      w.setMaterialPartMode(id,'dynamic');
      const cp=w.captureCheckpoint();
      expect(w.observe().tick).toBe(4);
      expect(Array.from(w.observe().retina)).toEqual(retinalOld);
      tick(w,2,still); // physical clock ticks 6,7, no new private sample
      expect(w.observe().tick).toBe(4);
      expect(Array.from(w.observe().retina)).toEqual(retinalOld);
      tick(w,1,still);
      expect(w.observe().tick).toBe(8);
      expect(Array.from(w.observe().retina)).not.toEqual(retinalOld);
      w.restoreCheckpoint(cp);
      expect(w.inspect().tick).toBe(5);
      expect(w.observe().tick).toBe(4);
      expect(Array.from(w.observe().retina)).toEqual(retinalOld);
    }finally{w.free();}
  });
  it('unanchoring an existing physical part permits real later body displacement',()=>{
    const w=new LivingWorld(false);
    try{
      const id=w.addMaterialPart(2.8,0,.55,.75,'anchored');
      tick(w,160,forward);
      const fixedX=part(w,id).x;
      expect(fixedX).toBeCloseTo(2.8,5);
      w.setMaterialPartMode(id,'dynamic');
      tick(w,220,forward);
      const moved=part(w,id);
      expect(moved.mode).toBe('dynamic');
      expect(moved.handle).toBe(id);
      expect(moved.x-fixedX).toBeGreaterThan(.25);
      expect(w.inspect().tick).toBe(380);
    }finally{w.free();}
  });
  it('an originally fixed then released part behaves like an originally dynamic part',()=>{
    const rollout=(bornFixed:boolean)=>{
      const w=new LivingWorld(false);
      try{
        const id=w.addMaterialPart(2.8,0,.55,.75,bornFixed?'anchored':'dynamic');
        if(bornFixed)w.setMaterialPartMode(id,'dynamic');
        const first=part(w,id);
        const track:number[]=[];
        for(let i=0;i<480;i++){
          w.step(i<280?forward:still);
          if(i%24===0)track.push(part(w,id).x);
        }
        return {track,final:part(w,id),tick:w.inspect().tick};
      }finally{w.free();}
    };
    const a=rollout(false),b=rollout(true);
    expect(a.tick).toBe(480);
    expect(b.tick).toBe(480);
    for(let i=0;i<a.track.length;i++)expect(b.track[i]).toBeCloseTo(a.track[i],3);
    expect(b.final.angle).toBeCloseTo(a.final.angle,3);
    expect(b.final.mode).toBe('dynamic');
  });
  it('actual Rapier rotation preserves collider identity, temporal sensory boundary and replay',()=>{
    const w=new LivingWorld(false);
    try{
      const id=w.addMaterialPart(3.1,0,1.2,.22,'anchored');
      for(let i=0;i<5;i++)w.step(still);
      const old=w.observe();
      w.rotateMaterialPart(id,Math.PI/12);
      expect(part(w,id).handle).toBe(id);
      expect(part(w,id).angle).toBeCloseTo(Math.PI/12,5);
      expect(w.observe()).toEqual(old);
      for(let i=0;i<3;i++)w.step(still);
      expect(w.observe().tick).toBe(8);
      expect(Array.from(w.observe().retina)).not.toEqual(Array.from(old.retina));
      const cp=w.captureCheckpoint();
      w.rotateMaterialPart(id,-Math.PI/4);
      w.restoreCheckpoint(cp);
      expect(part(w,id).angle).toBeCloseTo(Math.PI/12,5);
      w.setMaterialPartMode(id,'dynamic');
      expect(part(w,id).handle).toBe(id);
      for(let i=0;i<60;i++)w.step(forward);
      expect([part(w,id).x,part(w,id).y,part(w,id).angle].every(Number.isFinite)).toBe(true);
    }finally{w.free();}
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
