import { beforeAll, describe, expect, it } from 'vitest';
import { initE0Rapier } from '../src/e0-body-seam';
import { FIELD_BOUNDS, OwnerFieldLab } from '../src/owner-field-lab';

beforeAll(async () => {
  await initE0Rapier();
});

describe('Owner Field Lab engineering surface', () => {
  it('runs continuously with finite state and an independent sweeper', () => {
    const lab = new OwnerFieldLab();
    try {
      const start = lab.snapshot();
      expect(start.privateFrame.blobs.length).toBe(1);
      const sx = start.sweeper.x;
      for (let i = 0; i < 720; i += 1) lab.step();
      const end = lab.snapshot();

      for (const value of [
        end.actor.x, end.actor.y, end.actor.rotation,
        end.target.x, end.target.y,
        end.sweeper.x, end.sweeper.y,
      ]) expect(Number.isFinite(value)).toBe(true);

      expect(Math.abs(end.actor.x)).toBeLessThan(FIELD_BOUNDS.x + 2);
      expect(Math.abs(end.actor.y)).toBeLessThan(FIELD_BOUNDS.y + 2);
      expect(end.sweeper.x).not.toBe(sx);
      expect(end.events.length).toBeGreaterThan(0);
    } finally {
      lab.destroy();
    }
  });

  it('lets Owner create a real private-visibility intervention without copying World truth', () => {
    const lab = new OwnerFieldLab();
    try {
      lab.step(); // allow legal initial observation to enter private history
      expect(lab.snapshot().privateState.lastSeen).not.toBeNull();

      lab.setTargetPosition(2.2, 1.8);
      lab.step();
      const hidden = lab.snapshot();

      expect(hidden.privateFrame.blobs).toHaveLength(0);
      expect(hidden.privateState.lastSeen).not.toBeNull();
      expect(hidden.target.x).toBeGreaterThan(0);
      expect(hidden.events.some((e) => e.kind === 'owner')).toBe(true);

      lab.setMemoryEnabled(false);
      expect(lab.snapshot().privateState.lastSeen).toBeNull();
    } finally {
      lab.destroy();
    }
  });

  it('keeps World processes running while actor control is paused', () => {
    const lab = new OwnerFieldLab();
    try {
      lab.setActorEnabled(false);
      const a = lab.snapshot();
      for (let i = 0; i < 180; i += 1) lab.step();
      const b = lab.snapshot();

      expect(Math.hypot(b.actor.x - a.actor.x, b.actor.y - a.actor.y)).toBeLessThan(0.05);
      expect(Math.abs(b.sweeper.x - a.sweeper.x)).toBeGreaterThan(0.05);
    } finally {
      lab.destroy();
    }
  });
});
