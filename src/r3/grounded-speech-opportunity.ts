import type {
  LifeEvent,
  ResidentId,
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  R3_LIFE_PLACES,
} from "./autonomous-life-run";
import {
  distance,
} from "./life-world";

const GROUNDED_REQUEST_TEXT =
  "The input rack is empty.";
const RACK_LOCAL_RADIUS = 0.75;
const MATERIAL_SIGHT_RADIUS = 2.5;
const LATER_CHECK_HORIZON = 120;

export type R3GroundedSpeechOpportunityClassification =
  | "GROUNDED_SPEECH_ABSENT"
  | "GROUNDED_SPEECH_PRIVATE_ONLY"
  | "GROUNDED_SPEECH_SHARED_UNCONFIRMED"
  | "GROUNDED_PRIVATE_REPORT_SEED_AVAILABLE";

export interface R3GroundedSpeechOpportunityAudit {
  requestCount: number;
  groundedRequestCount: number;
  groundedRate: number | null;
  requestEpisodeCount: number;
  resolutionPlacementCount: number;
  sameSurfaceAcrossDistinctEpisodes: boolean;
  heardByResident:
    Readonly<Record<string, number>>;
  receptionChecks:
    Readonly<
      Record<
        string,
        {
          empty: number;
          stocked: number;
          notInSight: number;
        }
      >
    >;
  laterChecks:
    Readonly<
      Record<
        string,
        {
          empty: number;
          stocked: number;
          noCheck: number;
        }
      >
    >;
  classification:
    R3GroundedSpeechOpportunityClassification;
}

interface GroundedRequest {
  event: LifeEvent;
  grounded: boolean;
}

