import type {
  ActorPrivateFrame,
  CausalEpisodeFrame,
  CausalEventId,
} from "./causal-contracts";

/**
 * Qualify authored R2 episode fixtures before any candidate brain sees them.
 *
 * This validator proves only causal bookkeeping properties. It does not claim
 * that an observation was physically possible; the future perception/world
 * substrate must provide that stronger evidence.
 */
export function validateCausalEpisode(
  frames: readonly CausalEpisodeFrame[],
): void {
  if (frames.length === 0) throw new Error("causal episode must contain frames");

  let previousTick = Number.NEGATIVE_INFINITY;
  const eventTickById = new Map<CausalEventId, number>();

  for (const frame of frames) {
    const tick = frame.world.tick;
    if (!Number.isFinite(tick)) throw new Error("world tick must be finite");
    if (tick <= previousTick) {
      throw new Error("causal episode ticks must be strictly increasing");
    }
    previousTick = tick;

    for (const event of frame.world.events) {
      if (event.tick !== tick) {
        throw new Error("World event tick does not match containing frame");
      }
      if (eventTickById.has(event.id)) {
        throw new Error("duplicate causal event id: " + event.id);
      }
      eventTickById.set(event.id, event.tick);
    }

    for (const fact of frame.world.facts) {
      if (fact.tick !== tick) {
        throw new Error("World fact tick does not match containing frame");
      }
      assertPastOrPresentEvents(
        fact.provenanceEventIds,
        tick,
        eventTickById,
        "World fact",
      );
    }

    for (const [actorKey, privateFrame] of Object.entries(
      frame.privateByActor,
    )) {
      validatePrivateFrame(actorKey, privateFrame, tick, eventTickById);
    }
  }
}

function validatePrivateFrame(
  actorKey: string,
  privateFrame: ActorPrivateFrame,
  worldTick: number,
  eventTickById: ReadonlyMap<CausalEventId, number>,
): void {
  if (privateFrame.actorId !== actorKey) {
    throw new Error("private frame actor id does not match record key");
  }
  if (privateFrame.tick !== worldTick) {
    throw new Error("private frame tick does not match World tick");
  }

  for (const observation of privateFrame.observations) {
    if (observation.actorId !== actorKey) {
      throw new Error("observation actor does not match private frame");
    }
    if (observation.tick !== worldTick) {
      throw new Error("observation tick does not match private frame");
    }
    assertPastOrPresentEvents(
      observation.provenanceEventIds,
      worldTick,
      eventTickById,
      "private observation",
    );
  }

  for (const history of privateFrame.history) {
    if (history.actorId !== actorKey) {
      throw new Error("history actor does not match private frame");
    }
    if (history.recordedTick > worldTick) {
      throw new Error("private history cannot be recorded in the future");
    }
    assertPastOrPresentEvents(
      history.provenanceEventIds,
      history.recordedTick,
      eventTickById,
      "private history",
    );
  }

  if (privateFrame.activity && privateFrame.activity.actorId !== actorKey) {
    throw new Error("ongoing activity actor does not match private frame");
  }
  if (
    privateFrame.activity &&
    privateFrame.activity.startedTick > privateFrame.tick
  ) {
    throw new Error("ongoing activity cannot start in the future");
  }
}

function assertPastOrPresentEvents(
  eventIds: readonly CausalEventId[],
  maximumTick: number,
  eventTickById: ReadonlyMap<CausalEventId, number>,
  label: string,
): void {
  for (const id of eventIds) {
    const sourceTick = eventTickById.get(id);
    if (sourceTick === undefined) {
      throw new Error(label + " references unknown causal event: " + id);
    }
    if (sourceTick > maximumTick) {
      throw new Error(label + " references future causal event: " + id);
    }
  }
}
