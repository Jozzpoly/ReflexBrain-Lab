import type { ActorPrivateState } from "../contracts";
import type { AppraisalId } from "../local-choice-probe";
import { createR1CognitionTrainingAugmentation } from "./cognition-training-augmentation";
import {
  createR1CounterfactualSuite,
  type R1CounterfactualConstraint,
  type R1CounterfactualSuite,
  type R1Split,
  type R1StateRecord,
} from "./counterfactual-supervision";
import { createR1OodRedTeamSuite } from "./ood-red-team";
import { createR1PragmaticTrainingAugmentation } from "./pragmatic-training-augmentation";
import { createR1SemanticTrainingAugmentation } from "./semantic-training-augmentation";

export interface R1OracleSemanticPrimitives {
  dangerNow: number;
  operativeDemandNow: number;
  urgencyNow: number;
  unresolvedInfoNow: number;
}

export interface R1OracleAppraisalScores {
  attention: number;
  interrupt: number;
  social: number;
  threat: number;
  cognition: number;
}

export interface R1OracleConstraintResult extends R1CounterfactualConstraint {
  margin: number;
  passed: boolean;
}

export interface R1FactorizedOracleResult {
  states: readonly R1StateRecord[];
  constraints: readonly R1OracleConstraintResult[];
  splitCounts: Readonly<
    Record<R1Split, { passed: number; total: number }>
  >;
}

/**
 * Ontology-design audit only.
 *
 * These primitive labels are authored oracle truth. They are not predictions
 * and must never be counted as model generalization evidence.
 */
export function evaluateFactorizedOracle(): R1FactorizedOracleResult {
  const suite = createFactorizedOracleCorpus();
  const byId = new Map(suite.states.map((state) => [state.id, state] as const));

  for (const state of suite.states) {
    // Forces every current corpus state through the reviewed annotation path.
    oracleSemanticPrimitives(state.id);
  }

  const constraints = suite.constraints.map((constraint) => {
    const left = requiredState(byId, constraint.leftStateId);
    const right = requiredState(byId, constraint.rightStateId);
    const leftScore = oracleAppraisalScores(left);
    const rightScore = oracleAppraisalScores(right);
    const margin =
      leftScore[constraint.dimension] - rightScore[constraint.dimension];
    const passed =
      constraint.relation === "greater"
        ? margin > 0
        : Math.abs(margin) <= 1e-12;

    return {
      ...constraint,
      margin,
      passed,
    };
  });

  const splitCounts = {
    train: splitCount(constraints, "train"),
    dev: splitCount(constraints, "dev"),
    test: splitCount(constraints, "test"),
    ood: splitCount(constraints, "ood"),
  };

  return {
    states: suite.states,
    constraints,
    splitCounts,
  };
}

export function createFactorizedOracleCorpus(): R1CounterfactualSuite {
  const base = createR1CounterfactualSuite();
  const semantic = createR1SemanticTrainingAugmentation();
  const pragmatic = createR1PragmaticTrainingAugmentation();
  const cognition = createR1CognitionTrainingAugmentation();
  const ood = createR1OodRedTeamSuite();

  return {
    states: [
      ...base.states,
      ...semantic.states,
      ...pragmatic.states,
      ...cognition.states,
      ...ood.states,
    ],
    constraints: [
      ...base.constraints,
      ...semantic.constraints,
      ...pragmatic.constraints,
      ...cognition.constraints,
      ...ood.constraints,
    ],
  };
}

export function oracleAppraisalScores(
  record: R1StateRecord,
): R1OracleAppraisalScores {
  const semantic = oracleSemanticPrimitives(record.id);
  const addressed = addressedToActor(record.state) ? 1 : 0;
  const kinematicRisk = actorPrivateKinematicRisk(record.state);

  const threat = semantic.dangerNow + kinematicRisk;
  const interrupt =
    threat +
    addressed * semantic.operativeDemandNow +
    semantic.urgencyNow;

  return {
    attention: addressed + threat,
    interrupt,
    social: addressed,
    threat,
    cognition: semantic.unresolvedInfoNow,
  };
}

export function oracleSemanticPrimitives(
  stateId: string,
): R1OracleSemanticPrimitives {
  const value: R1OracleSemanticPrimitives = {
    dangerNow: 0,
    operativeDemandNow: 0,
    urgencyNow: 0,
    unresolvedInfoNow: 0,
  };

  if (applyBaseStateOracle(stateId, value)) return value;

  if (DANGER_NOW.has(stateId)) value.dangerNow = 1;
  if (OPERATIVE_DEMAND_NOW.has(stateId)) value.operativeDemandNow = 1;
  if (URGENCY_NOW.has(stateId)) value.urgencyNow = 1;
  if (UNRESOLVED_INFO_NOW.has(stateId)) value.unresolvedInfoNow = 1;

  if (!REVIEWED_NON_BASE_IDS.has(stateId)) {
    throw new Error("unreviewed factorized-oracle state: " + stateId);
  }

  return value;
}

function applyBaseStateOracle(
  stateId: string,
  value: R1OracleSemanticPrimitives,
): boolean {
  const match = /^(train|dev|test):(.*)$/.exec(stateId);
  if (!match) return false;

  const suffix = match[2]!;
  switch (suffix) {
    case "addressed-request":
    case "overheard-request":
    case "warning-control-request":
    case "clear-instruction":
      value.operativeDemandNow = 1;
      return true;

    case "urgent-warning":
      value.dangerNow = 1;
      value.operativeDemandNow = 1;
      value.urgencyNow = 1;
      return true;

    case "ambiguous-instruction":
      value.operativeDemandNow = 1;
      value.unresolvedInfoNow = 1;
      return true;

    case "fast-close":
    case "ordinary-pass":
    case "epistemic-hidden":
    case "epistemic-control":
      return true;

    default:
      return false;
  }
}

