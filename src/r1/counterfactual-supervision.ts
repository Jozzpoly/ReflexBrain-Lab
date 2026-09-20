import type { ActorPrivateState } from "../contracts";
import { createR0CounterfactualEpisode } from "../episode";
import type { AppraisalId } from "../local-choice-probe";
import { compilePrivateState } from "../private-state";

export type R1Relation = "greater" | "equal";
export type R1ConstraintStrength = "hard_invariant" | "directional";
export type R1Split = "train" | "dev" | "test";

export interface R1StateRecord {
  id: string;
  familyId: string;
  split: R1Split;
  description: string;
  state: ActorPrivateState;
}

export interface R1CounterfactualConstraint {
  id: string;
  familyId: string;
  split: R1Split;
  dimension: AppraisalId;
  relation: R1Relation;
  leftStateId: string;
  rightStateId: string;
  strength: R1ConstraintStrength;
  causalMutation: string;
  rationale: string;
}

export interface R1CounterfactualSuite {
  states: readonly R1StateRecord[];
  constraints: readonly R1CounterfactualConstraint[];
}

interface SplitRecipe {
  split: R1Split;
  requestText: string;
  warningText: string;
  speechX: number;
  speechVx: number;
  passX: number;
  passVx: number;
  fastX: number;
  fastVx: number;
  hiddenTick: number;
}

const RECIPES: readonly SplitRecipe[] = [
  {
    split: "train",
    requestText: "Please help with these crates.",
    warningText: "Watch out! Move away now!",
    speechX: 150,
    speechVx: 0,
    passX: 150,
    passVx: 0,
    fastX: 240,
    fastVx: -180,
    hiddenTick: 0,
  },
  {
    split: "dev",
    requestText: "Could you lend a hand here?",
    warningText: "Careful! Get back before impact!",
    speechX: 165,
    speechVx: -10,
    passX: 160,
    passVx: -20,
    fastX: 250,
    fastVx: -200,
    hiddenTick: 1,
  },
  {
    split: "test",
    requestText: "Kindly assist briefly.",
    warningText: "Incoming! Clear the area!",
    speechX: 145,
    speechVx: 10,
    passX: 140,
    passVx: 20,
    fastX: 235,
    fastVx: -170,
    hiddenTick: 2,
  },
];

/**
 * R1 supervision is relational by construction.
 *
 * No absolute semantic score is invented here. Every learned target is either:
 * - a directional causal comparison; or
 * - a hard epistemic equality for actor-indistinguishable states.
 *
 * Families never cross train/dev/test. Text and physical context are also
 * mutated across splits so exact private states cannot leak between them.
 */
export function createR1CounterfactualSuite(): R1CounterfactualSuite {
  const states: R1StateRecord[] = [];
  const constraints: R1CounterfactualConstraint[] = [];

  for (const recipe of RECIPES) {
    addRequestFamily(recipe, states, constraints);
    addWarningFamily(recipe, states, constraints);
    addApproachFamily(recipe, states, constraints);
    addHiddenWorldFamily(recipe, states, constraints);
  }

  assertSuiteReferences(states, constraints);
  return { states, constraints };
}

function addRequestFamily(
  recipe: SplitRecipe,
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = recipe.split + ":request-addressing";
  const addressedId = recipe.split + ":addressed-request";
  const overheardId = recipe.split + ":overheard-request";

  states.push(
    stateFromEpisode(
      addressedId,
      familyId,
      recipe.split,
      "Direct request with split-specific wording and physical context.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText: recipe.requestText,
        tick9PlayerX: recipe.speechX,
        tick9PlayerVx: recipe.speechVx,
        idSuffix: addressedId,
      }),
      10,
    ),
    stateFromEpisode(
      overheardId,
      familyId,
      recipe.split,
      "Identical words and physics, but the request is overheard.",
      createR0CounterfactualEpisode({
        speechExposure: "overheard",
        speechText: recipe.requestText,
        tick9PlayerX: recipe.speechX,
        tick9PlayerVx: recipe.speechVx,
        idSuffix: overheardId,
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      recipe.split + ":addressed-social-over-overheard",
      familyId,
      recipe.split,
      "social",
      addressedId,
      overheardId,
      "only speech addressee changes from not-this-actor to this actor",
      "Identical words addressed to the actor should be more socially relevant than merely overheard words.",
    ),
    directional(
      recipe.split + ":addressed-attention-over-overheard",
      familyId,
      recipe.split,
      "attention",
      addressedId,
      overheardId,
      "only speech addressee changes from not-this-actor to this actor",
      "Directly addressed speech should create more attention pressure than the same overheard speech.",
    ),
  );
}

