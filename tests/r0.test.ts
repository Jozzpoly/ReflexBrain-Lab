import { describe, expect, it } from "vitest";
import type { ActorPrivateState, ReflexProvider } from "../src/contracts";
import {
  createLowStakesAddressEpisode,
  createR0CounterfactualEpisode,
} from "../src/episode";
import { compilePrivateState } from "../src/private-state";
import {
  initialReflexDynamicsState,
  stepReflexDynamics,
} from "../src/reflex-dynamics";
import { RuleBaselineProvider } from "../src/rule-provider";
import { evaluateProvidersSameState } from "../src/semantic-probe";
import { createSemanticChallenges } from "../src/challenges";
import {
  actionFromChoiceToken,
  analyzeChoiceScores,
  APPRAISAL_SPECS,
  BIPOLAR_APPRAISAL_SPECS,
  buildAppraisalPrompt,
  buildBipolarAppraisalPrompt,
  buildImmediateResponsePrompt,
  buildSemanticResponsePrompt,
  chooseLocalQwenDtype,
  getImmediateResponseOptions,
  getLocalModelBackend,
  PERMUTATION_SWEEP_ORDERS,
  probabilityPositiveFromScores,
  probabilityYesFromScores,
  SEMANTIC_TOKEN_SPECS,
  semanticActionFromToken,
  isLocalModelBackendId,
} from "../src/local-choice-probe";
import { runShadowEpisode } from "../src/shadow-runner";

describe("R0 semantic shadow apparatus", () => {
  it("keeps shadow evaluation non-interfering with the World trace", async () => {
    const episode = createLowStakesAddressEpisode();
    const before = JSON.stringify(episode.frames);

    await runShadowEpisode(episode.frames, new RuleBaselineProvider());

    expect(JSON.stringify(episode.frames)).toBe(before);
  });

  it("isolates provider mutations behind a cloned private-state boundary", async () => {
    const episode = createLowStakesAddressEpisode();
    const malicious: ReflexProvider = {
      id: "mutator",
      evaluate(state: ActorPrivateState) {
        state.self.taskProgress = 999;
        return new RuleBaselineProvider().evaluate(state);
      },
    };

    await runShadowEpisode(episode.frames, malicious);

    expect(episode.frames[0]!.taskProgress).toBeLessThan(1);
  });

  it("raises attention/social pressure without automatic task abandonment", async () => {
    const episode = createLowStakesAddressEpisode();
    const trace = await runShadowEpisode(
      episode.frames,
      new RuleBaselineProvider(),
    );
    const speechFrame = trace.find((frame) =>
      frame.privateState.percepts.some((percept) => percept.kind === "speech"),
    );

    expect(speechFrame).toBeDefined();
    expect(speechFrame!.provider.scores.attentionPlayer).toBeGreaterThan(0.7);
    expect(speechFrame!.provider.scores.socialRelevance).toBeGreaterThan(0.7);
    expect(speechFrame!.provider.scores.interruptCurrent).toBeLessThan(0.6);
    expect(speechFrame!.provider.actions.continue).toBeGreaterThan(
      speechFrame!.provider.actions.withdraw,
    );
  });

  it("adds temporal persistence instead of mirroring a one-frame drop", () => {
    const provider = new RuleBaselineProvider();
    const addressed: ActorPrivateState = {
      tick: 1,
      self: {
        id: "resident:jan",
        currentTask: "sort_crates",
        taskProgress: 0.2,
        taskUrgency: 0.55,
      },
      percepts: [
        {
          kind: "visible_actor",
          actorId: "player",
          distanceBand: "near",
          approachSpeed: 0,
          relativeBearingRadians: 0,
        },
        {
          kind: "speech",
          sourceActorId: "player",
          addressed: true,
          text: "Hey",
        },
      ],
      recentFocus: "task",
    };
    const quiet: ActorPrivateState = {
      ...addressed,
      tick: 2,
      percepts: [],
    };

    const high = stepReflexDynamics(
      initialReflexDynamicsState(),
      provider.evaluate(addressed),
    );
    const afterDrop = stepReflexDynamics(high, provider.evaluate(quiet));

    expect(afterDrop.scores.attentionPlayer).toBeGreaterThan(
      provider.evaluate(quiet).scores.attentionPlayer,
    );
  });
});

describe("R0 first counterfactual family", () => {
  it("changes social/interruption pressure when identical words are addressed vs overheard", async () => {
    const provider = new RuleBaselineProvider();
    const addressed = await runShadowEpisode(
      createR0CounterfactualEpisode({ speechExposure: "addressed" }).frames,
      provider,
    );
    const overheard = await runShadowEpisode(
      createR0CounterfactualEpisode({ speechExposure: "overheard" }).frames,
      provider,
    );

    const addressedFrame = addressed.find((frame) => frame.tick === 10)!;
    const overheardFrame = overheard.find((frame) => frame.tick === 10)!;

    expect(addressedFrame.privateState.percepts).toContainEqual(
      expect.objectContaining({ kind: "speech", addressed: true }),
    );
    expect(overheardFrame.privateState.percepts).toContainEqual(
      expect.objectContaining({ kind: "speech", addressed: false }),
    );
    expect(addressedFrame.provider.scores.socialRelevance).toBeGreaterThan(
      overheardFrame.provider.scores.socialRelevance,
    );
    expect(addressedFrame.provider.scores.interruptCurrent).toBeGreaterThan(
      overheardFrame.provider.scores.interruptCurrent,
    );
  });

  it("does not let an unperceived World event change actor-private state", () => {
    const quiet = createR0CounterfactualEpisode({
      speechExposure: "none",
      hiddenOpeningSpeech: false,
    });
    const hidden = createR0CounterfactualEpisode({
      speechExposure: "none",
      hiddenOpeningSpeech: true,
    });

    const quietState = compilePrivateState(quiet.frames[0]!, "task");
    const hiddenState = compilePrivateState(hidden.frames[0]!, "task");

    expect(hidden.frames[0]!.events).not.toEqual(quiet.frames[0]!.events);
    expect(hiddenState).toEqual(quietState);
  });

  it("keeps the authoritative World trajectory identical across semantic exposure variants", () => {
    const addressed = createR0CounterfactualEpisode({ speechExposure: "addressed" });
    const silent = createR0CounterfactualEpisode({ speechExposure: "none" });

    const physical = (episode: typeof addressed) =>
      episode.frames.map((frame) => ({
        tick: frame.tick,
        actors: frame.actors,
        taskProgress: frame.taskProgress,
      }));

    expect(physical(addressed)).toEqual(physical(silent));
  });
});


describe("R0 same-state semantic probe", () => {
  it("gives every provider an equivalent isolated private-state snapshot", async () => {
    const episode = createR0CounterfactualEpisode({ speechExposure: "addressed" });
    const state = compilePrivateState(episode.frames[10]!, "task");
    const seen: string[] = [];

    const observingProvider = (id: string, mutate = false): ReflexProvider => ({
      id,
      evaluate(input) {
        seen.push(JSON.stringify(input));
        if (mutate) input.self.taskProgress = 999;
        const evaluation = new RuleBaselineProvider().evaluate(input);
        return { ...evaluation, providerId: id };
      },
    });

    const canonicalBefore = JSON.stringify(state);
    const results = await evaluateProvidersSameState(state, [
      observingProvider("observer-a", true),
      observingProvider("observer-b"),
    ]);

    expect(results.map((result) => result.providerId)).toEqual([
      "observer-a",
      "observer-b",
    ]);
    expect(seen[0]).toBe(seen[1]);
    expect(JSON.stringify(state)).toBe(canonicalBefore);
  });
});


