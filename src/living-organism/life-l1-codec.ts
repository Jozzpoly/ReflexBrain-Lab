import type {DevCheckpoint} from './dev-runtime';

/** Current research specimen only. No promise of save migration between versions. */
export type LifeL1Payload = {
 format:'reflexbrain-life-l1';schemaVersion:1;simHz:120;sensorHz:30;
 checkpoint:DevCheckpoint;
};
const object=(v:unknown,label:string):Record<string,unknown>=>{
 if(v===null||typeof v!=='object'||Array.isArray(v))throw Error('Invalid '+label);
 return v as Record<string,unknown>;
};
const number=(v:unknown,label:string):number=>{
 if(typeof v!=='number'||!Number.isFinite(v))throw Error('Invalid '+label);
 return v;
};
const integer=(v:unknown,label:string):number=>{
 const n=number(v,label);if(!Number.isSafeInteger(n))throw Error('Invalid '+label);
 return n;
};
const arr=(v:unknown,length:number,label:string):number[]=>{
 if(!Array.isArray(v)||v.length!==length)throw Error('Invalid '+label);
 return v.map((x,i)=>number(x,label+'['+i+']'));
};
const binary=(v:Uint8Array):string=>{
 let result='';
 for(let i=0;i<v.length;i+=8192)result+=String.fromCharCode(...v.subarray(i,i+8192));
 return btoa(result);
};
const fromBinary=(v:unknown):Uint8Array=>{
 if(typeof v!=='string'||v.length===0||v.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(v))
  throw Error('Invalid binary physics');
 const decoded=atob(v);
 if(decoded.length<100||decoded.length>16_777_216)throw Error('Invalid physics byte length');
 return Uint8Array.from(decoded,ch=>ch.charCodeAt(0));
};
const demand=(v:unknown,label:string)=>{
 const x=object(v,label);
 for(const key of ['drive','turn','gazeRate'])number(x[key],label+'.'+key);
};
const contactEvents=(v:unknown,label:string)=>{
 if(!Array.isArray(v)||v.length>1_000_000)throw Error('Invalid '+label);
 for(const e of v){const z=object(e,label+' event');integer(z.tick,'event.tick');integer(z.handle,'event.handle');number(z.impulse,'event.impulse');}
};
function validate(cp:DevCheckpoint):void{
 const c=object(cp,'checkpoint');
 if(c.version!==1||!['B0','B1'].includes(String(c.shape))||
  !['yard','shifted'].includes(String(c.layout))||
  !['adaptive','frozen','random'].includes(String(c.mode)))throw Error('Invalid LIFE identity');
 const w=object(c.world,'World');
 if(w.version!==3||w.bodyShape!==c.shape||!(w.physics instanceof Uint8Array)||
   w.physics.length<100||w.physics.length>16_777_216)throw Error('Invalid World identity/physics');
 const tick=integer(w.tick,'World tick');
 if(tick<0||tick>Number.MAX_SAFE_INTEGER-100000)throw Error('Invalid World tick');
 integer(w.actorHandle,'actorHandle');
 number(w.gaze,'World gaze');
 const f=object(w.frame,'private sensor');
 const frameTick=integer(f.tick,'private sensor tick');
 if(frameTick<0||frameTick>tick||tick-frameTick>4||frameTick%4!==0)
  throw Error('Invalid 30Hz private frame time');
 if(!(f.retina instanceof Float32Array)||f.retina.length!==288||
  !(f.touch instanceof Float32Array)||f.touch.length!==8||
  !(w.pendingTouch instanceof Float32Array)||w.pendingTouch.length!==8)
  throw Error('Invalid typed private sensory buffers');
 for(const [name,a] of [['retina',f.retina],['touch',f.touch],['pendingTouch',w.pendingTouch]] as const)
  for(const val of a as Float32Array)number(val,name);
 const p=object(f.proprio,'proprio');
 for(const k of ['forward','lateral','omega','gaze'])number(p[k],k);
 if(!Array.isArray(w.surfaces)||w.surfaces.length>100000)throw Error('Invalid surfaces');
 for(const surface of w.surfaces){
  const x=object(surface,'surface');
  integer(x.handle,'surface.handle');
  if(!['object','wall','block'].includes(String(x.kind)))throw Error('Invalid surface kind');
  arr(x.color,3,'surface color');
  number(x.hx,'surface hx');number(x.hy,'surface hy');
 }
 contactEvents(w.pendingContactEvents,'pending contact events');
 const sample=object(w.contactSample,'contact sample');
 const sampleTick=integer(sample.tick,'contact sample tick');
 if(sampleTick<0||sampleTick>tick)throw Error('Invalid contact sample tick');
 contactEvents(sample.contacts,'sample contacts');
 if(w.mover!==null){const m=object(w.mover,'mover');integer(m.handle,'mover.handle');
  for(const k of ['direction','left','right','railY','speed'])if(m[k]!==undefined)number(m[k],'mover '+k);
 }
 if(w.gateLink!==null&&w.gateLink!==undefined){
  const g=object(w.gateLink,'gateLink');
  for(const k of ['plateHandle','gateHandle','lastLoadCount','loadTransitions'])integer(g[k],'gate '+k);
  for(const k of ['closedX','closedY','travelX'])number(g[k],'gate '+k);
  if(typeof g.loaded!=='boolean')throw Error('Invalid gate loaded');
 }
 const s=object(c.resident,'private resident');
 if(s.version!==1||s.mode!==c.mode||!Number.isInteger(s.seed)||Number(s.seed)<0||Number(s.seed)>0xffffffff)
  throw Error('Invalid private resident identity');
 const lastTick=s.lastTick===null?null:integer(s.lastTick,'resident lastTick');
 if(lastTick!==null&&(lastTick<0||lastTick>tick))throw Error('Invalid resident time');
 demand(s.lastDemand,'lastDemand');
 for(const key of ['trials','learnedTrials','manualFrames'])if(integer(s[key],key)<0)throw Error('Invalid '+key);
 arr(s.chosen,4,'chosen').forEach(x=>{if(!Number.isSafeInteger(x)||x<0)throw Error('Invalid chosen');});
 if(s.lastResult!==null)number(s.lastResult,'lastResult');
 if(!Array.isArray(s.stats)||s.stats.length!==2)throw Error('Invalid learned stats');
 for(const row of s.stats){
  if(!Array.isArray(row)||row.length!==4)throw Error('Invalid learned action row');
  for(const entry of row){
   const x=object(entry,'learned stat');number(x.sum,'sum');
   if(integer(x.count,'count')<0)throw Error('Invalid learned count');
  }
 }
 if(s.active!==null){
  const a=object(s.active,'active trial');
  if(![0,1].includes(Number(a.context))||![0,1,2,3].includes(Number(a.maneuver)))
   throw Error('Invalid active probe');
  for(const key of ['start','until'])integer(a[key],'active '+key);
  for(const key of ['distance','touchExposure','seconds'])number(a[key],'active '+key);
 }
}
export function encodeLifeL1(cp:DevCheckpoint):string{
 validate(cp);
 // A lossless Uint8Array base64, but Float32 arrays stored as explicit numbers;
 // JSON converts float32 elements to exact JS number representation.
 return JSON.stringify({format:'reflexbrain-life-l1',schemaVersion:1,simHz:120,sensorHz:30,
  checkpoint:{...cp,world:{...cp.world,
   physics:binary(cp.world.physics),
   frame:{...cp.world.frame,
    retina:Array.from(cp.world.frame.retina),
    touch:Array.from(cp.world.frame.touch)},
   pendingTouch:Array.from(cp.world.pendingTouch)}}});
}
export function decodeLifeL1(source:string):DevCheckpoint{
 if(source.length>28_000_000)throw Error('LIFE checkpoint too large');
 const root=object(JSON.parse(source),'LIFE envelope');
 if(root.format!=='reflexbrain-life-l1'||root.schemaVersion!==1||
  root.simHz!==120||root.sensorHz!==30)throw Error('Unsupported LIFE format/version/rates');
 const cp=object(root.checkpoint,'checkpoint');
 const w=object(cp.world,'World');
 const f=object(w.frame,'private frame');
 const cloned={...cp,world:{...w,physics:fromBinary(w.physics),
   frame:{...f,retina:new Float32Array(arr(f.retina,288,'retina')),
    touch:new Float32Array(arr(f.touch,8,'touch'))},
   pendingTouch:new Float32Array(arr(w.pendingTouch,8,'pendingTouch'))}} as unknown as DevCheckpoint;
 validate(cloned);
 return cloned;
}
