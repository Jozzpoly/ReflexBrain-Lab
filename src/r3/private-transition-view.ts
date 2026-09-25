import type {
  MaterialKind,
  ResidentPrivateExperience,
} from "./life-contracts";

export interface R3PrivateTransitionFrame {
  semanticText: string;
  changed: boolean;
}

/**
 * Actor-private temporal change view.
 *
 * This deliberately excludes:
 * - matter text / matter ids;
 * - resident ids;
 * - activity / fixture policy labels;
 * - decision / intent;
 * - factual World outcomes;
 * - exact positions and absolute ticks.
 *
 * It may only describe facts derivable from two consecutive private states.
 */
export function serializeR3PrivateTransition(
  previous: ResidentPrivateExperience,
  current: ResidentPrivateExperience,
): R3PrivateTransitionFrame {
  if (previous.residentId !== current.residentId) {
    throw new Error(
      "private transition requires the same resident",
    );
  }

  const changes: string[] = [];

  appendHeldChange(changes, previous, current);
  appendVisibleActorChange(changes, previous, current);
  appendVisibleMaterialChange(changes, previous, current);
  appendActorMemoryChange(changes, previous, current);
  appendObjectMemoryChange(changes, previous, current);
  appendSpeech(changes, current);

  const changed = changes.length > 0;
  return {
    semanticText: [
      "private temporal change",
      "visible actors now: " +
        current.observation.visibleActors.length,
      "held material now: " +
        materialKindText(
          current.observation.heldObject?.kind ?? null,
        ),
      ...(changed ? changes : ["no new private change"]),
    ].join("\n"),
    changed,
  };
}

function appendHeldChange(
  output: string[],
  previous: ResidentPrivateExperience,
  current: ResidentPrivateExperience,
): void {
  const before = previous.observation.heldObject;
  const after = current.observation.heldObject;

  if (before?.id === after?.id && before?.kind === after?.kind) {
    return;
  }

  if (!before && after) {
    output.push(
      "began holding " + materialKindText(after.kind),
    );
    return;
  }

  if (before && !after) {
    output.push(
      "stopped holding " + materialKindText(before.kind),
    );
    return;
  }

  if (before && after && before.kind !== after.kind) {
    output.push(
      "held material changed from " +
        materialKindText(before.kind) +
        " to " +
        materialKindText(after.kind),
    );
    return;
  }

  if (before && after && before.id !== after.id) {
    output.push(
      "held object identity changed while remaining " +
        materialKindText(after.kind),
    );
  }
}

function appendVisibleActorChange(
  output: string[],
  previous: ResidentPrivateExperience,
  current: ResidentPrivateExperience,
): void {
  const before = new Set(
    previous.observation.visibleActors.map((actor) => actor.id),
  );
  const after = new Set(
    current.observation.visibleActors.map((actor) => actor.id),
  );

  const entered = [...after].filter((id) => !before.has(id)).length;
  const left = [...before].filter((id) => !after.has(id)).length;

  if (entered > 0) {
    output.push(
      entered === 1
        ? "another actor entered sight"
        : entered + " actors entered sight",
    );
  }
  if (left > 0) {
    output.push(
      left === 1
        ? "another actor left sight"
        : left + " actors left sight",
    );
  }
}

function appendVisibleMaterialChange(
  output: string[],
  previous: ResidentPrivateExperience,
  current: ResidentPrivateExperience,
): void {
  for (const kind of [
    "raw_blank",
    "finished_part",
  ] as const) {
    const before = previous.observation.visibleObjects.filter(
      (object) => object.kind === kind,
    ).length;
    const after = current.observation.visibleObjects.filter(
      (object) => object.kind === kind,
    ).length;

    if (after > before) {
      output.push(
        materialKindText(kind) +
          " visible count increased",
      );
    } else if (after < before) {
      output.push(
        materialKindText(kind) +
          " visible count decreased",
      );
    }
  }
}

function appendActorMemoryChange(
  output: string[],
  previous: ResidentPrivateExperience,
  current: ResidentPrivateExperience,
): void {
  let learned = 0;
  let located = 0;
  let invalidated = 0;
  let updated = 0;

  const ids = new Set([
    ...Object.keys(previous.memory.actorBeliefs),
    ...Object.keys(current.memory.actorBeliefs),
  ]);

  for (const id of ids) {
    const before = previous.memory.actorBeliefs[id];
    const after = current.memory.actorBeliefs[id];

    if (!before && after) {
      learned += 1;
      if (after.lastKnownPosition) located += 1;
      continue;
    }
    if (!before || !after) continue;

    const beforePosition = before.lastKnownPosition;
    const afterPosition = after.lastKnownPosition;

    if (!beforePosition && afterPosition) {
      located += 1;
    } else if (beforePosition && !afterPosition) {
      invalidated += 1;
    } else if (
      beforePosition &&
      afterPosition &&
      (
        beforePosition.x !== afterPosition.x ||
        beforePosition.y !== afterPosition.y
      )
    ) {
      updated += 1;
    }
  }

  if (learned > 0) {
    output.push(
      learned === 1
        ? "learned about another actor"
        : "learned about multiple actors",
    );
  }
  if (located > 0) {
    output.push(
      located === 1
        ? "gained a last-known actor location"
        : "gained multiple last-known actor locations",
    );
  }
  if (updated > 0) {
    output.push(
      updated === 1
        ? "updated a known actor location"
        : "updated multiple known actor locations",
    );
  }
  if (invalidated > 0) {
    output.push(
      invalidated === 1
        ? "invalidated a stale actor location"
        : "invalidated multiple stale actor locations",
    );
  }
}

function appendObjectMemoryChange(
  output: string[],
  previous: ResidentPrivateExperience,
  current: ResidentPrivateExperience,
): void {
  let learned = 0;
  let located = 0;
  let invalidated = 0;

  const ids = new Set([
    ...Object.keys(previous.memory.objectBeliefs),
    ...Object.keys(current.memory.objectBeliefs),
  ]);

  for (const id of ids) {
    const before = previous.memory.objectBeliefs[id];
    const after = current.memory.objectBeliefs[id];

    if (!before && after) {
      learned += 1;
      if (after.lastKnownLocation) located += 1;
      continue;
    }
    if (!before || !after) continue;

    if (!before.lastKnownLocation && after.lastKnownLocation) {
      located += 1;
    } else if (
      before.lastKnownLocation &&
      !after.lastKnownLocation
    ) {
      invalidated += 1;
    }
  }

  if (learned > 0) {
    output.push(
      learned === 1
        ? "learned about a material object"
        : "learned about multiple material objects",
    );
  }
  if (located > 0) {
    output.push(
      located === 1
        ? "gained a remembered material location"
        : "gained multiple remembered material locations",
    );
  }
  if (invalidated > 0) {
    output.push(
      invalidated === 1
        ? "invalidated a stale material location"
        : "invalidated multiple stale material locations",
    );
  }
}

function appendSpeech(
  output: string[],
  current: ResidentPrivateExperience,
): void {
  for (const event of current.observation.heardEvents) {
    if (event.kind !== "speech") continue;
    const text =
      typeof event.payload.text === "string"
        ? event.payload.text.trim()
        : "";
    if (text.length > 0) {
      output.push("heard speech " + JSON.stringify(text));
    }
  }
}

function materialKindText(
  kind: MaterialKind | null,
): string {
  if (kind === null) return "none";
  switch (kind) {
    case "raw_blank":
      return "raw blank";
    case "finished_part":
      return "finished part";
  }
}
