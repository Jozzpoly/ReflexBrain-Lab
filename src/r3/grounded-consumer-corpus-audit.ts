import type {
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  R3_GROUNDED_REPORT_PLACES,
  R3_GROUNDED_REQUEST_TEXT,
} from "./grounded-recurrent-report-consumer-run";
import {
  distance,
} from "./life-world";

export interface R3GroundedConsumerCorpusRow {
  tick: number;
  requestOrdinal: number;
  reportText: string;
  speakerId: string;
  matterId: string;
  matterStatement: string;
  listenerX: number;
  listenerY: number;
  activityKind: string;
  activityPhase: string;
  holdingObject: boolean;
  visibleRackStock: boolean;
  visibleSourceStock: boolean;
  knownRawBeliefCount: number;
  priorHeardCount: number;
  updateWorthy: boolean;
}

export interface R3GroundedCorpusShortcut {
  name: string;
  balancedAccuracy: number;
}

export type R3GroundedConsumerCorpusClassification =
  | "GROUNDED_CONSUMER_CORPUS_EMPTY"
  | "GROUNDED_CONSUMER_CORPUS_UNDERIDENTIFIED"
  | "GROUNDED_CONSUMER_CORPUS_AUDITABLE";

export interface R3GroundedConsumerCorpusAudit {
  rowCount: number;
  positiveCount: number;
  negativeCount: number;
  distinctReportSurfaces: number;
  distinctSpeakers: number;
  distinctMatterIds: number;
  distinctMatterStatements: number;
  distinctActivityKinds: number;
  distinctActivityPhases: number;
  purposeCounterfactualPresent: boolean;
  bestShortcuts: readonly R3GroundedCorpusShortcut[];
  maxShortcutBalancedAccuracy: number | null;
  classification: R3GroundedConsumerCorpusClassification;
  reasons: readonly string[];
}

export function buildR3GroundedConsumerCorpus(
  experiences: readonly ResidentPrivateExperience[],
  options: {
    currentRackStockBlocksUpdate?: boolean;
  } = {},
): readonly R3GroundedConsumerCorpusRow[] {
  const mira = experiences
    .filter(
      (experience) =>
        experience.residentId === "resident:mira",
    )
    .sort(
      (left, right) => left.tick - right.tick,
    );

  const rows: R3GroundedConsumerCorpusRow[] = [];
  let awaitingPrivateSettlement = false;
  let requestOrdinal = 0;

  for (const experience of mira) {
    if (
      awaitingPrivateSettlement &&
      privatelySeesRackSettled(experience)
    ) {
      awaitingPrivateSettlement = false;
    }

    const heard = experience.observation.heardEvents.find(
      (event) =>
        event.kind === "speech" &&
        event.actorId === "resident:janek" &&
        event.payload.text === R3_GROUNDED_REQUEST_TEXT,
    );

    if (!heard) continue;

    requestOrdinal += 1;
    const currentRackStock =
      visibleRawAt(
        experience,
        R3_GROUNDED_REPORT_PLACES.input_rack.position,
      );
    const updateWorthy =
      !awaitingPrivateSettlement &&
      !(
        options.currentRackStockBlocksUpdate &&
        currentRackStock
      );
    if (updateWorthy) {
      awaitingPrivateSettlement = true;
    }

    const matter = experience.matters[0] ?? {
      id: "",
      statement: "",
    };

    rows.push({
      tick: experience.tick,
      requestOrdinal,
      reportText: String(heard.payload.text ?? ""),
      speakerId: String(heard.actorId ?? ""),
      matterId: matter.id,
      matterStatement: matter.statement,
      listenerX: experience.observation.self.position.x,
      listenerY: experience.observation.self.position.y,
      activityKind: experience.activityBefore?.kind ?? "<none>",
      activityPhase: experience.activityBefore?.phase ?? "<none>",
      holdingObject: experience.observation.heldObject !== null,
      visibleRackStock: visibleRawAt(
        experience,
        R3_GROUNDED_REPORT_PLACES.input_rack.position,
      ),
      visibleSourceStock: visibleRawAt(
        experience,
        R3_GROUNDED_REPORT_PLACES.source.position,
      ),
      knownRawBeliefCount: Object.values(
        experience.memory.objectBeliefs,
      ).filter((belief) => belief.kind === "raw_blank").length,
      priorHeardCount: experience.memory.heardEventIds.length,
      updateWorthy,
    });
  }

  return rows;
}