describe("R0 local direct-choice contract", () => {
  it("keeps benchmark backends explicit and pinned", () => {
    expect(isLocalModelBackendId("qwen3-0.6b")).toBe(true);
    expect(isLocalModelBackendId("smollm2-135m")).toBe(true);
    expect(isLocalModelBackendId("unknown")).toBe(false);

    expect(getLocalModelBackend("qwen3-0.6b").modelRevision).toHaveLength(40);
    expect(getLocalModelBackend("smollm2-135m").modelRevision).toBe(
      "b8a5c0f183b78c55955a5364f610c36668b5e681",
    );
  });

  it("routes WebGPU dtype by shader-f16 capability", () => {
    expect(chooseLocalQwenDtype(true)).toBe("q4f16");
    expect(chooseLocalQwenDtype(false)).toBe("q8");
  });

  it("cycles every semantic action through every label position exactly once", () => {
    const placements = new Map<string, number[]>();

    PERMUTATION_SWEEP_ORDERS.forEach((order) => {
      getImmediateResponseOptions(order).forEach((option, index) => {
        const indexes = placements.get(option.id) ?? [];
        indexes.push(index);
        placements.set(option.id, indexes);
      });
    });

    for (const indexes of placements.values()) {
      expect([...indexes].sort()).toEqual([0, 1, 2, 3, 4]);
    }
  });

  it("reverses labels without changing the semantic option set", () => {
    const canonical = getImmediateResponseOptions("canonical");
    const reverse = getImmediateResponseOptions("reverse");

    expect(reverse.map((option) => option.id)).toEqual(
      [...canonical].reverse().map((option) => option.id),
    );
    expect(new Set(reverse.map((option) => option.id))).toEqual(
      new Set(canonical.map((option) => option.id)),
    );
  });

  it("serializes only the supplied actor-private state", () => {
    const episode = createR0CounterfactualEpisode({
      speechExposure: "none",
      hiddenOpeningSpeech: true,
    });
    const state = compilePrivateState(episode.frames[0]!, "task");
    const prompt = buildImmediateResponsePrompt(state);

    expect(prompt).toContain("current_task=sort_crates");
    expect(prompt).toContain("percepts:\n- none");
    expect(prompt).not.toContain("outside the resident's current sensory range");
    expect(prompt).not.toContain("speech:hidden-opening");
    expect(prompt).not.toContain("Prefer preserving");
    expect(prompt).not.toContain("/no_think");
  });

  it("defines one semantic-token candidate family for every reflex action", () => {
    expect(SEMANTIC_TOKEN_SPECS.map((spec) => spec.id)).toEqual([
      "continue",
      "orient",
      "acknowledge",
      "investigate",
      "withdraw",
    ]);
    for (const spec of SEMANTIC_TOKEN_SPECS) {
      expect(spec.candidates.length).toBeGreaterThan(0);
      expect(spec.candidates.every((candidate) => candidate.length > 0)).toBe(true);
    }
  });

  it("maps a semantic token id directly to its semantic action", () => {
    const tokens = [
      { action: "continue" as const, keyword: "work", surface: " work", tokenId: 10 },
      { action: "orient" as const, keyword: "look", surface: " look", tokenId: 11 },
      { action: "acknowledge" as const, keyword: "reply", surface: " reply", tokenId: 12 },
      { action: "investigate" as const, keyword: "inspect", surface: " inspect", tokenId: 13 },
      { action: "withdraw" as const, keyword: "leave", surface: " leave", tokenId: 14 },
    ];

    expect(semanticActionFromToken(13, tokens)).toBe("investigate");
    expect(() => semanticActionFromToken(99, tokens)).toThrow(
      "outside the semantic action token set",
    );
  });

  it("builds semantic-token prompts without arbitrary letter labels", () => {
    const episode = createR0CounterfactualEpisode({
      speechExposure: "addressed",
    });
    const state = compilePrivateState(episode.frames[10]!, "task");
    const tokens = [
      { action: "continue" as const, keyword: "work", surface: " work", tokenId: 10 },
      { action: "orient" as const, keyword: "look", surface: " look", tokenId: 11 },
      { action: "acknowledge" as const, keyword: "reply", surface: " reply", tokenId: 12 },
      { action: "investigate" as const, keyword: "inspect", surface: " inspect", tokenId: 13 },
      { action: "withdraw" as const, keyword: "leave", surface: " leave", tokenId: 14 },
    ];
    const prompt = buildSemanticResponsePrompt(state, tokens);

    expect(prompt).toContain("work — continue the current task");
    expect(prompt).toContain("leave — create distance from the player");
    expect(prompt).toContain("Answer with exactly one action keyword.");
    expect(prompt).not.toContain("A. ");
    expect(prompt).not.toContain("B. ");
  });

  it("maps a constrained generated token back to the semantic action", () => {
    const reverse = getImmediateResponseOptions("reverse");
    expect(actionFromChoiceToken(14, [10, 11, 12, 13, 14], reverse)).toBe(
      "continue",
    );
    expect(() =>
      actionFromChoiceToken(99, [10, 11, 12, 13, 14], reverse),
    ).toThrow("outside the allowed choice labels");
  });

  it("maps letter scores back onto semantic actions under reversed order", () => {
    const reverse = getImmediateResponseOptions("reverse");
    const analysis = analyzeChoiceScores(
      [8, 3, 2, 1, 0, -1],
      [0, 1, 2, 3, 4],
      reverse,
    );

    expect(analysis.distribution.withdraw).toBeGreaterThan(0.98);
    expect(analysis.distribution.continue).toBeLessThan(0.001);
  });

  it("keeps conditional choice preference separate from full-vocabulary mass", () => {
    const scores = [-2, -1, 0, 1, 2, 8, 7];
    const analysis = analyzeChoiceScores(scores, [0, 1, 2, 3, 4]);
    const total = Object.values(analysis.distribution).reduce(
      (sum, value) => sum + value,
      0,
    );

    expect(total).toBeCloseTo(1, 10);
    expect(analysis.distribution.withdraw).toBeGreaterThan(
      analysis.distribution.investigate,
    );
    expect(analysis.choiceMass).toBeLessThan(0.01);
    expect(analysis.bestAllowedRank).toBe(3);
    expect(analysis.topTokenId).toBe(5);
  });
});


describe("R0 independent binary appraisal contract", () => {
  it("defines the initial appraisal surface explicitly", () => {
    expect(APPRAISAL_SPECS.map((spec) => spec.id)).toEqual([
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ]);

    for (const spec of APPRAISAL_SPECS) {
      expect(spec.positive).not.toBe(spec.negative);
      expect(spec.positive.length).toBeGreaterThan(20);
      expect(spec.negative.length).toBeGreaterThan(20);
    }
  });

  it("builds polarity-controlled yes/no prompts from the same private state", () => {
    const episode = createR0CounterfactualEpisode({
      speechExposure: "addressed",
    });
    const state = compilePrivateState(episode.frames[10]!, "task");
    const attention = APPRAISAL_SPECS.find(
      (spec) => spec.id === "attention",
    )!;

    const positive = buildAppraisalPrompt(
      state,
      attention,
      "positive",
    );
    const negative = buildAppraisalPrompt(
      state,
      attention,
      "negative",
    );

    expect(positive).toContain(attention.positive);
    expect(negative).toContain(attention.negative);
    expect(positive).toContain("Answer exactly yes or no.");
    expect(positive).not.toContain("ALLOWED ANSWERS");
    expect(positive).not.toContain("ALLOWED ACTION KEYWORDS");
  });

  it("normalizes yes/no scores stably and symmetrically", () => {
    expect(probabilityYesFromScores(0, 0)).toBeCloseTo(0.5, 12);
    expect(probabilityYesFromScores(10, 0)).toBeGreaterThan(0.999);
    expect(probabilityYesFromScores(0, 10)).toBeLessThan(0.001);

    const forward = probabilityYesFromScores(2.75, -1.25);
    const reversed = probabilityYesFromScores(-1.25, 2.75);
    expect(forward + reversed).toBeCloseTo(1, 12);
  });
});

describe("R0 bipolar semantic appraisal contract", () => {
  it("defines one opposed semantic pair for every appraisal dimension", () => {
    expect(BIPOLAR_APPRAISAL_SPECS.map((spec) => spec.id)).toEqual([
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ]);

    for (const spec of BIPOLAR_APPRAISAL_SPECS) {
      expect(spec.positiveMeaning).not.toBe(spec.negativeMeaning);
      expect(spec.positiveCandidates.length).toBeGreaterThan(0);
      expect(spec.negativeCandidates.length).toBeGreaterThan(0);
    }
  });

  it("counterbalances semantic pole presentation without changing pole identity", () => {
    const episode = createR0CounterfactualEpisode({
      speechExposure: "addressed",
    });
    const state = compilePrivateState(episode.frames[10]!, "task");
    const spec = BIPOLAR_APPRAISAL_SPECS.find(
      (candidate) => candidate.id === "threat",
    )!;
    const tokens = [
      {
        pole: "positive" as const,
        keyword: "danger",
        surface: " danger",
        tokenId: 10,
      },
      {
        pole: "negative" as const,
        keyword: "safe",
        surface: " safe",
        tokenId: 11,
      },
    ];

    const positiveFirst = buildBipolarAppraisalPrompt(
      state,
      spec,
      tokens,
      "positive-first",
    );
    const negativeFirst = buildBipolarAppraisalPrompt(
      state,
      spec,
      tokens,
      "negative-first",
    );

    expect(positiveFirst).toContain("danger — " + spec.positiveMeaning);
    expect(positiveFirst).toContain("safe — " + spec.negativeMeaning);
    expect(negativeFirst.indexOf("safe —")).toBeLessThan(
      negativeFirst.indexOf("danger —"),
    );
    expect(positiveFirst.indexOf("danger —")).toBeLessThan(
      positiveFirst.indexOf("safe —"),
    );
    expect(positiveFirst).not.toContain("yes or no");
  });

  it("normalizes opposed semantic pole scores symmetrically", () => {
    expect(probabilityPositiveFromScores(0, 0)).toBeCloseTo(0.5, 12);
    const positive = probabilityPositiveFromScores(4, -1);
    const reversed = probabilityPositiveFromScores(-1, 4);
    expect(positive).toBeGreaterThan(0.99);
    expect(positive + reversed).toBeCloseTo(1, 12);
  });
});

