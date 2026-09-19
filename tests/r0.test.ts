import { describe, expect, it } from "vitest";
import type { ActorPrivateState, ReflexProvider } from "../src/contracts";
import { createLowStakesAddressEpisode } from "../src/episode";
import {
  initialReflexDynamicsState,
  stepReflexDynamics,
} from "../src/reflex-dynamics";
import { RuleBaselineProvider } from "../src/rule-provider";
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
