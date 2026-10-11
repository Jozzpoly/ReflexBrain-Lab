import {beforeAll,describe,expect,it} from 'vitest';
import {initLivingWorld} from '../../src/living-organism/world';
import {
  createWorldD1,runWorldD1,runD1MaterialIntervention,runD1UpperRoute,
} from '../../src/living-organism/world-ecology-d1';
beforeAll(initLivingWorld);
describe('WORLD-D1: reversible coupled material affordance / discovery',()=>{
  it('the plate and moving gate belong to World, not actor private sensor ontology',()=>{
    const s=createWorldD1(true);
    try{
      const g=s.world.inspectGateLink()!;
      expect(g.platePosition).toEqual({x:12.7,y:11.5});
      expect(g.gatePosition).toEqual({x:8,y:6.5});
      const frame=s.world.observe();
      expect(Object.keys(frame).sort()).toEqual(['proprio','retina','tick','touch']);
      expect('plateHandle' in frame).toBe(false);
      expect('loadCount' in frame).toBe(false);
      expect(s.world.inspect().objects.find(x=>x.handle===s.gateHandle)?.kind).toBe('block');
    }finally{s.world.free();}
  });
  it('physical mass placed then removed from the same sensor repeatedly opens and closes the actual dynamic gate',()=>{
    const r=runD1MaterialIntervention();
    console.log('RB_WORLD_D1_MATERIAL_INTERVENTIONS '+JSON.stringify(r));
    expect(r.actorStayedStill).toBe(true);
    expect(r.positions).toHaveLength(5);
    expect(r.positions[0]).toBeLessThan(8.6);
    expect(r.positions[1]).toBeGreaterThan(10.9);
    expect(r.positions[2]).toBeLessThan(8.6);
    expect(r.positions[3]).toBeGreaterThan(10.9);
    expect(r.positions[4]).toBeLessThan(8.6);
    expect(r.loaded).toEqual([false,true,false,true,false]);
    expect(r.transitions).toBeGreaterThanOrEqual(4);
  },120000);
  it('an independent physical rail causes repeated load cycles and material route changes across three minutes without actor/Owner',()=>{
    const dynamic=runWorldD1(true);
    const repeat=runWorldD1(true);
    const staticW=runWorldD1(false);
    const summary={
      dynamic:{transitions:dynamic.transitions,loadTimes:dynamic.loadedEntryTicks,
        clearTimes:dynamic.gateClearEntryTicks,
        closedTimes:dynamic.gateShutEntryTicks,
        last:dynamic.last,frames:dynamic.uniquePrivateFrames},
      static:{transitions:staticW.transitions,
        loadTimes:staticW.loadedEntryTicks,
        clearTimes:staticW.gateClearEntryTicks,
        closedTimes:staticW.gateShutEntryTicks,
        last:staticW.last},
    };
    console.log('RB_WORLD_D1_RECURRENT '+JSON.stringify(summary));
    expect(dynamic).toEqual(repeat);
    expect(dynamic.tick).toBe(21600);
    expect(dynamic.uniquePrivateFrames).toBe(5400);
    expect(dynamic.freeBodyPosition).toEqual({x:0,y:0});
    expect(dynamic.loadedEntryTicks.length).toBeGreaterThanOrEqual(2);
    expect(dynamic.gateClearEntryTicks.filter(t=>t>7200).length).toBeGreaterThanOrEqual(1);
    expect(dynamic.gateShutEntryTicks.filter(t=>t>7200).length).toBeGreaterThanOrEqual(1);
    expect(staticW.loadedEntryTicks).toHaveLength(0);
    expect(staticW.gateClearEntryTicks).toHaveLength(0);
    expect(staticW.transitions).toBe(0);
  },180000);
  it('same bounded-force actuator can physically cross upper divider when mechanically open but not when unloaded',()=>{
    const open=runD1UpperRoute(true);
    const closed=runD1UpperRoute(false);
    console.log('RB_WORLD_D1_ROUTE '+JSON.stringify({open,closed}));
    expect(open.firstGateOpenTick).not.toBeNull();
    expect(open.crossingTick).not.toBeNull();
    expect(closed.crossingTick).toBeNull();
    expect(open.finalGateX).toBeGreaterThan(10.8);
    expect(closed.finalGateX).toBeLessThan(9);
  },180000);
});
