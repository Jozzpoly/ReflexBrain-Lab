export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export function normalizeDistribution<T extends string>(
  values: Record<T, number>,
): Record<T, number> {
  const keys = Object.keys(values) as T[];
  const positive = keys.map((key) => Math.max(0, values[key]));
  const total = positive.reduce((sum, value) => sum + value, 0);

  if (total <= 1e-9) {
    const uniform = 1 / Math.max(1, keys.length);
    return Object.fromEntries(keys.map((key) => [key, uniform])) as Record<T, number>;
  }

  return Object.fromEntries(
    keys.map((key, index) => [key, positive[index]! / total]),
  ) as Record<T, number>;
}
