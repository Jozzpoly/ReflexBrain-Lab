import { createR0CounterfactualEpisode } from "../episode";
import type { AppraisalId } from "../local-choice-probe";
import { compilePrivateState } from "../private-state";
import type {
  R1CounterfactualConstraint,
  R1CounterfactualSuite,
  R1StateRecord,
} from "./counterfactual-supervision";

const SPLIT = "ood" as const;

export function createR1OodRedTeamSuite(): R1CounterfactualSuite {
  const states: R1StateRecord[] = [];
  const constraints: R1CounterfactualConstraint[] = [];

  addAddressing(states, constraints);
  addDangerDecoy(states, constraints);
  addIndirectWarning(states, constraints);
  addQuotedWarning(states, constraints);
  addNegationWarning(states, constraints);
  addCognition(states, constraints);
  addResolvedUncertainty(states, constraints);
  addApproach(states, constraints);
  addHiddenDanger(states, constraints);

  assertReferences(states, constraints);
  return { states, constraints };
}

function addAddressing(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:request-addressing";
  const text = "Would you spare a moment for this parcel?";
  const common = { tick9PlayerX: 155, tick9PlayerVx: 5 } as const;

  states.push(
    state(
      "ood:addressed-request",
      familyId,
      "Novel directly addressed request.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText: text,
        ...common,
        idSuffix: "ood-addressed-request",
      }),
      10,
    ),
    state(
      "ood:overheard-request",
      familyId,
      "Same words and physics, but not addressed to this actor.",
      createR0CounterfactualEpisode({
        speechExposure: "overheard",
        speechText: text,
        ...common,
        idSuffix: "ood-overheard-request",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:addressed-social-over-overheard",
      familyId,
      "social",
      "ood:addressed-request",
      "ood:overheard-request",
      "only speech addressee changes",
      "Novel addressed speech should remain more socially relevant than the same overheard speech.",
    ),
    directional(
      "ood:addressed-attention-over-overheard",
      familyId,
      "attention",
      "ood:addressed-request",
      "ood:overheard-request",
      "only speech addressee changes",
      "Novel addressed speech should retain more attention pressure than the same overheard speech.",
    ),
  );
}

function addDangerDecoy(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:danger-decoy";
  const common = { tick9PlayerX: 155, tick9PlayerVx: 5 } as const;

  states.push(
    state(
      "ood:urgent-warning",
      familyId,
      "Novel direct warning of an actual immediate hazard.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The beam is not secured and can fall; work should stop.",
        ...common,
        idSuffix: "ood-urgent-warning",
      }),
      10,
    ),
    state(
      "ood:danger-word-reassurance",
      familyId,
      "Contains danger language but explicitly denies an immediate hazard.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The beam is secured and can not fall; work should not stop.",
        ...common,
        idSuffix: "ood-danger-word-reassurance",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:warning-interrupt-over-danger-decoy",
      familyId,
      "interrupt",
      "ood:urgent-warning",
      "ood:danger-word-reassurance",
      "the same binary token set changes meaning through negation placement: active fall risk vs secured beam",
      "An active fall risk should create more interruption pressure than an explicitly secured beam.",
    ),
    directional(
      "ood:warning-threat-over-danger-decoy",
      familyId,
      "threat",
      "ood:urgent-warning",
      "ood:danger-word-reassurance",
      "the same binary token set changes meaning through negation placement: active fall risk vs secured beam",
      "An active fall risk should create more threat pressure than an explicitly secured beam.",
    ),
  );
}