export function auditR3GroundedSpeechOpportunity(
  experiences:
    readonly ResidentPrivateExperience[],
): R3GroundedSpeechOpportunityAudit {
  const ordered = [
    ...experiences,
  ].sort(
    (left, right) =>
      left.tick - right.tick ||
      left.residentId.localeCompare(
        right.residentId,
      ),
  );

  const requestByEventId =
    new Map<
      string,
      GroundedRequest
    >();

  for (const experience of ordered) {
    if (
      experience.residentId !==
      "resident:janek"
    ) {
      continue;
    }

    for (
      const event of
        experience.factualOutcomeEvents
    ) {
      if (
        event.kind !== "speech" ||
        event.actorId !==
          "resident:janek" ||
        event.payload.text !==
          GROUNDED_REQUEST_TEXT
      ) {
        continue;
      }

      requestByEventId.set(
        event.id,
        {
          event,
          grounded:
            speakerPrivatelySeesEmptyRack(
              experience,
            ),
        },
      );
    }
  }

  const requests = [
    ...requestByEventId.values(),
  ].sort(
    (left, right) =>
      left.event.tick -
      right.event.tick,
  );

  const resolutionPlacements =
    uniqueOutcomeEvents(
      ordered,
    )
      .filter(
        (event) =>
          event.kind ===
            "place" &&
          event.payload.objectKind ===
            "raw_blank" &&
          distance(
            event.position,
            R3_LIFE_PLACES
              .input_rack
              .position,
          ) <=
            RACK_LOCAL_RADIUS,
      )
      .sort(
        (left, right) =>
          left.tick -
          right.tick,
      );

  let requestEpisodeCount =
    requests.length > 0
      ? 1
      : 0;

  for (
    let index = 1;
    index < requests.length;
    index += 1
  ) {
    const previous =
      requests[index - 1]!
        .event.tick;
    const current =
      requests[index]!
        .event.tick;

    if (
      resolutionPlacements.some(
        (event) =>
          event.tick >
            previous &&
          event.tick <
            current,
      )
    ) {
      requestEpisodeCount += 1;
    }
  }

  const recipientIds:
    readonly ResidentId[] = [
      "resident:mira",
      "resident:ida",
    ];

  const heardByResident:
    Record<string, number> = {};
  const receptionChecks:
    Record<
      string,
      {
        empty: number;
        stocked: number;
        notInSight: number;
      }
    > = {};
  const laterChecks:
    Record<
      string,
      {
        empty: number;
        stocked: number;
        noCheck: number;
      }
    > = {};

  for (
    const residentId of
      recipientIds
  ) {
    const residentExperiences =
      ordered.filter(
        (experience) =>
          experience.residentId ===
          residentId,
      );

    let heard = 0;
    const reception = {
      empty: 0,
      stocked: 0,
      notInSight: 0,
    };
    const later = {
      empty: 0,
      stocked: 0,
      noCheck: 0,
    };

    for (const request of requests) {
      const receptionExperience =
        residentExperiences.find(
          (experience) =>
            experience.observation
              .heardEvents.some(
                (event) =>
                  event.id ===
                  request.event.id,
              ),
        );

      if (!receptionExperience) {
        continue;
      }

      heard += 1;

      const receptionState =
        rackPrivateState(
          receptionExperience,
        );
      if (
        receptionState ===
        null
      ) {
        reception.notInSight += 1;
      } else {
        reception[
          receptionState
            ? "stocked"
            : "empty"
        ] += 1;
      }

      const laterExperience =
        residentExperiences.find(
          (experience) =>
            experience.tick >
              receptionExperience.tick &&
            experience.tick <=
              request.event.tick +
                LATER_CHECK_HORIZON &&
            rackPrivateState(
              experience,
            ) !== null,
        );

      if (!laterExperience) {
        later.noCheck += 1;
      } else {
        const laterState =
          rackPrivateState(
            laterExperience,
          );
        later[
          laterState
            ? "stocked"
            : "empty"
        ] += 1;
      }
    }

    heardByResident[
      residentId
    ] = heard;
    receptionChecks[
      residentId
    ] = reception;
    laterChecks[
      residentId
    ] = later;
  }

  const groundedRequestCount =
    requests.filter(
      (request) =>
        request.grounded,
    ).length;
  const totalHeard =
    Object.values(
      heardByResident,
    ).reduce(
      (sum, count) =>
        sum + count,
      0,
    );
  const totalPrivateChecks =
    Object.values(
      receptionChecks,
    ).reduce(
      (sum, value) =>
        sum +
        value.empty +
        value.stocked,
      0,
    ) +
    Object.values(
      laterChecks,
    ).reduce(
      (sum, value) =>
        sum +
        value.empty +
        value.stocked,
      0,
    );

  let classification:
    R3GroundedSpeechOpportunityClassification;

  if (
    requests.length === 0 ||
    groundedRequestCount === 0
  ) {
    classification =
      "GROUNDED_SPEECH_ABSENT";
  } else if (
    totalHeard === 0
  ) {
    classification =
      "GROUNDED_SPEECH_PRIVATE_ONLY";
  } else if (
    totalPrivateChecks === 0
  ) {
    classification =
      "GROUNDED_SPEECH_SHARED_UNCONFIRMED";
  } else {
    classification =
      "GROUNDED_PRIVATE_REPORT_SEED_AVAILABLE";
  }

  return {
    requestCount:
      requests.length,
    groundedRequestCount,
    groundedRate:
      requests.length > 0
        ? groundedRequestCount /
          requests.length
        : null,
    requestEpisodeCount,
    resolutionPlacementCount:
      resolutionPlacements.length,
    sameSurfaceAcrossDistinctEpisodes:
      requestEpisodeCount >= 2,
    heardByResident,
    receptionChecks,
    laterChecks,
    classification,
  };
}

function speakerPrivatelySeesEmptyRack(
  experience:
    ResidentPrivateExperience,
): boolean {
  return (
    distance(
      experience.observation.self
        .position,
      R3_LIFE_PLACES.input_rack
        .position,
    ) <= 0.38 &&
    rackPrivateState(
      experience,
    ) === false
  );
}

function rackPrivateState(
  experience:
    ResidentPrivateExperience,
): boolean | null {
  if (
    distance(
      experience.observation.self
        .position,
      R3_LIFE_PLACES.input_rack
        .position,
    ) >
    MATERIAL_SIGHT_RADIUS
  ) {
    return null;
  }

  return experience.observation
    .visibleObjects.some(
      (object) =>
        object.kind ===
          "raw_blank" &&
        object.location.kind ===
          "free" &&
        distance(
          object.location.position,
          R3_LIFE_PLACES
            .input_rack
            .position,
        ) <=
          RACK_LOCAL_RADIUS,
    );
}

function uniqueOutcomeEvents(
  experiences:
    readonly ResidentPrivateExperience[],
): readonly LifeEvent[] {
  const events =
    new Map<
      string,
      LifeEvent
    >();

  for (const experience of experiences) {
    for (
      const event of
        experience.factualOutcomeEvents
    ) {
      events.set(
        event.id,
        event,
      );
    }
  }

  return [
    ...events.values(),
  ];
}
