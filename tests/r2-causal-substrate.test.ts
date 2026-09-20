import { describe, expect, it } from "vitest";
import { createR2ChallengeSpaceV0 } from "../src/r2/challenge-space";
import type { CausalEpisodeFrame } from "../src/r2/causal-contracts";
import { buildCausalMicroscope } from "../src/r2/causal-microscope";
import { validateCausalEpisode } from "../src/r2/causal-validation";
import type { OracleClaim } from "../src/r2/oracle-ladder";
import {
  oraclePayload,
  validateOracleBoundary,
} from "../src/r2/oracle-ladder";

describe("R2 causal organism substrate", () => {
  const challenges = createR2ChallengeSpaceV0();

  it("expands causal distinctions without requiring a replacement score ontology", () => {
    expect(challenges.map((challenge) => challenge.family)).toEqual([
      "same_event_different_history",
      "same_world_different_knowledge",
      "same_motion_different_provenance",
      "same_message_different_activity",
      "actuality_and_applicability",
      "interruption_and_resumption",
      "supersession",
    ]);

    const serialized = JSON.stringify(challenges);
    expect(serialized).not.toContain("attentionPlayer");
    expect(serialized).not.toContain("interruptCurrent");
    expect(serialized).not.toContain("socialRelevance");
    expect(serialized).not.toContain("deeperCognition");
    expect(serialized).not.toContain('"threat":');
    expect(serialized).not.toContain('"significance":');
  });

  it("qualifies all initial challenge variants as causally well-formed episodes", () => {
    for (const challenge of challenges) {
      for (const variant of challenge.variants) {
        expect(() => validateCausalEpisode(variant.frames)).not.toThrow();
      }
    }
  });

  it("holds the current event and observation constant while private history changes", () => {
    const challenge = challenges[0]!;
    const left = challenge.variants[0]!.frames.at(-1)!;
    const right = challenge.variants[1]!.frames.at(-1)!;

    expect(left.world).toEqual(right.world);
    expect(left.privateByActor["resident:mira"]!.observations).toEqual(
      right.privateByActor["resident:mira"]!.observations,
    );
    expect(left.privateByActor["resident:mira"]!.activity).toEqual(
      right.privateByActor["resident:mira"]!.activity,
    );
    expect(left.privateByActor["resident:mira"]!.history).not.toEqual(
      right.privateByActor["resident:mira"]!.history,
    );
  });

  it("keeps identical World truth hidden from an actor with no observation path", () => {
    const challenge = challenges[1]!;
    const seen = challenge.variants[0]!.frames[0]!;
    const unseen = challenge.variants[1]!.frames[0]!;

    expect(seen.world).toEqual(unseen.world);
    expect(seen.privateByActor["resident:mira"]!.observations).toHaveLength(1);
    expect(unseen.privateByActor["resident:mira"]!.observations).toHaveLength(0);
  });

  it("keeps identical observed motion compatible with different World provenance", () => {
    const challenge = challenges[2]!;
    const ownerOrigin = challenge.variants[0]!.frames[0]!;
    const externalOrigin = challenge.variants[1]!.frames[0]!;

    expect(ownerOrigin.privateByActor["resident:mira"]!.observations).toEqual(
      externalOrigin.privateByActor["resident:mira"]!.observations,
    );
    expect(ownerOrigin.world.events[0]!.kind).toBe("control.requested_motion");
    expect(externalOrigin.world.events[0]!.kind).toBe("body.external_impulse");
  });

  it("keeps identical speech while varying only the ongoing activity context", () => {
    const challenge = challenges[3]!;
    const low = challenge.variants[0]!.frames[0]!;
    const committed = challenge.variants[1]!.frames[0]!;

    expect(low.world).toEqual(committed.world);
    expect(low.privateByActor["resident:mira"]!.observations).toEqual(
      committed.privateByActor["resident:mira"]!.observations,
    );
    expect(low.privateByActor["resident:mira"]!.activity?.kind).not.toBe(
      committed.privateByActor["resident:mira"]!.activity?.kind,
    );
  });

  it("preserves activity identity across a transient hazard episode", () => {
    const challenge = challenges[5]!;
    const ids = challenge.variants[0]!.frames.map(
      (frame) => frame.privateByActor["resident:mira"]!.activity?.id,
    );
    expect(ids).toEqual([
      "activity:carry-crate",
      "activity:carry-crate",
      "activity:carry-crate",
    ]);
  });

  it("keeps both directive and later cancellation in private causal history before stale-looking playback", () => {
    const challenge = challenges[6]!;
    const last = challenge.variants[0]!.frames.at(-1)!;
    expect(
      last.privateByActor["resident:mira"]!.history.map((entry) => entry.id),
    ).toEqual(["history:gate-order", "history:gate-cancel"]);
  });

  it("builds a neutral microscope without adding inferred cognitive labels", () => {
    const challenge = challenges[6]!;
    const rows = buildCausalMicroscope(challenge.variants[0]!.frames);
    const serialized = JSON.stringify(rows);

    expect(rows.some((row) => row.kind === "world_event")).toBe(true);
    expect(rows.some((row) => row.kind === "observation")).toBe(true);
    expect(rows.some((row) => row.kind === "history")).toBe(true);
    expect(rows.some((row) => row.kind === "activity")).toBe(true);
    expect(serialized).not.toContain("salience");
    expect(serialized).not.toContain("threat");
    expect(serialized).not.toContain("interrupt");
    expect(serialized).not.toContain("significance");
  });

  it("rejects private evidence that cites a future causal event", () => {
    const frames: readonly CausalEpisodeFrame[] = [
      {
        world: { tick: 1, events: [], facts: [] },
        privateByActor: {
          "resident:mira": {
            actorId: "resident:mira",
            tick: 1,
            observations: [
              {
                id: "obs:future-cheat",
                actorId: "resident:mira",
                tick: 1,
                channel: "vision",
                provenanceEventIds: ["event:future"],
                kind: "future_cheat",
                payload: {},
              },
            ],
            history: [],
            activity: null,
          },
        },
      },
      {
        world: {
          tick: 2,
          events: [
            {
              id: "event:future",
              tick: 2,
              kind: "appears_later",
              sourceEntityId: null,
              targetEntityIds: [],
              payload: {},
            },
          ],
          facts: [],
        },
        privateByActor: {
          "resident:mira": {
            actorId: "resident:mira",
            tick: 2,
            observations: [],
            history: [],
            activity: null,
          },
        },
      },
    ];

    expect(() => validateCausalEpisode(frames)).toThrow(
      /references unknown causal event/,
    );
  });

  it("allows World-truth authority only for an explicit perception oracle", () => {
    const frame = challenges[1]!.variants[0]!.frames[0]!.privateByActor[
      "resident:mira"
    ]!;

    const perceptionOracle: OracleClaim = {
      id: "oracle:perception",
      actorId: frame.actorId,
      tick: frame.tick,
      layer: "perception",
      inputAuthority: "world_truth",
      evidenceRefs: [],
      payload: oraclePayload({ visible: true }),
    };

    expect(() =>
      validateOracleBoundary(perceptionOracle, frame),
    ).not.toThrow();

    const illegalSignificanceOracle: OracleClaim = {
      ...perceptionOracle,
      id: "oracle:illegal-significance",
      layer: "actor_relative_significance",
    };

    expect(() =>
      validateOracleBoundary(illegalSignificanceOracle, frame),
    ).toThrow(/must not use hidden World authority/);
  });

  it("requires post-perception oracle claims to cite actor-private evidence", () => {
    const frame = challenges[0]!.variants[0]!.frames.at(-1)!.privateByActor[
      "resident:mira"
    ]!;

    const grounded: OracleClaim = {
      id: "oracle:grounded",
      actorId: frame.actorId,
      tick: frame.tick,
      layer: "actor_relative_significance",
      inputAuthority: "actor_private",
      evidenceRefs: [
        { kind: "observation", id: "obs:janek-entered" },
        { kind: "history", id: "history:janek-tool-return" },
        { kind: "activity", id: "activity:sort" },
      ],
      payload: oraclePayload({ researchFixture: "significance-diff" }),
    };

    expect(() => validateOracleBoundary(grounded, frame)).not.toThrow();

    expect(() =>
      validateOracleBoundary(
        {
          ...grounded,
          id: "oracle:ungrounded",
          evidenceRefs: [{ kind: "history", id: "history:hidden-world-cheat" }],
        },
        frame,
      ),
    ).toThrow(/unavailable actor-private evidence/);
  });
});