export function auditR3GroundedConsumerCorpus(
  rows: readonly R3GroundedConsumerCorpusRow[],
): R3GroundedConsumerCorpusAudit {
  const positiveCount = rows.filter((row) => row.updateWorthy).length;
  const negativeCount = rows.length - positiveCount;

  if (
    rows.length === 0 ||
    positiveCount === 0 ||
    negativeCount === 0
  ) {
    return {
      rowCount: rows.length,
      positiveCount,
      negativeCount,
      distinctReportSurfaces: distinct(rows, (row) => row.reportText),
      distinctSpeakers: distinct(rows, (row) => row.speakerId),
      distinctMatterIds: distinct(rows, (row) => row.matterId),
      distinctMatterStatements: distinct(rows, (row) => row.matterStatement),
      distinctActivityKinds: distinct(rows, (row) => row.activityKind),
      distinctActivityPhases: distinct(rows, (row) => row.activityPhase),
      purposeCounterfactualPresent: false,
      bestShortcuts: [],
      maxShortcutBalancedAccuracy: null,
      classification: "GROUNDED_CONSUMER_CORPUS_EMPTY",
      reasons: ["both target classes are required"],
    };
  }

  const candidates: R3GroundedCorpusShortcut[] = [
    categoricalShortcut("majority", rows, () => "<all>"),
    categoricalShortcut("exact-report-text", rows, (row) => row.reportText),
    categoricalShortcut("speaker-id", rows, (row) => row.speakerId),
    categoricalShortcut("matter-id", rows, (row) => row.matterId),
    thresholdShortcut("request-ordinal-threshold", rows, (row) => row.requestOrdinal),
    thresholdShortcut("absolute-tick-threshold", rows, (row) => row.tick),
    thresholdShortcut("listener-x-threshold", rows, (row) => row.listenerX),
    thresholdShortcut("listener-y-threshold", rows, (row) => row.listenerY),
    categoricalShortcut("activity-kind", rows, (row) => row.activityKind),
    categoricalShortcut("activity-phase", rows, (row) => row.activityPhase),
    categoricalShortcut("holding-object", rows, (row) => String(row.holdingObject)),
    categoricalShortcut("visible-rack-stock", rows, (row) => String(row.visibleRackStock)),
    categoricalShortcut("visible-source-stock", rows, (row) => String(row.visibleSourceStock)),
    thresholdShortcut("known-raw-belief-count", rows, (row) => row.knownRawBeliefCount),
    thresholdShortcut("prior-heard-count-threshold", rows, (row) => row.priorHeardCount),
  ].sort(
    (left, right) =>
      right.balancedAccuracy - left.balancedAccuracy ||
      left.name.localeCompare(right.name),
  );

  const purposeCounterfactualPresent =
    hasPurposeCounterfactual(rows);

  const reasons: string[] = [];
  if (rows.length < 20) {
    reasons.push("fewer than 20 rows");
  }
  if (Math.min(positiveCount, negativeCount) < 5) {
    reasons.push("minority class has fewer than 5 rows");
  }
  if (!purposeCounterfactualPresent) {
    reasons.push("no same-report purpose counterfactual");
  }
  const maxShortcutBalancedAccuracy =
    candidates[0]?.balancedAccuracy ?? null;
  if (
    maxShortcutBalancedAccuracy !== null &&
    maxShortcutBalancedAccuracy >= 0.9
  ) {
    reasons.push("a trivial shortcut reaches BA >= 0.90");
  }
  if (
    distinct(rows, (row) => row.reportText) < 2 ||
    distinct(rows, (row) => row.speakerId) < 2 ||
    distinct(rows, (row) => row.matterStatement) < 2
  ) {
    reasons.push("report/speaker/matter diversity is too narrow");
  }

  return {
    rowCount: rows.length,
    positiveCount,
    negativeCount,
    distinctReportSurfaces: distinct(rows, (row) => row.reportText),
    distinctSpeakers: distinct(rows, (row) => row.speakerId),
    distinctMatterIds: distinct(rows, (row) => row.matterId),
    distinctMatterStatements: distinct(rows, (row) => row.matterStatement),
    distinctActivityKinds: distinct(rows, (row) => row.activityKind),
    distinctActivityPhases: distinct(rows, (row) => row.activityPhase),
    purposeCounterfactualPresent,
    bestShortcuts: candidates,
    maxShortcutBalancedAccuracy,
    classification:
      reasons.length === 0
        ? "GROUNDED_CONSUMER_CORPUS_AUDITABLE"
        : "GROUNDED_CONSUMER_CORPUS_UNDERIDENTIFIED",
    reasons,
  };
}

