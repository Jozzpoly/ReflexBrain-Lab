import type {
  ResidentPrivateExperience,
} from "./life-contracts";
import type {
  R3GroundedConsumerCorpusRow,
} from "./grounded-consumer-corpus-audit";
import {
  R3_SUPPLIER_STOCKED_TEXT,
} from "./grounded-listener-effector-run";
import {
  R3_GROUNDED_REQUEST_TEXT,
} from "./grounded-recurrent-report-consumer-run";

export interface R3AsyncEpisodeAudit {
  settledEpisodeCount: number;
  reportCounts: readonly number[];
  distinctLengths: readonly number[];
  maxLengthShare: number | null;
  hasSingleReportEpisode: boolean;
  hasThreePlusReportEpisode: boolean;
}

export interface R3AsyncPeriodicityShortcut {
  name: string;
  balancedAccuracy: number;
}

export function auditR3AsyncEpisodes(
  experiences: readonly ResidentPrivateExperience[],
): R3AsyncEpisodeAudit {
  const ida = experiences
    .filter(
      (experience) =>
        experience.residentId === "resident:ida",
    )
    .sort(
      (left, right) =>
        left.tick - right.tick,
    );

  const reportCounts: number[] = [];
  let currentCount = 0;

  for (const experience of ida) {
    for (const event of experience.observation.heardEvents) {
      if (
        event.kind !== "speech" ||
        typeof event.payload.text !== "string"
      ) {
        continue;
      }

      if (
        event.actorId === "resident:janek" &&
        event.payload.text === R3_GROUNDED_REQUEST_TEXT
      ) {
        currentCount += 1;
        continue;
      }

      if (
        event.actorId === "resident:mira" &&
        event.payload.text === R3_SUPPLIER_STOCKED_TEXT &&
        currentCount > 0
      ) {
        reportCounts.push(currentCount);
        currentCount = 0;
      }
    }
  }

  const distinctLengths =
    [...new Set(reportCounts)].sort(
      (a, b) => a - b,
    );

  let maxLengthShare: number | null =
    null;
  if (reportCounts.length > 0) {
    const counts =
      new Map<number, number>();
    for (const value of reportCounts) {
      counts.set(
        value,
        (counts.get(value) ?? 0) + 1,
      );
    }
    maxLengthShare =
      Math.max(...counts.values()) /
      reportCounts.length;
  }

  return {
    settledEpisodeCount:
      reportCounts.length,
    reportCounts,
    distinctLengths,
    maxLengthShare,
    hasSingleReportEpisode:
      reportCounts.includes(1),
    hasThreePlusReportEpisode:
      reportCounts.some(
        (value) => value >= 3,
      ),
  };
}

export function auditR3AsyncPeriodicity(
  rows: readonly R3GroundedConsumerCorpusRow[],
): readonly R3AsyncPeriodicityShortcut[] {
  if (
    rows.length === 0 ||
    !rows.some(
      (row) => row.updateWorthy,
    ) ||
    !rows.some(
      (row) =>
        !row.updateWorthy,
    )
  ) {
    return [];
  }

  return [
    ...[2, 3, 4, 5, 6].map(
      (modulus) =>
        categoricalModulo(
          "request-ordinal-mod-" +
            modulus,
          rows,
          (row) =>
            row.requestOrdinal,
          modulus,
        ),
    ),
    ...[24, 45, 60, 90, 120].map(
      (modulus) =>
        categoricalModulo(
          "absolute-tick-mod-" +
            modulus,
          rows,
          (row) =>
            row.tick,
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
): R3AsyncPeriodicityShortcut {
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

  const predictions =
    rows.map((row) => {
      const value =
        ((select(row) % modulus) +
          modulus) %
        modulus;
      return (
        prediction.get(value) ??
        false
      );
    });

  return {
    name,
    balancedAccuracy:
      balancedAccuracy(
        rows,
        predictions,
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

  rows.forEach(
    (row, index) => {
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
    },
  );

  return (
    0.5 *
    (
      truePositives / positives +
      trueNegatives / negatives
    )
  );
}
