import {LivingWorld,initLivingWorld,type Demand,type PrivateFrame} from '../src/living-organism/world';
import {SensoryRegressor} from '../src/living-organism/sensory-regressor';
import {sensoryFeatures,sensoryTarget} from '../src/living-organism/sensory-features';
import {visibleTurquoisePatches} from '../src/living-organism/retina-geometry';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
await initLivingWorld();
const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
const valid=(f:PrivateFrame)=>{const p=visibleTurquoisePatches(f.retina);return p.length===1&&!p[0].clipped;};
const noise=(seed:number,k:number)=>{let n=(seed*8191+k*131071+0x6d2b79f5)>>>0;n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);return ((n^(n>>>16))>>>0)/4294967296*2-1;};
const command=(seed:number,tick:number):Demand=>{const k=Math.floor(tick/48)*3;return {drive:.09+.14*noise(seed,k),turn:.13*noise(seed,k+1),gazeRate:.18*noise(seed,k+2)};};
type Row={id:string;split:string;tick:number;crossesCommand:boolean;input:number[];held:number[];scheduled:number[]};
const rows:Row[]=[],manifest=[];let verifiedScheduled=0;
for(const split of ['train','test'])for(const family of ['static','lateral'])for(let config=0;config<(split==='train'?6:3);config++){
 const seed=split==='train'?config+11:config+101,id=`${split}:${family}:${seed}`;
 const distance=split==='train'?5+config*.5:5.7+config*.8,radius=split==='train'?.45+.025*config:.48+.04*config;
 const x=distance,y=(config-2)*.24,speed=family==='lateral'?(split==='train'?.15+config*.04:.23+config*.07):0;
 const w=new LivingWorld(false),fork=new LivingWorld(false),h=w.addObject(x,y,radius,[.1,.85,.8]);
 let previous=w.observe(),masked=0,candidates=0;const rejectionCounts={input:0,held:0,scheduled:0};const expectations=new Map<number,PrivateFrame>();
 function advance(world:LivingWorld,tick:number,d:Demand){if(speed)world.moveObject(h,x,y+speed*tick/120);world.step(d);}
 for(let tick=0;tick<720;tick++){
  const current=w.observe();
  if(tick>0&&tick%12===0&&tick+24<=720){
   candidates++;const d=command(seed,tick),input=sensoryFeatures(previous,current,d),cp=w.captureCheckpoint();
   const outputs:Record<string,number[]|null>={};let continuous=valid(previous)&&valid(current);if(!input||!continuous)rejectionCounts.input++;
   for(const mode of ['scheduled','held']){
    fork.restoreCheckpoint(cp);let ok=true;
    for(let j=0;j<24;j++){advance(fork,tick+j,mode==='held'?d:command(seed,tick+j));if((j+1)%4===0)ok=ok&&valid(fork.observe());}
    const future=fork.observe();outputs[mode]=sensoryTarget(current,future);continuous=continuous&&ok;if(!ok||!outputs[mode])rejectionCounts[mode as 'held'|'scheduled']++;
    if(mode==='scheduled')expectations.set(tick+24,future);
   }
   const after=w.captureCheckpoint();if(JSON.stringify(w.observe())!==JSON.stringify(current)||!Buffer.from(cp.physics).equals(Buffer.from(after.physics)))throw new Error('Fork mutated source');
   if(input&&continuous&&outputs.held&&outputs.scheduled)rows.push({id,split,tick,crossesCommand:Math.floor(tick/48)!==Math.floor((tick+23)/48),input,held:outputs.held,scheduled:outputs.scheduled});else masked++;
  }
  if(tick%4===0)previous=current;
  advance(w,tick,command(seed,tick));
  const expected=expectations.get(tick+1);if(expected){if(JSON.stringify(w.observe())!==JSON.stringify(expected))throw new Error('Scheduled fork mismatch');verifiedScheduled++;expectations.delete(tick+1);}
 }
 manifest.push({id,split,family,seed,distance,radius,speed,candidates,masked,rejectionCounts,examples:rows.filter(r=>r.id===id).length,dataSha256:createHash('sha256').update(JSON.stringify(rows.filter(r=>r.id===id))).digest('hex')});w.free();fork.free();
}
const train=rows.filter(r=>r.split==='train'),test=rows.filter(r=>r.split==='test');
const noHistory=new SensoryRegressor(),motorOnly=new SensoryRegressor();const motorFeatures=(x:number[])=>[x[6],x[7],x[9],x[10]];
const heldModel=new SensoryRegressor(),scheduledModel=new SensoryRegressor(),old=new SensoryRegressor();
heldModel.fit(train.map(r=>({input:r.input,output:r.held})));noHistory.fit(train.map(r=>({input:r.input.slice(2),output:r.held})));motorOnly.fit(train.map(r=>({input:motorFeatures(r.input),output:r.held})));scheduledModel.fit(train.map(r=>({input:r.input,output:r.scheduled})));
old.restore(JSON.parse(readFileSync('evidence/living-organism/sensory-regressor-weights.json','utf8')));
function metrics(data:Row[],target:'held'|'scheduled'){
 const sums:Record<string,number[]>={hold:[0,0],bodyGaze:[0,0],frozenOld:[0,0],trainedHeld:[0,0],noHistory:[0,0],motorOnly:[0,0],trainedScheduled:[0,0]};let labelDifference=0;
 for(const r of data){const nextGaze=Math.max(-Math.PI/2,Math.min(Math.PI/2,r.input[7]+r.input[10]*.6));
 const predictions={hold:[0,0],bodyGaze:[-r.input[6]-(nextGaze-r.input[7]),0],frozenOld:old.predict(r.input),trainedHeld:heldModel.predict(r.input),noHistory:noHistory.predict(r.input.slice(2)),motorOnly:motorOnly.predict(motorFeatures(r.input)),trainedScheduled:scheduledModel.predict(r.input)};
 for(const [name,p] of Object.entries(predictions)){sums[name][0]+=Math.abs(wrap(p[0]-r[target][0]));sums[name][1]+=Math.abs(p[1]-r[target][1]);}
 labelDifference+=Math.abs(wrap(r.held[0]-r.scheduled[0]));}
 return {examples:data.length,labelBearingDifference:data.length?labelDifference/data.length:null,mae:data.length?Object.fromEntries(Object.entries(sums).map(([n,v])=>[n,{bearingRad:v[0]/data.length,logExtent:v[1]/data.length}])):null};
}
const result={scope:'Offline paired action intervention, private sensory labels. No runtime integration.',settings:{horizonTicks:24,episodeTicks:720,lambda:.001,sampleTicks:12,segmentTicks:48},verifiedScheduled,manifest,
 testHeld:metrics(test,'held'),testScheduled:metrics(test,'scheduled'),crossingHeld:metrics(test.filter(r=>r.crossesCommand),'held'),crossingScheduled:metrics(test.filter(r=>r.crossesCommand),'scheduled'),
 byEpisode:Object.fromEntries(manifest.filter(e=>e.split==='test').map(e=>[e.id,{held:metrics(test.filter(r=>r.id===e.id),'held'),scheduled:metrics(test.filter(r=>r.id===e.id),'scheduled')}])),models:{held:heldModel.capture(),noHistory:noHistory.capture(),motorOnly:motorOnly.capture(),scheduled:scheduledModel.capture()}};
writeFileSync('evidence/living-organism/action-conditioned.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
