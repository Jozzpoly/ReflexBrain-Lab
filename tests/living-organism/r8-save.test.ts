import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld} from '../../src/living-organism/world';
import {Occupant} from '../../src/living-organism/occupant';
import {encodeR8Save,decodeR8Save} from '../../src/living-organism/r8-save';
beforeAll(initLivingWorld);
describe('R8 protected cross-tab material file: no fragile in-page-only history',()=>{
 it('roundtrips multi-part physics, fixed/dynamic modes, private sensor clock and future replay',()=>{
  const w=new LivingWorld(false);const resident=new Occupant();
  try{
   const handles=[w.addMaterialPart(3,0,.6,.6,'dynamic'),w.addMaterialPart(5,2,.22,1.15,'anchored')];
   for(let i=0;i<321;i++)w.step(resident.decide(w.observe()));
   const raw=encodeR8Save({world:w.captureCheckpoint(),resident:resident.capture(),scene:'encounter'});
   expect(raw).toContain('reflexbrain-r8-workbench');
   const file=decodeR8Save(raw);
   expect(file.world.physics).toBeInstanceOf(Uint8Array);
   expect(file.world.frame.retina).toBeInstanceOf(Float32Array);
   expect(file.world.surfaces.filter(x=>x.kind==='part').map(x=>x.handle)).toEqual(handles);
   const restored=new LivingWorld(false);
   try{
    restored.restoreCheckpoint(file.world);
    const clone=new Occupant();clone.restore(file.resident);
    expect(restored.inspect()).toEqual(w.inspect());
    expect(restored.observe()).toEqual(w.observe());
    for(let i=0;i<304;i++){
     w.step(resident.decide(w.observe()));
     restored.step(clone.decide(restored.observe()));
    }
    expect(restored.captureCheckpoint().physics).toEqual(w.captureCheckpoint().physics);
    expect(restored.inspect()).toEqual(w.inspect());
    expect(clone.capture()).toEqual(resident.capture());
   }finally{restored.free();}
  }finally{w.free();}
 });
 it('rejects incompatible, malformed, forged-sensor and incomplete files before touching World',()=>{
  const w=new LivingWorld(false);
  try{
   w.addMaterialPart(3,0,.6,.6,'anchored');
   for(let i=0;i<9;i++)w.step({drive:0,turn:0,gazeRate:0});
   const base=JSON.parse(encodeR8Save({world:w.captureCheckpoint(),
    resident:new Occupant().capture(),scene:'open'}));
   const attempt=(mutate:(v:any)=>void)=>{
    const x=structuredClone(base);mutate(x);
    expect(()=>decodeR8Save(JSON.stringify(x))).toThrow();
   };
   attempt(v=>v.version=99);
   attempt(v=>v.ownerAuthored=false);
   attempt(v=>v.world.physics[5]=9999);
   attempt(v=>v.world.frame.tick=9); // cannot fabricate a private 30Hz frame
   attempt(v=>v.world.frame.retina=[]);
   attempt(v=>v.world.surfaces[0].mode='oracle');
   attempt(v=>v.world.surfaces.push(...Array.from({length:65},()=>v.world.surfaces[0])));
   expect(()=>decodeR8Save('{broken')).toThrow();
  }finally{w.free();}
 });
});
