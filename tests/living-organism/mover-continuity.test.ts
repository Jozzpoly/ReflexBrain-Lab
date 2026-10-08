import {beforeAll,expect,it} from 'vitest';
import {LivingWorld,initLivingWorld} from '../../src/living-organism/world';
beforeAll(initLivingWorld);
it('actually reverses the independent patrol repeatedly while the body stays idle',()=>{
 const w=new LivingWorld(),handle=w.captureCheckpoint().mover!.handle;
 let previous=0,reversals=0,min=Infinity,max=-Infinity,lastX=-6;
 for(let i=0;i<3600;i++){
  w.step({drive:0,turn:0,gazeRate:0});
  if(i%12===0){const x=w.inspect().objects.find(o=>o.handle===handle)!.x;
   min=Math.min(min,x);max=Math.max(max,x);
   const delta=x-lastX;lastX=x;
   if(Math.abs(delta)>.001){const d=Math.sign(delta);if(previous&&d!==previous)reversals++;previous=d;}
  }
 }
 expect(min).toBeLessThan(-5);expect(max).toBeGreaterThan(5);
 expect(reversals).toBeGreaterThanOrEqual(3);
 expect(Math.hypot(w.inspect().actor.x,w.inspect().actor.y)).toBeLessThan(.01);
 w.free();
});
