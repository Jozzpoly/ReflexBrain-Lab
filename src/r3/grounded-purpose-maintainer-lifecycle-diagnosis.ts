import {
  createR3GroundedPurposeStructureRun,
  R3_GROUNDED_PURPOSE_PLACES,
} from "./grounded-purpose-structure-run";
import type {
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  distance,
} from "./life-world";

export type R3GroundedPurposeMaintainerLifecycleClassification =
  | "MAINTAINER_EMPTY_RESPONSE_FAIL"
  | "MAINTAINER_SOURCE_ACQUISITION_FAIL"
  | "MAINTAINER_SOURCE_AVAILABILITY_FAIL"
  | "MAINTAINER_RETURN_OR_PLACE_FAIL"
  | "MAINTAINER_RECOVERY_LIFECYCLE_COMPLETE"
  | "MAINTAINER_RECOVERY_DIAGNOSIS_MIXED";

export interface R3GroundedPurposeMaintainerEpisode {
  firstEmptyTick: number;
  nextSatisfiedTick: number | null;
  respondToEmptyTick: number | null;
  goToSourceTick: number | null;
  sourceNearTick: number | null;
  sourceRawVisibleTick: number | null;
  pickupIntentTick: number | null;
  factualPickupTick: number | null;
  carryToTargetTick: number | null;
  rackNearHoldingRawTick: number | null;
  placeIntentTick: number | null;
  factualRackPlaceTick: number | null;
  recoveredSatisfiedTick: number | null;
  complete: boolean;
}

export interface R3GroundedPurposeMaintainerLifecycleDiagnosis {
  horizonTicks: number;
  emptyEpisodeCount: number;
  completeEpisodeCount: number;
  episodes:
    readonly R3GroundedPurposeMaintainerEpisode[];
  aggregates: {
    respondedToEmpty: number;
    reachedSource: number;
    sawSourceRaw: number;
    issuedPickupIntent: number;
    completedPickup: number;
    carriedToTarget: number;
    reachedRackHoldingRaw: number;
    issuedPlaceIntent: number;
    completedRackPlace: number;
    recoveredSatisfied: number;
  };
  classification:
    R3GroundedPurposeMaintainerLifecycleClassification;
  evidence: readonly string[];
}

const HORIZON_TICKS = 1800;
const INSPECTION_RADIUS = 2.5;
const NEAR_RADIUS = 0.38;
const STOCK_RADIUS = 0.75;

