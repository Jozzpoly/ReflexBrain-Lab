import {LivingRuntime} from '../src/living-organism/runtime';
import {initLivingWorld} from '../src/living-organism/world';
import {writeFileSync} from 'node:fs';
await initLivingWorld();
const r=new LivingRuntime(), counts:Record<string,number>={}, windows=[];
let distance=0,last=r.inspect().actor;
for(let t=0;t<72000;t++) {r.step();const s=r.occupant.capture(),a=r.inspect().actor;counts[s.mode]=(counts[s.mode]??0)+1;distance+=Math.hypot(a.x-last.x,a.y-last.y);last=a;if((t+1)%7200===0)windows.push({seconds:(t+1)/120,distance,actor:a,mode:s.mode});}
const result={simulatedSeconds:600,counts,distance,windows,private:r.occupant.capture()};
writeFileSync('evidence/living-organism/whole-loop-600s.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));r.free();
