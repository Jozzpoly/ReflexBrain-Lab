"use strict";
/*
ReflexBrain C5-G0: source-native reproduction permission, reproducible independent runner.
Usage: node replay-c5-g0.cjs <pinned-Gloop>/src/core/v1-mirror.mjs <pinned-Gloop>/src/core/m4-ecological-mosaic.mjs
Source commit: 91d924842cb2d3f460336f4147fa8b72f122da5b
Node 22+, no npm dependencies; original source never modified.
*/
const SOURCE_BLOBS = Object.freeze({
  mirror:"6e48c92976d5339d2354add554091be6bd38483f",
  m4:"d2fa51993d0bbd584e093a623b6009b31532b979"
});
function runC5G0(mirrorText,m4Text){
  const assert=(cond,msg)=>{if(!cond)throw Error(msg)};
  const exp=(s,re)=>s.replace(re,"");
  const mirror=exp(mirrorText,/export\s*\{\s*Simulation,[^}]+\};\s*$/);
  const m4=exp(m4Text,/export\s*\{[\s\S]+?\};\s*$/);
  assert(mirror!==mirrorText&&m4!==m4Text,"Unrecognized pinned ES module export pattern");
  const {Simulation,createM4Simulation}=new Function(mirror+m4+";return {Simulation,createM4Simulation};")();
  const W=createM4Simulation(Simulation), native=W.prototype.updateBlob;
  const oldConditional="if (b.energy > threshold && b.reproCooldown <= 0 && this.blobs.length < 260) {";
  const original=native.toString();
  const replacement="if (b.energy > threshold && b.reproCooldown <= 0 && this.blobs.length < 260 && (!this._allowRepro || this._allowRepro(b,threshold))) {";
  assert(original.includes(oldConditional),"Pinned native reproduction seam changed");
  const altered=original.replace(oldConditional,replacement);
  const guarded=new Function("clamp","return ({"+altered+"}).updateBlob")((x,lo,hi)=>Math.max(lo,Math.min(hi,x)));
  const copy=x=>JSON.parse(JSON.stringify(x));
  function cloneWorld(w){
    const out=Object.create(W.prototype);
    for(const k of Object.keys(w)){
      if(k==="rng"||k==="rngStream"||k==="_lifecycleWitness")continue;
      out[k]=typeof w[k]==="function"?w[k]:copy(w[k]);
    }
    out.rngStream=new w.rngStream.constructor(w.rngStream.snapshot());
    out.rng=()=>out.rngStream.next();
    out._lifecycleWitness=null;
    return out;
  }
  function equalSource(x,y){
    return JSON.stringify(x.blobs)===JSON.stringify(y.blobs) &&
      JSON.stringify(x.foods)===JSON.stringify(y.foods) &&
      x.rngStream.snapshot()===y.rngStream.snapshot() &&
      x.nextId===y.nextId&&x.births===y.births&&
      x.deaths===y.deaths&&x.simTime===y.simTime;
  }
  const seeds=[56071,101,202,303,404], expectedFirst=[116,71,135,184,148];
  const expectedSecondSplit=[441,483,242,466,null];
  const modes=["ORIGINAL","ALLOW","DENY_ONCE","CURRENT","PRIVATE_PHASE","NEVER"];
  const report=[];
  for(let i=0;i<seeds.length;i++){
    const seed=seeds[i],world=new W({seed,autoReseed:false});
    let first=null,pre=null,firstTick=0;
    world._lifecycleWitness=(e)=>{if(e.kind==="birth"&&!first)first=copy(e)};
    for(let k=1;k<=5400&&!first;k++){
      pre=cloneWorld(world);world.step(1/60);
      if(first)firstTick=k;
    }
    assert(first!==null&&firstTick===expectedFirst[i],"First native birth did not reproduce: "+seed);
    const parentId=first.parentId,all={},snapshots={};
    const threshold=118+3.4*pre.blobs.find(b=>b.id===parentId).g.size;
    for(const mode of modes){
      const w=cloneWorld(pre),focal=w.blobs.find(b=>b.id===parentId);
      assert(!!focal,"Missing selected native parent");
      const record={firstBirthDelay:null,focalBirths:0,denials:0,permits:0,endEnergy:null,population:null,births:null};
      let once=false,phase=false,stepNo=0;
      w._lifecycleWitness=(e)=>{if(e.kind==="birth"&&e.parentId===parentId){
        record.focalBirths++;
        if(record.firstBirthDelay===null)record.firstBirthDelay=stepNo;
      }};
      if(mode!=="ORIGINAL"){
        w.updateBlob=guarded;
        w._allowRepro=(b,t)=>{
          if(b!==focal)return true;
          let permission;
          if(mode==="ALLOW")permission=true;
          else if(mode==="DENY_ONCE"){permission=once;once=true;}
          else if(mode==="CURRENT")permission=b.energy>=1.5*t;
          else if(mode==="PRIVATE_PHASE"){permission=phase||b.energy>=1.5*t;if(permission)phase=true;}
          else if(mode==="NEVER")permission=false;
          else throw Error("Bad mode");
          record[permission?"permits":"denials"]++;
          return permission;
        };
      }
      snapshots[mode]={w,focal,record,setStep:k=>{stepNo=k;}};
    }
    let parity=true,firstHistoryDivergence=null;
    for(let k=1;k<=600;k++){
      const samePrior=equalSource(snapshots.CURRENT.w,snapshots.PRIVATE_PHASE.w);
      for(const mode of modes){
        const s=snapshots[mode];
        s.setStep(k);s.w.step(1/60);
      }
      if(!equalSource(snapshots.ORIGINAL.w,snapshots.ALLOW.w))parity=false;
      if(firstHistoryDivergence===null&&samePrior&&!equalSource(snapshots.CURRENT.w,snapshots.PRIVATE_PHASE.w))firstHistoryDivergence=k;
    }
    assert(parity,"No-op allow changed native source: seed "+seed);
    assert(firstHistoryDivergence===expectedSecondSplit[i],"History divergence shifted: seed "+seed);
    for(const mode of modes){
      const s=snapshots[mode],st=s.record,alive=s.w.blobs.some(b=>b===s.focal);
      st.endEnergy=alive?s.focal.energy:null;
      st.population=s.w.blobs.length;
      st.births=s.w.births;
      all[mode]=st;
    }
    report.push({seed,firstTick,parentId,nativeThreshold:threshold,
      originalVsAllowParity600:parity,
      firstHistoryDivergence,
      arms:all});
  }
  return {sourceCommit:"91d924842cb2d3f460336f4147fa8b72f122da5b",
    sourceBlobs:SOURCE_BLOBS,numberOfSeeds:seeds.length,stepsPerArm:600,arms:modes,report};
}
if(typeof module!=="undefined")module.exports={runC5G0,SOURCE_BLOBS};
if(typeof require==="function"&&typeof module!=="undefined"&&require.main===module){
  const fs=require("node:fs"),crypto=require("node:crypto"),args=process.argv.slice(2);
  if(args.length!==2)throw Error("Usage: node replay-c5-g0.cjs <v1-mirror.mjs> <m4-ecological-mosaic.mjs>");
  function readPinned(path,expected){
    const raw=fs.readFileSync(path);
    const hash=crypto.createHash("sha1").update(Buffer.from("blob "+raw.length+"\0")).update(raw).digest("hex");
    if(hash!==expected)throw Error("Git blob mismatch for "+path+": got "+hash+", expected "+expected);
    return raw.toString("utf8");
  }
  const output=runC5G0(readPinned(args[0],SOURCE_BLOBS.mirror),readPinned(args[1],SOURCE_BLOBS.m4));
  console.log(JSON.stringify(output,null,2));
}
