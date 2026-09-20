import { buildCausalMicroscope } from "./causal-microscope";
import type {
  LivingSpecimenRun,
  LivingSpecimenStep,
} from "./living-specimen";

export interface LivingSpecimenMicroscopeRow {
  tick: number;
  lane: "world" | "private" | "fixture_oracle";
  kind: string;
  id: string;
  detail: string;
}

export function buildLivingSpecimenMicroscope(
  run: LivingSpecimenRun,
): readonly LivingSpecimenMicroscopeRow[] {
  const causalRows = buildCausalMicroscope(
    run.steps.map((step) => step.frame),
  ).map((row) => ({
    tick: row.tick,
    lane: row.scope,
    kind: row.kind,
    id: row.id,
    detail:
      row.semanticKind +
      (row.provenanceEventIds.length > 0
        ? " <- " + row.provenanceEventIds.join(",")
        : ""),
  })) satisfies LivingSpecimenMicroscopeRow[];

  const oracleRows = run.steps.map((step: LivingSpecimenStep) => ({
    tick: step.frame.world.tick,
    lane: "fixture_oracle" as const,
    kind: "decision",
    id: "fixture-oracle:" + step.frame.world.tick,
    detail:
      step.decision.behavior +
      " | " +
      step.decision.reason +
      (step.decision.evidenceIds.length > 0
        ? " | evidence=" + step.decision.evidenceIds.join(",")
        : ""),
  }));

  return [...causalRows, ...oracleRows].sort(
    (left, right) =>
      left.tick - right.tick ||
      laneOrder(left.lane) - laneOrder(right.lane) ||
      left.id.localeCompare(right.id),
  );
}

function laneOrder(
  lane: LivingSpecimenMicroscopeRow["lane"],
): number {
  switch (lane) {
    case "world":
      return 0;
    case "private":
      return 1;
    case "fixture_oracle":
      return 2;
  }
}
