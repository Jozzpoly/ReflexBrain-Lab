import {LivingWorld, type Demand} from './world';

type Point={x:number;y:number};
export const D0_ZONES = Object.freeze([
  {id:'west',center:{x:-14,y:0},label:'west structures'},
  {id:'center',center:{x:0,y:0},label:'open common area'},
  {id:'east',center:{x:14,y:0},label:'moving material'},
] as const);
export type D0Scenario={
  world:LivingWorld;
  railHandle:number|null;
  looseHandles:readonly number[];
  walls:readonly number[];
};
const WALL:[number,number,number]=[.32,.38,.42];
const CYAN:[number,number,number]=[.12,.82,.75];
const OCHRE:[number,number,number]=[.88,.52,.20];
const PURPLE:[number,number,number]=[.68,.43,.83];

/**
 * Open physical prototype. There are NO perimeter walls and no invisible
 * boundary or teleport return. Occlusions/routes are actual Rapier walls,
 * not decorative painted polygons.
 *
 * This is deliberately not the final "world". Its limited positive pressure
 * is a hypothesis to qualify before building a Local Brain to fit it.
 */
export function createWorldD0(independentRail=true):D0Scenario{
  const world=new LivingWorld(false);
  const walls:number[]=[];
  const looseHandles:number[]=[];
  try{
    const addWall=(x:number,y:number,hx:number,hy:number)=>
      walls.push(world.addWall(x,y,hx,hy,WALL));
    // Two actual partitions, not a surrounding prison. Each has two 5-unit
    // gaps (upper/lower); actor body diameter is 2 units.
    for(const x of [-8,8]){
      addWall(x,-12.5,.35,3.5); // ends at -9
      addWall(x,0,.35,4);      // -4..4
      addWall(x,12.5,.35,3.5); // 9..16
    }
    // West alcove. With real walls, it hides contents behind corners while
    // leaving multiple ways to enter or simply move around the structure.
    addWall(-15,7,5,.3);
    addWall(-20,3,.3,4);
    addWall(-15,-7,5,.3);
    // East workshop silhouettes, not a prescriptive quest-graph.
    addWall(15,7,4,.3);
    addWall(20,4,.3,3);
    addWall(17,-1,3,.3);

    looseHandles.push(world.addObject(-15,3,.85,CYAN));
    looseHandles.push(world.addObject(-13,-10,1.05,OCHRE));
    looseHandles.push(world.addObject(1,8,1.1,PURPLE));
    looseHandles.push(world.addObject(15,-10,.8,OCHRE));
    looseHandles.push(world.addObject(17,4,1.15,CYAN));

    const railHandle=independentRail?
      world.addRailMover(11,-10,.75,PURPLE,11,20,2.4):null;

    return{world,railHandle,looseHandles,walls};
  }catch(error){world.free();throw error;}
}

export type D0WorldRun={
  railEnabled:boolean;
  tick:number;
  deterministicWorldFingerprint:string;
  actorPosition:Point;
  targetStart:Point;
  targetEnd:Point;
  targetDisplacement:number;
  railStart:Point|null;
  railEnd:Point|null;
  finite:boolean;
  privateFrameCount:number;
  contactSampleCount:number;
};
/**
 * Host-only ecology null control. Focal actor requests zero motor activity
 * in both variants; only a normal physical rail process differs. The target
 * identity is NEVER supplied to any actor.
 */
export function runWorldD0(railEnabled:boolean,ticks=7200):D0WorldRun {
  const scene=createWorldD0(railEnabled);
  const w=scene.world;
  try{
    const sample=(handle:number)=>{
      const o=w.inspect().objects.find(o=>o.handle===handle);
      if(!o)throw Error('World sample handle missing');
      return{x:o.x,y:o.y};
    };
    const tracked=scene.looseHandles[3];
    const targetStart=sample(tracked);
    const railStart=scene.railHandle===null?null:sample(scene.railHandle);
    const demand:Demand={drive:0,turn:0,gazeRate:0};
    let privateFrameCount=0,contactSampleCount=0;
    let lastFrame=-1,lastContact=-1;
    let finite=true;
    for(let i=0;i<ticks;i++){
      const f=w.observe();
      if(f.tick!==lastFrame){lastFrame=f.tick;privateFrameCount++;}
      w.step(demand);
      const h=w.inspect();
      if(![h.actor.x,h.actor.y,h.actor.vx,h.actor.vy].every(Number.isFinite))finite=false;
      const contact=w.inspectContactSample();
      if(contact.tick!==lastContact){lastContact=contact.tick;contactSampleCount++;}
    }
    const final=w.inspect();
    const targetEnd=sample(tracked);
    const railEnd=scene.railHandle===null?null:sample(scene.railHandle);
    const actorPosition={x:final.actor.x,y:final.actor.y};
    // Fingerprint is bounded host-world truth, not leaked private agent data.
    const deterministicWorldFingerprint=JSON.stringify(final.objects.map(o=>[
      o.kind,o.x,o.y,o.angle,o.hx,o.hy]));
    return{railEnabled,tick:final.tick,actorPosition,targetStart,targetEnd,
      targetDisplacement:Math.hypot(targetEnd.x-targetStart.x,targetEnd.y-targetStart.y),
      railStart,railEnd,finite,privateFrameCount,contactSampleCount,
      deterministicWorldFingerprint};
  }finally{w.free();}
}