function privatelySeesRackSettled(
  experience: ResidentPrivateExperience,
): boolean {
  return (
    experience.observation.heldObject === null &&
    distance(
      experience.observation.self.position,
      R3_GROUNDED_REPORT_PLACES.input_rack.position,
    ) <= 2.5 &&
    visibleRawAt(
      experience,
      R3_GROUNDED_REPORT_PLACES.input_rack.position,
    )
  );
}

function visibleRawAt(
  experience: ResidentPrivateExperience,
  position: { x: number; y: number },
): boolean {
  return experience.observation.visibleObjects.some(
    (object) =>
      object.kind === "raw_blank" &&
      object.location.kind === "free" &&
      distance(object.location.position, position) <= 0.75,
  );
}

function distinct<T>(
  rows: readonly R3GroundedConsumerCorpusRow[],
  select: (row: R3GroundedConsumerCorpusRow) => T,
): number {
  return new Set(rows.map(select)).size;
}

function hasPurposeCounterfactual(
  rows: readonly R3GroundedConsumerCorpusRow[],
): boolean {
  const byReport = new Map<
    string,
    Map<string, Set<boolean>>
  >();

  for (const row of rows) {
    const purposes =
      byReport.get(row.reportText) ??
      new Map<string, Set<boolean>>();
    const labels =
      purposes.get(row.matterStatement) ??
      new Set<boolean>();
    labels.add(row.updateWorthy);
    purposes.set(row.matterStatement, labels);
    byReport.set(row.reportText, purposes);
  }

  for (const purposes of byReport.values()) {
    if (purposes.size < 2) continue;
    const purposeEntries = [...purposes.entries()];
    for (let i = 0; i < purposeEntries.length; i += 1) {
      for (let j = i + 1; j < purposeEntries.length; j += 1) {
        const left = purposeEntries[i]![1];
        const right = purposeEntries[j]![1];
        if (
          [...left].some((label) => !right.has(label)) ||
          [...right].some((label) => !left.has(label))
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function categoricalShortcut(
  name: string,
  rows: readonly R3GroundedConsumerCorpusRow[],
  select: (row: R3GroundedConsumerCorpusRow) => string,
): R3GroundedCorpusShortcut {
  const labelsByValue =
    new Map<string, boolean[]>();

  for (const row of rows) {
    const value = select(row);
    const labels = labelsByValue.get(value) ?? [];
    labels.push(row.updateWorthy);
    labelsByValue.set(value, labels);
  }

  const predictionByValue =
    new Map<string, boolean>();
  for (const [value, labels] of labelsByValue) {
    const positives = labels.filter(Boolean).length;
    predictionByValue.set(
      value,
      positives * 2 >= labels.length,
    );
  }

  const predictions = rows.map(
    (row) => predictionByValue.get(select(row)) ?? false,
  );

  return {
    name,
    balancedAccuracy: balancedAccuracy(rows, predictions),
  };
}

function thresholdShortcut(
  name: string,
  rows: readonly R3GroundedConsumerCorpusRow[],
  select: (row: R3GroundedConsumerCorpusRow) => number,
): R3GroundedCorpusShortcut {
  const values = [...new Set(rows.map(select))].sort((a, b) => a - b);
  const thresholds: number[] = [];
  if (values.length === 1) {
    thresholds.push(values[0]!);
  } else {
    thresholds.push(values[0]! - 1);
    for (let index = 1; index < values.length; index += 1) {
      thresholds.push((values[index - 1]! + values[index]!) / 2);
    }
    thresholds.push(values[values.length - 1]! + 1);
  }

  let best = 0;
  for (const threshold of thresholds) {
    const ge = rows.map((row) => select(row) >= threshold);
    const lt = ge.map((value) => !value);
    best = Math.max(
      best,
      balancedAccuracy(rows, ge),
      balancedAccuracy(rows, lt),
    );
  }

  return {
    name,
    balancedAccuracy: best,
  };
}

function balancedAccuracy(
  rows: readonly R3GroundedConsumerCorpusRow[],
  predictions: readonly boolean[],
): number {
  let tp = 0;
  let tn = 0;
  let p = 0;
  let n = 0;

  rows.forEach((row, index) => {
    if (row.updateWorthy) {
      p += 1;
      if (predictions[index]) tp += 1;
    } else {
      n += 1;
      if (!predictions[index]) tn += 1;
    }
  });

  return 0.5 * (tp / p + tn / n);
}
