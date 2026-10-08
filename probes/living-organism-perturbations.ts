import {LivingRuntime} from '../src/living-organism/runtime';
import {initLivingWorld} from '../src/living-organism/world';
import {mkdirSync,writeFileSync} from 'node:fs';
await initLivingWorld();
const results=[];
for(const intervention of ['control','remove-turquoise','manual-turn'] as const){
 const r=new LivingRuntime();for(let i=0;i<7200;i++)r.step();
 if(intervention==='remove-turquoise')for(const o of r.inspect().objects)if(o.color[1]>.65&&o.color[2]>.6&&o.color[0]<.3)r.world.moveObject(o.handle,100,100);
 const cells=new Set<string>(),counts:Record<string,number>={},windows=[];
 let last=r.inspect().actor,distance=0,lowMotionTicks=0,longestLowMotion=0;
 for(let i=0;i<28800;i++){
  r.step(intervention==='manual-turn'&&i<600?{drive:0,turn:1,gazeRate:0}:null);
  const a=r.inspect().actor,s=r.occupant.capture(),delta=Math.hypot(a.x-last.x,a.y-last.y);last=a;distance+=delta;
  cells.add(`${Math.floor(a.x)},${Math.floor(a.y)}`);counts[s.mode]=(counts[s.mode]??0)+1;
  lowMotionTicks=delta<.0001?lowMotionTicks+1:0;longestLowMotion=Math.max(longestLowMotion,lowMotionTicks);
  if((i+1)%3600===0)windows.push({seconds:(i+1)/120,distance,cells:cells.size,mode:s.mode});
 }
 results.push({intervention,simulatedSeconds:240,gridCellSize:1,visitedCells:cells.size,distance,longestLowMotionSeconds:longestLowMotion/120,counts,windows,final:r.inspect().actor,private:r.occupant.capture()});r.free();
}
mkdirSync('evidence/living-organism',{recursive:true});
writeFileSync('evidence/living-organism/perturbations-final.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results));