function addWarningFamily(
  recipe: SplitRecipe,
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = recipe.split + ":warning-semantics";
  const warningId = recipe.split + ":urgent-warning";
  const requestId = recipe.split + ":warning-control-request";

  const common = {
    tick9PlayerX: recipe.speechX,
    tick9PlayerVx: recipe.speechVx,
  } as const;

  states.push(
    stateFromEpisode(
      warningId,
      familyId,
      recipe.split,
      "Direct urgent warning.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText: recipe.warningText,
        ...common,
        idSuffix: warningId,
      }),
      10,
    ),
    stateFromEpisode(
      requestId,
      familyId,
      recipe.split,
      "Direct non-urgent request under identical physics and addressee.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText: recipe.requestText,
        ...common,
        idSuffix: requestId,
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      recipe.split + ":warning-interrupt-over-request",
      familyId,
      recipe.split,
      "interrupt",
      warningId,
      requestId,
      "speech meaning changes from ordinary request to urgent danger warning; physics and addressee stay fixed",
      "Urgent danger language should create more interruption pressure than an ordinary addressed request.",
    ),
    directional(
      recipe.split + ":warning-threat-over-request",
      familyId,
      recipe.split,
      "threat",
      warningId,
      requestId,
      "speech meaning changes from ordinary request to urgent danger warning; physics and addressee stay fixed",
      "Urgent danger language should increase immediate threat appraisal over an ordinary addressed request.",
    ),
    directional(
      recipe.split + ":warning-cognition-over-request",
      familyId,
      recipe.split,
      "cognition",
      warningId,
      requestId,
      "speech meaning changes from ordinary request to urgent danger warning; physics and addressee stay fixed",
      "Urgent danger language should create more pressure for deliberate reconsideration than an ordinary request.",
    ),
  );
}

function addApproachFamily(
  recipe: SplitRecipe,
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = recipe.split + ":approach-speed";
  const fastId = recipe.split + ":fast-close";
  const passId = recipe.split + ":ordinary-pass";

  states.push(
    stateFromEpisode(
      fastId,
      familyId,
      recipe.split,
      "Silent fast closing approach.",
      createR0CounterfactualEpisode({
        speechExposure: "none",
        tick9PlayerX: recipe.fastX,
        tick9PlayerVx: recipe.fastVx,
        idSuffix: fastId,
      }),
      10,
    ),
    stateFromEpisode(
      passId,
      familyId,
      recipe.split,
      "Silent ordinary nearby pass.",
      createR0CounterfactualEpisode({
        speechExposure: "none",
        tick9PlayerX: recipe.passX,
        tick9PlayerVx: recipe.passVx,
        idSuffix: passId,
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      recipe.split + ":fast-close-threat-over-pass",
      familyId,
      recipe.split,
      "threat",
      fastId,
      passId,
      "closing speed changes materially while speech remains absent",
      "Rapid closing motion should increase immediate threat appraisal relative to an ordinary silent pass.",
    ),
  );
}

function addHiddenWorldFamily(
  recipe: SplitRecipe,
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = recipe.split + ":hidden-world-invariance";
  const hiddenId = recipe.split + ":epistemic-hidden";
  const controlId = recipe.split + ":epistemic-control";

  const control = createR0CounterfactualEpisode({
    speechExposure: "none",
    hiddenOpeningSpeech: false,
    idSuffix: controlId,
  });
  const hidden = createR0CounterfactualEpisode({
    speechExposure: "none",
    hiddenOpeningSpeech: true,
    hiddenSpeechTick: recipe.hiddenTick,
    idSuffix: hiddenId,
  });

  states.push(
    stateFromEpisode(
      hiddenId,
      familyId,
      recipe.split,
      "World-only hidden event outside current actor sensory range.",
      hidden,
      recipe.hiddenTick,
    ),
    stateFromEpisode(
      controlId,
      familyId,
      recipe.split,
      "Matched control without the hidden World-only event.",
      control,
      recipe.hiddenTick,
    ),
  );

  for (const dimension of [
    "attention",
    "interrupt",
    "social",
    "threat",
    "cognition",
  ] as const) {
    constraints.push({
      id: recipe.split + ":hidden-world-equal-" + dimension,
      familyId,
      split: recipe.split,
      dimension,
      relation: "equal",
      leftStateId: hiddenId,
      rightStateId: controlId,
      strength: "hard_invariant",
      causalMutation:
        "World-only hidden event differs; actor-private state must remain identical",
      rationale:
        "A semantic reflex must not respond to facts the actor cannot perceive or legitimately know.",
    });
  }
}

function stateFromEpisode(
  id: string,
  familyId: string,
  split: R1Split,
  description: string,
  episode: ReturnType<typeof createR0CounterfactualEpisode>,
  tick: number,
): R1StateRecord {
  const world = episode.frames[tick];
  if (!world) throw new Error("missing episode tick " + tick + " for " + id);
  return {
    id,
    familyId,
    split,
    description,
    state: compilePrivateState(world, "task"),
  };
}

function directional(
  id: string,
  familyId: string,
  split: R1Split,
  dimension: AppraisalId,
  leftStateId: string,
  rightStateId: string,
  causalMutation: string,
  rationale: string,
): R1CounterfactualConstraint {
  return {
    id,
    familyId,
    split,
    dimension,
    relation: "greater",
    leftStateId,
    rightStateId,
    strength: "directional",
    causalMutation,
    rationale,
  };
}

function assertSuiteReferences(
  states: readonly R1StateRecord[],
  constraints: readonly R1CounterfactualConstraint[],
): void {
  const ids = new Set(states.map((state) => state.id));
  if (ids.size !== states.length) {
    throw new Error("duplicate R1 state id");
  }

  for (const constraint of constraints) {
    if (!ids.has(constraint.leftStateId) || !ids.has(constraint.rightStateId)) {
      throw new Error("R1 constraint references missing state: " + constraint.id);
    }
    const left = states.find((state) => state.id === constraint.leftStateId)!;
    const right = states.find((state) => state.id === constraint.rightStateId)!;
    if (
      left.split !== constraint.split ||
      right.split !== constraint.split ||
      left.familyId !== constraint.familyId ||
      right.familyId !== constraint.familyId
    ) {
      throw new Error("R1 constraint crosses split/family boundary: " + constraint.id);
    }
  }
}