export function diagnoseR3GroundedPurposeMaintainerLifecycle(
  horizonTicks = HORIZON_TICKS,
): R3GroundedPurposeMaintainerLifecycleDiagnosis {
  const run =
    createR3GroundedPurposeStructureRun(
      "input_rack",
      "baseline",
    );

  run.runTicks(
    horizonTicks,
  );

  const idaRows =
    run.privateExperiences()
      .filter(
        (row) =>
          row.residentId ===
          "resident:ida",
      )
      .sort(
        (left, right) =>
          left.tick -
          right.tick,
      );

  const anchors =
    emptyEpisodeAnchors(
      idaRows,
    );

  const episodes =
    anchors.map(
      (anchorTick) =>
        diagnoseEpisode(
          idaRows,
          anchorTick,
        ),
    );

  const aggregates = {
    respondedToEmpty:
      countPresent(
        episodes,
        "respondToEmptyTick",
      ),
    reachedSource:
      countPresent(
        episodes,
        "sourceNearTick",
      ),
    sawSourceRaw:
      countPresent(
        episodes,
        "sourceRawVisibleTick",
      ),
    issuedPickupIntent:
      countPresent(
        episodes,
        "pickupIntentTick",
      ),
    completedPickup:
      countPresent(
        episodes,
        "factualPickupTick",
      ),
    carriedToTarget:
      countPresent(
        episodes,
        "carryToTargetTick",
      ),
    reachedRackHoldingRaw:
      countPresent(
        episodes,
        "rackNearHoldingRawTick",
      ),
    issuedPlaceIntent:
      countPresent(
        episodes,
        "placeIntentTick",
      ),
    completedRackPlace:
      countPresent(
        episodes,
        "factualRackPlaceTick",
      ),
    recoveredSatisfied:
      countPresent(
        episodes,
        "recoveredSatisfiedTick",
      ),
  };

  const completeEpisodeCount =
    episodes.filter(
      (episode) =>
        episode.complete,
    ).length;

  const laterEpisodes =
    episodes.slice(1);

  const anyLaterNoResponse =
    laterEpisodes.some(
      (episode) =>
        episode.respondToEmptyTick ===
        null,
    );

  const sourceReachedWithoutVisibleRaw =
    laterEpisodes.some(
      (episode) =>
        episode.sourceNearTick !==
          null &&
        episode.sourceRawVisibleTick ===
          null,
    );

  const visibleRawWithoutPickup =
    laterEpisodes.some(
      (episode) =>
        episode.sourceRawVisibleTick !==
          null &&
        episode.factualPickupTick ===
          null,
    );

  const pickupWithoutPlace =
    laterEpisodes.some(
      (episode) =>
        episode.factualPickupTick !==
          null &&
        episode.factualRackPlaceTick ===
          null,
    );

  let classification:
    R3GroundedPurposeMaintainerLifecycleClassification;

  if (
    completeEpisodeCount >=
    3
  ) {
    classification =
      "MAINTAINER_RECOVERY_LIFECYCLE_COMPLETE";
  } else if (
    anyLaterNoResponse
  ) {
    classification =
      "MAINTAINER_EMPTY_RESPONSE_FAIL";
  } else if (
    visibleRawWithoutPickup
  ) {
    classification =
      "MAINTAINER_SOURCE_ACQUISITION_FAIL";
  } else if (
    sourceReachedWithoutVisibleRaw
  ) {
    classification =
      "MAINTAINER_SOURCE_AVAILABILITY_FAIL";
  } else if (
    pickupWithoutPlace
  ) {
    classification =
      "MAINTAINER_RETURN_OR_PLACE_FAIL";
  } else {
    classification =
      "MAINTAINER_RECOVERY_DIAGNOSIS_MIXED";
  }

  const evidence = [
    "empty episodes=" +
      episodes.length +
      ", complete=" +
      completeEpisodeCount,
    "responded=" +
      aggregates.respondedToEmpty +
      ", sourceNear=" +
      aggregates.reachedSource +
      ", sourceRawVisible=" +
      aggregates.sawSourceRaw +
      ", pickups=" +
      aggregates.completedPickup +
      ", rackPlaces=" +
      aggregates.completedRackPlace +
      ", satisfiedRecoveries=" +
      aggregates.recoveredSatisfied,
  ];

  return {
    horizonTicks,
    emptyEpisodeCount:
      episodes.length,
    completeEpisodeCount,
    episodes,
    aggregates,
    classification,
    evidence,
  };
}

function emptyEpisodeAnchors(
  rows:
    readonly ResidentPrivateExperience[],
): readonly number[] {
  const anchors: number[] =
    [];

  let previousEmpty =
    false;

  for (
    const row of rows
  ) {
    const empty =
      privatelyObservedRackState(
        row,
      ) === false;

    if (
      empty &&
      !previousEmpty
    ) {
      anchors.push(
        row.tick,
      );
    }

    previousEmpty =
      empty;
  }

  return anchors;
}

