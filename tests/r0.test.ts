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
import {
  buildImmediateResponsePrompt,
  distributionFromSelectedLogits,
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
  });

  it("normalizes only the declared action logits", () => {
    const distribution = distributionFromSelectedLogits([0, 1, 2, 3, 4]);
    const total = Object.values(distribution).reduce(
      (sum, value) => sum + value,
      0,
    );

    expect(total).toBeCloseTo(1, 10);
    expect(distribution.withdraw).toBeGreaterThan(distribution.investigate);
    expect(distribution.investigate).toBeGreaterThan(distribution.acknowledge);
    expect(distribution.acknowledge).toBeGreaterThan(distribution.orient);
    expect(distribution.orient).toBeGreaterThan(distribution.continue);
  });
});
