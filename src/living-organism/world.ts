import { E0_RAPIER as R, E0_DT, E0_FMAX, E0_TMAX, createE0World, createE0Body } from '../e0-body-seam';

export const initLivingWorld = async () => { await R.init(); };
export type Demand = {drive:number;turn:number;gazeRate:number};
type Color = [number,number,number];
type Surface = {handle:number;color:Color;kind:'object'|'wall';hx:number;hy:number};
export type Checkpoint = {version:1;physics:Uint8Array;actorHandle:number;tick:number;gaze:number;surfaces:Surface[]};
const clamp=(x:number)=>Math.max(-1,Math.min(1,x));
const background:Color=[.025,.04,.06];

/** World IDs belong to this host. observe() never exports them. */
export class LivingWorld {
  private world:any;
  private actor:any;
  private tick=0;
  private gaze=0;
  private surfaces:Surface[]=[];
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
    }
  }
  addObject(x:number,y:number,radius:number,color:Color) {
    const b=createE0Body(this.world,x,y,1,radius,1,1);
    this.surfaces.push({handle:b.co.handle,color:[...color],kind:'object',hx:radius,hy:radius});
    return b.co.handle;
  }
  addWall(x:number,y:number,hx:number,hy:number,color:Color) {
    const rb=this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(x,y));
    const co=this.world.createCollider(R.ColliderDesc.cuboid(hx,hy),rb);
    this.surfaces.push({handle:co.handle,color:[...color],kind:'wall',hx,hy});
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
    // One reset phase. Contributions below never erase each other.
    this.actor.resetForces(true);this.actor.resetTorques(true);
    const a=this.actor.rotation();
    this.actor.addForce({x:Math.cos(a)*E0_FMAX*clamp(d.drive)+external.x,y:Math.sin(a)*E0_FMAX*clamp(d.drive)+external.y},true);
    this.actor.addTorque(E0_TMAX*clamp(d.turn),true);
    this.gaze=Math.max(-Math.PI/2,Math.min(Math.PI/2,this.gaze+3*clamp(d.gazeRate)*E0_DT));
    this.world.step();this.tick++;
  }
  observe() {
    const p=this.actor.translation(),a=this.actor.rotation(),v=this.actor.linvel();
    const retina=new Float32Array(288);
    for(let i=0;i<96;i++){
      const u=(i+.5)/96*2-1;
      // Quadratic angular spacing concentrates samples in the centre.
      const angle=a+this.gaze+Math.sign(u)*u*u*(80*Math.PI/180);
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
    const touch=new Float32Array(8);
    for(const s of this.surfaces){
      const co=this.world.getCollider(s.handle);
      this.world.contactPair(this.actor.collider(0),co,(m:any)=>{
        const n=m.normal();
        const angle=Math.atan2(n.y,n.x)-a;
        const sector=((Math.floor((angle+Math.PI)/(Math.PI*2)*8)%8)+8)%8;
        for(let i=0;i<m.numSolverContacts();i++)touch[sector]+=Math.abs(m.contactImpulse(i));
      });
    }
    return {tick:this.tick,retina,touch,proprio:{forward:v.x*Math.cos(a)+v.y*Math.sin(a),lateral:-v.x*Math.sin(a)+v.y*Math.cos(a),omega:this.actor.angvel(),gaze:this.gaze}};
  }
  inspect() {
    const p=this.actor.translation(),v=this.actor.linvel();
    return {tick:this.tick,gaze:this.gaze,actor:{x:p.x,y:p.y,vx:v.x,vy:v.y,angle:this.actor.rotation()},
      objects:this.surfaces.map(s=>{const b=this.world.getCollider(s.handle).parent(),p=b.translation();return {...s,color:[...s.color] as Color,x:p.x,y:p.y,angle:b.rotation()};})};
  }
  captureCheckpoint():Checkpoint {
    return {version:1,physics:this.world.takeSnapshot(),actorHandle:this.actor.handle,tick:this.tick,gaze:this.gaze,surfaces:this.surfaces.map(s=>({...s,color:[...s.color]}))};
  }
  restoreCheckpoint(cp:Checkpoint) {
    if(cp.version!==1)throw new Error('Unsupported checkpoint');
    const restored=R.World.restoreSnapshot(cp.physics);
    this.world.free();this.world=restored;this.actor=restored.getRigidBody(cp.actorHandle);
    this.tick=cp.tick;this.gaze=cp.gaze;this.surfaces=cp.surfaces.map(s=>({...s,color:[...s.color]}));
  }
  free(){this.world.free();}
}
