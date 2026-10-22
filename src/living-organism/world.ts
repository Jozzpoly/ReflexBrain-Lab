import {retinalAngle} from './retina-geometry';
import { E0_RAPIER as R, E0_DT, E0_FMAX, E0_TMAX, E0_LINEAR_DAMPING, E0_ANGULAR_DAMPING, createE0World, createE0Body } from '../e0-body-seam';

export const initLivingWorld = async () => { await R.init(); };
export type Demand = {drive:number;turn:number;gazeRate:number};
/** Optional experimental shape, default B0 remains unchanged. */
export type BodyShape = 'B0'|'B1';
type Color = [number,number,number];
type Surface = {handle:number;color:Color;kind:'object'|'wall'|'block'|'part';hx:number;hy:number;mode?:'anchored'|'dynamic'};
export type PrivateFrame = {tick:number;retina:Float32Array;touch:Float32Array;proprio:{forward:number;lateral:number;omega:number;gaze:number}};
export type HostContactEvent={tick:number;handle:number;impulse:number};
export type HostContactSample={tick:number;contacts:HostContactEvent[]};
export type GateLink={plateHandle:number;gateHandle:number;closedX:number;closedY:number;travelX:number;loaded:boolean;lastLoadCount:number;loadTransitions:number};
export type Checkpoint = {version:3;bodyShape?:BodyShape;physics:Uint8Array;actorHandle:number;tick:number;gaze:number;surfaces:Surface[];frame:PrivateFrame;pendingTouch:Float32Array;pendingContactEvents:HostContactEvent[];contactSample:HostContactSample;mover:{handle:number;direction:number;left?:number;right?:number;railY?:number;speed?:number}|null;gateLink?:GateLink|null};
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
  private pendingContactEvents:HostContactEvent[]=[];
  private contactSample:HostContactSample={tick:0,contacts:[]};
  private mover:{handle:number;direction:number;left?:number;right?:number;railY?:number;speed?:number}|null=null;
  private gateLink:GateLink|null=null;
  constructor(scene=true,readonly bodyShape:BodyShape='B0',initialHeading=0) {
    this.world=createE0World();
    if(bodyShape==='B0'){
      this.actor=createE0Body(this.world,0,0).rb;
      if(initialHeading)this.actor.setRotation(initialHeading,true);
    }else{
      // B1 Oct-6 hypothesis: single rounded asymmetric body.
      // Capsule is oriented along local X; dimensions 2.60 x 1.30.
      // Keep B0 mass/damping and E0 motor law; this changes inertia,
      // and is NOT a claim of equivalent angular motor response.
      const rb=this.world.createRigidBody(R.RigidBodyDesc.dynamic()
        .setTranslation(0,0).setRotation(initialHeading)
        .setLinearDamping(E0_LINEAR_DAMPING).setAngularDamping(E0_ANGULAR_DAMPING));
      this.world.createCollider(R.ColliderDesc.capsule(.65,.65)
        .setRotation(Math.PI/2).setMass(1).setFriction(0).setRestitution(0),rb);
      this.actor=rb;
    }
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
  /** Authored open-world material part: actual Rapier FIXED/DYNAMIC rectangle.
   * Collider handle remains stable across changes; modes are HOST truth only.
   * Physics and private 96RGB/contact sampling stay unchanged.
   */
  addMaterialPart(x:number,y:number,hx:number,hy:number,mode:'anchored'|'dynamic'='dynamic'){
    if(![x,y,hx,hy].every(Number.isFinite)||hx<=0||hy<=0||hx>8||hy>8)
      throw new Error('Invalid material part shape');
    if(this.surfaces.filter(s=>s.kind==='part').length>=64)
      throw new Error('Material workbench capacity (64) reached');
    const rb=this.world.createRigidBody(
      (mode==='anchored'?R.RigidBodyDesc.fixed():R.RigidBodyDesc.dynamic()
         .setLinearDamping(1.7).setAngularDamping(3).lockRotations())
        .setTranslation(x,y)
    );
    const co=this.world.createCollider(
      R.ColliderDesc.cuboid(hx,hy).setMass(Math.max(.3,Math.min(6,2*hx*hy)))
        .setFriction(.45).setRestitution(.015),rb);
    this.surfaces.push({handle:co.handle,color:[.74,.65,.40],kind:'part',hx,hy,mode});
    // Leave the most recent 30Hz private frame intact until solver advances.
    return co.handle as number;
  }
  setMaterialPartMode(handle:number,mode:'anchored'|'dynamic'){
    if(mode!=='anchored'&&mode!=='dynamic')throw new Error('Unknown material mode');
    const surface=this.surfaces.find(s=>s.handle===handle&&s.kind==='part');
    if(!surface)throw new Error('Not a material part');
    if(surface.mode===mode)return;
    const body=this.world.getCollider(handle).parent();
    body.setLinvel({x:0,y:0},true);
    body.setAngvel(0,true);
    body.setBodyType(mode==='anchored'?R.RigidBodyType.Fixed:R.RigidBodyType.Dynamic,true);
    // A part CREATED fixed must acquire the SAME mobility/damping
    // characteristics as a part CREATED dynamic when released.
    // Rapier setBodyType does not synthesize a dynamic descriptor.
    if(mode==='dynamic'){
      body.setLinearDamping(1.7);
      body.setAngularDamping(3);
      body.lockRotations(true,true);
    }
    surface.mode=mode;
    // Leave the most recent 30Hz private frame intact until solver advances.
  }
  moveMaterialPart(handle:number,x:number,y:number){
    if(![x,y].every(Number.isFinite))throw new Error('Invalid material position');
    const surface=this.surfaces.find(s=>s.handle===handle&&s.kind==='part');
    if(!surface)throw new Error('Not a material part');
    const body=this.world.getCollider(handle).parent();
    body.setTranslation({x,y},true);
    body.setLinvel({x:0,y:0},true);
    body.setAngvel(0,true);
    this.world.propagateModifiedBodyPositionsToColliders();
    // Leave the most recent 30Hz private frame intact until solver advances.
  }
  /** Manual Owner material rotation. A real Rapier pose change preserving identity. */
  rotateMaterialPart(handle:number,delta:number){
    if(!Number.isFinite(delta)||Math.abs(delta)>Math.PI)throw new Error('Invalid material rotation');
    const surface=this.surfaces.find(s=>s.handle===handle&&s.kind==='part');
    if(!surface)throw new Error('Not a material part');
    const body=this.world.getCollider(handle).parent();
    body.setRotation(Math.atan2(Math.sin(body.rotation()+delta),Math.cos(body.rotation()+delta)),true);
    body.setAngvel(0,true);
    this.world.propagateModifiedBodyPositionsToColliders();
    // No 30Hz private-frame backdating during paused Owner intervention.
  }
  removeMaterialPart(handle:number){
    const idx=this.surfaces.findIndex(s=>s.handle===handle&&s.kind==='part');
    if(idx<0)throw new Error('Not a material part');
    this.world.removeRigidBody(this.world.getCollider(handle).parent());
    this.surfaces.splice(idx,1);
    // Leave the most recent 30Hz private frame intact until solver advances.
  }
  /**
   * Explicit independent material World process. Optional bounds belong
   * solely to host mechanics. The actor never receives process phase, rail
   * configuration or collider handles through PrivateFrame.
   */
  addRailMover(x:number,y:number,radius:number,color:Color,left:number,right:number,speed=2) {
    if(this.mover)throw new Error('Only one physical rail mover per World instance');
    if(![x,y,radius,left,right,speed].every(Number.isFinite)||left>=right||radius<=0||speed<=0)
      throw new Error('Invalid rail geometry');
    const handle=this.addObject(x,y,radius,color);
    this.mover={handle,direction:1,left,right,railY:y,speed};
    return handle;
  }
  /**
   * D1 optional powered mechanism. A fixed overlap plate senses the *actual*
   * physics state of ANY dynamic body and drives a rectangular gate by bounded
   * Rapier force. No global timer, special-key label, direct teleport of gate,
   * or plate/load/handle field exposed by PrivateFrame.
   *
   * The plate itself is a non-occluding floor sensor, deliberately omitted
   * from the two-dimensional retina, while the moving gate has real geometry
   * and is hit by the unchanged physical rays and contacts.
   */
  addLoadCoupledGate(
    plateX:number,plateY:number,plateHx:number,plateHy:number,
    closedX:number,closedY:number,gateHx:number,gateHy:number,travelX:number,
    color:Color,
  ){
    if(this.gateLink)throw new Error('Only one experimental load-gate link');
    if(![plateX,plateY,plateHx,plateHy,closedX,closedY,gateHx,gateHy,travelX].every(Number.isFinite)
      ||plateHx<=0||plateHy<=0||gateHx<=0||gateHy<=0||travelX<=0)
      throw new Error('Bad load-gate geometry');
    const plateBody=this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(plateX,plateY));
    const plate=this.world.createCollider(R.ColliderDesc.cuboid(plateHx,plateHy).setSensor(true),plateBody);
    const gateBody=this.world.createRigidBody(R.RigidBodyDesc.dynamic()
      .setTranslation(closedX,closedY).setLinearDamping(8).setAngularDamping(20).lockRotations());
    const gate=this.world.createCollider(R.ColliderDesc.cuboid(gateHx,gateHy)
      .setMass(12).setFriction(0).setRestitution(0),gateBody);
    this.surfaces.push({handle:gate.handle,color:[...color],kind:'block',hx:gateHx,hy:gateHy});
    this.gateLink={plateHandle:plate.handle,gateHandle:gate.handle,
      closedX,closedY,travelX,loaded:false,lastLoadCount:0,loadTransitions:0};
    if(this.tick===0)this.frame=null;
    return{plateHandle:plate.handle,gateHandle:gate.handle};
  }
  /** Host microscope only; never part of observe(). */
  inspectGateLink(){
    if(!this.gateLink)return null;
    const p=this.world.getCollider(this.gateLink.plateHandle).parent().translation();
    const g=this.world.getCollider(this.gateLink.gateHandle).parent().translation();
    return{...this.gateLink,platePosition:{x:p.x,y:p.y},gatePosition:{x:g.x,y:g.y}};
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
      const left=this.mover.left??-6,right=this.mover.right??6;
      const railY=this.mover.railY??-3,speed=this.mover.speed??2;
      if(p.x>=right)this.mover.direction=-1;
      if(p.x<=left)this.mover.direction=1;
      rb.resetForces(true);rb.resetTorques(true);
      rb.addForce({x:Math.max(-20,Math.min(20,(this.mover.direction*speed-v.x)*10)),y:Math.max(-20,Math.min(20,(railY-p.y)*10-v.y*4))},true);
    }
    if(this.gateLink){
      const gate=this.world.getCollider(this.gateLink.gateHandle).parent();
      const pos=gate.translation(),vel=gate.linvel();
      const goalX=this.gateLink.closedX+(this.gateLink.loaded?this.gateLink.travelX:0);
      gate.resetForces(true);gate.resetTorques(true);
      const fx=Math.max(-2500,Math.min(2500,(goalX-pos.x)*1050-vel.x*300));
      const fy=Math.max(-2500,Math.min(2500,(this.gateLink.closedY-pos.y)*1050-vel.y*300));
      gate.addForce({x:fx,y:fy},true);
    }
    this.gaze=Math.max(-Math.PI/2,Math.min(Math.PI/2,this.gaze+3*clamp(d.gazeRate)*E0_DT));
    this.world.step();this.tick++;
    if(this.gateLink){
      const plate=this.world.getCollider(this.gateLink.plateHandle);
      let loadCount=Number(!!this.world.intersectionPair(plate,this.actor.collider(0)));
      for(const surface of this.surfaces){
        if(surface.kind!=='object')continue;
        const other=this.world.getCollider(surface.handle);
        if(this.world.intersectionPair(plate,other))loadCount++;
      }
      const loaded=loadCount>0;
      if(loaded!==this.gateLink.loaded)this.gateLink.loadTransitions++;
      this.gateLink.loaded=loaded;
      this.gateLink.lastLoadCount=loadCount;
    }
    const touch=this.sampleTouch();
    for(const s of this.surfaces){
      let impulse=0;
      this.world.contactPair(this.actor.collider(0),this.world.getCollider(s.handle),(m:any)=>{
        for(let i=0;i<m.numSolverContacts();i++)impulse+=Math.abs(m.contactImpulse(i));
      });
      if(impulse>0)this.pendingContactEvents.push({tick:this.tick,handle:s.handle,impulse});
    }
    for(let i=0;i<8;i++)this.pendingTouch[i]+=touch[i];
    if(this.tick%4===0){
      this.frame=this.sample();
      this.frame.touch=this.pendingTouch.slice();
      this.pendingTouch.fill(0);
      this.contactSample={tick:this.tick,contacts:this.pendingContactEvents};
      this.pendingContactEvents=[];
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
  /**
   * R8 host-only structural assertion after restoring a user-supplied snapshot.
   * JSON metadata must not fabricate geometry, modes, or handles that disagree
   * with actual Rapier. This is NOT a proof of source authenticity or learning.
   */
  verifyR8MaterialSnapshot(){
    const actor=this.actor;
    if(!actor||!actor.isDynamic()||actor.numColliders()!==1)
      throw new Error('R8: missing valid physical actor');
    const actorCollider=actor.collider(0);
    if(!actorCollider||actorCollider.shapeType()!==R.ShapeType.Ball||
       Math.abs(actorCollider.radius()-1)>1e-4||actorCollider.isSensor())
      throw new Error('R8: wrong actor collider');
    if(this.surfaces.length>64)throw new Error('R8: excessive parts');
    const expected=new Set<number>([actorCollider.handle]);
    for(const part of this.surfaces){
      if(part.kind!=='part'||!['anchored','dynamic'].includes(part.mode||'')||
         !Number.isSafeInteger(part.handle)||expected.has(part.handle))
        throw new Error('R8: duplicated or unrecognized material handle');
      const collider=this.world.getCollider(part.handle);
      if(!collider||collider.shapeType()!==R.ShapeType.Cuboid||
         collider.isSensor())
        throw new Error('R8: material collider missing or non-solid');
      const ext=collider.halfExtents(),body=collider.parent();
      if(!ext||!body||body.numColliders()!==1||
         Math.abs(ext.x-part.hx)>1e-4||Math.abs(ext.y-part.hy)>1e-4)
        throw new Error('R8: material geometry mismatch');
      if(part.mode==='anchored'?!body.isFixed():!body.isDynamic())
        throw new Error('R8: material body mode mismatch');
      expected.add(part.handle);
    }
    let actual=0;
    this.world.forEachCollider((collider:any)=>{
      actual++;
      if(!expected.has(collider.handle))
        throw new Error('R8: undeclared physical collider');
    });
    if(actual!==expected.size)
      throw new Error('R8: missing physical collider');
  }
  /** Host-only attribution aligned with the private sensory window, never brain input. */
  inspectContactSample():HostContactSample{return structuredClone(this.contactSample);}
  captureCheckpoint():Checkpoint {
    const frame=this.observe();
    return {version:3,bodyShape:this.bodyShape,physics:this.world.takeSnapshot(),actorHandle:this.actor.handle,tick:this.tick,gaze:this.gaze,surfaces:this.surfaces.map(s=>({...s,color:[...s.color]})),frame,pendingTouch:this.pendingTouch.slice(),pendingContactEvents:structuredClone(this.pendingContactEvents),contactSample:this.inspectContactSample(),mover:this.mover?{...this.mover}:null,gateLink:this.gateLink?{...this.gateLink}:null};
  }
  restoreCheckpoint(cp:Checkpoint) {
    if(cp.version!==3)throw new Error('Unsupported checkpoint');
    // Untagged v3 snapshots predate B1 and can only be B0 snapshots.
    // Never accept an old circular collider under the B1 runtime identity.
    if((cp.bodyShape??'B0')!==this.bodyShape)throw new Error('Body morphology mismatch on restore');
    const restored=R.World.restoreSnapshot(cp.physics);
    this.world.free();this.world=restored;this.actor=restored.getRigidBody(cp.actorHandle);
    this.tick=cp.tick;this.gaze=cp.gaze;this.surfaces=cp.surfaces.map(s=>({...s,color:[...s.color]}));
    this.frame=this.copyFrame(cp.frame);this.pendingTouch=cp.pendingTouch.slice();this.mover=cp.mover?{...cp.mover}:null;
    this.pendingContactEvents=structuredClone(cp.pendingContactEvents);this.contactSample=structuredClone(cp.contactSample);
    this.gateLink=cp.gateLink?{...cp.gateLink}:null;
  }
  free(){this.world.free();}
}
