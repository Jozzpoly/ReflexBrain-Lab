import type {
  R3GroundedConsumerCorpusRow,
} from "./grounded-consumer-corpus-audit";

export interface R3ModuloShortcutAudit {
  name: string;
  balancedAccuracy: number;
}

export function auditR3PersistentModuloShortcuts(
  rows: readonly R3GroundedConsumerCorpusRow[],
): readonly R3ModuloShortcutAudit[] {
  if (
    rows.length === 0 ||
    !rows.some((row) => row.updateWorthy) ||
    !rows.some((row) => !row.updateWorthy)
  ) {
    return [];
  }

  return [
    ...[2, 3, 4, 5, 6].map((modulus) =>
      categoricalModulo(
        "request-ordinal-mod-" + modulus,
        rows,
        (row) => row.requestOrdinal,
        modulus,
      ),
    ),
    ...[24, 45, 90, 120].map((modulus) =>
      categoricalModulo(
        "absolute-tick-mod-" + modulus,
        rows,
        (row) => row.tick,
        modulus,
      ),
    ),
  ].sort(
    (left, right) =>
      right.balancedAccuracy -
        left.balancedAccuracy ||
      left.name.localeCompare(
        right.name,
      ),
  );
}

function categoricalModulo(
  name: string,
  rows: readonly R3GroundedConsumerCorpusRow[],
  select: (row: R3GroundedConsumerCorpusRow) => number,
  modulus: number,
): R3ModuloShortcutAudit {
  const labels =
    new Map<number, boolean[]>();

  for (const row of rows) {
    const value =
      ((select(row) % modulus) +
        modulus) %
      modulus;
    const bucket =
      labels.get(value) ?? [];
    bucket.push(row.updateWorthy);
    labels.set(value, bucket);
  }

  const prediction =
    new Map<number, boolean>();

  for (const [value, bucket] of labels) {
    const positives =
      bucket.filter(Boolean).length;
    prediction.set(
      value,
      positives * 2 >= bucket.length,
    );
  }

  return {
    name,
    balancedAccuracy:
      balancedAccuracy(
        rows,
        rows.map((row) => {
          const value =
            ((select(row) % modulus) +
              modulus) %
            modulus;
          return (
            prediction.get(value) ??
            false
          );
        }),
      ),
  };
}

function balancedAccuracy(
  rows: readonly R3GroundedConsumerCorpusRow[],
  predictions: readonly boolean[],
): number {
  let positives = 0;
  let negatives = 0;
  let truePositives = 0;
  let trueNegatives = 0;

  rows.forEach((row, index) => {
    if (row.updateWorthy) {
      positives += 1;
      if (predictions[index]) {
        truePositives += 1;
      }
    } else {
      negatives += 1;
      if (!predictions[index]) {
        trueNegatives += 1;
      }
    }
  });

  return (
    0.5 *
    (
      truePositives /
        positives +
      trueNegatives /
        negatives
    )
  );
}