describe("R0 semantic challenge suite", () => {
  it("keeps addressed vs overheard request as a one-fact semantic mutation", () => {
    const challenges = createSemanticChallenges();
    const addressed = challenges.find(
      (challenge) => challenge.id === "addressed-request",
    )!;
    const overheard = challenges.find(
      (challenge) => challenge.id === "overheard-request",
    )!;

    const addressedState = compilePrivateState(addressed.episode.frames[10]!, "task");
    const overheardState = compilePrivateState(overheard.episode.frames[10]!, "task");

    const addressedSpeech = addressedState.percepts.find(
      (percept) => percept.kind === "speech",
    );
    const overheardSpeech = overheardState.percepts.find(
      (percept) => percept.kind === "speech",
    );

    expect(addressedSpeech).toEqual(
      expect.objectContaining({
        kind: "speech",
        addressed: true,
        text: "Can you help me with this for a moment?",
      }),
    );
    expect(overheardSpeech).toEqual(
      expect.objectContaining({
        kind: "speech",
        addressed: false,
        text: "Can you help me with this for a moment?",
      }),
    );

    const normalizeAddressed = (state: ActorPrivateState) => ({
      ...state,
      percepts: state.percepts.map((percept) =>
        percept.kind === "speech"
          ? { ...percept, addressed: false }
          : percept,
      ),
    });

    expect(normalizeAddressed(addressedState)).toEqual(overheardState);
  });

  it("makes fast-close pressure visible through private motion evidence", () => {
    const challenges = createSemanticChallenges();
    const ordinary = challenges.find(
      (challenge) => challenge.id === "silent-pass",
    )!;
    const fast = challenges.find(
      (challenge) => challenge.id === "fast-close",
    )!;

    const ordinaryState = compilePrivateState(ordinary.episode.frames[10]!, "task");
    const fastState = compilePrivateState(fast.episode.frames[10]!, "task");

    const ordinaryVisible = ordinaryState.percepts.find(
      (percept) => percept.kind === "visible_actor",
    );
    const fastVisible = fastState.percepts.find(
      (percept) => percept.kind === "visible_actor",
    );

    expect(ordinaryVisible).toEqual(
      expect.objectContaining({ kind: "visible_actor", distanceBand: "near" }),
    );
    expect(fastVisible).toEqual(
      expect.objectContaining({ kind: "visible_actor", distanceBand: "near" }),
    );

    if (
      ordinaryVisible?.kind !== "visible_actor" ||
      fastVisible?.kind !== "visible_actor"
    ) {
      throw new Error("expected visible actor percepts");
    }

    expect(fastVisible.approachSpeed).toBeGreaterThan(
      ordinaryVisible.approachSpeed + 100,
    );
    expect(
      fastState.percepts.some((percept) => percept.kind === "speech"),
    ).toBe(false);
  });
});


describe("R1 counterfactual supervision suite", () => {
  it("keeps train/dev/test families disjoint and balanced", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const suite = createR1CounterfactualSuite();

    expect(suite.states).toHaveLength(30);
    expect(suite.constraints).toHaveLength(33);

    for (const split of ["train", "dev", "test"] as const) {
      expect(suite.states.filter((state) => state.split === split)).toHaveLength(10);
      expect(
        suite.constraints.filter((constraint) => constraint.split === split),
      ).toHaveLength(11);
    }

    const familySplits = new Map<string, Set<string>>();
    for (const state of suite.states) {
      const splits = familySplits.get(state.familyId) ?? new Set<string>();
      splits.add(state.split);
      familySplits.set(state.familyId, splits);
    }
    expect(
      [...familySplits.values()].every((splits) => splits.size === 1),
    ).toBe(true);
  });

  it("contains no exact private-state leakage across train/dev/test", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const suite = createR1CounterfactualSuite();
    const owners = new Map<string, string>();

    for (const state of suite.states) {
      const key = JSON.stringify(state.state);
      const existing = owners.get(key);
      if (existing && existing !== state.split) {
        throw new Error(
          "exact private state leaked across splits: " +
            existing +
            " -> " +
            state.split +
            " for " +
            state.id,
        );
      }
      owners.set(key, state.split);
    }
  });

  it("keeps hidden World mutations as hard equalities in every split", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const suite = createR1CounterfactualSuite();

    for (const split of ["train", "dev", "test"] as const) {
      const hidden = suite.states.find(
        (state) => state.id === split + ":epistemic-hidden",
      )!;
      const control = suite.states.find(
        (state) => state.id === split + ":epistemic-control",
      )!;
      expect(hidden.state).toEqual(control.state);

      const equalities = suite.constraints.filter(
        (constraint) =>
          constraint.split === split &&
          constraint.familyId === split + ":hidden-world-invariance",
      );
      expect(equalities).toHaveLength(5);
      expect(
        equalities.every(
          (constraint) =>
            constraint.relation === "equal" &&
            constraint.strength === "hard_invariant",
        ),
      ).toBe(true);
    }
  });

  it("forces a semantic warning-vs-request distinction with matched physics/addressee", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const suite = createR1CounterfactualSuite();

    for (const split of ["train", "dev", "test"] as const) {
      const warning = suite.states.find(
        (state) => state.id === split + ":urgent-warning",
      )!;
      const request = suite.states.find(
        (state) => state.id === split + ":warning-control-request",
      )!;

      const normalizeSpeechText = (state: ActorPrivateState) => ({
        ...state,
        percepts: state.percepts.map((percept) =>
          percept.kind === "speech"
            ? { ...percept, text: "<TEXT>" }
            : percept,
        ),
      });

      expect(normalizeSpeechText(warning.state)).toEqual(
        normalizeSpeechText(request.state),
      );

      const semanticConstraints = suite.constraints.filter(
        (constraint) =>
          constraint.split === split &&
          constraint.familyId === split + ":warning-semantics",
      );
      expect(
        new Set(semanticConstraints.map((constraint) => constraint.dimension)),
      ).toEqual(new Set(["interrupt", "threat"]));
    }
  });

  it("gives deeper cognition its own ambiguity-vs-clear causal family", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const suite = createR1CounterfactualSuite();

    for (const split of ["train", "dev", "test"] as const) {
      const ambiguous = suite.states.find(
        (state) => state.id === split + ":ambiguous-instruction",
      )!;
      const clear = suite.states.find(
        (state) => state.id === split + ":clear-instruction",
      )!;

      const normalizeSpeechText = (state: ActorPrivateState) => ({
        ...state,
        percepts: state.percepts.map((percept) =>
          percept.kind === "speech"
            ? { ...percept, text: "<TEXT>" }
            : percept,
        ),
      });

      expect(normalizeSpeechText(ambiguous.state)).toEqual(
        normalizeSpeechText(clear.state),
      );

      const constraints = suite.constraints.filter(
        (constraint) =>
          constraint.split === split &&
          constraint.familyId === split + ":cognition-ambiguity",
      );
      expect(constraints).toHaveLength(1);
      expect(constraints[0]).toMatchObject({
        dimension: "cognition",
        relation: "greater",
        leftStateId: split + ":ambiguous-instruction",
        rightStateId: split + ":clear-instruction",
      });
    }
  });

  it("keeps addressed-vs-overheard as a one-field percept mutation within each split", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const suite = createR1CounterfactualSuite();

    for (const split of ["train", "dev", "test"] as const) {
      const addressed = suite.states.find(
        (state) => state.id === split + ":addressed-request",
      )!;
      const overheard = suite.states.find(
        (state) => state.id === split + ":overheard-request",
      )!;

      const normalizeAddressed = (state: ActorPrivateState) => ({
        ...state,
        percepts: state.percepts.map((percept) =>
          percept.kind === "speech"
            ? { ...percept, addressed: false }
            : percept,
        ),
      });

      expect(normalizeAddressed(addressed.state)).toEqual(overheard.state);
    }
  });
});


