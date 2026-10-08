import {LivingWorld,initLivingWorld} from '../src/living-organism/world';
import {PrivateVision} from '../src/living-organism/private-vision';
import {writeFileSync} from 'node:fs';
await initLivingWorld();const results=[];
for(const variant of ['static-near','static-far','moving-alias'] as const){
 const w=new LivingWorld(false),v=new PrivateVision(),x=variant==='static-far'?6:3;
 const handle=w.addObject(x,0,x/10,[.1,.85,.8]);v.observe(w.observe());
 for(let i=0;i<60;i++){
  w.step({drive:0,turn:0,gazeRate:0},{x:0,y:30});
  if(variant==='moving-alias')w.moveObject(handle,x,w.inspect().actor.y*.5);
  v.observe(w.observe());
 }
 const a=w.inspect().actor,o=w.inspect().objects[0],actualDistance=Math.hypot(o.x-a.x,o.y-a.y);
 results.push({variant,actualDistance,private:v.capture(),scope:'Actual distance is host-only evaluation. Moving-alias is a deliberately misleading intervention.'});w.free();
}
writeFileSync('evidence/living-organism/private-vision-characterization.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results.map(r=>({variant:r.variant,actualDistance:r.actualDistance,estimate:r.private.estimate,reason:r.private.reason}))));
