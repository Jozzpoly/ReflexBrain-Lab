import {
  createR3GroundedPurposeStructureRun,
  R3_GROUNDED_PURPOSE_PLACES,
  type R3GroundedPurposeTargetPlace,
} from "./grounded-purpose-structure-run";
import type {
  LifeEvent,
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  distance,
} from "./life-world";

export type R3GroundedPurposePressureDiagnosisClassification =
  | "BACKGROUND_ROUTE_STARVATION"
  | "BACKGROUND_STOCK_PHASE_MISS"
  | "BACKGROUND_PICKUP_EXECUTION_FAIL"
  | "BACKGROUND_PRESSURE_DIAGNOSIS_MIXED";

export interface R3BackgroundTargetRouteMetrics {
  target: R3GroundedPurposeTargetPlace;
  nearTargetTicks: number;
  nearTargetEpisodes: number;
  stockVisibleTicks: number;
  stockVisibleEpisodes: number;
  pickupEvents: number;
  firstVisitTick: number | null;
  lastVisitTick: number | null;
}

export interface R3GroundedPurposePressureWorldDiagnosis {
  purpose: R3GroundedPurposeTargetPlace;
  targets: Readonly<
    Record<
      R3GroundedPurposeTargetPlace,
      R3BackgroundTargetRouteMetrics
    >
  >;
  janekDepotNearEpisodes: number;
  janekRouteMotionEvents: number;
  idaTargetPlacements: number;
}

export interface R3GroundedPurposePressureDiagnosis {
  horizonTicks: number;
  rackPurpose: R3GroundedPurposePressureWorldDiagnosis;
  outputPurpose: R3GroundedPurposePressureWorldDiagnosis;
  classification:
    R3GroundedPurposePressureDiagnosisClassification;
  evidence: readonly string[];
}

export function diagnoseR3GroundedPurposePressure(
  horizonTicks = 1800,
): R3GroundedPurposePressureDiagnosis {
  const rack =
    createR3GroundedPurposeStructureRun(
      "input_rack",
      "baseline",
    );
  rack.runTicks(horizonTicks);

  const output =
    createR3GroundedPurposeStructureRun(
      "output",
      "baseline",
    );
  output.runTicks(horizonTicks);

  const rackDiagnosis =
    diagnoseWorld(
      "input_rack",
      rack.privateExperiences(),
      rack.allEvents(),
      rack.metrics()
        .idaTargetPlacements,
    );

  const outputDiagnosis =
    diagnoseWorld(
      "output",
      output.privateExperiences(),
      output.allEvents(),
      output.metrics()
        .idaTargetPlacements,
    );

  const failing =
    rackDiagnosis.targets.input_rack;

  const failingOther =
    rackDiagnosis.targets.output;

  const outputTarget =
    outputDiagnosis.targets.output;

  const routeStarved =
    materiallyFewerVisits(
      failing.nearTargetEpisodes,
      failingOther.nearTargetEpisodes,
    ) ||
    materiallyFewerVisits(
      failing.nearTargetEpisodes,
      outputTarget.nearTargetEpisodes,
    );

  const recurrentRackVisits =
    failing.nearTargetEpisodes >= 3;

  const rackVisibleEpisodeRate =
    failing.nearTargetEpisodes > 0
      ? failing.stockVisibleEpisodes /
        failing.nearTargetEpisodes
      : 0;

  const recurrentRackStockMiss =
    recurrentRackVisits &&
    rackDiagnosis.idaTargetPlacements >= 3 &&
    rackVisibleEpisodeRate < 0.34;

  const pickupExecutionFail =
    failing.stockVisibleEpisodes >= 3 &&
    failing.pickupEvents <
      Math.max(
        1,
        Math.floor(
          failing.stockVisibleEpisodes *
            0.5,
        ),
      );

  let classification:
    R3GroundedPurposePressureDiagnosisClassification;

  if (routeStarved) {
    classification =
      "BACKGROUND_ROUTE_STARVATION";
  } else if (
    recurrentRackStockMiss
  ) {
    classification =
      "BACKGROUND_STOCK_PHASE_MISS";
  } else if (
    pickupExecutionFail
  ) {
    classification =
      "BACKGROUND_PICKUP_EXECUTION_FAIL";
  } else {
    classification =
      "BACKGROUND_PRESSURE_DIAGNOSIS_MIXED";
  }

  const evidence: string[] = [];

  evidence.push(
    "rack-purpose rack visits=" +
      failing.nearTargetEpisodes +
      ", rack stock-visible visits=" +
      failing.stockVisibleEpisodes +
      ", rack pickups=" +
      failing.pickupEvents +
      ", Ida rack placements=" +
      rackDiagnosis.idaTargetPlacements,
  );

  evidence.push(
    "rack-purpose output visits=" +
      failingOther.nearTargetEpisodes +
      ", output stock-visible visits=" +
      failingOther.stockVisibleEpisodes,
  );

  evidence.push(
    "output-purpose output visits=" +
      outputTarget.nearTargetEpisodes +
      ", output stock-visible visits=" +
      outputTarget.stockVisibleEpisodes +
      ", output pickups=" +
      outputTarget.pickupEvents +
      ", Ida output placements=" +
      outputDiagnosis.idaTargetPlacements,
  );

  return {
    horizonTicks,
    rackPurpose:
      rackDiagnosis,
    outputPurpose:
      outputDiagnosis,
    classification,
    evidence,
  };
}