function addIndirectWarning(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:indirect-warning";
  const common = { tick9PlayerX: 155, tick9PlayerVx: 5 } as const;

  states.push(
    state(
      "ood:indirect-live-warning",
      familyId,
      "Indirect immediate warning without stock danger/run vocabulary.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The support pin is sliding out now; earlier the hoist was locked.",
        ...common,
        idSuffix: "ood-indirect-live-warning",
      }),
      10,
    ),
    state(
      "ood:indirect-maintenance-note",
      familyId,
      "Matched hazard vocabulary framed as non-current maintenance information.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The support pin was sliding out earlier; now the hoist is locked.",
        ...common,
        idSuffix: "ood-indirect-maintenance-note",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:indirect-warning-interrupt-over-maintenance",
      familyId,
      "interrupt",
      "ood:indirect-live-warning",
      "ood:indirect-maintenance-note",
      "identical binary token set; temporal roles of now/earlier swap current failure vs historical failure",
      "A support pin sliding out now should create more interruption pressure than the same failure described as earlier while the hoist is locked now.",
    ),
    directional(
      "ood:indirect-warning-threat-over-maintenance",
      familyId,
      "threat",
      "ood:indirect-live-warning",
      "ood:indirect-maintenance-note",
      "identical binary token set; temporal roles of now/earlier swap current failure vs historical failure",
      "A support pin sliding out now should create more threat pressure than the same failure described as earlier while the hoist is locked now.",
    ),
  );
}

function addQuotedWarning(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:quoted-warning";
  const common = { tick9PlayerX: 155, tick9PlayerVx: 5 } as const;
  const quote = '"RUN, THE CEILING IS FALLING!"';

  states.push(
    state(
      "ood:quoted-live-warning",
      familyId,
      "Quoted warning explicitly framed as current and addressed to us.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Dispatch notice: " + quote + " applies presently to this room.",
        ...common,
        idSuffix: "ood-quoted-live-warning",
      }),
      10,
    ),
    state(
      "ood:quoted-old-drill",
      familyId,
      "Same alarming quote framed as a finished historical drill.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Archive note: " +
          quote +
          " belonged to a completed rehearsal elsewhere.",
        ...common,
        idSuffix: "ood-quoted-old-drill",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:quoted-warning-interrupt-over-old-drill",
      familyId,
      "interrupt",
      "ood:quoted-live-warning",
      "ood:quoted-old-drill",
      "both contain the same alarming quote; only temporal/pragmatic framing changes",
      "A current quoted warning should create more interruption pressure than the identical quote inside a completed-drill report.",
    ),
    directional(
      "ood:quoted-warning-threat-over-old-drill",
      familyId,
      "threat",
      "ood:quoted-live-warning",
      "ood:quoted-old-drill",
      "both contain the same alarming quote; only temporal/pragmatic framing changes",
      "A current quoted warning should create more threat pressure than the identical quote inside a completed-drill report.",
    ),
  );
}

function addNegationWarning(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:negation-warning";
  const common = { tick9PlayerX: 155, tick9PlayerVx: 5 } as const;

  states.push(
    state(
      "ood:negated-unsafe",
      familyId,
      "Immediate unsafe statement and instruction to move.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The floor is not stable. Do not stay there; move away from it.",
        ...common,
        idSuffix: "ood-negated-unsafe",
      }),
      10,
    ),
    state(
      "ood:negated-safe",
      familyId,
      "Lexically similar reassurance whose negation reverses the hazard.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The floor is stable. There is no reason to move away; stay there.",
        ...common,
        idSuffix: "ood-negated-safe",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:negation-interrupt-unsafe-over-safe",
      familyId,
      "interrupt",
      "ood:negated-unsafe",
      "ood:negated-safe",
      "matched physical context and heavily overlapping lexical surface; negation reverses current safety meaning",
      "Unsafe meaning should create more interruption pressure than explicit reassurance.",
    ),
    directional(
      "ood:negation-threat-unsafe-over-safe",
      familyId,
      "threat",
      "ood:negated-unsafe",
      "ood:negated-safe",
      "matched physical context and heavily overlapping lexical surface; negation reverses current safety meaning",
      "Unsafe meaning should create more threat pressure than explicit reassurance.",
    ),
  );
}

function addCognition(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:cognition-ambiguity";
  const common = { tick9PlayerX: 155, tick9PlayerVx: 5 } as const;

  states.push(
    state(
      "ood:ambiguous-instruction",
      familyId,
      "Novel instruction whose prerequisite truth is unresolved.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The seal status is not confirmed; checking is required before moving.",
        ...common,
        idSuffix: "ood-ambiguous-instruction",
      }),
      10,
    ),
    state(
      "ood:clear-instruction",
      familyId,
      "Novel clear instruction under identical physics.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The seal status is confirmed; checking is not required before moving.",
        ...common,
        idSuffix: "ood-clear-instruction",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:ambiguous-cognition-over-clear",
      familyId,
      "cognition",
      "ood:ambiguous-instruction",
      "ood:clear-instruction",
      "identical binary token set; negation moves between confirmation and checking requirement",
      "An unconfirmed prerequisite with checking required should demand more deliberate cognition than a confirmed prerequisite with checking not required.",
    ),
  );
}

