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
  addConditionalHazard(states, constraints);
  addOperativeInstruction(states, constraints);
  addNegationScope(states, constraints);
  addUrgencyThreatDisentangle(states, constraints);
  addAdministrativeUrgency(states, constraints);
  addRoutingUncertainty(states, constraints);
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
      "ood:secured-beam-control",
      familyId,
      "Same token vocabulary encodes a secured beam and no need to stop work.",
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
      "ood:secured-beam-control",
      "the same binary token set changes meaning through negation placement: active fall risk vs secured beam",
      "An active fall risk should create more interruption pressure than an explicitly secured beam.",
    ),
    directional(
      "ood:warning-threat-over-danger-decoy",
      familyId,
      "threat",
      "ood:urgent-warning",
      "ood:secured-beam-control",
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
      "ood:indirect-earlier-control",
      familyId,
      "Same token vocabulary places the pin failure earlier and the locked hoist now.",
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
      "ood:indirect-warning-interrupt-over-earlier-control",
      familyId,
      "interrupt",
      "ood:indirect-live-warning",
      "ood:indirect-earlier-control",
      "identical binary token set; temporal roles of now/earlier swap current failure vs historical failure",
      "A support pin sliding out now should create more interruption pressure than the same failure described as earlier while the hoist is locked now.",
    ),
    directional(
      "ood:indirect-warning-threat-over-earlier-control",
      familyId,
      "threat",
      "ood:indirect-live-warning",
      "ood:indirect-earlier-control",
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
      "ood:seal-unconfirmed",
      familyId,
      "Seal prerequisite is unconfirmed and checking remains required.",
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
      "ood:seal-confirmed",
      familyId,
      "Seal prerequisite is confirmed and checking is not required.",
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
      "ood:seal-unconfirmed-cognition-over-confirmed",
      familyId,
      "cognition",
      "ood:seal-unconfirmed",
      "ood:seal-confirmed",
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
      "ood:clearance-unestablished",
      familyId,
      "Clearance prerequisite is not established and review remains required.",
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
      "ood:clearance-established",
      familyId,
      "Clearance prerequisite is established and review is not required.",
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
      "ood:clearance-unestablished-cognition-over-resolved",
      familyId,
      "cognition",
      "ood:clearance-unestablished",
      "ood:clearance-established",
      "identical binary token set; negation moves between established clearance and review requirement",
      "Unestablished clearance with review required should create more cognition pressure than established clearance with review not required.",
    ),
  );
}

function addConditionalHazard(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:v3-conditional-hazard";
  const common = { tick9PlayerX: 157, tick9PlayerVx: 3 } as const;

  states.push(
    state(
      "ood:v3-smoke-current",
      familyId,
      "Smoke is present now; the clearing condition is only later.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Smoke is present now; work stops. If smoke clears later, work resumes.",
        ...common,
        idSuffix: "ood-v3-smoke-current",
      }),
      10,
    ),
    state(
      "ood:v3-smoke-conditional",
      familyId,
      "Smoke is absent now and only conditional later.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "If smoke is present later, work stops; smoke clears now, work resumes.",
        ...common,
        idSuffix: "ood-v3-smoke-conditional",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:v3-current-smoke-interrupt-over-conditional",
      familyId,
      "interrupt",
      "ood:v3-smoke-current",
      "ood:v3-smoke-conditional",
      "identical binary token set; present/clears attach to now/later in opposite temporal roles",
      "A hazard present now should create more interruption pressure than the same hazard described only as a later condition while it clears now.",
    ),
    directional(
      "ood:v3-current-smoke-threat-over-conditional",
      familyId,
      "threat",
      "ood:v3-smoke-current",
      "ood:v3-smoke-conditional",
      "identical binary token set; present/clears attach to now/later in opposite temporal roles",
      "A hazard present now should create more threat pressure than the same hazard described only as a later condition while it clears now.",
    ),
  );
}

function addOperativeInstruction(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:v3-operative-instruction";
  const common = { tick9PlayerX: 157, tick9PlayerVx: 3 } as const;
  const command = '"Move crate seven outside."';

  states.push(
    state(
      "ood:v3-current-order",
      familyId,
      "The quoted command belongs to the current order.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Current order says " + command + " Archived note says obsolete.",
        ...common,
        idSuffix: "ood-v3-current-order",
      }),
      10,
    ),
    state(
      "ood:v3-archived-order",
      familyId,
      "The identical quoted command belongs only to the archived order.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Archived order says " + command + " Current note says obsolete.",
        ...common,
        idSuffix: "ood-v3-archived-order",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:v3-operative-order-interrupt-over-archived",
      familyId,
      "interrupt",
      "ood:v3-current-order",
      "ood:v3-archived-order",
      "identical binary token set and quoted command; current/archived roles swap",
      "A command belonging to the current order should create more interruption pressure than the identical command marked as archived and obsolete.",
    ),
  );
}