function diagnoseWorld(
  purpose:
    R3GroundedPurposeTargetPlace,
  experiences:
    readonly ResidentPrivateExperience[],
  events:
    readonly LifeEvent[],
  idaTargetPlacements:
    number,
): R3GroundedPurposePressureWorldDiagnosis {
  const janekRows =
    experiences.filter(
      (experience) =>
        experience.residentId ===
        "resident:janek",
    );

  return {
    purpose,
    targets: {
      input_rack:
        targetMetrics(
          "input_rack",
          janekRows,
          events,
        ),
      output:
        targetMetrics(
          "output",
          janekRows,
          events,
        ),
    },
    janekDepotNearEpisodes:
      nearEpisodes(
        janekRows.map(
          (experience) =>
            distance(
              experience.observation
                .self.position,
              R3_GROUNDED_PURPOSE_PLACES
                .depot.position,
            ) <= 0.38,
        ),
      ),
    janekRouteMotionEvents:
      events.filter(
        (event) =>
          event.kind ===
            "motion" &&
          event.actorId ===
            "resident:janek",
      ).length,
    idaTargetPlacements,
  };
}

function targetMetrics(
  target:
    R3GroundedPurposeTargetPlace,
  rows:
    readonly ResidentPrivateExperience[],
  events:
    readonly LifeEvent[],
): R3BackgroundTargetRouteMetrics {
  const place =
    R3_GROUNDED_PURPOSE_PLACES[
      target
    ];

  const near =
    rows.map(
      (experience) =>
        distance(
          experience.observation
            .self.position,
          place.position,
        ) <= 0.38,
    );

  const visible =
    rows.map(
      (experience, index) =>
        near[index] === true &&
        experience.observation
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
              ) <= 0.75,
          ),
    );

  const visitWindows =
    booleanWindows(
      near,
    );

  let stockVisibleEpisodes =
    0;

  for (
    const window of
      visitWindows
  ) {
    let sawStock = false;

    for (
      let index =
        window.start;
      index <=
        window.end;
      index += 1
    ) {
      if (
        visible[index]
      ) {
        sawStock = true;
        break;
      }
    }

    if (sawStock) {
      stockVisibleEpisodes +=
        1;
    }
  }

  const pickupEvents =
    events.filter(
      (event) =>
        event.kind ===
          "pickup" &&
        event.actorId ===
          "resident:janek" &&
        event.payload
          .objectKind ===
          "raw_blank" &&
        distance(
          event.position,
          place.position,
        ) <= 0.75,
    ).length;

  const firstVisit =
    visitWindows[0];

  const lastVisit =
    visitWindows[
      visitWindows.length -
        1
    ];

  return {
    target,
    nearTargetTicks:
      near.filter(Boolean)
        .length,
    nearTargetEpisodes:
      visitWindows.length,
    stockVisibleTicks:
      visible.filter(Boolean)
        .length,
    stockVisibleEpisodes,
    pickupEvents,
    firstVisitTick:
      firstVisit
        ? rows[
            firstVisit.start
          ]!.tick
        : null,
    lastVisitTick:
      lastVisit
        ? rows[
            lastVisit.end
          ]!.tick
        : null,
  };
}

function booleanWindows(
  values:
    readonly boolean[],
): readonly {
  start: number;
  end: number;
}[] {
  const windows:
    {
      start: number;
      end: number;
    }[] = [];

  let start:
    number | null = null;

  for (
    let index = 0;
    index <
    values.length;
    index += 1
  ) {
    if (
      values[index] &&
      start === null
    ) {
      start = index;
    }

    const closes =
      start !== null &&
      (
        !values[index] ||
        index ===
          values.length -
            1
      );

    if (!closes) {
      continue;
    }

    const end =
      values[index]
        ? index
        : index - 1;

    if (
      start === null
    ) {
      continue;
    }

    windows.push({
      start,
      end,
    });

    start = null;
  }

  return windows;
}

function nearEpisodes(
  values:
    readonly boolean[],
): number {
  return booleanWindows(
    values,
  ).length;
}

function materiallyFewerVisits(
  failing: number,
  comparison: number,
): boolean {
  return (
    comparison >= 3 &&
    failing <
      comparison * 0.5
  );
}