describe("R1 surface-memorizer negative control", () => {
  it("fits train while failing held-out semantic paraphrases", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const {
      evaluateSurfaceMemorizer,
      trainSurfaceMemorizer,
    } = await import("../src/r1/surface-baseline");

    const suite = createR1CounterfactualSuite();
    const model = trainSurfaceMemorizer(suite);
    const reports = evaluateSurfaceMemorizer(model, suite);

    expect(reports.find((report) => report.split === "train")).toMatchObject({
      passed: 11,
      total: 11,
      warningSemanticPassed: 2,
      warningSemanticTotal: 2,
    });

    for (const split of ["dev", "test"] as const) {
      const report = reports.find((candidate) => candidate.split === split)!;
      expect(report.total).toBe(11);
      expect(report.equalPassed).toBe(5);
      expect(report.directionalPassed).toBe(3);
      expect(report.warningSemanticPassed).toBe(0);
      expect(report.warningSemanticTotal).toBe(2);
      expect(report.passed).toBe(8);
    }
  });

  it("does not solve held-out cognition ambiguity by train lexical memorization", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const { score, trainSurfaceMemorizer } = await import(
      "../src/r1/surface-baseline"
    );

    const suite = createR1CounterfactualSuite();
    const model = trainSurfaceMemorizer(suite);

    for (const split of ["dev", "test"] as const) {
      const ambiguous = suite.states.find(
        (state) => state.id === split + ":ambiguous-instruction",
      )!;
      const clear = suite.states.find(
        (state) => state.id === split + ":clear-instruction",
      )!;

      const margin =
        score(model, "cognition", ambiguous.state) -
        score(model, "cognition", clear.state);
      expect(margin).toBeLessThanOrEqual(0);
    }
  });

  it("does not leak held-out speech tokens into the training vocabulary", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const { trainSurfaceMemorizer } = await import(
      "../src/r1/surface-baseline"
    );

    const suite = createR1CounterfactualSuite();
    const model = trainSurfaceMemorizer(suite);
    const vocabulary = new Set(model.vocabulary);

    for (const token of [
      "careful",
      "impact",
      "incoming",
      "clear",
      "lend",
      "hand",
      "assist",
      "briefly",
      "mira",
      "retain",
      "confirm",
      "ownership",
      "removal",
      "route",
      "closure",
      "establish",
      "passage",
      "condition",
      "transport",
    ]) {
      expect(vocabulary.has(token)).toBe(false);
    }
  });
});


describe("R1 encoder benchmark contract", () => {
  it("serializes only actor-private state and preserves epistemic equality", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const { serializeR1PrivateState } = await import(
      "../src/r1/encoder-contract"
    );

    const suite = createR1CounterfactualSuite();
    const hidden = suite.states.find(
      (state) => state.id === "test:epistemic-hidden",
    )!;
    const control = suite.states.find(
      (state) => state.id === "test:epistemic-control",
    )!;

    expect(serializeR1PrivateState(hidden.state)).toBe(
      serializeR1PrivateState(control.state),
    );
    expect(serializeR1PrivateState(hidden.state)).not.toContain(
      "hidden World",
    );
    expect(serializeR1PrivateState(hidden.state)).not.toContain(
      "epistemic-hidden",
    );
  });

  it("keeps warning-vs-request encoder input matched except for speech meaning", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const { serializeR1PrivateState } = await import(
      "../src/r1/encoder-contract"
    );

    const suite = createR1CounterfactualSuite();
    const warning = suite.states.find(
      (state) => state.id === "test:urgent-warning",
    )!;
    const request = suite.states.find(
      (state) => state.id === "test:warning-control-request",
    )!;

    const normalizeText = (value: string) =>
      value.replace(/text "[^"]*"/, 'text "<TEXT>"');

    expect(normalizeText(serializeR1PrivateState(warning.state))).toBe(
      normalizeText(serializeR1PrivateState(request.state)),
    );
    expect(serializeR1PrivateState(warning.state)).not.toBe(
      serializeR1PrivateState(request.state),
    );
  });

  it("computes cosine similarity without hidden normalization assumptions", async () => {
    const { cosineSimilarity } = await import("../src/r1/encoder-contract");

    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 12);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 12);
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1, 12);
  });
});


describe("R1 frozen-encoder prototype head", () => {
  it("learns only from TRAIN relations and evaluates held-out relations afterward", async () => {
    const {
      evaluatePrototypeHeads,
      learnPrototypeHeads,
    } = await import("../src/r1/prototype-head");
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;

    const embeddings = new Map<string, readonly number[]>();
    const constraints: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const positive = new Array<number>(5).fill(0);
      positive[index] = 1;
      const negative = new Array<number>(5).fill(0);

      embeddings.set("train:" + dimension + ":left", positive);
      embeddings.set("train:" + dimension + ":right", negative);
      embeddings.set("dev:" + dimension + ":left", positive);
      embeddings.set("dev:" + dimension + ":right", negative);
      embeddings.set("test:" + dimension + ":left", positive);
      embeddings.set("test:" + dimension + ":right", negative);

      constraints.push(
        {
          id: "train:" + dimension,
          familyId: "train:" + dimension,
          split: "train",
          dimension,
          relation: "greater",
          leftStateId: "train:" + dimension + ":left",
          rightStateId: "train:" + dimension + ":right",
        },
        {
          id: "dev:" + dimension,
          familyId: "dev:" + dimension,
          split: "dev",
          dimension,
          relation: "greater",
          leftStateId: "dev:" + dimension + ":left",
          rightStateId: "dev:" + dimension + ":right",
        },
        {
          id: "test:" + dimension,
          familyId: "test:" + dimension,
          split: "test",
          dimension,
          relation: "greater",
          leftStateId: "test:" + dimension + ":left",
          rightStateId: "test:" + dimension + ":right",
        },
      );
    });

    const heads = learnPrototypeHeads(embeddings, constraints);
    const evaluated = evaluatePrototypeHeads(
      heads,
      embeddings,
      constraints,
    );

    expect(
      evaluated.constraints.every((constraint) => constraint.passed),
    ).toBe(true);
    expect(
      evaluated.dimensions.every(
        (dimension) => dimension.trainingRelations === 1,
      ),
    ).toBe(true);
  });

  it("does not let DEV/TEST labels change learned head weights", async () => {
    const { learnPrototypeHeads } = await import(
      "../src/r1/prototype-head"
    );
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;
    const embeddings = new Map<string, readonly number[]>();
    const train: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const left = new Array<number>(5).fill(0);
      left[index] = 1;
      embeddings.set("left:" + dimension, left);
      embeddings.set("right:" + dimension, new Array<number>(5).fill(0));
      train.push({
        id: "train:" + dimension,
        familyId: "train:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "left:" + dimension,
        rightStateId: "right:" + dimension,
      });
    });

    const devA: import("../src/r1/encoder-contract").R1LearnConstraintInput = {
      id: "dev:a",
      familyId: "dev:a",
      split: "dev",
      dimension: "threat",
      relation: "greater",
      leftStateId: "left:threat",
      rightStateId: "right:threat",
    };
    const devB: import("../src/r1/encoder-contract").R1LearnConstraintInput = {
      ...devA,
      id: "dev:b",
      leftStateId: "right:threat",
      rightStateId: "left:threat",
    };

    const withA = learnPrototypeHeads(embeddings, [...train, devA]);
    const withB = learnPrototypeHeads(embeddings, [...train, devB]);

    expect(withA.weights).toEqual(withB.weights);
  });

  it("keeps identical embeddings equal under every learned dimension", async () => {
    const {
      evaluatePrototypeHeads,
      learnPrototypeHeads,
    } = await import("../src/r1/prototype-head");
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;
    const embeddings = new Map<string, readonly number[]>();
    const constraints: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const left = new Array<number>(5).fill(0);
      left[index] = 1;
      embeddings.set("train-left:" + dimension, left);
      embeddings.set("train-right:" + dimension, new Array<number>(5).fill(0));
      constraints.push({
        id: "train:" + dimension,
        familyId: "train:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "train-left:" + dimension,
        rightStateId: "train-right:" + dimension,
      });
    });

    embeddings.set("same-a", [0.2, 0.3, 0.4, 0.5, 0.6]);
    embeddings.set("same-b", [0.2, 0.3, 0.4, 0.5, 0.6]);
    constraints.push({
      id: "test:hidden-equality",
      familyId: "test:hidden",
      split: "test",
      dimension: "threat",
      relation: "equal",
      leftStateId: "same-a",
      rightStateId: "same-b",
    });

    const heads = learnPrototypeHeads(embeddings, constraints);
    const evaluation = evaluatePrototypeHeads(
      heads,
      embeddings,
      constraints,
    );
    const equality = evaluation.constraints.find(
      (constraint) => constraint.id === "test:hidden-equality",
    )!;

    expect(equality.margin).toBe(0);
    expect(equality.passed).toBe(true);
  });
});