function addResolvedUncertainty(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:resolved-uncertainty";
  const common = { tick9PlayerX: 155, tick9PlayerVx: 5 } as const;

  states.push(
    state(
      "ood:live-uncertainty",
      familyId,
      "Current unresolved prerequisite.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Clearance is not established; review is required before access.",
        ...common,
        idSuffix: "ood-live-uncertainty",
      }),
      10,
    ),
    state(
      "ood:resolved-uncertainty-quote",
      familyId,
      "Uncertainty vocabulary appears only as an obsolete quoted note.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Clearance is established; review is not required before access.",
        ...common,
        idSuffix: "ood-resolved-uncertainty-quote",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:live-uncertainty-cognition-over-resolved",
      familyId,
      "cognition",
      "ood:live-uncertainty",
      "ood:resolved-uncertainty-quote",
      "identical binary token set; negation moves between established clearance and review requirement",
      "Unestablished clearance with review required should create more cognition pressure than established clearance with review not required.",
    ),
  );
}

function addApproach(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:approach-speed";

  states.push(
    state(
      "ood:fast-close",
      familyId,
      "Alternate silent fast closing trajectory.",
      createR0CounterfactualEpisode({
        speechExposure: "none",
        tick9PlayerX: 270,
        tick9PlayerVx: -230,
        idSuffix: "ood-fast-close",
      }),
      10,
    ),
    state(
      "ood:ordinary-pass",
      familyId,
      "Alternate silent nearby pass trajectory.",
      createR0CounterfactualEpisode({
        speechExposure: "none",
        tick9PlayerX: 135,
        tick9PlayerVx: 25,
        idSuffix: "ood-ordinary-pass",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:fast-close-threat-over-pass",
      familyId,
      "threat",
      "ood:fast-close",
      "ood:ordinary-pass",
      "alternate closing kinematics while speech remains absent",
      "A materially faster closing trajectory should increase threat appraisal over a pass-by.",
    ),
  );
}

function addHiddenDanger(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:hidden-danger-invariance";

  states.push(
    state(
      "ood:hidden-danger",
      familyId,
      "Urgent World-only speech outside the actor's sensory range.",
      createR0CounterfactualEpisode({
        speechExposure: "none",
        hiddenOpeningSpeech: true,
        hiddenSpeechTick: 0,
        hiddenSpeechText: "DANGER! Run now!",
        idSuffix: "ood-hidden-danger",
      }),
      0,
    ),
    state(
      "ood:hidden-control",
      familyId,
      "Matched control without the hidden urgent event.",
      createR0CounterfactualEpisode({
        speechExposure: "none",
        hiddenOpeningSpeech: false,
        idSuffix: "ood-hidden-control",
      }),
      0,
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
      id: "ood:hidden-danger-equal-" + dimension,
      familyId,
      split: SPLIT,
      dimension,
      relation: "equal",
      leftStateId: "ood:hidden-danger",
      rightStateId: "ood:hidden-control",
      strength: "hard_invariant",
      causalMutation:
        "urgent danger text exists only in World truth outside actor perception",
      rationale:
        "No semantic or structured channel may react to an unperceived urgent World event.",
    });
  }
}

function state(
  id: string,
  familyId: string,
  description: string,
  episode: ReturnType<typeof createR0CounterfactualEpisode>,
  tick: number,
): R1StateRecord {
  const world = episode.frames[tick];
  if (!world) throw new Error("missing OOD tick " + tick + " for " + id);
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
  if (ids.size !== states.length) throw new Error("duplicate OOD state id");

  for (const constraint of constraints) {
    if (!ids.has(constraint.leftStateId) || !ids.has(constraint.rightStateId)) {
      throw new Error("OOD constraint references missing state: " + constraint.id);
    }
  }
}
