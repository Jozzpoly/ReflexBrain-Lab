#!/usr/bin/env node
// LIFE/L1 research host. This first step intentionally supports ONLY smoke.
// The browser UI is not an always-on life process.
import {createServer} from 'vite';

export async function loadHeadless() {
 const vite=await createServer({
  server:{middlewareMode:true},appType:'custom',
  logLevel:'error',
 });
 try {
  const world=await vite.ssrLoadModule('/src/living-organism/world.ts');
  const runtime=await vite.ssrLoadModule('/src/living-organism/dev-runtime.ts');
  await world.initLivingWorld();
  return {vite,DevRuntime:runtime.DevRuntime};
 } catch(err) {await vite.close();throw err;}
}

async function main(){
 const [verb,...rest]=process.argv.slice(2);
 if(verb!=='smoke'||rest.length)throw Error('Usage: life-l1-runner.mjs smoke');
 const {vite,DevRuntime}=await loadHeadless();
 let r;
 try{
  r=new DevRuntime('adaptive','B1','yard',1183);
  for(let i=0;i<480;i++)r.step();
  if(r.world.inspect().tick!==480)throw Error('Headless physics did not execute 480 ticks');
  const snapshot=r.capture();
  if(snapshot.resident.learnedTrials<1||snapshot.world.frame.tick!==480)
   throw Error('No real learned history or private sensory frame');
  console.log('RB_LIFE_L1_SMOKE '+JSON.stringify({
   physicsTicks:snapshot.world.tick,
   retinaLength:snapshot.world.frame.retina.length,
   learnedTrials:snapshot.resident.learnedTrials,
   rapierSnapshotBytes:snapshot.world.physics.length,
  }));
 }finally{r?.free();await vite.close();}
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)
 main().catch(e=>{console.error(e);process.exitCode=1;});
