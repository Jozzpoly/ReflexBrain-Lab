#!/usr/bin/env node
/**
 * LIFE/L1 scientific CLI. Real Rapier 120Hz and legal actor 30Hz.
 * A stopped process experiences ZERO sim time. No automatic overnight host.
 * No brain, sensor, environment or physics changes from O-DEV V0.
 */
import {createServer} from 'vite';
import {readFile,open,link,unlink,mkdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {resolve,dirname,basename,join} from 'node:path';
import {pathToFileURL} from 'node:url';

const DONOR_SHA='010531a0d5996ad70bba25a8b60b8324ec1c77cb';
const RUNTIME_CONTRACT='odev-v0-l1-snapshot-v1/rapier0.20.0';
const MAX_FILE=28_000_000;
const sha=s=>createHash('sha256').update(s).digest('hex');
export async function loadHeadless(){
 const vite=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const world=await vite.ssrLoadModule('/src/living-organism/world.ts');
  const runtime=await vite.ssrLoadModule('/src/living-organism/dev-runtime.ts');
  const codec=await vite.ssrLoadModule('/src/living-organism/life-l1-codec.ts');
  await world.initLivingWorld();
  return {vite,DevRuntime:runtime.DevRuntime,
   encodeLifeL1:codec.encodeLifeL1,decodeLifeL1:codec.decodeLifeL1};
 }catch(err){await vite.close();throw err;}
}
function parseOptions(argv){
 const [verb,...tail]=argv;
 if(!['smoke','new','resume'].includes(verb))throw Error('Expected smoke/new/resume');
 if(verb==='smoke'){if(tail.length)throw Error('smoke takes no arguments');return{verb};}
 const keys=new Set(['ticks','input','output','shape','layout','mode','seed']);
 const out={verb};
 for(let i=0;i<tail.length;i+=2){
  const tok=tail[i],val=tail[i+1];
  if(!tok?.startsWith('--')||!keys.has(tok.slice(2))||!val||
   Object.hasOwn(out,tok.slice(2)))throw Error('Invalid/duplicate LIFE argument '+tok);
  out[tok.slice(2)]=val;
 }
 const tick=Number(out.ticks);
 if(!Number.isSafeInteger(tick)||tick<=0||tick>1_000_000)throw Error('Invalid tick count');
 out.ticks=tick;
 if(!out.output||typeof out.output!=='string')throw Error('Missing --output');
 out.output=resolve(out.output);
 if(verb==='new'){
  if(out.input)throw Error('new does not accept --input');
  out.shape??='B1';out.layout??='yard';out.mode??='adaptive';out.seed??='1183';
  if(!['B0','B1'].includes(out.shape)||!['yard','shifted'].includes(out.layout)||
   !['adaptive','frozen','random'].includes(out.mode))throw Error('Invalid resident configuration');
  const seed=Number(out.seed);
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid resident seed');
  out.seed=seed;
 }else{
  if(!out.input)throw Error('Missing --input for resume');
  if(['shape','layout','mode','seed'].some(x=>out[x]!==undefined))throw Error('Resume uses identity from file only');
  out.input=resolve(out.input);
  if(out.input===out.output)throw Error('Refuse in-place checkpoint overwrite');
 }
 return out;
}
function digestBody(body){return sha(JSON.stringify(body));}
function pack({lifeId,createdAt,recordedAt,snapshot}){
 const body={
  format:'reflexbrain-life-record',schemaVersion:1,runtimeContract:RUNTIME_CONTRACT,
  donorSha:DONOR_SHA,lifeId,controllerAuthority:'auto',paused:false,
  createdAt,recordedAt,physicsTicks:snapshot.checkpoint.world.tick,
  simulatedSeconds:snapshot.checkpoint.world.tick/120,
  sensorHz:30,simHz:120,snapshot
 };
 return JSON.stringify({...body,integritySha256:digestBody(body)})+'\n';
}
function unpack(raw,decodeLifeL1){
 if(raw.length>MAX_FILE)throw Error('Checkpoint exceeds size limit');
 const r=JSON.parse(raw);
 if(!r||typeof r!=='object'||Array.isArray(r))throw Error('Malformed LIFE record');
 const {integritySha256,...body}=r;
 if(typeof integritySha256!=='string'||integritySha256!==digestBody(body))
  throw Error('LIFE record integrity digest mismatch');
 if(body.format!=='reflexbrain-life-record'||body.schemaVersion!==1||
  body.runtimeContract!==RUNTIME_CONTRACT||body.donorSha!==DONOR_SHA||
  body.controllerAuthority!=='auto'||body.paused!==false||
  body.simHz!==120||body.sensorHz!==30||typeof body.lifeId!=='string'||
  !/^[0-9a-f-]{36}$/i.test(body.lifeId)||
  typeof body.createdAt!=='string'||typeof body.recordedAt!=='string')
  throw Error('Incompatible LIFE record identity or authority');
 const cp=decodeLifeL1(JSON.stringify(body.snapshot));
 if(!Number.isSafeInteger(body.physicsTicks)||body.physicsTicks!==cp.world.tick||
  body.simulatedSeconds!==body.physicsTicks/120)throw Error('LIFE clock mismatch');
 return {...body,cp};
}
async function saveExclusive(destination,content){
 const temp=join(dirname(destination),'.'+basename(destination)+'.'+randomUUID()+'.tmp');
 let created=false;
 try{
  // Unique temporary file, buffered flush, then link creates final name only
  // if non-existent; never use rename(), which can clobber an existing save.
  const fd=await open(temp,'wx',0o600);
  created=true;
  try{await fd.writeFile(content,'utf8');await fd.sync();}finally{await fd.close();}
  await link(temp,destination); // atomic on the same filesystem; EEXIST refuses.
 }finally{
  if(created)await unlink(temp).catch(()=>{});
 }
}
async function run(){
 const o=parseOptions(process.argv.slice(2));
 const {vite,DevRuntime,encodeLifeL1,decodeLifeL1}=await loadHeadless();
 let organism;
 try{
  if(o.verb==='smoke'){
   organism=new DevRuntime('adaptive','B1','yard',1183);
   for(let i=0;i<480;i++)organism.step();
   const cp=organism.capture();
   if(cp.world.tick!==480||cp.world.frame.tick!==480||cp.resident.learnedTrials<1)
    throw Error('Rapier/private history smoke failed');
   console.log('RB_LIFE_L1_SMOKE '+JSON.stringify({
    physicsTicks:cp.world.tick,retinaLength:cp.world.frame.retina.length,
    learnedTrials:cp.resident.learnedTrials,rapierSnapshotBytes:cp.world.physics.length}));
   return;
  }
  let lifeId,createdAt,baseTick=0;
  const tLoad=performance.now();
  if(o.verb==='new'){
   organism=new DevRuntime(o.mode,o.shape,o.layout,o.seed);
   lifeId=randomUUID();createdAt=new Date().toISOString();
  }else{
   const input=await readFile(o.input,'utf8');
   const loaded=unpack(input,decodeLifeL1); // validates before any physics restore
   lifeId=loaded.lifeId;createdAt=loaded.createdAt;
   const cp=loaded.cp;
   organism=new DevRuntime(cp.mode,cp.shape,cp.layout);
   organism.restore(cp);
   baseTick=cp.world.tick;
  }
  const restoreMs=performance.now()-tLoad;
  const first=organism.capture();
  if(first.world.tick!==baseTick)throw Error('LIFE resumed with altered tick');
  const tStart=performance.now();
  let sampledRss=process.memoryUsage().rss;
  for(let i=0;i<o.ticks;i++){
   organism.step();
   if(i%3600===0)sampledRss=Math.max(sampledRss,process.memoryUsage().rss);
  }
  sampledRss=Math.max(sampledRss,process.memoryUsage().rss);
  const runtimeMs=performance.now()-tStart;
  const snap=organism.capture();
  if(snap.world.tick!==baseTick+o.ticks)throw Error('LIFE tick conservation failed');
  const tEncode=performance.now();
  const encoded=JSON.parse(encodeLifeL1(snap));
  const output=pack({lifeId,createdAt,recordedAt:new Date().toISOString(),snapshot:encoded});
  const encodeMs=performance.now()-tEncode;
  const tSave=performance.now();
  await saveExclusive(o.output,output);
  const saveMs=performance.now()-tSave;
  const evidence={
   lifeId,verb:o.verb,donorSha:DONOR_SHA,contract:RUNTIME_CONTRACT,
   simulatedStartTick:baseTick,executedPhysicsTicks:o.ticks,
   simulatedEndTick:snap.world.tick,simulatedSeconds:snap.world.tick/120,
   newSimulatedSeconds:o.ticks/120,frameTick:snap.world.frame.tick,
   learnedTrials:snap.resident.learnedTrials,
   wallRunMs:runtimeMs,restoreMs,encodeMs,saveMs,
   physicsStepsPerWallSecond:runtimeMs>0?o.ticks/(runtimeMs/1000):null,
   sampledMaxRssBytes:sampledRss,checkpointBytes:Buffer.byteLength(output),
   output:o.output,simulatedDowntimeSeconds:0,
   conclusion:'research continuity only; NOT organism or life quality PASS'
  };
  console.log('RB_LIFE_L1_RUN '+JSON.stringify(evidence));
 }finally{organism?.free();await vite.close();}
}
if(import.meta.url===pathToFileURL(resolve(process.argv[1]??'')).href)
 run().catch(e=>{console.error('RB_LIFE_L1_ERROR',e);process.exitCode=1;});
