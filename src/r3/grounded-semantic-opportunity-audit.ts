import type {
  ResidentId,
  ResidentPrivateExperience,
  Vec2,
} from "./life-contracts";
import { distance } from "./life-world";
import { R3_LIFE_PLACES } from "./autonomous-life-run";

export type R3MaterialFactFamily =
  | "input_rack_has_raw"
  | "source_has_raw"
  | "output_has_finished"
  | "depot_has_finished";

export interface R3BooleanEpisodeStats {
  observedTicks: number;
  trueTicks: number;
  falseTicks: number;
  trueEpisodes: number;
  falseEpisodes: number;
  transitions: number;
  observedBothTruthValues: boolean;
}

export interface R3MaterialFactResidentAudit
  extends R3BooleanEpisodeStats {
  family: R3MaterialFactFamily;
  residentId: ResidentId;
}

export interface R3ContactPairAudit
  extends R3BooleanEpisodeStats {
  family: "coworker_nearby";
  observerId: ResidentId;
  targetId: ResidentId;
}

export interface R3SemanticFactFamilySummary {
  family: R3MaterialFactFamily | "coworker_nearby";
  observersWithBothTruthValues: number;
  maxTrueEpisodes: number;
  maxFalseEpisodes: number;
  maxTransitions: number;
  recurrentBothWays: boolean;
}

export type R3GroundedSemanticOpportunityClassification =
  | "GROUNDED_SEMANTIC_DIVERSITY_SEED_AVAILABLE"
  | "GROUNDED_SEMANTIC_DIVERSITY_TOO_NARROW";

export interface R3GroundedSemanticOpportunityAudit {
  ticks: number;
  matters: Readonly<
    Record<
      ResidentId,
      readonly string[]
    >
  >;
  material: readonly R3MaterialFactResidentAudit[];
  contact: readonly R3ContactPairAudit[];
  families: readonly R3SemanticFactFamilySummary[];
  qualifyingFactFamilies: readonly string[];
  qualifyingMaterialFamilies: readonly string[];
  crossActorMaterialFamilies: readonly string[];
  qualifyingContactPairs: readonly string[];
  classification: R3GroundedSemanticOpportunityClassification;
  reasons: readonly string[];
}

const RESIDENTS = [
  "resident:mira",
  "resident:janek",
  "resident:ida",
] as const;

const MATERIAL_FACTS: readonly {
  family: R3MaterialFactFamily;
  place:
    | "input_rack"
    | "source"
    | "output"
    | "depot";
  objectKind:
    | "raw_blank"
    | "finished_part";
}[] = [
  {
    family: "input_rack_has_raw",
    place: "input_rack",
    objectKind: "raw_blank",
  },
  {
    family: "source_has_raw",
    place: "source",
    objectKind: "raw_blank",
  },
  {
    family: "output_has_finished",
    place: "output",
    objectKind: "finished_part",
  },
  {
    family: "depot_has_finished",
    place: "depot",
    objectKind: "finished_part",
  },
];