function addressedToActor(state: ActorPrivateState): boolean {
  return state.percepts.some(
    (percept) => percept.kind === "speech" && percept.addressed,
  );
}

function actorPrivateKinematicRisk(state: ActorPrivateState): number {
  const visible = state.percepts.find(
    (percept) => percept.kind === "visible_actor",
  );
  if (!visible || visible.kind !== "visible_actor") return 0;
  return clamp(visible.approachSpeed / 250, 0, 1);
}

function splitCount(
  rows: readonly R1OracleConstraintResult[],
  split: R1Split,
): { passed: number; total: number } {
  const splitRows = rows.filter((row) => row.split === split);
  return {
    passed: splitRows.filter((row) => row.passed).length,
    total: splitRows.length,
  };
}

function requiredState(
  byId: ReadonlyMap<string, R1StateRecord>,
  id: string,
): R1StateRecord {
  const value = byId.get(id);
  if (!value) throw new Error("missing oracle state " + id);
  return value;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

const DANGER_NOW = new Set<string>([
  "train:pressure-active",
  "train:hoist-active",
  "train:circuit-unsafe",
  "train:injury-immediate",

  "ood:urgent-warning",
  "ood:indirect-live-warning",
  "ood:quoted-live-warning",
  "ood:negated-unsafe",
  "ood:v3-smoke-current",
  "ood:v3-hatch-unsafe",
  "ood:v3-immediate-hazard",
]);

const OPERATIVE_DEMAND_NOW = new Set<string>([
  "train:interlock-unresolved",
  "train:interlock-confirmed",
  "train:active-directive",
  "train:circuit-unsafe",
  "train:circuit-safe",
  "train:inspection-incomplete",
  "train:inspection-complete",
  "train:corridor-clearance-unknown",
  "train:corridor-clearance-known",
  "train:container-unidentified",
  "train:container-identified",

  "ood:addressed-request",
  "ood:overheard-request",
  "ood:urgent-warning",
  "ood:secured-beam-control",
  "ood:quoted-live-warning",
  "ood:negated-unsafe",
  "ood:negated-safe",
  "ood:seal-unconfirmed",
  "ood:seal-confirmed",
  "ood:clearance-unestablished",
  "ood:clearance-established",
  "ood:v3-smoke-current",
  "ood:v3-smoke-conditional",
  "ood:v3-current-order",
  "ood:v3-hatch-unsafe",
  "ood:v3-hatch-safe",
  "ood:v3-deadline-now",
  "ood:v3-destination-unknown",
  "ood:v3-destination-known",
]);

const URGENCY_NOW = new Set<string>([
  "train:injury-immediate",
  "train:filing-immediate",

  "ood:urgent-warning",
  "ood:quoted-live-warning",
  "ood:v3-smoke-current",
  "ood:v3-immediate-hazard",
  "ood:v3-immediate-deadline",
  "ood:v3-deadline-now",
]);

const UNRESOLVED_INFO_NOW = new Set<string>([
  "train:interlock-unresolved",
  "train:inspection-incomplete",
  "train:corridor-clearance-unknown",
  "train:container-unidentified",

  "ood:seal-unconfirmed",
  "ood:clearance-unestablished",
  "ood:v3-destination-unknown",
]);

const REVIEWED_NON_BASE_IDS = new Set<string>([
  // Semantic TRAIN breadth.
  "train:pressure-active",
  "train:pressure-resolved",
  "train:hoist-active",
  "train:hoist-resolved",
  "train:interlock-unresolved",
  "train:interlock-confirmed",

  // Pragmatic TRAIN breadth.
  "train:active-directive",
  "train:retired-directive",
  "train:circuit-unsafe",
  "train:circuit-safe",
  "train:injury-immediate",
  "train:filing-immediate",

  // Cognition TRAIN breadth.
  "train:inspection-incomplete",
  "train:inspection-complete",
  "train:corridor-clearance-unknown",
  "train:corridor-clearance-known",
  "train:container-unidentified",
  "train:container-identified",

  // OOD v2/v3.
  "ood:addressed-request",
  "ood:overheard-request",
  "ood:urgent-warning",
  "ood:secured-beam-control",
  "ood:indirect-live-warning",
  "ood:indirect-earlier-control",
  "ood:quoted-live-warning",
  "ood:quoted-old-drill",
  "ood:negated-unsafe",
  "ood:negated-safe",
  "ood:seal-unconfirmed",
  "ood:seal-confirmed",
  "ood:clearance-unestablished",
  "ood:clearance-established",
  "ood:v3-smoke-current",
  "ood:v3-smoke-conditional",
  "ood:v3-current-order",
  "ood:v3-archived-order",
  "ood:v3-hatch-unsafe",
  "ood:v3-hatch-safe",
  "ood:v3-immediate-hazard",
  "ood:v3-immediate-deadline",
  "ood:v3-deadline-now",
  "ood:v3-deadline-later",
  "ood:v3-destination-unknown",
  "ood:v3-destination-known",
  "ood:fast-close",
  "ood:ordinary-pass",
  "ood:hidden-danger",
  "ood:hidden-control",
]);
