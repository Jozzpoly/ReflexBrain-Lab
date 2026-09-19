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
  buildImmediateResponsePrompt,
  chooseLocalQwenDtype,
  getImmediateResponseOptions,
  getLocalModelBackend,
  PERMUTATION_SWEEP_ORDERS,
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
