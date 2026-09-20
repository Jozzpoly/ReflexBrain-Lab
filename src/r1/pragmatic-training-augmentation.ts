import { createR0CounterfactualEpisode } from "../episode";
import { compilePrivateState } from "../private-state";
import type {
  R1CounterfactualConstraint,
  R1CounterfactualSuite,
  R1StateRecord,
} from "./counterfactual-supervision";

const SPLIT = "train" as const;

/**
 * Independent pragmatic TRAIN breadth for OOD-v3 abstractions.
 *
 * These examples intentionally use different entities and wording from OOD v3.
 * They teach only:
 * - operative vs retired instruction;
 * - negation-scope safety meaning;
 * - physical threat vs equally immediate administrative urgency.
 *
 * Routing/cognition is deliberately untouched.
 */
export function createR1PragmaticTrainingAugmentation(): R1CounterfactualSuite {
  const states: R1StateRecord[] = [];
  const constraints: R1CounterfactualConstraint[] = [];

  addDirectiveCurrentness(states, constraints);
  addCircuitNegationScope(states, constraints);
  addInjuryVsFiling(states, constraints);

  assertReferences(states, constraints);
  return { states, constraints };
}

function addDirectiveCurrentness(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "train:pragmatic-directive-currentness";
  const common = { tick9PlayerX: 153, tick9PlayerVx: 4 } as const;
  const command = '"Close gate three."';

  states.push(
    state(
      "train:active-directive",
      familyId,
      "Quoted command belongs to the active directive.",
      "Active directive says " + command + " Retired memo says void.",
      common,
    ),
    state(
      "train:retired-directive",
      familyId,
      "The same quoted command belongs only to the retired directive.",
      "Retired directive says " + command + " Active memo says void.",
      common,
    ),
  );

  constraints.push(
    directional(
      "train:active-directive-interrupt-over-retired",
      familyId,
      "interrupt",
      "train:active-directive",
      "train:retired-directive",
      "identical binary token set and quoted command; active/retired roles swap",
      "A command in an active directive should create more interruption pressure than the identical command in a retired directive marked void.",
    ),
  );
}

function addCircuitNegationScope(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "train:pragmatic-negation-scope";
  const common = { tick9PlayerX: 153, tick9PlayerVx: 4 } as const;

  states.push(
    state(
      "train:circuit-unsafe",
      familyId,
      "Circuit is not isolated; contact is unsafe.",
      "The circuit is not isolated. Contact is unsafe. Touch? Do not.",
      common,
    ),
    state(
      "train:circuit-safe",
      familyId,
      "Circuit is isolated; contact is explicitly not unsafe.",
      "The circuit is isolated. Contact is not unsafe. Do touch.",
      common,
    ),
  );

  constraints.push(
    directional(
      "train:circuit-unsafe-interrupt-over-safe",
      familyId,
      "interrupt",
      "train:circuit-unsafe",
      "train:circuit-safe",
      "identical binary token set; negation scope moves from isolated to unsafe",
      "Unsafe contact with a non-isolated circuit should create more interruption pressure than safe contact with an isolated circuit.",
    ),
    directional(
      "train:circuit-unsafe-threat-over-safe",
      familyId,
      "threat",
      "train:circuit-unsafe",
      "train:circuit-safe",
      "identical binary token set; negation scope moves from isolated to unsafe",
      "Unsafe contact with a non-isolated circuit should create more threat pressure than safe contact with an isolated circuit.",
    ),
  );
}

function addInjuryVsFiling(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "train:pragmatic-threat-vs-urgency";
  const common = { tick9PlayerX: 153, tick9PlayerVx: 4 } as const;

  states.push(
    state(
      "train:injury-immediate",
      familyId,
      "Immediate injury risk while filing is not immediate.",
      "Injury is immediate; filing is not. Safety matters now; report can wait.",
      common,
    ),
    state(
      "train:filing-immediate",
      familyId,
      "Immediate filing deadline while injury risk is explicitly absent.",
      "Filing is immediate; injury is not. Report matters now; safety can wait.",
      common,
    ),
  );

  constraints.push(
    directional(
      "train:injury-threat-over-filing",
      familyId,
      "threat",
      "train:injury-immediate",
      "train:filing-immediate",
      "identical binary token set; immediacy moves between injury risk and filing deadline",
      "Immediate physical injury risk should create more threat pressure than equally immediate filing work.",
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
  if (!world) throw new Error("missing pragmatic TRAIN tick 10 for " + id);

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
  dimension: "interrupt" | "threat",
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
    throw new Error("duplicate pragmatic TRAIN state id");
  }

  for (const constraint of constraints) {
    if (!ids.has(constraint.leftStateId) || !ids.has(constraint.rightStateId)) {
      throw new Error(
        "pragmatic TRAIN augmentation references missing state: " +
          constraint.id,
      );
    }
  }
}
