export const R3E_MIN_IMPULSE_GESTURE = 0.08;
export const R3E_MAX_IMPULSE = 1.45;

export type WorldPoint = { x: number; y: number };
export type ScreenPoint = { x: number; y: number };

export type ViewportProjection = {
  width: number;
  height: number;
  scale: number;
  worldToScreen(point: WorldPoint): ScreenPoint;
  screenToWorld(point: ScreenPoint): WorldPoint;
  radiusToScreen(radius: number): number;
};

export type MaterialImpulseResult =
  | { kind: 'none'; reason: 'below-threshold' }
  | {
      kind: 'impulse';
      impulse: WorldPoint;
      rawMagnitude: number;
      appliedMagnitude: number;
    };

export function createR3EProjection(
  width: number,
  height: number,
): ViewportProjection {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error('projection requires positive finite viewport dimensions');
  }

  // Frozen to the current E01 low-fidelity world composition.
  // Canvas rendering, spatial proxy placement and pointer conversion all use
  // this one transform in R3E.
  const scale = Math.min((width - 52) / 11.8, (height - 42) / 4.2);
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('projection produced invalid scale');
  }

  return {
    width,
    height,
    scale,
    worldToScreen(point) {
      return {
        x: width / 2 + point.x * scale,
        y: height / 2 - point.y * scale,
      };
    },
    screenToWorld(point) {
      return {
        x: (point.x - width / 2) / scale,
        y: -(point.y - height / 2) / scale,
      };
    },
    radiusToScreen(radius) {
      if (!Number.isFinite(radius) || radius < 0) {
        throw new Error('radius must be finite and non-negative');
      }
      return radius * scale;
    },
  };
}

export function deriveSpatialProxyCircle(args: {
  viewportWidth: number;
  viewportHeight: number;
  worldCenter: WorldPoint;
  worldRadius: number;
  hitExpansion?: number;
}): {
  center: ScreenPoint;
  visualRadiusPx: number;
  hitRadiusPx: number;
} {
  const projection = createR3EProjection(
    args.viewportWidth,
    args.viewportHeight,
  );
  const visualRadiusPx = projection.radiusToScreen(args.worldRadius);
  const hitExpansion = args.hitExpansion ?? 1.45;
  if (!Number.isFinite(hitExpansion) || hitExpansion < 1) {
    throw new Error('hitExpansion must be finite and >= 1');
  }
  return {
    center: projection.worldToScreen(args.worldCenter),
    visualRadiusPx,
    hitRadiusPx: visualRadiusPx * hitExpansion,
  };
}

export function materialImpulseFromGesture(args: {
  bodyWorld: WorldPoint;
  pointerWorld: WorldPoint;
  minGesture?: number;
  maxImpulse?: number;
}): MaterialImpulseResult {
  const minGesture = args.minGesture ?? R3E_MIN_IMPULSE_GESTURE;
  const maxImpulse = args.maxImpulse ?? R3E_MAX_IMPULSE;

  for (const [label, value] of [
    ['body.x', args.bodyWorld.x],
    ['body.y', args.bodyWorld.y],
    ['pointer.x', args.pointerWorld.x],
    ['pointer.y', args.pointerWorld.y],
    ['minGesture', minGesture],
    ['maxImpulse', maxImpulse],
  ] as const) {
    if (!Number.isFinite(value)) {
      throw new Error(`${label} must be finite`);
    }
  }
  if (minGesture < 0 || maxImpulse <= 0) {
    throw new Error('gesture thresholds invalid');
  }

  const dx = args.pointerWorld.x - args.bodyWorld.x;
  const dy = args.pointerWorld.y - args.bodyWorld.y;
  const rawMagnitude = Math.hypot(dx, dy);

  if (rawMagnitude < minGesture) {
    return { kind: 'none', reason: 'below-threshold' };
  }

  const appliedMagnitude = Math.min(maxImpulse, rawMagnitude);
  const scale = appliedMagnitude / rawMagnitude;

  return {
    kind: 'impulse',
    impulse: {
      x: dx * scale,
      y: dy * scale,
    },
    rawMagnitude,
    appliedMagnitude,
  };
}
