import type { CausalEpisodeFrame } from "./causal-contracts";

export type CausalMicroscopeScope = "world" | "private";

export interface CausalMicroscopeRow {
  tick: number;
  scope: CausalMicroscopeScope;
  actorId: string | null;
  kind: "world_event" | "world_fact" | "observation" | "history" | "activity";
  id: string;
  semanticKind: string;
  provenanceEventIds: readonly string[];
}

/**
 * Neutral causal microscope.
 *
 * It exposes authored/replayed causal bookkeeping only. It does not infer
 * salience, significance, intent, policy, threat or cognition need.
 */
export function buildCausalMicroscope(
  frames: readonly CausalEpisodeFrame[],
): readonly CausalMicroscopeRow[] {
  const rows: CausalMicroscopeRow[] = [];

  for (const frame of frames) {
    for (const event of frame.world.events) {
      rows.push({
        tick: frame.world.tick,
        scope: "world",
        actorId: null,
        kind: "world_event",
        id: event.id,
        semanticKind: event.kind,
        provenanceEventIds: [],
      });
    }

    for (const fact of frame.world.facts) {
      rows.push({
        tick: frame.world.tick,
        scope: "world",
        actorId: null,
        kind: "world_fact",
        id: fact.id,
        semanticKind: fact.kind,
        provenanceEventIds: [...fact.provenanceEventIds],
      });
    }

    for (const privateFrame of Object.values(frame.privateByActor)) {
      for (const observation of privateFrame.observations) {
        rows.push({
          tick: privateFrame.tick,
          scope: "private",
          actorId: privateFrame.actorId,
          kind: "observation",
          id: observation.id,
          semanticKind: observation.kind,
          provenanceEventIds: [...observation.provenanceEventIds],
        });
      }

      for (const history of privateFrame.history) {
        rows.push({
          tick: privateFrame.tick,
          scope: "private",
          actorId: privateFrame.actorId,
          kind: "history",
          id: history.id,
          semanticKind: history.kind,
          provenanceEventIds: [...history.provenanceEventIds],
        });
      }

      if (privateFrame.activity) {
        rows.push({
          tick: privateFrame.tick,
          scope: "private",
          actorId: privateFrame.actorId,
          kind: "activity",
          id: privateFrame.activity.id,
          semanticKind:
            privateFrame.activity.kind + ":" + privateFrame.activity.phase,
          provenanceEventIds: [],
        });
      }
    }
  }

  return rows;
}
