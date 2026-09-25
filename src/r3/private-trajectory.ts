import type {
  ResidentPrivateExperience,
  ResidentId,
} from "./life-contracts";

export interface R3PrivateTrajectoryWindow {
  residentId: ResidentId;
  history: readonly ResidentPrivateExperience[];
  future: ResidentPrivateExperience;
  horizonTicks: number;
}

/**
 * Build temporal supervision substrate without inventing a semantic ontology.
 *
 * A window is only "what this actor privately experienced for N frames" plus
 * its actual later private state. No threat/interrupt/relevance label exists.
 */
export function buildR3PrivateTrajectoryWindows(
  experiences: readonly ResidentPrivateExperience[],
  options: {
    historyLength?: number;
    horizonTicks?: number;
  } = {},
): readonly R3PrivateTrajectoryWindow[] {
  const historyLength = options.historyLength ?? 6;
  const horizonTicks = options.horizonTicks ?? 8;

  if (!Number.isSafeInteger(historyLength) || historyLength < 1) {
    throw new Error("historyLength must be a positive safe integer");
  }
  if (!Number.isSafeInteger(horizonTicks) || horizonTicks < 1) {
    throw new Error("horizonTicks must be a positive safe integer");
  }

  const byResident = new Map<ResidentId, ResidentPrivateExperience[]>();
  for (const experience of experiences) {
    const bucket = byResident.get(experience.residentId) ?? [];
    bucket.push(structuredClone(experience));
    byResident.set(experience.residentId, bucket);
  }

  const windows: R3PrivateTrajectoryWindow[] = [];

  for (const [residentId, raw] of byResident) {
    const rows = [...raw].sort((a, b) => a.tick - b.tick);
    const byTick = new Map(rows.map((row) => [row.tick, row]));

    for (let index = historyLength - 1; index < rows.length; index += 1) {
      const end = rows[index]!;
      const future = byTick.get(end.tick + horizonTicks);
      if (!future) continue;

      const history = rows.slice(index - historyLength + 1, index + 1);
      if (!isContiguous(history)) continue;

      windows.push({
        residentId,
        history: history.map((row) => structuredClone(row)),
        future: structuredClone(future),
        horizonTicks,
      });
    }
  }

  return windows.sort(
    (a, b) =>
      a.history[a.history.length - 1]!.tick -
        b.history[b.history.length - 1]!.tick ||
      a.residentId.localeCompare(b.residentId),
  );
}

/**
 * Semantic text deliberately excludes resident id and absolute tick so a
 * representation cannot solve temporal relations by identity/time tokens.
 * Exact geometry is not forced through language; a later hybrid path may add
 * actor-private structured channels separately.
 */
export function serializeR3PrivateExperience(
  experience: ResidentPrivateExperience,
): string {
  const lines = [
    "private embodied experience",
    "continuing matters: " +
      (experience.matters.length > 0
        ? experience.matters.map((matter) => matter.statement).join(" | ")
        : "none"),
    "activity: " +
      (experience.activityBefore
        ? experience.activityBefore.kind + " / " + experience.activityBefore.phase
        : "none"),
    "held object: " +
      (experience.observation.heldObject?.kind ?? "none"),
  ];

  const visibleObjectKinds = experience.observation.visibleObjects
    .map((object) => object.kind)
    .sort();
  lines.push(
    "visible objects: " +
      (visibleObjectKinds.length > 0
        ? visibleObjectKinds.join(", ")
        : "none"),
  );

  lines.push(
    "visible actors: " +
      (experience.observation.visibleActors.length > 0
        ? experience.observation.visibleActors.length
        : "none"),
  );

  const speech = experience.observation.heardEvents
    .filter((event) => event.kind === "speech")
    .map((event) =>
      typeof event.payload.text === "string"
        ? event.payload.text
        : "",
    )
    .filter((text) => text.length > 0);

  lines.push(
    "heard speech: " +
      (speech.length > 0 ? speech.map((text) => JSON.stringify(text)).join(" | ") : "none"),
  );

  return lines.join("\n");
}

export interface R3TemporalFactDelta {
  activityIdentityChanged: boolean;
  activityPhaseChanged: boolean;
  heldObjectChanged: boolean;
  visibleObjectKindsChanged: boolean;
  speechArrived: boolean;
  factualOutcomeKinds: readonly string[];
}

/**
 * Evaluation-only factual deltas. They are derived from the trajectory and are
 * not promoted as the semantic representation or required model outputs.
 */
export function deriveR3TemporalFactDelta(
  window: R3PrivateTrajectoryWindow,
): R3TemporalFactDelta {
  const anchor = window.history[window.history.length - 1]!;
  const future = window.future;

  return {
    activityIdentityChanged:
      anchor.activityBefore?.id !== future.activityBefore?.id,
    activityPhaseChanged:
      anchor.activityBefore?.phase !== future.activityBefore?.phase,
    heldObjectChanged:
      anchor.observation.heldObject?.id !== future.observation.heldObject?.id,
    visibleObjectKindsChanged:
      canonicalKinds(anchor) !== canonicalKinds(future),
    speechArrived: future.observation.heardEvents.some(
      (event) => event.kind === "speech",
    ),
    factualOutcomeKinds: future.factualOutcomeEvents.map(
      (event) => event.kind,
    ),
  };
}

function isContiguous(
  history: readonly ResidentPrivateExperience[],
): boolean {
  for (let index = 1; index < history.length; index += 1) {
    if (history[index]!.tick !== history[index - 1]!.tick + 1) {
      return false;
    }
  }
  return true;
}

function canonicalKinds(experience: ResidentPrivateExperience): string {
  return experience.observation.visibleObjects
    .map((object) => object.kind)
    .sort()
    .join("|");
}
