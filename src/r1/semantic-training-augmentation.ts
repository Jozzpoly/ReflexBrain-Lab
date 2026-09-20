import { createR0CounterfactualEpisode } from "../episode";
import type { AppraisalId } from "../local-choice-probe";
import { compilePrivateState } from "../private-state";
import type {
  R1CounterfactualConstraint,
  R1CounterfactualSuite,
  R1StateRecord,
} from "./counterfactual-supervision";

const SPLIT = "train" as const;

/**
 * Independent semantic supervision expansion.
 *
 * These families intentionally avoid the frozen OOD quoted-warning surface.
 * They teach current-vs-resolved hazard semantics and current uncertainty
 * without copying "radio", "drill", "yesterday" or the alarming OOD quote.
 */
export function createR1SemanticTrainingAugmentation(): R1CounterfactualSuite {
  const states: R1StateRecord[] = [];
  const constraints: R1CounterfactualConstraint[] = [];

  addPressureHazard(states, constraints);
  addHoistHazard(states, constraints);
  addInterlockUncertainty(states, constraints);

  assertReferences(states, constraints);
  return { states, constraints };
}

function addPressureHazard(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "train:semantic-breadth-pressure";
  const currentId = "train:pressure-active";
  const resolvedId = "train:pressure-resolved";
  const common = { tick9PlayerX: 158, tick9PlayerVx: -5 } as const;

  states.push(
    state(
      currentId,
      familyId,
      "Current pressure-line failure.",
      "A pressure hose beside you has ruptured and fluid is spraying across the walkway.",
      common,
    ),
    state(
      resolvedId,
      familyId,
      "Previously damaged pressure line explicitly repaired and inspected.",
      "The damaged pressure hose was replaced before this shift and the line passed inspection.",
      common,
    ),
  );

  constraints.push(
    directional(
      "train:pressure-active-interrupt-over-resolved",
      familyId,
      "interrupt",
      currentId,
      resolvedId,
      "current rupture vs previously repaired fault under identical physics/addressee",
      "An active nearby failure should create more interruption pressure than an already repaired fault.",
    ),
    directional(
      "train:pressure-active-threat-over-resolved",
      familyId,
      "threat",
      currentId,
      resolvedId,
      "current rupture vs previously repaired fault under identical physics/addressee",
      "An active nearby failure should create more threat pressure than an already repaired fault.",
    ),
  );
}

function addHoistHazard(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "train:semantic-breadth-hoist";
  const currentId = "train:hoist-active";
  const resolvedId = "train:hoist-resolved";
  const common = { tick9PlayerX: 152, tick9PlayerVx: 8 } as const;

  states.push(
    state(
      currentId,
      familyId,
      "Current uncontrolled suspended-load movement.",
      "The suspended load is descending without control above the work area.",
      common,
    ),
    state(
      resolvedId,
      familyId,
      "Previously observed descent fault explicitly serviced and load-tested.",
      "The descent fault was corrected during service and the hoist passed its load test.",
      common,
    ),
  );

  constraints.push(
    directional(
      "train:hoist-active-interrupt-over-resolved",
      familyId,
      "interrupt",
      currentId,
      resolvedId,
      "active uncontrolled descent vs serviced historical fault under identical physics/addressee",
      "An active uncontrolled load should create more interruption pressure than a repaired historical fault.",
    ),
    directional(
      "train:hoist-active-threat-over-resolved",
      familyId,
      "threat",
      currentId,
      resolvedId,
      "active uncontrolled descent vs serviced historical fault under identical physics/addressee",
      "An active uncontrolled load should create more threat pressure than a repaired historical fault.",
    ),
  );
}

function addInterlockUncertainty(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "train:semantic-breadth-interlock";
  const unresolvedId = "train:interlock-unresolved";
  const confirmedId = "train:interlock-confirmed";
  const common = { tick9PlayerX: 162, tick9PlayerVx: -6 } as const;

  states.push(
    state(
      unresolvedId,
      familyId,
      "Current prerequisite remains unestablished.",
      "The interlock condition has not been established; determine it before releasing the latch.",
      common,
    ),
    state(
      confirmedId,
      familyId,
      "Prerequisite was independently confirmed before the current instruction.",
      "The interlock condition was confirmed during setup; release the latch.",
      common,
    ),
  );

  constraints.push(
    directional(
      "train:interlock-unresolved-cognition-over-confirmed",
      familyId,
      "cognition",
      unresolvedId,
      confirmedId,
      "same instruction context; prerequisite changes from unknown to already confirmed",
      "An unresolved prerequisite should create more deliberate-cognition pressure than one already confirmed.",
    ),
  );
}

function state(
  id: string,
  familyId: string,
  description: string,
  speechText: string,
  common: { tick9PlayerX: number; tick9PlayerVx: number },
): R1StateRecord {
  const episode = createR0CounterfactualEpisode({
    speechExposure: "addressed",
    speechText,
    ...common,
    idSuffix: id,
  });
  const world = episode.frames[10];
  if (!world) throw new Error("missing TRAIN augmentation tick 10 for " + id);

  return {
    id,
    familyId,
    split: SPLIT,
    description,
    state: compilePrivateState(world, "task"),
  };
}

function directional(
  id: string,
  familyId: string,
  dimension: AppraisalId,
  leftStateId: string,
  rightStateId: string,
  causalMutation: string,
  rationale: string,
): R1CounterfactualConstraint {
  return {
    id,
    familyId,
    split: SPLIT,
    dimension,
    relation: "greater",
    leftStateId,
    rightStateId,
    strength: "directional",
    causalMutation,
    rationale,
  };
}

function assertReferences(
  states: readonly R1StateRecord[],
  constraints: readonly R1CounterfactualConstraint[],
): void {
  const ids = new Set(states.map((state) => state.id));
  if (ids.size !== states.length) {
    throw new Error("duplicate semantic-training augmentation state id");
  }
  for (const constraint of constraints) {
    if (!ids.has(constraint.leftStateId) || !ids.has(constraint.rightStateId)) {
      throw new Error(
        "semantic-training augmentation references missing state: " +
          constraint.id,
      );
    }
  }
}
