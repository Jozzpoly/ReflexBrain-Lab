import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {
  createWorldD0,runWorldD0,runD0Transit,
} from '../../src/living-organism/world-ecology-d0';
beforeAll(initLivingWorld);
describe('RB-WORLD/D0 open material ecology / pre-occupant feasibility',()=>{
  it('has no enclosing perimeter, two body-scale openings per divider and no hidden World labels in private sensory frames',()=>{
    const s=createWorldD0();
    try{
      const host=s.world.inspect();
      expect(s.walls.length).toBe(12); // six dividers + three west + three east
      expect(s.looseHandles.length).toBe(5);
      const xWalls=host.objects.filter(o=>o.kind==='wall'&&Math.abs(Math.abs(o.x)-8)<.01);
      expect(xWalls).toHaveLength(6);
      expect(xWalls.some(o=>o.hy>=4&&Math.abs(o.y)<.01)).toBe(true);
      // No enclosing walls: actor may leave the built environment.
      expect(host.objects.filter(o=>o.kind==='wall').some(o=>o.hx>=20||o.hy>=15)).toBe(false);
      const p=s.world.observe();
      expect(Object.keys(p).sort()).toEqual(['proprio','retina','tick','touch']);
      expect(p.retina.length).toBe(96*3);
      expect(p.touch.length).toBe(8);
      expect('mover' in p || 'zone' in p || 'target' in p || 'handle' in p).toBe(false);
    }finally{s.world.free();}
  });
  it('independent material pressure survives in the real Rapier world without any focal actor motor input',()=>{
    const d=runWorldD0(true),dAgain=runWorldD0(true),staticW=runWorldD0(false);
    expect(d).toEqual(dAgain);
    expect(d.finite).toBe(true);
    expect(d.tick).toBe(7200);
    expect(d.privateFrameCount).toBe(1800);
    expect(d.actorPosition).toEqual(staticW.actorPosition);
    expect(d.targetDisplacement).toBeGreaterThan(.1);
    expect(staticW.targetDisplacement).toBeLessThan(.001);
    expect(d.targetEnd).not.toEqual(staticW.targetEnd);
    console.log('RB_WORLD_D0_MATERIAL '+JSON.stringify({
      railEnabled:d.railEnabled,processMovedTo:d.railEnd,
      materialStart:d.targetStart,materialDynamicEnd:d.targetEnd,
      materialStaticEnd:staticW.targetEnd,
      dynamicMaterialDisplacement:d.targetDisplacement,
      staticMaterialDisplacement:staticW.targetDisplacement,
      privateFrames:d.privateFrameCount,
    }));
  },180000);
  it('the SAME true bounded-force body can traverse both distinct physical passes without teleporting',()=>{
    const upper=runD0Transit('upper');
    const lower=runD0Transit('lower');
    console.log('RB_WORLD_D0_TRAVERSAL '+JSON.stringify({upper,lower}));
    expect(upper.finite&&lower.finite).toBe(true);
    expect(upper.goalReached).toBe(true);
    expect(lower.goalReached).toBe(true);
    expect(upper.firstDividerCrossTick).not.toBeNull();
    expect(lower.firstDividerCrossTick).not.toBeNull();
    expect(upper.crossingY).toBeGreaterThan(5);
    expect(lower.crossingY).toBeLessThan(-5);
    expect(upper.distinctPrivateFrames).toBeGreaterThan(20);
    expect(lower.distinctPrivateFrames).toBeGreaterThan(20);
  },180000);
});
