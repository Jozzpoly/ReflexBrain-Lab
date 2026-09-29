import { createAutonomousContactRun } from "./autonomous-contact-run";
import { createAutonomousLifeRun } from "./autonomous-life-run";
import type {
  MaterialKind,
  ResidentId,
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  buildR3PrivateTrajectoryWindows,
  deriveR3TemporalFactDelta,
  type R3TemporalFactDelta,
} from "./private-trajectory";

export type R3EcologyId = "material-work" | "moving-contact";

export interface R3StructuredPrivateLearningFrame {
  hasOngoingActivity: boolean;
  heldObjectPresent: boolean;
  visibleActorCount: number;
  visibleObjectCount: number;
  rememberedActorCount: number;
  locatedActorContactCount: number;
  rememberedObjectCount: number;
  locatedObjectCount: number;
}

export interface R3PrivateLearningFrame {
  semanticText: string;
  structured: R3StructuredPrivateLearningFrame;
}

export interface R3LearningInput {
  history: readonly R3PrivateLearningFrame[];
}

export interface R3LearningEvaluation {
  futureDelta: R3TemporalFactDelta;
}

export interface R3LearningExample {
  id: string;
  ecology: R3EcologyId;
  residentId: ResidentId;
  anchorTick: number;
  input: R3LearningInput;
  evaluation: R3LearningEvaluation;
}

export interface R3CrossEcologyCorpus {
  examples: readonly R3LearningExample[];
}

export function buildR3CrossEcologyCorpus(options: {
  materialTicks?: number;
  contactTicks?: number;
  historyLength?: number;
  horizonTicks?: number;
} = {}): R3CrossEcologyCorpus {
  const material = createAutonomousLifeRun();
  material.runTicks(options.materialTicks ?? 420);

  const contact = createAutonomousContactRun();
  contact.runTicks(options.contactTicks ?? 420);

  const historyLength = options.historyLength ?? 6;
  const horizonTicks = options.horizonTicks ?? 8;

  return {
    examples: [
      ...examplesForEcology(
        "material-work",
        material.privateExperiences(),
        historyLength,
        horizonTicks,
      ),
      ...examplesForEcology(
        "moving-contact",
        contact.privateExperiences(),
        historyLength,
        horizonTicks,
      ),
    ],
  };
}

export function splitR3CorpusByHeldOutEcology(
  corpus: R3CrossEcologyCorpus,
  heldOutEcology: R3EcologyId,
): {
  train: readonly R3LearningExample[];
  heldOut: readonly R3LearningExample[];
} {
  return {
    train: corpus.examples.filter(
      (example) => example.ecology !== heldOutEcology,
    ),
    heldOut: corpus.examples.filter(
      (example) => example.ecology === heldOutEcology,
    ),
  };
}

/**
 * Learning semantic text intentionally contains only actor-private semantic
 * content that is legitimate at inference time.
 *
 * Excluded on purpose:
 * - resident id;
 * - absolute tick;
 * - ecology id;
 * - fixture activity kind/phase/id;
 * - World outcome names;
 * - exact geometry that belongs in structured channels.
 */
export function serializeR3SemanticLearningFrame(
  experience: ResidentPrivateExperience,
): string {
  const matterStatements = experience.matters
    .map((matter) => matter.statement.trim())
    .filter((statement) => statement.length > 0);

  const speech = experience.observation.heardEvents
    .filter((event) => event.kind === "speech")
    .map((event) =>
      typeof event.payload.text === "string"
        ? event.payload.text.trim()
        : "",
    )
    .filter((text) => text.length > 0);

  const visibleKinds = experience.observation.visibleObjects
    .map((object) => materialKindText(object.kind))
    .sort();

  const heldKind = experience.observation.heldObject
    ? materialKindText(experience.observation.heldObject.kind)
    : "none";

  return [
    "private semantic context",
    "continuing matters: " +
      (matterStatements.length > 0
        ? matterStatements.join(" | ")
        : "none"),
    "held material kind: " + heldKind,
    "visible material kinds: " +
      (visibleKinds.length > 0
        ? visibleKinds.join(", ")
        : "none"),
    "heard speech: " +
      (speech.length > 0
        ? speech.map((text) => JSON.stringify(text)).join(" | ")
        : "none"),
  ].join("\n");
}

export function structuredR3PrivateLearningFrame(
  experience: ResidentPrivateExperience,
): R3StructuredPrivateLearningFrame {
  const actorBeliefs = Object.values(experience.memory.actorBeliefs);
  const objectBeliefs = Object.values(experience.memory.objectBeliefs);

  return {
    hasOngoingActivity: experience.activityBefore !== null,
    heldObjectPresent: experience.observation.heldObject !== null,
    visibleActorCount: experience.observation.visibleActors.length,
    visibleObjectCount: experience.observation.visibleObjects.length,
    rememberedActorCount: actorBeliefs.length,
    locatedActorContactCount: actorBeliefs.filter(
      (belief) => belief.lastKnownPosition !== null,
    ).length,
    rememberedObjectCount: objectBeliefs.length,
    locatedObjectCount: objectBeliefs.filter(
      (belief) => belief.lastKnownLocation !== null,
    ).length,
  };
}

function examplesForEcology(
  ecology: R3EcologyId,
  experiences: readonly ResidentPrivateExperience[],
  historyLength: number,
  horizonTicks: number,
): R3LearningExample[] {
  return buildR3PrivateTrajectoryWindows(experiences, {
    historyLength,
    horizonTicks,
  }).map((window) => {
    const anchor = window.history[window.history.length - 1]!;
    return {
      id:
        "r3:" +
        ecology +
        ":" +
        window.residentId +
        ":" +
        anchor.tick,
      ecology,
      residentId: window.residentId,
      anchorTick: anchor.tick,
      input: {
        history: window.history.map((experience) => ({
          semanticText: serializeR3SemanticLearningFrame(experience),
          structured: structuredR3PrivateLearningFrame(experience),
        })),
      },
      evaluation: {
        futureDelta: deriveR3TemporalFactDelta(window),
      },
    };
  });
}

function materialKindText(kind: MaterialKind): string {
  switch (kind) {
    case "raw_blank":
      return "raw blank";
    case "finished_part":
      return "finished part";
  }
}
