import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld,LivingWorld} from '../../src/living-organism/world';
import {Occupant} from '../../src/living-organism/occupant';

beforeAll(initLivingWorld);
const authoredScene=[
 [3.1,.2,.52,.55,'dynamic'],[5.2,-.6,.60,.60,'dynamic'],
 [4.2,2.5,1.15,.22,'dynamic'],[7.1,1.9,.22,1.15,'anchored'],
 [-2.4,2.3,.6,.55,'dynamic'],[-4.4,-1.8,1.15,.22,'anchored'],
 [1.1,-3.4,.22,1.15,'anchored']
] as const;

describe('R8 resident–material relationship: observational anti-self-deception diagnostic',()=>{
 it('separately observes whether the default material yard continues without actor motor or Owner intervention',()=>{
  const w=new LivingWorld(false);
  try{
   for(const [x,y,hx,hy,mode] of authoredScene)w.addMaterialPart(x,y,hx,hy,mode);
   const baseline=w.inspect().objects.filter(x=>x.kind==='part');
   const idle={drive:0,turn:0,gazeRate:0};
   for(let i=0;i<7200;i++)w.step(idle);
   const now=w.inspect().objects.filter(x=>x.kind==='part');
   const changes=now.map((o,i)=>({
    handle:o.handle,
    linearDisplacement:Math.hypot(o.x-baseline[i].x,o.y-baseline[i].y),
    angularDisplacement:Math.abs(o.angle-baseline[i].angle)
   }));
   const maxMotion=Math.max(...changes.map(o=>o.linearDisplacement));
   console.log('RB_R8_NO_ACTOR_WORLD_PROCESS '+JSON.stringify({
    physicalSeconds:60,solverSteps:w.inspect().tick,materialParts:now.length,
    maxMotion,hasAnyIndependentMaterialMotion:maxMotion>.0001
   }));
   expect(w.inspect().tick).toBe(7200);
   expect(changes.every(o=>Number.isFinite(o.linearDisplacement)&&Number.isFinite(o.angularDisplacement))).toBe(true);
  }finally{w.free();}
 },120000);
 it('records first two minutes of the actual unscripted UI occupant under unchanged controls',()=>{
  const w=new LivingWorld(false),resident=new Occupant();
  try{
   for(const [x,y,hx,hy,mode] of authoredScene)w.addMaterialPart(x,y,hx,hy,mode);
   const checkpoints:{sec:number;x:number;y:number;radius:number;nearestMaterial:number;
       closestPhysicalSurface:number;privateRetinaHasMaterial:boolean;contacts:number;controllerMode:string}[]=[];
   let timeFar=0,framesAway=0,contactFrames30Hz=0,sensorFrames30Hz=0,visibleFrames30Hz=0,bodyMaterialMoved=false;
   const firstPositions=w.inspect().objects.filter(o=>o.kind==='part').map(o=>({handle:o.handle,x:o.x,y:o.y}));
   for(let i=0;i<14400;i++){
    const observation=w.observe();
    const demand=resident.decide(observation);
    w.step(demand);
    // Count the genuine actor-private 30 Hz samples, not an arbitrary one-second instant.
    if((i+1)%4===0){
      const privateFrame=w.observe();
      sensorFrames30Hz++;
      if(privateFrame.touch.some(x=>x>.001))contactFrames30Hz++;
      if(Array.from(privateFrame.retina).some(x=>Math.abs(x-.74)<.0001))visibleFrames30Hz++;
    }
    if((i+1)%120!==0)continue;
    const s=w.inspect(),a=s.actor;
    const radius=Math.hypot(a.x,a.y);
    const parts=s.objects.filter(o=>o.kind==='part');
    const nearestMaterial=Math.min(...parts.map(o=>Math.hypot(o.x-a.x,o.y-a.y)));
    const closestPhysicalSurface=Math.min(...parts.map(o=>{
      const dx=Math.max(0,Math.abs(o.x-a.x)-o.hx);
      const dy=Math.max(0,Math.abs(o.y-a.y)-o.hy);
      return Math.hypot(dx,dy);
    }));
    const contacts=w.observe().touch.filter(x=>x>.001).length;
    const privateRetinaHasMaterial=Array.from(w.observe().retina).some(x=>Math.abs(x-.74)<.0001);
    if(radius>12)timeFar++;
    if(nearestMaterial>12)framesAway++;
    if(parts.some(o=>firstPositions.some(p=>p.handle===o.handle&&Math.hypot(o.x-p.x,o.y-p.y)>.15)))
      bodyMaterialMoved=true;
    if([1,5,15,30,60,90,120].includes((i+1)/120)||((i+1)%1200===0))
      checkpoints.push({sec:(i+1)/120,x:a.x,y:a.y,radius,nearestMaterial,
        closestPhysicalSurface,privateRetinaHasMaterial,contacts,controllerMode:resident.capture().mode});
   }
   const evidence={durationSec:120,physicsSteps:w.inspect().tick,fromActorPrivatePerception:true,
     materialParts:authoredScene.length,withinInitialSceneSeconds:120-timeFar,
     withoutNearbyMaterialSeconds:framesAway,privateSampledFrames30Hz:sensorFrames30Hz,
     contactFrames30Hz,materialVisibleFrames30Hz:visibleFrames30Hz,
     changedWorldParts:bodyMaterialMoved,checkpoints};
   console.log('RB_R8_RESIDENT_OPEN_WORLD_DIAGNOSTIC '+JSON.stringify(evidence));
   expect(evidence.physicsSteps).toBe(14400);
   expect(checkpoints.every(c=>Object.values(c).filter(x=>typeof x==='number').every(Number.isFinite))).toBe(true);
  }finally{w.free();}
 },120000);
});
