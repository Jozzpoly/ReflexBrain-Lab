import * as RapierModule from '@dimforge/rapier2d-deterministic-compat';

export const E0_RAPIER: any = (RapierModule as any).default ?? RapierModule;

export const E0_DT = 1 / 120;
export const E0_RADIUS = 1;
export const E0_MASS = 1;

export const E0_VMAX = 5.2631578947;
export const E0_TAU_MOVE = 0.196;
export const E0_OMEGA_MAX = 2.0;
export const E0_TAU_TURN = 0.143;

export const E0_LINEAR_DAMPING = (Math.exp(E0_DT / E0_TAU_MOVE) - 1) / E0_DT;
export const E0_ANGULAR_DAMPING = (Math.exp(E0_DT / E0_TAU_TURN) - 1) / E0_DT;
export const E0_FMAX = E0_MASS * E0_LINEAR_DAMPING * E0_VMAX;
export const E0_DISC_INERTIA = 0.5 * E0_MASS * E0_RADIUS * E0_RADIUS;
export const E0_TMAX = E0_DISC_INERTIA * E0_ANGULAR_DAMPING * E0_OMEGA_MAX;

export type E0Body = {
  rb: any;
  co: any;
};

export type E0Wall = E0Body & {
  hx: number;
  hy: number;
};

export async function initE0Rapier(): Promise<void> {
  await E0_RAPIER.init();
}

export function createE0World(): any {
  const world = new E0_RAPIER.World({ x: 0, y: 0 });
  world.timestep = E0_DT;
  return world;
}

export function createE0Body(
  world: any,
  x: number,
  y: number,
  mass = E0_MASS,
  radius = E0_RADIUS,
  linearDamping = E0_LINEAR_DAMPING,
  angularDamping = E0_ANGULAR_DAMPING,
): E0Body {
  const rb = world.createRigidBody(
    E0_RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y)
      .setLinearDamping(linearDamping)
      .setAngularDamping(angularDamping),
  );

  const co = world.createCollider(
    E0_RAPIER.ColliderDesc.ball(radius)
      .setMass(mass)
      .setFriction(0)
      .setRestitution(0),
    rb,
  );

  return { rb, co };
}

export function createE0Wall(
  world: any,
  x: number,
  y: number,
  hx: number,
  hy: number,
): E0Wall {
  const rb = world.createRigidBody(
    E0_RAPIER.RigidBodyDesc.fixed().setTranslation(x, y),
  );
  const co = world.createCollider(
    E0_RAPIER.ColliderDesc.cuboid(hx, hy)
      .setFriction(0)
      .setRestitution(0),
    rb,
  );
  return { rb, co, hx, hy };
}

export function applyE0Demand(
  rb: any,
  drive: number,
  turn: number,
): void {
  rb.resetForces(true);
  rb.resetTorques(true);

  const angle = rb.rotation();
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  rb.addForce(
    {
      x: c * E0_FMAX * drive,
      y: s * E0_FMAX * drive,
    },
    true,
  );
  rb.addTorque(E0_TMAX * turn, true);
}

export function wrapE0Pi(x: number): number {
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

export function e0PairImpulse(world: any, a: any, b: any): {
  impulse: number;
  solverContacts: number;
} {
  let impulse = 0;
  let solverContacts = 0;

  world.contactPair(a, b, (manifold: any) => {
    const n = manifold.numSolverContacts();
    solverContacts += n;
    for (let i = 0; i < n; i += 1) {
      impulse += Math.abs(manifold.contactImpulse(i));
    }
  });

  return { impulse, solverContacts };
}

export function e0BytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
