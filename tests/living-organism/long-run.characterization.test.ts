import {beforeAll,it,expect} from 'vitest';
import {LivingRuntime} from '../../src/living-organism/runtime';
import {initLivingWorld} from '../../src/living-organism/world';
beforeAll(initLivingWorld);
it('characterizes ten minutes of whole-loop behavior without reset',()=>{
 const runtime=new LivingRuntime(),counts:Record<string,number>={};
 let distance=0,last=runtime.inspect().actor,seenSamples=0,windowStart=0;
 const windowDistances:number[]=[];
 for(let tick=0;tick<72000;tick++){
  runtime.step();
  const state=runtime.occupant.capture(),now=runtime.inspect().actor;
  counts[state.mode]=(counts[state.mode]??0)+1;
  distance+=Math.hypot(now.x-last.x,now.y-last.y);last=now;
  if((tick+1)%7200===0){windowDistances.push(distance-windowStart);windowStart=distance;}
  if(tick%4===0&&state.lastSeenTick===runtime.observe().tick)seenSamples++;
  expect(Number.isFinite(now.x)&&Number.isFinite(now.y)).toBe(true);
 }
 console.log(JSON.stringify({simulatedSeconds:600,counts,distance,windowDistances,seenSamples,final:runtime.inspect().actor,private:runtime.occupant.capture()}));
 expect(runtime.inspect().tick).toBe(72000);
 // Regression gate for the reproduced permanent close-patch halt, not a cognition score.
 expect(windowDistances.every(d=>d>1)).toBe(true);
 expect(counts.explore).toBeGreaterThan(0);
 runtime.free();
},30000);