describe("R1 hybrid structured representation", () => {
  it("keeps hard epistemic equality identical in structured channels", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const { structuredPrivateFeatures } = await import(
      "../src/r1/structured-features"
    );
    const suite = createR1CounterfactualSuite();
    const hidden = suite.states.find(
      (state) => state.id === "test:epistemic-hidden",
    )!;
    const control = suite.states.find(
      (state) => state.id === "test:epistemic-control",
    )!;

    expect(structuredPrivateFeatures(hidden.state)).toEqual(
      structuredPrivateFeatures(control.state),
    );
  });

  it("preserves fast-close kinematics explicitly instead of asking the language encoder to infer them", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const {
      R1_STRUCTURED_FEATURE_NAMES,
      structuredPrivateFeatures,
    } = await import("../src/r1/structured-features");
    const suite = createR1CounterfactualSuite();
    const fast = suite.states.find(
      (state) => state.id === "test:fast-close",
    )!;
    const pass = suite.states.find(
      (state) => state.id === "test:ordinary-pass",
    )!;
    const index = R1_STRUCTURED_FEATURE_NAMES.indexOf(
      "approach_speed_norm",
    );

    expect(index).toBeGreaterThanOrEqual(0);
    expect(structuredPrivateFeatures(fast.state)[index]).toBeGreaterThan(
      structuredPrivateFeatures(pass.state)[index]!,
    );
  });

  it("appends bounded structured channels without altering encoder coordinates", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const {
      hybridPrivateRepresentation,
      R1_STRUCTURED_FEATURE_NAMES,
    } = await import("../src/r1/structured-features");
    const state = createR1CounterfactualSuite().states[0]!.state;
    const embedding = [0.1, 0.2, 0.3];

    const hybrid = hybridPrivateRepresentation(embedding, state);

    expect(hybrid.slice(0, embedding.length)).toEqual(embedding);
    expect(hybrid).toHaveLength(
      embedding.length + R1_STRUCTURED_FEATURE_NAMES.length,
    );
    expect(
      hybrid
        .slice(embedding.length)
        .every((value) => Number.isFinite(value) && value >= -1 && value <= 1),
    ).toBe(true);
  });
});


describe("R1 adversarial OOD red-team", () => {
  it("defines one held-out 30-state / 26-relation semantic red-team split", async () => {
    const { createR1OodRedTeamSuite } = await import(
      "../src/r1/ood-red-team"
    );
    const suite = createR1OodRedTeamSuite();

    expect(suite.states).toHaveLength(30);
    expect(suite.constraints).toHaveLength(26);
    expect(suite.states.every((state) => state.split === "ood")).toBe(true);
    expect(
      suite.constraints.every((constraint) => constraint.split === "ood"),
    ).toBe(true);
  });

  it("keeps all new semantic adversaries physically matched within their pair", async () => {
    const { createR1OodRedTeamSuite } = await import(
      "../src/r1/ood-red-team"
    );
    const suite = createR1OodRedTeamSuite();

    const normalizeSpeechText = (state: ActorPrivateState) => ({
      ...state,
      percepts: state.percepts.map((percept) =>
        percept.kind === "speech"
          ? { ...percept, text: "<TEXT>" }
          : percept,
      ),
    });

    for (const [leftId, rightId] of [
      ["ood:urgent-warning", "ood:secured-beam-control"],
      ["ood:indirect-live-warning", "ood:indirect-earlier-control"],
      ["ood:quoted-live-warning", "ood:quoted-old-drill"],
      ["ood:negated-unsafe", "ood:negated-safe"],
      ["ood:seal-unconfirmed", "ood:seal-confirmed"],
      ["ood:clearance-unestablished", "ood:clearance-established"],
      ["ood:v3-smoke-current", "ood:v3-smoke-conditional"],
      ["ood:v3-current-order", "ood:v3-archived-order"],
      ["ood:v3-hatch-unsafe", "ood:v3-hatch-safe"],
      ["ood:v3-immediate-hazard", "ood:v3-immediate-deadline"],
      ["ood:v3-deadline-now", "ood:v3-deadline-later"],
      ["ood:v3-destination-unknown", "ood:v3-destination-known"],
    ] as const) {
      const left = suite.states.find((state) => state.id === leftId)!;
      const right = suite.states.find((state) => state.id === rightId)!;

      expect(normalizeSpeechText(left.state)).toEqual(
        normalizeSpeechText(right.state),
      );
    }
  });

  it("uses identical binary token bags for the hardened structural semantic adversaries", async () => {
    const { createR1OodRedTeamSuite } = await import(
      "../src/r1/ood-red-team"
    );
    const suite = createR1OodRedTeamSuite();

    const speechText = (id: string) => {
      const record = suite.states.find((state) => state.id === id)!;
      const percept = record.state.percepts.find(
        (candidate) => candidate.kind === "speech",
      );
      if (!percept || percept.kind !== "speech") {
        throw new Error("missing speech for " + id);
      }
      return percept.text;
    };
    const tokenBag = (value: string) =>
      [...new Set(value.toLowerCase().match(/[a-z]+/g) ?? [])].sort();

    for (const [leftId, rightId] of [
      ["ood:urgent-warning", "ood:secured-beam-control"],
      ["ood:indirect-live-warning", "ood:indirect-earlier-control"],
      ["ood:seal-unconfirmed", "ood:seal-confirmed"],
      ["ood:clearance-unestablished", "ood:clearance-established"],
      ["ood:v3-smoke-current", "ood:v3-smoke-conditional"],
      ["ood:v3-current-order", "ood:v3-archived-order"],
      ["ood:v3-hatch-unsafe", "ood:v3-hatch-safe"],
      ["ood:v3-immediate-hazard", "ood:v3-immediate-deadline"],
      ["ood:v3-deadline-now", "ood:v3-deadline-later"],
      ["ood:v3-destination-unknown", "ood:v3-destination-known"],
    ] as const) {
      expect(tokenBag(speechText(leftId))).toEqual(
        tokenBag(speechText(rightId)),
      );
      expect(speechText(leftId)).not.toBe(speechText(rightId));
    }
  });

  it("uses the exact same alarming quote on both sides of the quoted-warning adversary", async () => {
    const { createR1OodRedTeamSuite } = await import(
      "../src/r1/ood-red-team"
    );
    const suite = createR1OodRedTeamSuite();
    const live = suite.states.find(
      (state) => state.id === "ood:quoted-live-warning",
    )!;
    const drill = suite.states.find(
      (state) => state.id === "ood:quoted-old-drill",
    )!;

    const speech = (state: ActorPrivateState) =>
      state.percepts.find((percept) => percept.kind === "speech");

    expect(speech(live.state)).toEqual(
      expect.objectContaining({
        text: expect.stringContaining("RUN, THE CEILING IS FALLING!"),
      }),
    );
    expect(speech(drill.state)).toEqual(
      expect.objectContaining({
        text: expect.stringContaining("RUN, THE CEILING IS FALLING!"),
      }),
    );
  });

  it("keeps hidden urgent danger outside both semantic and structured actor-private channels", async () => {
    const { createR1OodRedTeamSuite } = await import(
      "../src/r1/ood-red-team"
    );
    const {
      serializeR1PrivateState,
    } = await import("../src/r1/encoder-contract");
    const {
      structuredPrivateFeatures,
    } = await import("../src/r1/structured-features");

    const suite = createR1OodRedTeamSuite();
    const hidden = suite.states.find(
      (state) => state.id === "ood:hidden-danger",
    )!;
    const control = suite.states.find(
      (state) => state.id === "ood:hidden-control",
    )!;

    expect(hidden.state).toEqual(control.state);
    expect(serializeR1PrivateState(hidden.state)).toBe(
      serializeR1PrivateState(control.state),
    );
    expect(structuredPrivateFeatures(hidden.state)).toEqual(
      structuredPrivateFeatures(control.state),
    );
    expect(serializeR1PrivateState(hidden.state)).not.toContain("DANGER");
  });

  it("keeps OOD constraints completely outside prototype-head learning", async () => {
    const { learnPrototypeHeads } = await import(
      "../src/r1/prototype-head"
    );
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;
    const embeddings = new Map<string, readonly number[]>();
    const train: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const left = new Array<number>(5).fill(0);
      left[index] = 1;
      embeddings.set("train-left:" + dimension, left);
      embeddings.set("train-right:" + dimension, new Array<number>(5).fill(0));
      train.push({
        id: "train:" + dimension,
        familyId: "train:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "train-left:" + dimension,
        rightStateId: "train-right:" + dimension,
      });
    });

    embeddings.set("ood-left", [0, 0, -100, 0, 0]);
    embeddings.set("ood-right", [0, 0, 100, 0, 0]);

    const oodA: import("../src/r1/encoder-contract").R1LearnConstraintInput = {
      id: "ood:a",
      familyId: "ood:a",
      split: "ood",
      dimension: "social",
      relation: "greater",
      leftStateId: "ood-left",
      rightStateId: "ood-right",
    };
    const oodB: import("../src/r1/encoder-contract").R1LearnConstraintInput = {
      ...oodA,
      id: "ood:b",
      leftStateId: "ood-right",
      rightStateId: "ood-left",
    };

    const withA = learnPrototypeHeads(embeddings, [...train, oodA]);
    const withB = learnPrototypeHeads(embeddings, [...train, oodB]);

    expect(withA.weights).toEqual(withB.weights);
  });
});


