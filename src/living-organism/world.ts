import {retinalAngle} from './retina-geometry';
import { E0_RAPIER as R, E0_DT, E0_FMAX, E0_TMAX, createE0World, createE0Body } from '../e0-body-seam';

export const initLivingWorld = async () => { await R.init(); };
export type Demand = {drive:number;turn:number;gazeRate:number};
type Color = [number,number,number];
type Surface = {handle:number;color:Color;kind:'object'|'wall';hx:number;hy:number};
export type PrivateFrame = {tick:number;retina:Float32Array;touch:Float32Array;proprio:{forward:number;lateral:number;omega:number;gaze:number}};
export type Checkpoint = {version:2;physics:Uint8Array;actorHandle:number;tick:number;gaze:number;surfaces:Surface[];frame:PrivateFrame;pendingTouch:Float32Array;mover:{handle:number;direction:number}|null};
const clamp=(x:number)=>Math.max(-1,Math.min(1,x));
const background:Color=[.025,.04,.06];

/** World IDs belong to this host. observe() never exports them. */
export class LivingWorld {
  private world:any;
  private actor:any;
  private tick=0;
  private gaze=0;
  private surfaces:Surface[]=[];
  private frame:PrivateFrame|null=null;
  private pendingTouch=new Float32Array(8);
  private mover:{handle:number;direction:number}|null=null;
  constructor(scene=true) {
    this.world=createE0World();
    this.actor=createE0Body(this.world,0,0).rb;
    if(scene) {
      this.addWall(0,-6,10,.2,[.3,.35,.4]);
      this.addWall(0,6,10,.2,[.3,.35,.4]);
      this.addWall(-10,0,.2,6,[.3,.35,.4]);
      this.addWall(10,0,.2,6,[.3,.35,.4]);
      this.addWall(3,0,.18,1.3,[.4,.4,.45]);
      this.addObject(5,0,.6,[.1,.85,.8]);
      this.addObject(5,3,.6,[.1,.85,.8]);
      this.addObject(-3,2,.8,[.8,.5,.2]);
      this.mover={handle:this.addObject(-6,-3,.65,[.65,.4,.8]),direction:1};
    }
  }
  addObject(x:number,y:number,radius:number,color:Color) {
    const b=createE0Body(this.world,x,y,1,radius,1,1);
    this.surfaces.push({handle:b.co.handle,color:[...color],kind:'object',hx:radius,hy:radius});
    if(this.tick===0)this.frame=null;
    return b.co.handle;
  }
  addWall(x:number,y:number,hx:number,hy:number,color:Color) {
    const rb=this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x,y));
    const co=this.world.createCollider(R.ColliderDesc.cuboid(hx,hy),rb);
    this.surfaces.push({handle:co.handle,color:[...color],kind:'wall',hx,hy});
    if(this.tick===0)this.frame=null;
    return co.handle;
  }
  moveObject(handle:number,x:number,y:number) {
    if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Invalid world position');
    const surface=this.surfaces.find(s=>s.handle===handle);
    if(surface?.kind!=='object')throw new Error('Not a movable object');
    const rb=this.world.getCollider(handle).parent();
    rb.setTranslation({x,y},true);rb.setLinvel({x:0,y:0},true);
    this.world.propagateModifiedBodyPositionsToColliders();
  }
  step(d:Demand,external={x:0,y:0}) {
    if(![d.drive,d.turn,d.gazeRate,external.x,external.y].every(Number.isFinite))throw new Error('Nonfinite demand');
    if(!this.frame)this.frame=this.sample();
    // One reset phase. Contributions below never erase each other.
    this.actor.resetForces(true);this.actor.resetTorques(true);
    const a=this.actor.rotation();
    this.actor.addForce({x:Math.cos(a)*E0_FMAX*clamp(d.drive)+external.x,y:Math.sin(a)*E0_FMAX*clamp(d.drive)+external.y},true);
    this.actor.addTorque(E0_TMAX*clamp(d.turn),true);
    if(this.mover){
      const rb=this.world.getCollider(this.mover.handle).parent(),p=rb.translation(),v=rb.linvel();
      if(p.x>=6)this.mover.direction=-1;
      if(p.x<=-6)this.mover.direction=1;
      rb.resetForces(true);rb.resetTorques(true);
      rb.addForce({x:Math.max(-20,Math.min(20,(this.mover.direction*2-v.x)*10)),y:Math.max(-20,Math.min(20,(-3-p.y)*10-v.y*4))},true);
    }
    this.gaze=Math.max(-Math.PI/2,Math.min(Math.PI/2,this.gaze+3*clamp(d.gazeRate)*E0_DT));
    this.world.step();this.tick++;
    const touch=this.sampleTouch();
    for(let i=0;i<8;i++)this.pendingTouch[i]+=touch[i];
    if(this.tick%4===0){
      this.frame=this.sample();
      this.frame.touch=this.pendingTouch.slice();
      this.pendingTouch.fill(0);
    }
  }
  observe() {
    if(!this.frame)this.frame=this.sample();
    return this.copyFrame(this.frame);
  }
  private copyFrame(frame:PrivateFrame):PrivateFrame{
    return {...frame,retina:frame.retina.slice(),touch:frame.touch.slice(),proprio:{...frame.proprio}};
  }
  private sample():PrivateFrame {
    const p=this.actor.translation(),a=this.actor.rotation(),v=this.actor.linvel();
    const retina=new Float32Array(288);
    for(let i=0;i<96;i++){
      const u=(i+.5)/96*2-1;
      // Quadratic angular spacing concentrates samples in the centre.
      const angle=a+this.gaze+retinalAngle(u);
      const ray=new R.Ray(p,{x:Math.cos(angle),y:Math.sin(angle)});
      // Direct collider queries work at tick zero and immediately after restore;
      // world broad-phase queries are not initialized until a physics step.
      let nearest=12, color=background;
      for(const surface of this.surfaces){
        const distance=this.world.getCollider(surface.handle).castRay(ray,12,true);
        if(distance>=0&&distance<nearest){nearest=distance;color=surface.color;}
      }
      retina.set(color,i*3);
    }
    return {tick:this.tick,retina,touch:this.sampleTouch(),proprio:{forward:v.x*Math.cos(a)+v.y*Math.sin(a),lateral:-v.x*Math.sin(a)+v.y*Math.cos(a),omega:this.actor.angvel(),gaze:this.gaze}};
  }
  private sampleTouch() {
    const touch=new Float32Array(8),a=this.actor.rotation();
    for(const s of this.surfaces){
      const co=this.world.getCollider(s.handle);
      this.world.contactPair(this.actor.collider(0),co,(m:any)=>{
        const n=m.normal();
        const angle=Math.atan2(n.y,n.x)-a;
        const sector=((Math.floor((angle+Math.PI)/(Math.PI*2)*8)%8)+8)%8;
        for(let i=0;i<m.numSolverContacts();i++)touch[sector]+=Math.abs(m.contactImpulse(i));
      });
    }
    return touch;
  }
  inspect() {
    const p=this.actor.translation(),v=this.actor.linvel();
    return {tick:this.tick,gaze:this.gaze,actor:{x:p.x,y:p.y,vx:v.x,vy:v.y,angle:this.actor.rotation()},
      objects:this.surfaces.map(s=>{const b=this.world.getCollider(s.handle).parent(),p=b.translation();return {...s,color:[...s.color] as Color,x:p.x,y:p.y,angle:b.rotation()};})};
  }
  captureCheckpoint():Checkpoint {
    const frame=this.observe();
    return {version:2,physics:this.world.takeSnapshot(),actorHandle:this.actor.handle,tick:this.tick,gaze:this.gaze,surfaces:this.surfaces.map(s=>({...s,color:[...s.color]})),frame,pendingTouch:this.pendingTouch.slice(),mover:this.mover?{...this.mover}:null};
  }
  restoreCheckpoint(cp:Checkpoint) {
    if(cp.version!==2)throw new Error('Unsupported checkpoint');
    const restored=R.World.restoreSnapshot(cp.physics);
    this.world.free();this.world=restored;this.actor=restored.getRigidBody(cp.actorHandle);
    this.tick=cp.tick;this.gaze=cp.gaze;this.surfaces=cp.surfaces.map(s=>({...s,color:[...s.color]}));
    this.frame=this.copyFrame(cp.frame);this.pendingTouch=cp.pendingTouch.slice();this.mover=cp.mover?{...cp.mover}:null;
  }
  free(){this.world.free();}
}
