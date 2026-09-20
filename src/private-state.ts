import type {
  ActorPrivateState,
  Percept,
  SpeechPercept,
  VisibleActorPercept,
  WorldActor,
  WorldSnapshot,
} from "./contracts";
import { distance } from "./math";

const RESIDENT_ID = "resident:jan";
const PLAYER_ID = "player";
const MAX_SIGHT = 420;

export function compilePrivateState(
  world: WorldSnapshot,
  recentFocus: ActorPrivateState["recentFocus"],
): ActorPrivateState {
  const self = requiredActor(world, RESIDENT_ID);
  const player = requiredActor(world, PLAYER_ID);
  const percepts: Percept[] = [];
  const d = distance(
    self.position.x,
    self.position.y,
    player.position.x,
    player.position.y,
  );

  if (d <= MAX_SIGHT) percepts.push(visiblePlayer(self, player, d));

  for (const event of world.events) {
    if (event.kind !== "speech" || event.sourceActorId !== PLAYER_ID || !event.text) continue;
    if (d > MAX_SIGHT) continue;

    const percept: SpeechPercept = {
      kind: "speech",
      sourceActorId: PLAYER_ID,
      addressed: event.targetActorId === RESIDENT_ID,
      text: event.text,
    };
    percepts.push(percept);
  }

  return {
    tick: world.tick,
    self: {
      id: RESIDENT_ID,
      currentTask: "sort_crates",
      taskProgress: world.taskProgress,
      taskUrgency: 0.55,
    },
    percepts,
    recentFocus,
  };
}

function visiblePlayer(
  self: WorldActor,
  player: WorldActor,
  d: number,
): VisibleActorPercept {
  const relativeX = player.position.x - self.position.x;
  const relativeY = player.position.y - self.position.y;
  const radialDirection =
    d <= 1e-6 ? { x: 0, y: 0 } : { x: relativeX / d, y: relativeY / d };
  const relativeVelocity = {
    x: player.velocity.x - self.velocity.x,
    y: player.velocity.y - self.velocity.y,
  };
  const closingSpeed = -(
    relativeVelocity.x * radialDirection.x +
    relativeVelocity.y * radialDirection.y
  );

  return {
    kind: "visible_actor",
    actorId: PLAYER_ID,
    distanceBand: d < 170 ? "near" : d < 300 ? "mid" : "far",
    approachSpeed: closingSpeed,
    relativeBearingRadians:
      Math.atan2(relativeY, relativeX) - self.facingRadians,
  };
}

function requiredActor(world: WorldSnapshot, id: string): WorldActor {
  const found = world.actors.find((actorValue) => actorValue.id === id);
  if (!found) throw new Error("missing actor " + id);
  return found;
}