export function auditR3GroundedSemanticOpportunity(
  experiences: readonly ResidentPrivateExperience[],
): R3GroundedSemanticOpportunityAudit {
  const ticks =
    experiences.reduce(
      (maximum, experience) =>
        Math.max(
          maximum,
          experience.tick,
        ),
      0,
    );

  const matters =
    Object.fromEntries(
      RESIDENTS.map(
        (residentId) => [
          residentId,
          firstMatters(
            experiences,
            residentId,
          ),
        ],
      ),
    ) as Record<
      ResidentId,
      readonly string[]
    >;

  const byResident =
    new Map<
      ResidentId,
      readonly ResidentPrivateExperience[]
    >();

  for (const residentId of RESIDENTS) {
    byResident.set(
      residentId,
      experiences
        .filter(
          (experience) =>
            experience.residentId ===
            residentId,
        )
        .sort(
          (left, right) =>
            left.tick - right.tick,
        ),
    );
  }

  const material:
    R3MaterialFactResidentAudit[] = [];

  for (const fact of MATERIAL_FACTS) {
    for (const residentId of RESIDENTS) {
      const stream =
        byResident.get(residentId) ??
        [];
      const values =
        stream.map(
          (experience) =>
            materialFactValue(
              experience,
              fact.place,
              fact.objectKind,
            ),
        );

      material.push({
        family: fact.family,
        residentId,
        ...episodeStats(values),
      });
    }
  }

  const contact:
    R3ContactPairAudit[] = [];

  for (const observerId of RESIDENTS) {
    for (const targetId of RESIDENTS) {
      if (
        observerId === targetId
      ) {
        continue;
      }

      const stream =
        byResident.get(observerId) ??
        [];
      const values =
        stream.map(
          (experience) =>
            experience.observation
              .visibleActors.some(
                (actor) =>
                  actor.id ===
                  targetId,
              ),
        );

      contact.push({
        family:
          "coworker_nearby",
        observerId,
        targetId,
        ...episodeStats(values),
      });
    }
  }

  const families:
    R3SemanticFactFamilySummary[] =
      [];

  for (const fact of MATERIAL_FACTS) {
    const entries =
      material.filter(
        (entry) =>
          entry.family ===
          fact.family,
      );

    families.push({
      family: fact.family,
      observersWithBothTruthValues:
        entries.filter(
          (entry) =>
            entry.observedBothTruthValues,
        ).length,
      maxTrueEpisodes:
        max(
          entries.map(
            (entry) =>
              entry.trueEpisodes,
          ),
        ),
      maxFalseEpisodes:
        max(
          entries.map(
            (entry) =>
              entry.falseEpisodes,
          ),
        ),
      maxTransitions:
        max(
          entries.map(
            (entry) =>
              entry.transitions,
          ),
        ),
      recurrentBothWays:
        entries.some(
          (entry) =>
            entry.trueEpisodes >= 3 &&
            entry.falseEpisodes >= 3,
        ),
    });
  }

  families.push({
    family:
      "coworker_nearby",
    observersWithBothTruthValues:
      contact.filter(
        (entry) =>
          entry.observedBothTruthValues,
      ).length,
    maxTrueEpisodes:
      max(
        contact.map(
          (entry) =>
            entry.trueEpisodes,
        ),
      ),
    maxFalseEpisodes:
      max(
        contact.map(
          (entry) =>
            entry.falseEpisodes,
        ),
      ),
    maxTransitions:
      max(
        contact.map(
          (entry) =>
            entry.transitions,
        ),
      ),
    recurrentBothWays:
      contact.some(
        (entry) =>
          entry.trueEpisodes >= 3 &&
          entry.falseEpisodes >= 3,
      ),
  });

  const qualifyingMaterialFamilies =
    families
      .filter(
        (family) =>
          family.family !==
            "coworker_nearby" &&
          family.recurrentBothWays,
      )
      .map(
        (family) =>
          family.family,
      );

  const qualifyingContactPairs =
    contact
      .filter(
        (entry) =>
          entry.observedBothTruthValues &&
          entry.trueEpisodes >= 3 &&
          entry.falseEpisodes >= 3 &&
          entry.transitions >= 3,
      )
      .map(
        (entry) =>
          entry.observerId +
          "->" +
          entry.targetId,
      );

  const qualifyingFactFamilies = [
    ...qualifyingMaterialFamilies,
    ...(qualifyingContactPairs.length >
    0
      ? ["coworker_nearby"]
      : []),
  ];

  const crossActorMaterialFamilies =
    families
      .filter(
        (family) =>
          family.family !==
            "coworker_nearby" &&
          family
            .observersWithBothTruthValues >=
            2,
      )
      .map(
        (family) =>
          family.family,
      );

  const reasons: string[] = [];

  if (
    qualifyingFactFamilies.length < 3
  ) {
    reasons.push(
      "fewer than 3 fact families recur in both truth values",
    );
  }

  if (
    qualifyingMaterialFamilies.length <
    2
  ) {
    reasons.push(
      "fewer than 2 material-place fact families recur in both truth values",
    );
  }

  if (
    crossActorMaterialFamilies.length <
    1
  ) {
    reasons.push(
      "no material fact family is observed in both truth values by at least 2 residents",
    );
  }

  if (
    qualifyingContactPairs.length < 1
  ) {
    reasons.push(
      "no contact pair has both truth values with at least 3 recurrent episodes/transitions",
    );
  }

  return {
    ticks,
    matters,
    material,
    contact,
    families,
    qualifyingFactFamilies,
    qualifyingMaterialFamilies,
    crossActorMaterialFamilies,
    qualifyingContactPairs,
    classification:
      reasons.length === 0
        ? "GROUNDED_SEMANTIC_DIVERSITY_SEED_AVAILABLE"
        : "GROUNDED_SEMANTIC_DIVERSITY_TOO_NARROW",
    reasons,
  };
}

function materialFactValue(
  experience: ResidentPrivateExperience,
  placeId:
    | "input_rack"
    | "source"
    | "output"
    | "depot",
  objectKind:
    | "raw_blank"
    | "finished_part",
): boolean | null {
  const place =
    R3_LIFE_PLACES[placeId];

  if (
    distance(
      experience.observation.self
        .position,
      place.position,
    ) > 2.5
  ) {
    return null;
  }

  return experience.observation
    .visibleObjects.some(
      (object) =>
        object.kind === objectKind &&
        object.location.kind ===
          "free" &&
        distance(
          object.location.position,
          place.position,
        ) <= 0.75,
    );
}

function episodeStats(
  values:
    readonly (boolean | null)[],
): R3BooleanEpisodeStats {
  let observedTicks = 0;
  let trueTicks = 0;
  let falseTicks = 0;
  let trueEpisodes = 0;
  let falseEpisodes = 0;
  let transitions = 0;
  let previous:
    boolean | null = null;

  for (const value of values) {
    if (value === null) {
      previous = null;
      continue;
    }

    observedTicks += 1;
    if (value) {
      trueTicks += 1;
    } else {
      falseTicks += 1;
    }

    if (
      previous === null
    ) {
      if (value) {
        trueEpisodes += 1;
      } else {
        falseEpisodes += 1;
      }
    } else if (
      previous !== value
    ) {
      transitions += 1;
      if (value) {
        trueEpisodes += 1;
      } else {
        falseEpisodes += 1;
      }
    }

    previous = value;
  }

  return {
    observedTicks,
    trueTicks,
    falseTicks,
    trueEpisodes,
    falseEpisodes,
    transitions,
    observedBothTruthValues:
      trueTicks > 0 &&
      falseTicks > 0,
  };
}

function firstMatters(
  experiences:
    readonly ResidentPrivateExperience[],
  residentId: ResidentId,
): readonly string[] {
  return (
    experiences.find(
      (experience) =>
        experience.residentId ===
        residentId,
    )?.matters.map(
      (matter) =>
        matter.statement,
    ) ?? []
  );
}

function max(
  values: readonly number[],
): number {
  return values.length > 0
    ? Math.max(...values)
    : 0;
}
