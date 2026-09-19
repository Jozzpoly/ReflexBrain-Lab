import type { ActorPrivateState } from "../contracts";
import { createSemanticChallenges } from "../challenges";
import { createR0CounterfactualEpisode } from "../episode";
import type { AppraisalId } from "../local-choice-probe";
import { compilePrivateState } from "../private-state";

export type R1Relation = "greater" | "equal";
export type R1ConstraintStrength = "hard_invariant" | "directional";

export interface R1StateRecord {
  id: string;
  familyId: string;
  description: string;
  state: ActorPrivateState;
}

export interface R1CounterfactualConstraint {
  id: string;
  familyId: string;
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

/**
 * R1 seed supervision is intentionally relational.
 *
 * It does not invent absolute "gold probabilities". It records only causal
 * comparisons we are willing to defend before any learned model exists.
 */
export function createR1CounterfactualSuite(): R1CounterfactualSuite {
  const challengeStates = new Map(
    createSemanticChallenges().map((challenge) => [
      challenge.id,
      compilePrivateState(challenge.episode.frames[10]!, "task"),
    ]),
  );

  const quiet = createR0CounterfactualEpisode({
    speechExposure: "none",
    hiddenOpeningSpeech: false,
    idSuffix: "r1-epistemic-control",
  });
  const hidden = createR0CounterfactualEpisode({
    speechExposure: "none",
    hiddenOpeningSpeech: true,
    idSuffix: "r1-epistemic-hidden",
  });

  const states: R1StateRecord[] = [
    stateRecord(
      "silent-pass",
      "pass-by",
      "Nearby player passes silently while actor continues its own task.",
      required(challengeStates, "silent-pass"),
    ),
    stateRecord(
      "addressed-request",
      "request-addressing",
      "Player directly asks the actor for help.",
      required(challengeStates, "addressed-request"),
    ),
    stateRecord(
      "overheard-request",
      "request-addressing",
      "Identical request is overheard rather than addressed to the actor.",
      required(challengeStates, "overheard-request"),
    ),
    stateRecord(
      "urgent-warning",
      "warning-vs-quiet",
      "Player directly gives an urgent warning to move away.",
      required(challengeStates, "urgent-warning"),
    ),
    stateRecord(
      "fast-close",
      "approach-speed",
      "Player closes distance rapidly without speaking.",
      required(challengeStates, "fast-close"),
    ),
    stateRecord(
      "epistemic-control",
      "hidden-world-invariance",
      "No hidden opening event exists.",
      compilePrivateState(quiet.frames[0]!, "task"),
    ),
    stateRecord(
      "epistemic-hidden",
      "hidden-world-invariance",
      "A hidden World event exists outside current actor perception.",
      compilePrivateState(hidden.frames[0]!, "task"),
    ),
  ];

  const constraints: R1CounterfactualConstraint[] = [
    directional(
      "addressed-social-over-overheard",
      "request-addressing",
      "social",
      "addressed-request",
      "overheard-request",
      "speech addressee flips from other/none to this actor",
      "Identical words addressed to the actor should be more socially relevant than merely overheard words.",
    ),
    directional(
      "addressed-attention-over-overheard",
      "request-addressing",
      "attention",
      "addressed-request",
      "overheard-request",
      "speech addressee flips from other/none to this actor",
      "Directly addressed speech should create more attention pressure than the same overheard speech.",
    ),
    directional(
      "fast-close-threat-over-pass",
      "approach-speed",
      "threat",
      "fast-close",
      "silent-pass",
      "approach speed increases by more than 100 world-units/s with no speech mutation",
      "Rapid closing motion should increase immediate threat appraisal relative to an ordinary silent pass.",
    ),
    directional(
      "warning-attention-over-pass",
      "warning-vs-quiet",
      "attention",
      "urgent-warning",
      "silent-pass",
      "direct urgent warning replaces silence",
      "An addressed urgent warning should demand more attention than a silent nearby pass.",
    ),
    directional(
      "warning-interrupt-over-pass",
      "warning-vs-quiet",
      "interrupt",
      "urgent-warning",
      "silent-pass",
      "direct urgent warning replaces silence",
      "An urgent warning should exert more interruption pressure than a silent pass-by.",
    ),
    directional(
      "warning-cognition-over-pass",
      "warning-vs-quiet",
      "cognition",
      "urgent-warning",
      "silent-pass",
      "direct urgent warning replaces silence",
      "An urgent warning should create more pressure for deliberate reconsideration than a silent pass-by.",
    ),
    ...(["attention", "interrupt", "social", "threat", "cognition"] as const).map(
      (dimension): R1CounterfactualConstraint => ({
        id: "hidden-world-equal-" + dimension,
        familyId: "hidden-world-invariance",
        dimension,
        relation: "equal",
        leftStateId: "epistemic-hidden",
        rightStateId: "epistemic-control",
        strength: "hard_invariant",
        causalMutation:
          "World-only hidden event added outside actor sensory range; actor-private state remains byte-equivalent",
        rationale:
          "A semantic reflex must not respond to World facts the actor cannot perceive or legitimately know.",
      }),
    ),
  ];

  return { states, constraints };
}

function stateRecord(
  id: string,
  familyId: string,
  description: string,
  state: ActorPrivateState,
): R1StateRecord {
  return {
    id,
    familyId,
    description,
    state: structuredClone(state),
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
    dimension,
    relation: "greater",
    leftStateId,
    rightStateId,
    strength: "directional",
    causalMutation,
    rationale,
  };
}

function required(
  states: ReadonlyMap<string, ActorPrivateState>,
  id: string,
): ActorPrivateState {
  const state = states.get(id);
  if (!state) throw new Error("missing semantic challenge state " + id);
  return state;
}
