import type { WorldActor, WorldEvent, WorldSnapshot } from "./contracts";

const DT = 0.5;
const RESIDENT_ID = "resident:jan";
const PLAYER_ID = "player";

export interface Episode {
  readonly id: string;
  readonly title: string;
  readonly frames: readonly WorldSnapshot[];
}

export type SpeechExposure = "addressed" | "overheard" | "none";

export interface R0EpisodeOptions {
  speechExposure: SpeechExposure;
  hiddenOpeningSpeech?: boolean;
}

export function createLowStakesAddressEpisode(): Episode {
  return createR0CounterfactualEpisode({ speechExposure: "addressed" });
}

export function createR0CounterfactualEpisode(
  options: R0EpisodeOptions,
): Episode {
  let resident = actor(RESIDENT_ID, "resident", 0, 0, 0, 0);
  let player = actor(PLAYER_ID, "player", 520, 0, -80, 0);
  const frames: WorldSnapshot[] = [];
  let taskProgress = 0;

  for (let tick = 0; tick <= 16; tick += 1) {
    const events: WorldEvent[] = [];

    if (tick === 0) player = actor(PLAYER_ID, "player", 520, 0, -80, 0);
    if (tick === 4) player = actor(PLAYER_ID, "player", 360, 0, -100, 0);
    if (tick === 7) player = actor(PLAYER_ID, "player", 210, 0, -40, 0);
    if (tick === 9) player = actor(PLAYER_ID, "player", 150, 0, 0, 0);

    if (tick === 0 && options.hiddenOpeningSpeech) {
      events.push({
        id: "speech:hidden-opening",
        tick,
        kind: "speech",
        sourceActorId: PLAYER_ID,
        targetActorId: RESIDENT_ID,
        text: "This exists in World truth but is outside the resident's current sensory range.",
      });
    }

    if (tick === 10 && options.speechExposure !== "none") {
      events.push({
        id: "speech:hello:" + options.speechExposure,
        tick,
        kind: "speech",
        sourceActorId: PLAYER_ID,
        targetActorId:
          options.speechExposure === "addressed" ? RESIDENT_ID : null,
        text: "Hey, got a second?",
      });
    }

    if (tick === 12) player = actor(PLAYER_ID, "player", 170, 0, 80, 0);

    taskProgress = Math.min(1, taskProgress + 0.035);
    events.push({
      id: "task:" + tick,
      tick,
      kind: "task_progress",
      sourceActorId: RESIDENT_ID,
      targetActorId: RESIDENT_ID,
      text: null,
    });

    frames.push({
      tick,
      actors: [structuredClone(resident), structuredClone(player)],
      events,
      taskProgress,
    });

    resident = integrate(resident, DT);
    player = integrate(player, DT);
  }

  return {
    id: "low-stakes-" + options.speechExposure +
      (options.hiddenOpeningSpeech ? "-hidden-opening" : ""),
    title:
      options.speechExposure === "addressed"
        ? "Own task vs low-stakes addressed player interruption"
        : options.speechExposure === "overheard"
          ? "Own task vs identical overheard player speech"
          : "Own task vs silent player pass-by",
    frames,
  };
}

function actor(
  id: string,
  kind: WorldActor["kind"],
  x: number,
  y: number,
  vx: number,
  vy: number,
): WorldActor {
  return {
    id,
    kind,
    position: { x, y },
    velocity: { x: vx, y: vy },
    facingRadians: vx === 0 && vy === 0 ? 0 : Math.atan2(vy, vx),
  };
}

function integrate(value: WorldActor, dt: number): WorldActor {
  return {
    ...value,
    position: {
      x: value.position.x + value.velocity.x * dt,
      y: value.position.y + value.velocity.y * dt,
    },
  };
}