function diagnoseEpisode(
  rows:
    readonly ResidentPrivateExperience[],
  firstEmptyTick: number,
): R3GroundedPurposeMaintainerEpisode {
  const startIndex =
    rows.findIndex(
      (row) =>
        row.tick ===
        firstEmptyTick,
    );

  if (
    startIndex < 0
  ) {
    throw new Error(
      "missing lifecycle anchor tick " +
        firstEmptyTick,
    );
  }

  let nextSatisfiedTick:
    number | null = null;

  for (
    let index =
      startIndex + 1;
    index <
      rows.length;
    index += 1
  ) {
    const state =
      privatelyObservedRackState(
        rows[index]!,
      );

    if (
      state === true
    ) {
      nextSatisfiedTick =
        rows[index]!.tick;
      break;
    }
  }

  const endTick =
    nextSatisfiedTick ??
    Number.POSITIVE_INFINITY;

  const window =
    rows.filter(
      (row) =>
        row.tick >=
          firstEmptyTick &&
        row.tick <=
          endTick,
    );

  const respondToEmptyTick =
    firstTick(
      window,
      (row) =>
        row.decision.activity
          ?.phase ===
        "respond_to_empty_target",
    );

  const goToSourceTick =
    firstTick(
      window,
      (row) =>
        row.decision.activity
          ?.phase ===
        "go_to_source",
    );

  const sourceNearTick =
    firstTick(
      window,
      (row) =>
        distance(
          row.observation.self
            .position,
          R3_GROUNDED_PURPOSE_PLACES
            .source.position,
        ) <=
        NEAR_RADIUS,
    );

  const sourceRawVisibleTick =
    firstTick(
      window,
      (row) =>
        visibleFreeRawAt(
          row,
          "source",
        ),
    );

  const pickupIntentTick =
    firstTick(
      window,
      (row) =>
        row.decision.intent
          .kind ===
          "pickup" &&
        visibleRawIdMatchesIntent(
          row,
        ),
    );

  const factualPickupTick =
    firstTick(
      window,
      (row) =>
        row.factualOutcomeEvents
          .some(
            (event) =>
              event.kind ===
                "pickup" &&
              event.payload
                .objectKind ===
                "raw_blank",
          ),
    );

  const carryToTargetTick =
    firstTick(
      window,
      (row) =>
        row.decision.activity
          ?.phase ===
        "carry_stock_to_target",
    );

  const rackNearHoldingRawTick =
    firstTick(
      window,
      (row) =>
        row.observation
          .heldObject?.kind ===
          "raw_blank" &&
        distance(
          row.observation.self
            .position,
          R3_GROUNDED_PURPOSE_PLACES
            .input_rack.position,
        ) <=
        NEAR_RADIUS,
    );

  const placeIntentTick =
    firstTick(
      window,
      (row) =>
        row.decision.intent
          .kind ===
          "place" &&
        distance(
          row.decision.intent
            .position,
          R3_GROUNDED_PURPOSE_PLACES
            .input_rack.position,
        ) <=
        STOCK_RADIUS,
    );

  const factualRackPlaceTick =
    firstTick(
      window,
      (row) =>
        row.factualOutcomeEvents
          .some(
            (event) =>
              event.kind ===
                "place" &&
              event.payload
                .objectKind ===
                "raw_blank" &&
              distance(
                event.position,
                R3_GROUNDED_PURPOSE_PLACES
                  .input_rack.position,
              ) <=
              STOCK_RADIUS,
          ),
    );

  const recoveredSatisfiedTick =
    nextSatisfiedTick;

  const complete =
    respondToEmptyTick !==
      null &&
    sourceNearTick !==
      null &&
    sourceRawVisibleTick !==
      null &&
    factualPickupTick !==
      null &&
    carryToTargetTick !==
      null &&
    rackNearHoldingRawTick !==
      null &&
    placeIntentTick !==
      null &&
    factualRackPlaceTick !==
      null &&
    recoveredSatisfiedTick !==
      null;

  return {
    firstEmptyTick,
    nextSatisfiedTick,
    respondToEmptyTick,
    goToSourceTick,
    sourceNearTick,
    sourceRawVisibleTick,
    pickupIntentTick,
    factualPickupTick,
    carryToTargetTick,
    rackNearHoldingRawTick,
    placeIntentTick,
    factualRackPlaceTick,
    recoveredSatisfiedTick,
    complete,
  };
}

function privatelyObservedRackState(
  row:
    ResidentPrivateExperience,
): boolean | null {
  if (
    distance(
      row.observation.self
        .position,
      R3_GROUNDED_PURPOSE_PLACES
        .input_rack.position,
    ) >
    INSPECTION_RADIUS
  ) {
    return null;
  }

  return visibleFreeRawAt(
    row,
    "input_rack",
  );
}

function visibleFreeRawAt(
  row:
    ResidentPrivateExperience,
  placeId:
    "source" |
    "input_rack",
): boolean {
  const place =
    R3_GROUNDED_PURPOSE_PLACES[
      placeId
    ];

  return row.observation
    .visibleObjects.some(
      (object) =>
        object.kind ===
          "raw_blank" &&
        object.location.kind ===
          "free" &&
        distance(
          object.location
            .position,
          place.position,
        ) <=
        STOCK_RADIUS,
    );
}

function visibleRawIdMatchesIntent(
  row:
    ResidentPrivateExperience,
): boolean {
  if (
    row.decision.intent
      .kind !==
    "pickup"
  ) {
    return false;
  }

  const id =
    row.decision.intent
      .objectId;

  return row.observation
    .visibleObjects.some(
      (object) =>
        object.id ===
          id &&
        object.kind ===
          "raw_blank" &&
        object.location.kind ===
          "free",
    );
}

function firstTick(
  rows:
    readonly ResidentPrivateExperience[],
  predicate:
    (
      row:
        ResidentPrivateExperience,
    ) => boolean,
): number | null {
  const row =
    rows.find(
      predicate,
    );

  return row?.tick ??
    null;
}

function countPresent(
  episodes:
    readonly R3GroundedPurposeMaintainerEpisode[],
  key:
    keyof R3GroundedPurposeMaintainerEpisode,
): number {
  return episodes.filter(
    (episode) =>
      episode[key] !==
      null,
  ).length;
}