describe("R1 semantic TRAIN breadth augmentation", () => {
  it("adds six TRAIN-only states and five directional relations", async () => {
    const { createR1SemanticTrainingAugmentation } = await import(
      "../src/r1/semantic-training-augmentation"
    );
    const suite = createR1SemanticTrainingAugmentation();

    expect(suite.states).toHaveLength(6);
    expect(suite.constraints).toHaveLength(5);
    expect(suite.states.every((state) => state.split === "train")).toBe(true);
    expect(
      suite.constraints.every(
        (constraint) =>
          constraint.split === "train" &&
          constraint.relation === "greater",
      ),
    ).toBe(true);
  });

  it("keeps every augmentation pair physically/addressee matched", async () => {
    const { createR1SemanticTrainingAugmentation } = await import(
      "../src/r1/semantic-training-augmentation"
    );
    const suite = createR1SemanticTrainingAugmentation();

    const normalizeSpeechText = (state: ActorPrivateState) => ({
      ...state,
      percepts: state.percepts.map((percept) =>
        percept.kind === "speech"
          ? { ...percept, text: "<TEXT>" }
          : percept,
      ),
    });

    for (const [leftId, rightId] of [
      ["train:pressure-active", "train:pressure-resolved"],
      ["train:hoist-active", "train:hoist-resolved"],
      ["train:interlock-unresolved", "train:interlock-confirmed"],
    ] as const) {
      const left = suite.states.find((state) => state.id === leftId)!;
      const right = suite.states.find((state) => state.id === rightId)!;
      expect(normalizeSpeechText(left.state)).toEqual(
        normalizeSpeechText(right.state),
      );
    }
  });

  it("does not copy the frozen quoted-warning OOD surface", async () => {
    const { createR1SemanticTrainingAugmentation } = await import(
      "../src/r1/semantic-training-augmentation"
    );
    const suite = createR1SemanticTrainingAugmentation();
    const text = suite.states
      .flatMap((state) =>
        state.state.percepts
          .filter((percept) => percept.kind === "speech")
          .map((percept) => percept.text.toLowerCase()),
      )
      .join(" ");

    for (const forbidden of [
      "run, the ceiling is falling",
      "dispatch",
      "presently",
      "archive",
      "rehearsal",
      "elsewhere",
    ]) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("keeps all semantic OOD relations beyond exact-token memorization before and after augmentation", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const { createR1OodRedTeamSuite } = await import(
      "../src/r1/ood-red-team"
    );
    const { createR1SemanticTrainingAugmentation } = await import(
      "../src/r1/semantic-training-augmentation"
    );
    const { score, trainSurfaceMemorizer } = await import(
      "../src/r1/surface-baseline"
    );

    const base = createR1CounterfactualSuite();
    const extra = createR1SemanticTrainingAugmentation();
    const ood = createR1OodRedTeamSuite();
    const byId = new Map(ood.states.map((state) => [state.id, state] as const));

    const semanticFamilies = new Set([
      "ood:danger-decoy",
      "ood:indirect-warning",
      "ood:quoted-warning",
      "ood:negation-warning",
      "ood:cognition-ambiguity",
      "ood:resolved-uncertainty",
      "ood:v3-conditional-hazard",
      "ood:v3-operative-instruction",
      "ood:v3-negation-scope",
      "ood:v3-urgency-threat-disentangle",
      "ood:v3-administrative-urgency",
      "ood:v3-routing-uncertainty",
    ]);
    const semanticConstraints = ood.constraints.filter(
      (constraint) =>
        constraint.relation === "greater" &&
        semanticFamilies.has(constraint.familyId),
    );
    expect(semanticConstraints).toHaveLength(18);

    const variants = [
      { label: "base", suite: base },
      {
        label: "expanded",
        suite: {
          states: [...base.states, ...extra.states],
          constraints: [...base.constraints, ...extra.constraints],
        },
      },
    ] as const;
    const leaks: string[] = [];

    for (const variant of variants) {
      const model = trainSurfaceMemorizer(variant.suite);

      for (const constraint of semanticConstraints) {
        const left = byId.get(constraint.leftStateId)!;
        const right = byId.get(constraint.rightStateId)!;
        const margin =
          score(model, constraint.dimension, left.state) -
          score(model, constraint.dimension, right.state);

        if (margin > 0) {
          leaks.push(
            variant.label +
              ":" +
              constraint.id +
              ":" +
              margin.toFixed(6),
          );
        }
      }
    }

    expect(leaks).toEqual([]);
  });
});


describe("R1 deterministic regularized linear ranking head", () => {
  it("learns only from TRAIN directional relations", async () => {
    const { learnRegularizedLinearHeads } = await import(
      "../src/r1/linear-ranking-head"
    );
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;
    const embeddings = new Map<string, readonly number[]>();
    const train: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const left = new Array<number>(5).fill(0);
      left[index] = 1;
      embeddings.set("train-left:" + dimension, left);
      embeddings.set("train-right:" + dimension, new Array<number>(5).fill(0));
      train.push({
        id: "train:" + dimension,
        familyId: "train:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "train-left:" + dimension,
        rightStateId: "train-right:" + dimension,
      });
    });

    embeddings.set("ood-left", [0, 0, -100, 0, 0]);
    embeddings.set("ood-right", [0, 0, 100, 0, 0]);

    const oodA: import("../src/r1/encoder-contract").R1LearnConstraintInput = {
      id: "ood:a",
      familyId: "ood:a",
      split: "ood",
      dimension: "social",
      relation: "greater",
      leftStateId: "ood-left",
      rightStateId: "ood-right",
    };
    const oodB: import("../src/r1/encoder-contract").R1LearnConstraintInput = {
      ...oodA,
      id: "ood:b",
      leftStateId: "ood-right",
      rightStateId: "ood-left",
    };

    const withA = learnRegularizedLinearHeads(embeddings, [...train, oodA]);
    const withB = learnRegularizedLinearHeads(embeddings, [...train, oodB]);

    expect(withA.weights).toEqual(withB.weights);
    expect(withA.trainingCounts).toEqual({
      attention: 1,
      interrupt: 1,
      social: 1,
      threat: 1,
      cognition: 1,
    });
  });

  it("is deterministic and ranks its synthetic TRAIN pairs positively", async () => {
    const { evaluatePrototypeHeads } = await import(
      "../src/r1/prototype-head"
    );
    const { learnRegularizedLinearHeads } = await import(
      "../src/r1/linear-ranking-head"
    );
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;
    const embeddings = new Map<string, readonly number[]>();
    const constraints: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const a = new Array<number>(6).fill(0);
      const b = new Array<number>(6).fill(0);
      a[index] = 1;
      b[5] = 0.15 * (index + 1);
      embeddings.set("left:" + dimension, a);
      embeddings.set("right:" + dimension, b);
      constraints.push({
        id: "train:" + dimension,
        familyId: "train:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "left:" + dimension,
        rightStateId: "right:" + dimension,
      });
    });

    const first = learnRegularizedLinearHeads(embeddings, constraints);
    const second = learnRegularizedLinearHeads(embeddings, constraints);
    expect(first.weights).toEqual(second.weights);

    const evaluation = evaluatePrototypeHeads(
      first,
      embeddings,
      constraints,
    );
    expect(
      evaluation.constraints.every(
        (constraint) => constraint.passed && constraint.margin > 0,
      ),
    ).toBe(true);
  });

  it("keeps learned weight vectors normalized for comparable margins", async () => {
    const { learnRegularizedLinearHeads } = await import(
      "../src/r1/linear-ranking-head"
    );
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;
    const embeddings = new Map<string, readonly number[]>();
    const constraints: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const left = new Array<number>(5).fill(0);
      left[index] = 2;
      embeddings.set("l:" + dimension, left);
      embeddings.set("r:" + dimension, new Array<number>(5).fill(0));
      constraints.push({
        id: "train:" + dimension,
        familyId: "train:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "l:" + dimension,
        rightStateId: "r:" + dimension,
      });
    });

    const head = learnRegularizedLinearHeads(embeddings, constraints);
    for (const dimension of dimensions) {
      const norm = Math.sqrt(
        head.weights[dimension].reduce(
          (sum, value) => sum + value * value,
          0,
        ),
      );
      expect(norm).toBeCloseTo(1, 10);
    }
  });
});


