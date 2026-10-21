import type {Demand,PrivateFrame} from './world';

/**
 * L2/R3: small *authored* organism candidate, not a claim of artificial life.
 * The sole inputs for autonomous action are 96xRGB, touch and proprio.
 *
 * Continuation belongs to its physics body and its own persistent private
 * controller state. No World IDs, coordinates, gates, scene targets, prizes,
 * timers from the host, or object-color identity enter decide().
 */
export type SituatedMode='adaptive'|'frozen'|'blind';
export type SituatedState={
 version:1;mode:SituatedMode;lastTick:number|null;lastDemand:Demand;
 frames:number;manualFrames:number;retinalModulations:number;
 touchEpisodes:number;touchFrames:number;habitUpdates:number;
 habit:number;lastTouch:number;recovery:number;lastVisualTurn:number;
 currentVisual:{left:number;middle:number;right:number};
};
const ZERO:Demand={drive:0,turn:0,gazeRate:0};
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const copy=(d:Demand):Demand=>({...d});
function appearance(f:PrivateFrame){
 let left=0,middle=0,right=0;
 for(let i=0;i<96;i++){
  const k=i*3;
  // Background is RGB(.025,.04,.06). This tests contrast only, never
  // label/color similarity or a researcher-selected material target.
  const visible=f.retina[k]+f.retina[k+1]+f.retina[k+2]>.22;
  if(!visible)continue;
  if(i<32)left++;else if(i<64)middle++;else right++;
 }
 return {left:left/32,middle:middle/32,right:right/32};
}
function physicalContact(f:PrivateFrame){
 let n=0;
 for(const t of f.touch)n+=Math.max(0,t);
 return n;
}
export class SituatedResident{
 private s:SituatedState;
 constructor(mode:SituatedMode='adaptive'){
  this.s={version:1,mode,lastTick:null,lastDemand:copy(ZERO),
   frames:0,manualFrames:0,retinalModulations:0,
   touchEpisodes:0,touchFrames:0,habitUpdates:0,
   habit:0,lastTouch:0,recovery:0,lastVisualTurn:0,
   currentVisual:{left:0,middle:0,right:0}};
 }
 /** Authored initial practice: continue moving; when sensory obstruction is
  * encountered, try to find a different orientation and recover.
  * Memory is only a contact-conditioned slow turn bias, NOT a reward/goal. */
 decide(f:PrivateFrame):Demand{
  const s=this.s;
  if(s.lastTick!==null&&f.tick<=s.lastTick)return copy(s.lastDemand);
  const dt=s.lastTick===null?4:Math.max(1,f.tick-s.lastTick);
  const visual=appearance(f);
  const physical=physicalContact(f);
  const contact=physical>.005;
  const motorStall=s.lastDemand.drive>.2&&Math.abs(f.proprio.forward)<.08;
  const surprised=contact||motorStall;
  // A turn away from the more visually occupied side. If symmetric,
  // maintain a tiny initial rightwards practice; it is authored, not learned.
  const visualTurn=clamp((visual.left-visual.right)*1.5,-.85,.85);
  const gap=visual.middle;
  let turn=visualTurn;
  if(Math.abs(turn)<.08&&gap>.13)turn=.27;
  if(s.mode==='blind')turn=0;

  // A contact-conditioned motor habit only. This deliberately weak
  // local plasticity can be ablated without touching World or current frames.
  if(s.mode==='adaptive'&&s.lastTick!==null){
   const recovering=s.lastTouch>.005&&!contact;
   const worsened=contact&&physical>s.lastTouch+.005;
   const signed=Math.sign(s.lastDemand.turn||turn||.2);
   if(recovering){
    s.habit=clamp(s.habit+.075*signed,-.8,.8);
    s.habitUpdates++;
   }else if(worsened&&Math.abs(s.lastDemand.turn)>.02){
    s.habit=clamp(s.habit-.024*signed,-.8,.8);
    s.habitUpdates++;
   }
  }
  if(contact&&!((s.lastTouch)>.005))s.touchEpisodes++;
  if(contact)s.touchFrames++;
  if(surprised)s.recovery=Math.max(s.recovery,40);
  else s.recovery=Math.max(0,s.recovery-dt);

  let drive=.58;
  if(s.recovery>0){
   // Retreat and turn; not a planned path or globally defined obstacle.
   drive=-.34;
   turn=clamp(turn+(Math.abs(turn)<.18?.34:0),-1,1);
  }else{
   // Slow down around visible geometry; retina HAS causal motor effect.
   drive=clamp(.58-.34*gap,.16,.58);
  }
  if(s.mode!=='blind')turn=clamp(turn+s.habit*.35,-1,1);
  if(s.mode==='blind'&&s.recovery>0)turn=.34;
  if(s.mode!=='blind'&&Math.abs(turn)>0.06)s.retinalModulations++;
  const demand:Demand={drive,turn,gazeRate:0};
  s.currentVisual=visual;s.lastVisualTurn=visualTurn;
  s.lastTouch=physical;s.lastTick=f.tick;s.lastDemand=copy(demand);s.frames++;
  return copy(demand);
 }
 /** External motor provenance is determined by the host, not attributed to
  * the organism's own motor command. No reward update during manual control. */
 onAuthorityWithheld(f:PrivateFrame){
  if(this.s.lastTick!==null&&f.tick<=this.s.lastTick)return;
  this.s.lastTick=f.tick;
  this.s.manualFrames++;
  this.s.lastDemand=copy(ZERO);
  this.s.lastTouch=physicalContact(f);
 }
 capture():SituatedState{return structuredClone(this.s);}
 restore(v:SituatedState){
  if(v.version!==1||v.mode!==this.s.mode||!Number.isFinite(v.habit)||
    !Number.isFinite(v.lastTouch)||v.habit<-.8||v.habit>.8||
    ![v.lastDemand.drive,v.lastDemand.turn,v.lastDemand.gazeRate].every(Number.isFinite))
   throw Error('L2/R3 private specimen mismatch');
  this.s=structuredClone(v);
 }
}