function addNegationScope(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:v3-negation-scope";
  const common = { tick9PlayerX: 157, tick9PlayerVx: 3 } as const;

  states.push(
    state(
      "ood:v3-hatch-unsafe",
      familyId,
      "Negation applies to sealing; entry remains unsafe.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The hatch is not sealed. Entry is unsafe. Proceed? Do not.",
        ...common,
        idSuffix: "ood-v3-hatch-unsafe",
      }),
      10,
    ),
    state(
      "ood:v3-hatch-safe",
      familyId,
      "Negation applies to unsafe; the hatch is sealed.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The hatch is sealed. Entry is not unsafe. Do proceed.",
        ...common,
        idSuffix: "ood-v3-hatch-safe",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:v3-negation-scope-interrupt-unsafe-over-safe",
      familyId,
      "interrupt",
      "ood:v3-hatch-unsafe",
      "ood:v3-hatch-safe",
      "identical binary token set; negation scope moves from sealed to unsafe",
      "An unsealed unsafe hatch should create more interruption pressure than a sealed hatch explicitly described as not unsafe.",
    ),
    directional(
      "ood:v3-negation-scope-threat-unsafe-over-safe",
      familyId,
      "threat",
      "ood:v3-hatch-unsafe",
      "ood:v3-hatch-safe",
      "identical binary token set; negation scope moves from sealed to unsafe",
      "An unsealed unsafe hatch should create more threat pressure than a sealed hatch explicitly described as not unsafe.",
    ),
  );
}

function addUrgencyThreatDisentangle(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:v3-urgency-threat-disentangle";
  const common = { tick9PlayerX: 157, tick9PlayerVx: 3 } as const;

  states.push(
    state(
      "ood:v3-immediate-hazard",
      familyId,
      "Immediate physical hazard; paperwork deadline is not immediate.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Hazard is immediate; deadline is not. Safety matters now; paperwork can wait.",
        ...common,
        idSuffix: "ood-v3-immediate-hazard",
      }),
      10,
    ),
    state(
      "ood:v3-immediate-deadline",
      familyId,
      "Immediate administrative deadline; physical hazard is explicitly absent.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Deadline is immediate; hazard is not. Paperwork matters now; safety can wait.",
        ...common,
        idSuffix: "ood-v3-immediate-deadline",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:v3-hazard-threat-over-deadline",
      familyId,
      "threat",
      "ood:v3-immediate-hazard",
      "ood:v3-immediate-deadline",
      "identical binary token set; immediacy moves between physical hazard and paperwork deadline",
      "Immediate physical hazard should create more threat pressure than equally immediate administrative paperwork.",
    ),
  );
}

function addAdministrativeUrgency(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:v3-administrative-urgency";
  const common = { tick9PlayerX: 157, tick9PlayerVx: 3 } as const;

  states.push(
    state(
      "ood:v3-deadline-now",
      familyId,
      "Non-hazard administrative deadline applies now.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Deadline is now; paperwork waits later? No, act now.",
        ...common,
        idSuffix: "ood-v3-deadline-now",
      }),
      10,
    ),
    state(
      "ood:v3-deadline-later",
      familyId,
      "The same administrative deadline applies later rather than now.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "Deadline is later; paperwork waits now? No, act later.",
        ...common,
        idSuffix: "ood-v3-deadline-later",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:v3-admin-now-interrupt-over-later",
      familyId,
      "interrupt",
      "ood:v3-deadline-now",
      "ood:v3-deadline-later",
      "identical binary token set; now/later attach to deadline and action in opposite temporal roles",
      "A non-hazard administrative deadline that applies now should create more interruption pressure than the same deadline deferred until later.",
    ),
  );
}

function addRoutingUncertainty(
  states: R1StateRecord[],
  constraints: R1CounterfactualConstraint[],
): void {
  const familyId = "ood:v3-routing-uncertainty";
  const common = { tick9PlayerX: 157, tick9PlayerVx: 3 } as const;

  states.push(
    state(
      "ood:v3-destination-unknown",
      familyId,
      "Routing destination is absent and must be determined.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The destination code is absent. Determine which depot receives this pallet before routing it.",
        ...common,
        idSuffix: "ood-v3-destination-unknown",
      }),
      10,
    ),
    state(
      "ood:v3-destination-known",
      familyId,
      "Routing destination is explicitly established.",
      createR0CounterfactualEpisode({
        speechExposure: "addressed",
        speechText:
          "The destination code names depot four. Route this pallet there.",
        ...common,
        idSuffix: "ood-v3-destination-known",
      }),
      10,
    ),
  );

  constraints.push(
    directional(
      "ood:v3-routing-unknown-cognition-over-known",
      familyId,
      "cognition",
      "ood:v3-destination-unknown",
      "ood:v3-destination-known",
      "routing destination changes from absent and requiring determination to explicitly established",
      "Missing destination evidence should create more deliberate-cognition pressure than an explicitly established routing destination.",
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