describe("R1 relation geometry diagnostic", () => {
  it("reports exact same-dimension TRAIN alignment without using held-out labels for learning", async () => {
    const { analyzeRelationGeometry } = await import(
      "../src/r1/relation-geometry"
    );
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;
    const representations = new Map<string, readonly number[]>();
    const constraints: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const left = new Array<number>(7).fill(0);
      left[index] = 1;
      representations.set("train-a-left:" + dimension, left);
      representations.set(
        "train-a-right:" + dimension,
        new Array<number>(7).fill(0),
      );
      constraints.push({
        id: "train:a:" + dimension,
        familyId: "train:a:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "train-a-left:" + dimension,
        rightStateId: "train-a-right:" + dimension,
      });
    });

    const cognitionSecond = new Array<number>(7).fill(0);
    cognitionSecond[5] = 1;
    representations.set("train-b-left:cognition", cognitionSecond);
    representations.set("train-b-right:cognition", new Array<number>(7).fill(0));
    constraints.push({
      id: "train:b:cognition",
      familyId: "train:b:cognition",
      split: "train",
      dimension: "cognition",
      relation: "greater",
      leftStateId: "train-b-left:cognition",
      rightStateId: "train-b-right:cognition",
    });

    const heldOut = new Array<number>(7).fill(0);
    heldOut[4] = 1;
    representations.set("ood-left", heldOut);
    representations.set("ood-right", new Array<number>(7).fill(0));
    constraints.push({
      id: "ood:cognition",
      familyId: "ood:cognition",
      split: "ood",
      dimension: "cognition",
      relation: "greater",
      leftStateId: "ood-left",
      rightStateId: "ood-right",
    });

    const geometry = analyzeRelationGeometry(
      representations,
      constraints,
    );
    const row = geometry.find(
      (candidate) => candidate.constraintId === "ood:cognition",
    )!;

    expect(row.nearestTrainConstraintId).toBe("train:a:cognition");
    expect(row.nearestCosine).toBeCloseTo(1, 12);
    expect(row.meanTrainCosine).toBeCloseTo(0.5, 12);
    expect(row.prototypeCosine).toBeCloseTo(1 / Math.sqrt(2), 12);
    expect(row.trainAlignments).toEqual([
      {
        trainConstraintId: "train:a:cognition",
        cosine: 1,
      },
      {
        trainConstraintId: "train:b:cognition",
        cosine: 0,
      },
    ]);
  });

  it("excludes equality constraints from directional geometry rows", async () => {
    const { analyzeRelationGeometry } = await import(
      "../src/r1/relation-geometry"
    );
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;
    const representations = new Map<string, readonly number[]>();
    const constraints: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const left = new Array<number>(5).fill(0);
      left[index] = 1;
      representations.set("train-left:" + dimension, left);
      representations.set("train-right:" + dimension, new Array<number>(5).fill(0));
      constraints.push({
        id: "train:" + dimension,
        familyId: "train:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "train-left:" + dimension,
        rightStateId: "train-right:" + dimension,
      });
    });

    representations.set("same-a", [0.1, 0.2, 0.3, 0.4, 0.5]);
    representations.set("same-b", [0.1, 0.2, 0.3, 0.4, 0.5]);
    constraints.push({
      id: "ood:equal",
      familyId: "ood:equal",
      split: "ood",
      dimension: "threat",
      relation: "equal",
      leftStateId: "same-a",
      rightStateId: "same-b",
    });

    expect(
      analyzeRelationGeometry(representations, constraints),
    ).toEqual([]);
  });
});


describe("R1 cognition TRAIN breadth augmentation", () => {
  it("adds six TRAIN-only states and three cognition relations", async () => {
    const { createR1CognitionTrainingAugmentation } = await import(
      "../src/r1/cognition-training-augmentation"
    );
    const suite = createR1CognitionTrainingAugmentation();

    expect(suite.states).toHaveLength(6);
    expect(suite.constraints).toHaveLength(3);
    expect(suite.states.every((state) => state.split === "train")).toBe(true);
    expect(
      suite.constraints.every(
        (constraint) =>
          constraint.split === "train" &&
          constraint.dimension === "cognition" &&
          constraint.relation === "greater",
      ),
    ).toBe(true);
  });

  it("keeps every cognition augmentation pair physically and addressee matched", async () => {
    const { createR1CognitionTrainingAugmentation } = await import(
      "../src/r1/cognition-training-augmentation"
    );
    const suite = createR1CognitionTrainingAugmentation();

    const normalizeSpeechText = (state: ActorPrivateState) => ({
      ...state,
      percepts: state.percepts.map((percept) =>
        percept.kind === "speech"
          ? { ...percept, text: "<TEXT>" }
          : percept,
      ),
    });

    for (const [leftId, rightId] of [
      ["train:inspection-incomplete", "train:inspection-complete"],
      ["train:corridor-clearance-unknown", "train:corridor-clearance-known"],
      ["train:container-unidentified", "train:container-identified"],
    ] as const) {
      const left = suite.states.find((state) => state.id === leftId)!;
      const right = suite.states.find((state) => state.id === rightId)!;

      expect(normalizeSpeechText(left.state)).toEqual(
        normalizeSpeechText(right.state),
      );
    }
  });

  it("uses identical binary token bags in the structural inspection pair", async () => {
    const { createR1CognitionTrainingAugmentation } = await import(
      "../src/r1/cognition-training-augmentation"
    );
    const suite = createR1CognitionTrainingAugmentation();

    const speechText = (id: string) => {
      const record = suite.states.find((state) => state.id === id)!;
      const percept = record.state.percepts.find(
        (candidate) => candidate.kind === "speech",
      );
      if (!percept || percept.kind !== "speech") {
        throw new Error("missing cognition TRAIN speech for " + id);
      }
      return percept.text;
    };
    const tokenBag = (value: string) =>
      [...new Set(value.toLowerCase().match(/[a-z]+/g) ?? [])].sort();

    expect(tokenBag(speechText("train:inspection-incomplete"))).toEqual(
      tokenBag(speechText("train:inspection-complete")),
    );
    expect(speechText("train:inspection-incomplete")).not.toBe(
      speechText("train:inspection-complete"),
    );
  });

  it("keeps hardened semantic OOD beyond exact-token memorization after cognition expansion", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const { createR1OodRedTeamSuite } = await import(
      "../src/r1/ood-red-team"
    );
    const { createR1SemanticTrainingAugmentation } = await import(
      "../src/r1/semantic-training-augmentation"
    );
    const { createR1CognitionTrainingAugmentation } = await import(
      "../src/r1/cognition-training-augmentation"
    );
    const { score, trainSurfaceMemorizer } = await import(
      "../src/r1/surface-baseline"
    );

    const base = createR1CounterfactualSuite();
    const semantic = createR1SemanticTrainingAugmentation();
    const cognition = createR1CognitionTrainingAugmentation();
    const trainSuite = {
      states: [...base.states, ...semantic.states, ...cognition.states],
      constraints: [
        ...base.constraints,
        ...semantic.constraints,
        ...cognition.constraints,
      ],
    };
    const model = trainSurfaceMemorizer(trainSuite);
    const ood = createR1OodRedTeamSuite();
    const byId = new Map(ood.states.map((state) => [state.id, state] as const));
    const semanticFamilies = new Set([
      "ood:danger-decoy",
      "ood:indirect-warning",
      "ood:quoted-warning",
      "ood:negation-warning",
      "ood:cognition-ambiguity",
      "ood:resolved-uncertainty",
    ]);
    const leaks: string[] = [];

    for (const constraint of ood.constraints.filter(
      (candidate) =>
        candidate.relation === "greater" &&
        semanticFamilies.has(candidate.familyId),
    )) {
      const left = byId.get(constraint.leftStateId)!;
      const right = byId.get(constraint.rightStateId)!;
      const margin =
        score(model, constraint.dimension, left.state) -
        score(model, constraint.dimension, right.state);

      if (margin > 0) {
        leaks.push(constraint.id + ":" + margin.toFixed(6));
      }
    }

    expect(leaks).toEqual([]);
  });
});


describe("R1 learned-head embedding isolation", () => {
  it("pins correctness qualification to one state per encoder batch", async () => {
    const { R1_LEARNED_HEAD_EMBEDDING_BATCH_SIZE } = await import(
      "../src/r1/encoder-contract"
    );
    expect(R1_LEARNED_HEAD_EMBEDDING_BATCH_SIZE).toBe(1);
  });
});


