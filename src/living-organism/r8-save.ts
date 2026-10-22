import type {Checkpoint} from './world';
import type {OccupantState} from './occupant';

/** Standalone, explicitly Owner-authored R8 files; not compatible with LIFE/L1.
 * Built-in sensor provenance and physics snapshot must survive actual browser reload.
 */
export type R8Save={world:Checkpoint;resident:OccupantState;scene:'encounter'|'open'};
const object=(v:unknown,label:string):Record<string,unknown>=>{
 if(v===null||typeof v!=='object'||Array.isArray(v))throw Error('Nieprawidłowy '+label);
 return v as Record<string,unknown>;
};
const finite=(v:unknown,label:string):number=>{
 if(typeof v!=='number'||!Number.isFinite(v))throw Error('Nieprawidłowy '+label);
 return v;
};
const int=(v:unknown,label:string)=>{const n=finite(v,label);if(!Number.isSafeInteger(n))throw Error('Nieprawidłowy '+label);return n;};
const vect=(v:unknown,n:number,label:string):number[]=>{
 if(!Array.isArray(v)||v.length!==n)throw Error('Nieprawidłowy '+label);
 return v.map((x,i)=>finite(x,label+'['+i+']'));
};
function validate(cp:R8Save){
 const root=object(cp,'świat');
 if(!['encounter','open'].includes(String(root.scene)))throw Error('Nieznany wariant sceny');
 const w=object(root.world,'fizyka');
 if(w.version!==3||w.bodyShape!==undefined&&w.bodyShape!=='B0')throw Error('Inny model świata');
 const tick=int(w.tick,'zegar');if(tick<0||tick>100000000000)throw Error('Nieprawidłowy czas');
 finite(w.actorHandle,'ciało');finite(w.gaze,'wzrok');
 if(!(w.physics instanceof Uint8Array)||w.physics.length<100||w.physics.length>4000000)
  throw Error('Brak prawidłowego stanu fizycznego');
 if(!Array.isArray(w.surfaces)||w.surfaces.length>64)throw Error('Za dużo elementów');
 for(const el of w.surfaces){
  const e=object(el,'element');
  if(e.kind!=='part'||!['dynamic','anchored'].includes(String(e.mode)))throw Error('Obcy element świata');
  finite(e.handle,'uchwyt');const hx=finite(e.hx,'wymiar'),hy=finite(e.hy,'wymiar');
  if(hx<=0||hy<=0||hx>8||hy>8)throw Error('Nieprawidłowy wymiar');
  vect(e.color,3,'kolor');
 }
 const frame=object(w.frame,'zmysły');
 const ft=int(frame.tick,'zegar zmysłów');
 if(ft<0||ft>tick||tick-ft>4||ft%4!==0)throw Error('Fałszywy czas obserwacji');
 if(!(frame.retina instanceof Float32Array)||frame.retina.length!==288||
  !(frame.touch instanceof Float32Array)||frame.touch.length!==8||
  !(w.pendingTouch instanceof Float32Array)||w.pendingTouch.length!==8)
  throw Error('Nieprawidłowe buforowanie zmysłów');
 for(const [name,arr] of [['retina',frame.retina],['touch',frame.touch],['pendingTouch',w.pendingTouch]] as const){
  for(const value of arr as Float32Array)finite(value,name);
 }
 const prop=object(frame.proprio,'proprio');
 for(const key of ['forward','lateral','omega','gaze'])finite(prop[key],key);
 if(w.mover!==null||w.gateLink!==null&&w.gateLink!==undefined)throw Error('Obcy napęd w warsztacie');
 const ct=object(w.contactSample,'kontakt');
 const ctTick=int(ct.tick,'kontakt czas');if(ctTick<0||ctTick>tick)throw Error('Fałszywy czas kontaktu');
 for(const arr of [w.pendingContactEvents,ct.contacts]){
  if(!Array.isArray(arr)||arr.length>16000)throw Error('Nieprawidłowa historia kontaktu');
  for(const val of arr){
   const c=object(val,'dotyk');
   if(int(c.tick,'kontakt tick')>tick||finite(c.impulse,'impuls')<0)throw Error('Nieprawidłowy kontakt');
   finite(c.handle,'kontakt ID');
  }
 }
 const o=object(root.resident,'sterownik');
 const modes=['explore','approach','inspect','yield'];
 if(!modes.includes(String(o.mode)))throw Error('Obcy sterownik');
 const last=o.lastTick===null?null:int(o.lastTick,'sterownik tick');
 if(last!==null&&(last<0||last>tick))throw Error('Fałszywy czas sterownika');
 for(const key of ['heading','yieldUntil','ignoreUntil','exploreTravel','exploreTurn',
   'randomState','escapeDrive','escapeTurn'])finite(o[key],key);
 if(o.closeSince!==null)finite(o.closeSince,'closeSince');
 if(o.lastDirection!==null)finite(o.lastDirection,'lastDirection');
 if(o.lastSeenTick!==null)finite(o.lastSeenTick,'lastSeenTick');
 const d=object(o.demand,'sterowanie');
 for(const k of ['drive','turn','gazeRate'])finite(d[k],k);
}
export function encodeR8Save(cp:R8Save):string{
 validate(cp);
 return JSON.stringify({format:'reflexbrain-r8-workbench',version:1,simHz:120,sensorHz:30,
  ownerAuthored:true,scene:cp.scene,resident:cp.resident,
  world:{...cp.world,physics:Array.from(cp.world.physics),
   frame:{...cp.world.frame,retina:Array.from(cp.world.frame.retina),
    touch:Array.from(cp.world.frame.touch)},
   pendingTouch:Array.from(cp.world.pendingTouch)}});
}
export function decodeR8Save(source:string):R8Save{
 if(source.length>8000000)throw Error('Plik zbyt duży');
 const top=object(JSON.parse(source),'plik');
 if(top.format!=='reflexbrain-r8-workbench'||top.version!==1||
  top.simHz!==120||top.sensorHz!==30||top.ownerAuthored!==true)
  throw Error('Nieznana wersja warsztatu');
 const w=object(top.world,'fizyka'),frame=object(w.frame,'zmysły');
 const physics=w.physics;
 if(!Array.isArray(physics)||physics.length<100||physics.length>4000000)
  throw Error('Brak właściwego snapshotu');
 const bytes=physics.map((x,i)=>{const v=int(x,'physics'+i);if(v<0||v>255)throw Error('Uszkodzone dane');return v;});
 const cp={scene:top.scene,resident:top.resident,world:{...w,
  physics:Uint8Array.from(bytes),
  frame:{...frame,retina:Float32Array.from(vect(frame.retina,288,'retina')),
   touch:Float32Array.from(vect(frame.touch,8,'touch'))},
  pendingTouch:Float32Array.from(vect(w.pendingTouch,8,'pendingTouch'))}} as R8Save;
 validate(cp);
 return cp;
}
