import {
  createAutonomousContactRun,
  type AutonomousContactRunOptions,
} from "./autonomous-contact-run";
import {
  createAutonomousLifeRun,
  type AutonomousLifeRunOptions,
} from "./autonomous-life-run";
import type {
  ResidentDecision,
  ResidentId,
  ResidentPrivateExperience,
} from "./life-contracts";

export type R3CounterfactualEcology =
  | "material-work"
  | "moving-contact";

export interface R3ResidentFirstDivergence {
  residentId: ResidentId;
  firstObservationTick: number | null;
  firstPrivateStateTick: number | null;
  firstDecisionTick: number | null;
  firstOutcomeTick: number | null;
}

export interface R3CounterfactualEvidence {
  ecology: R3CounterfactualEcology;
  perturbationId: string;
  ticks: number;
  residents: readonly R3ResidentFirstDivergence[];
}

/**
 * Run two deterministic autonomous worlds separately, then compare actor-
 * private trajectories by aligned tick.
 *
 * The paired runs are sequential rather than interleaved so temporary fixture
 * policy state cannot accidentally communicate between worlds.
 */
export function compareMaterialCounterfactual(options: {
  perturbationId: string;
  ticks: number;
  baseline?: AutonomousLifeRunOptions;
  variant: AutonomousLifeRunOptions;
}): R3CounterfactualEvidence {
  const baseline = createAutonomousLifeRun(
    options.baseline ?? {},
  );
  baseline.runTicks(options.ticks);
  const baselineRows = baseline.privateExperiences();

  const variant = createAutonomousLifeRun(options.variant);
  variant.runTicks(options.ticks);
  const variantRows = variant.privateExperiences();

  return compareExperienceSets(
    "material-work",
    options.perturbationId,
    options.ticks,
    baselineRows,
    variantRows,
  );
}

export function compareContactCounterfactual(options: {
  perturbationId: string;
  ticks: number;
  baseline?: AutonomousContactRunOptions;
  variant: AutonomousContactRunOptions;
}): R3CounterfactualEvidence {
  const baseline = createAutonomousContactRun(
    options.baseline ?? {},
  );
  baseline.runTicks(options.ticks);
  const baselineRows = baseline.privateExperiences();

  const variant = createAutonomousContactRun(options.variant);
  variant.runTicks(options.ticks);
  const variantRows = variant.privateExperiences();

  return compareExperienceSets(
    "moving-contact",
    options.perturbationId,
    options.ticks,
    baselineRows,
    variantRows,
  );
}

function compareExperienceSets(
  ecology: R3CounterfactualEcology,
  perturbationId: string,
  ticks: number,
  baseline: readonly ResidentPrivateExperience[],
  variant: readonly ResidentPrivateExperience[],
): R3CounterfactualEvidence {
  const residentIds = [
    ...new Set([
      ...baseline.map((row) => row.residentId),
      ...variant.map((row) => row.residentId),
    ]),
  ].sort();

  return {
    ecology,
    perturbationId,
    ticks,
    residents: residentIds.map((residentId) =>
      compareResident(
        residentId,
        baseline.filter(
          (row) => row.residentId === residentId,
        ),
        variant.filter(
          (row) => row.residentId === residentId,
        ),
      ),
    ),
  };
}

function compareResident(
  residentId: ResidentId,
  baselineRows: readonly ResidentPrivateExperience[],
  variantRows: readonly ResidentPrivateExperience[],
): R3ResidentFirstDivergence {
  const baselineByTick = new Map(
    baselineRows.map((row) => [row.tick, row]),
  );
  const variantByTick = new Map(
    variantRows.map((row) => [row.tick, row]),
  );
  const ticks = [
    ...new Set([
      ...baselineByTick.keys(),
      ...variantByTick.keys(),
    ]),
  ].sort((a, b) => a - b);

  let firstObservationTick: number | null = null;
  let firstPrivateStateTick: number | null = null;
  let firstDecisionTick: number | null = null;
  let firstOutcomeTick: number | null = null;

  for (const tick of ticks) {
    const baseline = baselineByTick.get(tick);
    const variant = variantByTick.get(tick);

    if (!baseline || !variant) {
      const divergenceTick = tick;
      firstObservationTick ??= divergenceTick;
      firstPrivateStateTick ??= divergenceTick;
      firstDecisionTick ??= divergenceTick;
      firstOutcomeTick ??= divergenceTick;
      continue;
    }

    if (
      firstObservationTick === null &&
      stableJson(observationView(baseline)) !==
        stableJson(observationView(variant))
    ) {
      firstObservationTick = tick;
    }

    if (
      firstPrivateStateTick === null &&
      stableJson(privateStateView(baseline)) !==
        stableJson(privateStateView(variant))
    ) {
      firstPrivateStateTick = tick;
    }

    if (
      firstDecisionTick === null &&
      stableJson(decisionView(baseline.decision)) !==
        stableJson(decisionView(variant.decision))
    ) {
      firstDecisionTick = tick;
    }

    if (
      firstOutcomeTick === null &&
      stableJson(outcomeView(baseline)) !==
        stableJson(outcomeView(variant))
    ) {
      firstOutcomeTick = tick;
    }
  }

  return {
    residentId,
    firstObservationTick,
    firstPrivateStateTick,
    firstDecisionTick,
    firstOutcomeTick,
  };
}

function observationView(
  experience: ResidentPrivateExperience,
): unknown {
  return experience.observation;
}

function privateStateView(
  experience: ResidentPrivateExperience,
): unknown {
  return {
    matters: experience.matters,
    activityBefore: experience.activityBefore,
    observation: experience.observation,
    memory: experience.memory,
  };
}

function decisionView(decision: ResidentDecision): unknown {
  return decision;
}

function outcomeView(
  experience: ResidentPrivateExperience,
): unknown {
  return experience.factualOutcomeEvents;
}

function stableJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      result[key] = canonicalize(source[key]);
    }
    return result;
  }

  return value;
}