describe("R1 pragmatic TRAIN breadth augmentation", () => {
  it("adds six TRAIN-only states and four interrupt/threat relations", async () => {
    const { createR1PragmaticTrainingAugmentation } = await import(
      "../src/r1/pragmatic-training-augmentation"
    );
    const suite = createR1PragmaticTrainingAugmentation();

    expect(suite.states).toHaveLength(6);
    expect(suite.constraints).toHaveLength(4);
    expect(suite.states.every((state) => state.split === "train")).toBe(true);
    expect(
      suite.constraints.every(
        (constraint) =>
          constraint.split === "train" &&
          constraint.relation === "greater" &&
          (constraint.dimension === "interrupt" ||
            constraint.dimension === "threat"),
      ),
    ).toBe(true);
  });

  it("keeps all pragmatic pairs physically/addressee matched and same-token-bag", async () => {
    const { createR1PragmaticTrainingAugmentation } = await import(
      "../src/r1/pragmatic-training-augmentation"
    );
    const suite = createR1PragmaticTrainingAugmentation();

    const normalizeSpeechText = (state: ActorPrivateState) => ({
      ...state,
      percepts: state.percepts.map((percept) =>
        percept.kind === "speech"
          ? { ...percept, text: "<TEXT>" }
          : percept,
      ),
    });
    const speechText = (id: string) => {
      const record = suite.states.find((state) => state.id === id)!;
      const percept = record.state.percepts.find(
        (candidate) => candidate.kind === "speech",
      );
      if (!percept || percept.kind !== "speech") {
        throw new Error("missing pragmatic TRAIN speech for " + id);
      }
      return percept.text;
    };
    const tokenBag = (value: string) =>
      [...new Set(value.toLowerCase().match(/[a-z]+/g) ?? [])].sort();

    for (const [leftId, rightId] of [
      ["train:active-directive", "train:retired-directive"],
      ["train:circuit-unsafe", "train:circuit-safe"],
      ["train:injury-immediate", "train:filing-immediate"],
    ] as const) {
      const left = suite.states.find((state) => state.id === leftId)!;
      const right = suite.states.find((state) => state.id === rightId)!;

      expect(normalizeSpeechText(left.state)).toEqual(
        normalizeSpeechText(right.state),
      );
      expect(tokenBag(speechText(leftId))).toEqual(
        tokenBag(speechText(rightId)),
      );
    }
  });

  it("keeps all semantic OOD v3 beyond exact-token memorization after pragmatic TRAIN expansion", async () => {
    const { createR1CounterfactualSuite } = await import(
      "../src/r1/counterfactual-supervision"
    );
    const { createR1OodRedTeamSuite } = await import(
      "../src/r1/ood-red-team"
    );
    const { createR1SemanticTrainingAugmentation } = await import(
      "../src/r1/semantic-training-augmentation"
    );
    const { createR1PragmaticTrainingAugmentation } = await import(
      "../src/r1/pragmatic-training-augmentation"
    );
    const { score, trainSurfaceMemorizer } = await import(
      "../src/r1/surface-baseline"
    );

    const base = createR1CounterfactualSuite();
    const semantic = createR1SemanticTrainingAugmentation();
    const pragmatic = createR1PragmaticTrainingAugmentation();
    const trainSuite = {
      states: [...base.states, ...semantic.states, ...pragmatic.states],
      constraints: [
        ...base.constraints,
        ...semantic.constraints,
        ...pragmatic.constraints,
      ],
    };
    const model = trainSurfaceMemorizer(trainSuite);
    const ood = createR1OodRedTeamSuite();
    const byId = new Map(ood.states.map((state) => [state.id, state] as const));
    const semanticFamilies = new Set([
      "ood:danger-decoy",
      "ood:indirect-warning",
      "ood:quoted-warning",
      "ood:negation-warning",
      "ood:cognition-ambiguity",
      "ood:resolved-uncertainty",
      "ood:v3-conditional-hazard",
      "ood:v3-operative-instruction",
      "ood:v3-negation-scope",
      "ood:v3-urgency-threat-disentangle",
      "ood:v3-administrative-urgency",
      "ood:v3-routing-uncertainty",
    ]);
    const leaks: string[] = [];

    for (const constraint of ood.constraints.filter(
      (candidate) =>
        candidate.relation === "greater" &&
        semanticFamilies.has(candidate.familyId),
    )) {
      const left = byId.get(constraint.leftStateId)!;
      const right = byId.get(constraint.rightStateId)!;
      const margin =
        score(model, constraint.dimension, left.state) -
        score(model, constraint.dimension, right.state);
      if (margin > 0) {
        leaks.push(constraint.id + ":" + margin.toFixed(6));
      }
    }

    expect(leaks).toEqual([]);
  });
});


describe("R1 prototype-bank head", () => {
  it("constructs anchors from TRAIN directional relations only", async () => {
    const { learnPrototypeBankHeads } = await import(
      "../src/r1/prototype-bank-head"
    );
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;
    const embeddings = new Map<string, readonly number[]>();
    const train: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const left = new Array<number>(5).fill(0);
      left[index] = 1;
      embeddings.set("train-left:" + dimension, left);
      embeddings.set("train-right:" + dimension, new Array<number>(5).fill(0));
      train.push({
        id: "train:" + dimension,
        familyId: "train:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "train-left:" + dimension,
        rightStateId: "train-right:" + dimension,
      });
    });

    embeddings.set("ood-left", [99, 99, 99, 99, 99]);
    embeddings.set("ood-right", [-99, -99, -99, -99, -99]);

    const oodA: import("../src/r1/encoder-contract").R1LearnConstraintInput = {
      id: "ood:a",
      familyId: "ood:a",
      split: "ood",
      dimension: "threat",
      relation: "greater",
      leftStateId: "ood-left",
      rightStateId: "ood-right",
    };
    const oodB: import("../src/r1/encoder-contract").R1LearnConstraintInput = {
      ...oodA,
      id: "ood:b",
      leftStateId: "ood-right",
      rightStateId: "ood-left",
    };

    const withA = learnPrototypeBankHeads(embeddings, [...train, oodA]);
    const withB = learnPrototypeBankHeads(embeddings, [...train, oodB]);

    expect(withA).toEqual(withB);
    expect(withA.trainingCounts).toEqual({
      attention: 1,
      interrupt: 1,
      social: 1,
      threat: 1,
      cognition: 1,
    });
    expect(
      withA.anchors.threat.some(
        (anchor) =>
          anchor.higherStateId.startsWith("ood") ||
          anchor.lowerStateId.startsWith("ood"),
      ),
    ).toBe(false);
  });

  it("preserves exact equality for actor-indistinguishable states", async () => {
    const {
      evaluatePrototypeBankHeads,
      learnPrototypeBankHeads,
    } = await import("../src/r1/prototype-bank-head");
    const dimensions = [
      "attention",
      "interrupt",
      "social",
      "threat",
      "cognition",
    ] as const;
    const embeddings = new Map<string, readonly number[]>();
    const constraints: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    dimensions.forEach((dimension, index) => {
      const left = new Array<number>(6).fill(0);
      const right = new Array<number>(6).fill(0);
      left[index] = 1;
      right[index] = -1;
      embeddings.set("left:" + dimension, left);
      embeddings.set("right:" + dimension, right);
      constraints.push({
        id: "train:" + dimension,
        familyId: "train:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "left:" + dimension,
        rightStateId: "right:" + dimension,
      });
    });

    const same = [0.2, -0.1, 0.3, 0, 0.4, 0.7];
    embeddings.set("same-a", same);
    embeddings.set("same-b", [...same]);
    constraints.push({
      id: "ood:equal",
      familyId: "ood:equal",
      split: "ood",
      dimension: "threat",
      relation: "equal",
      leftStateId: "same-a",
      rightStateId: "same-b",
    });

    const head = learnPrototypeBankHeads(embeddings, constraints);
    const result = evaluatePrototypeBankHeads(
      head,
      embeddings,
      constraints,
    );
    const equality = result.constraints.find(
      (row) => row.id === "ood:equal",
    )!;

    expect(equality.margin).toBe(0);
    expect(equality.passed).toBe(true);
  });

  it("represents two local threat reasons that collapse a single summed direction", async () => {
    const {
      evaluatePrototypeBankHeads,
      learnPrototypeBankHeads,
    } = await import("../src/r1/prototype-bank-head");
    const { learnPrototypeHeads } = await import(
      "../src/r1/prototype-head"
    );

    const embeddings = new Map<string, readonly number[]>();
    const constraints: import("../src/r1/encoder-contract").R1LearnConstraintInput[] = [];

    const simpleDimensions = [
      "attention",
      "interrupt",
      "social",
      "cognition",
    ] as const;

    simpleDimensions.forEach((dimension, index) => {
      const y = 30 + index * 10;
      embeddings.set("high:" + dimension, [1, y]);
      embeddings.set("low:" + dimension, [-1, y]);
      constraints.push({
        id: "train:" + dimension,
        familyId: "train:" + dimension,
        split: "train",
        dimension,
        relation: "greater",
        leftStateId: "high:" + dimension,
        rightStateId: "low:" + dimension,
      });
    });

    // Two valid local threat reasons have opposite global x directions.
    embeddings.set("threat-a-high", [1, 0]);
    embeddings.set("threat-a-low", [-1, 0]);
    embeddings.set("threat-b-high", [-1, 10]);
    embeddings.set("threat-b-low", [1, 10]);

    constraints.push(
      {
        id: "train:threat-a",
        familyId: "train:threat-a",
        split: "train",
        dimension: "threat",
        relation: "greater",
        leftStateId: "threat-a-high",
        rightStateId: "threat-a-low",
      },
      {
        id: "train:threat-b",
        familyId: "train:threat-b",
        split: "train",
        dimension: "threat",
        relation: "greater",
        leftStateId: "threat-b-high",
        rightStateId: "threat-b-low",
      },
    );

    expect(() =>
      learnPrototypeHeads(embeddings, constraints),
    ).toThrow(/collapsed to zero/);

    const bank = learnPrototypeBankHeads(embeddings, constraints);
    const result = evaluatePrototypeBankHeads(
      bank,
      embeddings,
      constraints,
    );

    for (const id of ["train:threat-a", "train:threat-b"]) {
      const row = result.constraints.find((candidate) => candidate.id === id)!;
      expect(row.passed).toBe(true);
      expect(row.margin).toBeGreaterThan(0);
    }
  });
});
