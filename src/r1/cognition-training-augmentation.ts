import { createR0CounterfactualEpisode } from "../episode";
import { compilePrivateState } from "../private-state";
import type {
  R1CounterfactualConstraint,
  R1CounterfactualSuite,
  R1StateRecord,
} from "./counterfactual-supervision";

const SPLIT = "train" as const;

/**
 * Additional cognition-only supervision.
 *
 * OOD remains frozen. These scenarios use independent domains and phrasing.
 * One pair is deliberately same-token-bag to teach relational negation /
 * requirement structure; two use natural paraphrases to avoid reducing the
 * lesson to one syntactic template.
 */
export function createR1CognitionTrainingAugmentation(): R1CounterfactualSuite {
  const states: R1StateRecord[] = [];
  const constraints: R1CounterfactualConstraint[] = [];

  addInspectionStatus(states, constraints);
  addCorridorClearance(states, constraints);
  addContainerIdentity(states, constraints);

  assertReferences(states, constraints);
  return { states, constraints };
}

function addInspectionStatus(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "train:cognition-breadth-inspection";
  const unresolvedId = "train:inspection-incomplete";
  const resolvedId = "train:inspection-complete";
  const common = { tick9PlayerX: 156, tick9PlayerVx: 4 } as const;

  states.push(
    state(
      unresolvedId,
      familyId,
      "Inspection incomplete; verification still required.",
      "Inspection is not complete; verification is required before startup.",
      common,
    ),
    state(
      resolvedId,
      familyId,
      "Inspection complete; no further verification required.",
      "Inspection is complete; verification is not required before startup.",
      common,
    ),
  );

  constraints.push(
    cognition(
      "train:inspection-incomplete-cognition-over-complete",
      familyId,
      unresolvedId,
      resolvedId,
      "same binary token set; negation moves between completion and verification requirement",
      "Incomplete inspection with verification required should demand more deliberation than completed inspection with no further verification required.",
    ),
  );
}

function addCorridorClearance(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "train:cognition-breadth-corridor";
  const unresolvedId = "train:corridor-clearance-unknown";
  const resolvedId = "train:corridor-clearance-known";
  const common = { tick9PlayerX: 164, tick9PlayerVx: -7 } as const;

  states.push(
    state(
      unresolvedId,
      familyId,
      "Control has not established corridor clearance.",
      "Control has not confirmed whether corridor C is cleared. Contact them before entering.",
      common,
    ),
    state(
      resolvedId,
      familyId,
      "Control has positively established corridor clearance.",
      "Control confirmed corridor C is clear. Entry may proceed.",
      common,
    ),
  );

  constraints.push(
    cognition(
      "train:corridor-unknown-cognition-over-known",
      familyId,
      unresolvedId,
      resolvedId,
      "corridor clearance changes from unresolved to explicitly established",
      "Unknown clearance requiring contact should demand more deliberation than confirmed clearance.",
    ),
  );
}

function addContainerIdentity(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "train:cognition-breadth-container";
  const unresolvedId = "train:container-unidentified";
  const resolvedId = "train:container-identified";
  const common = { tick9PlayerX: 148, tick9PlayerVx: 6 } as const;

  states.push(
    state(
      unresolvedId,
      familyId,
      "Material identity remains unknown before an irreversible operation.",
      "The container contents are unidentified. Determine what it holds before heating it.",
      common,
    ),
    state(
      resolvedId,
      familyId,
      "Material identity is established before the same operation.",
      "The container is confirmed to hold water. Heating may proceed.",
      common,
    ),
  );

  constraints.push(
    cognition(
      "train:container-unidentified-cognition-over-identified",
      familyId,
      unresolvedId,
      resolvedId,
      "material identity changes from unknown to confirmed before heating",
      "Unknown material identity before heating should demand more deliberation than confirmed benign contents.",
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
  if (!world) throw new Error("missing cognition TRAIN tick 10 for " + id);

  return {
    id,
    familyId,
    split: SPLIT,
    description,
    state: compilePrivateState(world, "task"),
  };
}

function cognition(
  id: string,
  familyId: string,
  leftStateId: string,
  rightStateId: string,
  causalMutation: string,
  rationale: string,
): R1CounterfactualConstraint {
  return {
    id,
    familyId,
    split: SPLIT,
    dimension: "cognition",
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
    throw new Error("duplicate cognition TRAIN augmentation state id");
  }
  for (const constraint of constraints) {
    if (!ids.has(constraint.leftStateId) || !ids.has(constraint.rightStateId)) {
      throw new Error(
        "cognition TRAIN augmentation references missing state: " +
          constraint.id,
      );
    }
  }
}
