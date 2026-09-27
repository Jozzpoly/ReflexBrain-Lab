import {
  describe,
  expect,
  it,
} from "vitest";
import {
  createR3GroundedMaterialSemanticRun,
  R3_GROUNDED_MATERIAL_PLACES,
  R3_GROUNDED_MATERIAL_REPORTS,
  type R3GroundedMaterialConsumerMode,
  type R3GroundedMaterialDomain,
  type R3GroundedMaterialPurpose,
  type R3GroundedMaterialRegime,
} from "../src/r3/grounded-material-semantic-consumer-run";
import type {
  LifeEvent,
  ResidentPrivateExperience,
} from "../src/r3/life-contracts";
import {
  distance,
} from "../src/r3/life-world";

const PURPOSES:
  readonly R3GroundedMaterialPurpose[] = [
    "rack",
    "source",
  ];

const MODES:
  readonly R3GroundedMaterialConsumerMode[] = [
    "ignore-all",
    "respond-all",
    "rack-surface-only",
    "source-surface-only",
    "rack-speaker-only",
    "source-speaker-only",
    "ideal-semantic-oracle",
  ];

interface GroundedReportRecord {
  tick: number;
  eventId: string | null;
  domain: R3GroundedMaterialDomain;
  primary: boolean;
  repeat: boolean;
  grounded: boolean;
}

interface RunSummary {
  purpose: R3GroundedMaterialPurpose;
  mode: R3GroundedMaterialConsumerMode;
  regime: R3GroundedMaterialRegime;
  ticks: number;
  reports: readonly GroundedReportRecord[];
  reportTimeline: readonly string[];
  listenerDecisionCount: number;
  allReportsHeard: boolean;
  listenerDirectSightExcluded: boolean;
  correctRelationDecisions: number;
  relationDecisionCount: number;
  targetPositiveCount: number;
  rackAckCount: number;
  sourceAckCount: number;
  totalAckCount: number;
  processingCompletedCount: number;
}

describe(
  "R3 grounded material semantic consumer",
  () => {
    it(
      "executes the frozen relation and persistent consumer gates without retaining all worlds in memory",
      () => {
        const relationSummaries =
          runAllSerially(
            "relation",
          );
        const stageA =
          auditStageA(
            relationSummaries,
          );

        const persistentSummaries =
          runAllSerially(
            "persistent",
          );
        const stageB =
          auditStageB(
            persistentSummaries,
          );

        const groundingPass =
          stageA.groundingPass &&
          stageB.groundingPass;

        let classification:
          | "GROUNDED_MATERIAL_REPORT_PROVENANCE_FAIL"
          | "GROUNDED_MATERIAL_RELATION_PRESSURE_INVALID"
          | "GROUNDED_MATERIAL_RELATION_FAIL"
          | "GROUNDED_MATERIAL_CONSUMER_PRESSURE_TOO_NARROW"
          | "GROUNDED_MATERIAL_CONSUMER_NOT_USEFUL"
          | "GROUNDED_MATERIAL_SEMANTIC_CONSUMER_QUALIFIED";

        if (!groundingPass) {
          classification =
            "GROUNDED_MATERIAL_REPORT_PROVENANCE_FAIL";
        } else if (
          !stageA.timelineInvariant ||
          !stageA.allReportsHeard ||
          !stageA.listenerDirectSightExcluded
        ) {
          classification =
            "GROUNDED_MATERIAL_RELATION_PRESSURE_INVALID";
        } else if (
          !stageA.semanticGatePass
        ) {
          classification =
            "GROUNDED_MATERIAL_RELATION_FAIL";
        } else if (
          !stageB.repeatPressurePass
        ) {
          classification =
            "GROUNDED_MATERIAL_CONSUMER_PRESSURE_TOO_NARROW";
        } else if (
          !stageB.consumerGatePass
        ) {
          classification =
            "GROUNDED_MATERIAL_CONSUMER_NOT_USEFUL";
        } else {
          classification =
            "GROUNDED_MATERIAL_SEMANTIC_CONSUMER_QUALIFIED";
        }

        console.log(
          "R3_GROUNDED_MATERIAL_SEMANTIC_CONSUMER " +
            JSON.stringify({
              stageA,
              stageB,
              classification,
            }),
        );

        expect(
          relationSummaries.every(
            (summary) =>
              summary.ticks === 5400,
          ),
        ).toBe(true);
        expect(
          persistentSummaries.every(
            (summary) =>
              summary.ticks === 5400,
          ),
        ).toBe(true);
        expect(
          [
            "GROUNDED_MATERIAL_REPORT_PROVENANCE_FAIL",
            "GROUNDED_MATERIAL_RELATION_PRESSURE_INVALID",
            "GROUNDED_MATERIAL_RELATION_FAIL",
            "GROUNDED_MATERIAL_CONSUMER_PRESSURE_TOO_NARROW",
            "GROUNDED_MATERIAL_CONSUMER_NOT_USEFUL",
            "GROUNDED_MATERIAL_SEMANTIC_CONSUMER_QUALIFIED",
          ],
        ).toContain(
          classification,
        );
      },
      240_000,
    );
  },
);

function runAllSerially(
  regime:
    R3GroundedMaterialRegime,
): readonly RunSummary[] {
  const summaries:
    RunSummary[] = [];

  for (
    const purpose of
      PURPOSES
  ) {
    for (
      const mode of
        MODES
    ) {
      summaries.push(
        runOne(
          purpose,
          mode,
          regime,
        ),
      );
    }
  }

  return summaries;
}

function runOne(
  purpose:
    R3GroundedMaterialPurpose,
  mode:
    R3GroundedMaterialConsumerMode,
  regime:
    R3GroundedMaterialRegime,
): RunSummary {
  const run =
    createR3GroundedMaterialSemanticRun(
      purpose,
      mode,
      regime,
    );

  run.runTicks(5400);

  const experiences =
    run.privateExperiences();
  const events =
    run.allEvents();
  const debug =
    run.listenerDebug();
  const metrics =
    run.metrics();

  const reports =
    auditGroundedReports(
      experiences,
    );

  const decisionIds =
    new Set(
      debug.decisions.map(
        (decision) =>
          decision.eventId,
      ),
    );

  const listenerReportExperiences =
    experiences.filter(
      (experience) =>
        experience.residentId ===
          "resident:ida" &&
        experience.observation
          .heardEvents.some(
            (event) =>
              reportEventDomain(
                event,
              ) !== null,
          ),
    );

  const correctRelationDecisions =
    debug.decisions.filter(
      (decision) =>
        decision
          .shouldAcknowledge ===
        (
          decision.domain ===
          purpose
        ),
    ).length;

  const targetPositiveCount =
    debug.decisions.filter(
      (decision) =>
        decision.domain ===
        purpose,
    ).length;

  return {
    purpose,
    mode,
    regime,
    ticks:
      metrics.ticks,
    reports,
    reportTimeline:
      reportTimeline(
        events,
      ),
    listenerDecisionCount:
      debug.decisions.length,
    allReportsHeard:
      reports.every(
        (report) =>
          report.eventId !==
            null &&
          decisionIds.has(
            report.eventId,
          ),
      ),
    listenerDirectSightExcluded:
      listenerReportExperiences.every(
        listenerCannotDirectlyInspectEitherPlace,
      ),
    correctRelationDecisions,
    relationDecisionCount:
      debug.decisions.length,
    targetPositiveCount,
    rackAckCount:
      metrics.rackAckCount,
    sourceAckCount:
      metrics.sourceAckCount,
    totalAckCount:
      metrics.totalAckCount,
    processingCompletedCount:
      metrics.processingCompletedCount,
  };
}

function auditStageA(
  summaries:
    readonly RunSummary[],
) {
  const groundingPass =
    summaries.every(
      (summary) =>
        summary.reports.every(
          (report) =>
            report.grounded,
        ),
    );

  const allReportsHeard =
    summaries.every(
      (summary) =>
        summary.allReportsHeard &&
        summary
          .listenerDecisionCount ===
        summary.reports.length,
    );

  const listenerDirectSightExcluded =
    summaries.every(
      (summary) =>
        summary.listenerDirectSightExcluded,
    );

  const minRackReports =
    Math.min(
      ...summaries.map(
        (summary) =>
          countDomain(
            summary.reports,
            "rack",
          ),
      ),
    );

  const minSourceReports =
    Math.min(
      ...summaries.map(
        (summary) =>
          countDomain(
            summary.reports,
            "source",
          ),
      ),
    );

  const timelineInvariant =
    PURPOSES.every(
      (purpose) => {
        const purposeRuns =
          summaries.filter(
            (summary) =>
              summary.purpose ===
              purpose,
          );
        const baseline =
          JSON.stringify(
            purposeRuns.find(
              (summary) =>
                summary.mode ===
                "ignore-all",
            )!.reportTimeline,
          );

        return purposeRuns.every(
          (summary) =>
            JSON.stringify(
              summary.reportTimeline,
            ) ===
            baseline,
        );
      },
    );

  const idealAccuracy =
    aggregateAccuracy(
      summaries,
      "ideal-semantic-oracle",
    );

  const fixedControlAccuracy =
    Object.fromEntries(
      [
        "rack-surface-only",
        "source-surface-only",
        "rack-speaker-only",
        "source-speaker-only",
      ].map(
        (mode) => [
          mode,
          aggregateAccuracy(
            summaries,
            mode as R3GroundedMaterialConsumerMode,
          ),
        ],
      ),
    );

  const baselineRuns =
    summaries.filter(
      (summary) =>
        summary.mode ===
        "ignore-all",
    );

  const positives =
    baselineRuns.reduce(
      (sum, summary) =>
        sum +
        summary.targetPositiveCount,
      0,
    );
  const total =
    baselineRuns.reduce(
      (sum, summary) =>
        sum +
        summary.relationDecisionCount,
      0,
    );

  const majorityAccuracy =
    total > 0
      ? Math.max(
          positives,
          total -
            positives,
        ) /
        total
      : 0;

  const matterIdOnlyAccuracy =
    majorityAccuracy;

  const semanticGatePass =
    minRackReports >= 10 &&
    minSourceReports >= 10 &&
    idealAccuracy === 1 &&
    Object.values(
      fixedControlAccuracy,
    ).every(
      (accuracy) =>
        accuracy <= 0.55,
    ) &&
    matterIdOnlyAccuracy ===
      majorityAccuracy;

  return {
    groundingPass,
    allReportsHeard,
    listenerDirectSightExcluded,
    minRackReports,
    minSourceReports,
    timelineInvariant,
    idealAccuracy,
    fixedControlAccuracy,
    majorityAccuracy,
    matterIdOnlyAccuracy,
    semanticGatePass,
  };
}

function auditStageB(
  summaries:
    readonly RunSummary[],
) {
  const groundingPass =
    summaries.every(
      (summary) =>
        summary.reports.every(
          (report) =>
            report.grounded,
        ),
    );

  const matrix =
    Object.fromEntries(
      PURPOSES.map(
        (purpose) => [
          purpose,
          Object.fromEntries(
            MODES.map(
              (mode) => [
                mode,
                persistentSummary(
                  findSummary(
                    summaries,
                    purpose,
                    mode,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ) as Record<
      R3GroundedMaterialPurpose,
      Record<
        R3GroundedMaterialConsumerMode,
        ReturnType<
          typeof persistentSummary
        >
      >
    >;

  const repeatPressurePass =
    PURPOSES.every(
      (purpose) =>
        matrix[
          purpose
        ]["ignore-all"]
          .relevantRepeatReports >
        0,
    );

  const idealPrimaryAckPass =
    PURPOSES.every(
      (purpose) => {
        const value =
          matrix[
            purpose
          ][
            "ideal-semantic-oracle"
          ];
        return (
          value
            .relevantPrimaryActualAcks ===
          value
            .relevantPrimaryReports
        );
      },
    );

  const idealZeroDecoyPass =
    PURPOSES.every(
      (purpose) =>
        matrix[
          purpose
        ][
          "ideal-semantic-oracle"
        ].decoyActualAcks ===
        0,
    );

  const ignoreVsIdealPass =
    PURPOSES.every(
      (purpose) =>
        matrix[
          purpose
        ]["ignore-all"]
          .relevantRepeatReports >
        matrix[
          purpose
        ][
          "ideal-semantic-oracle"
        ].relevantRepeatReports,
    );

  const respondAllPass =
    PURPOSES.every(
      (purpose) =>
        matrix[
          purpose
        ]["respond-all"]
          .relevantRepeatReports <
          matrix[
            purpose
          ]["ignore-all"]
            .relevantRepeatReports &&
        matrix[
          purpose
        ]["respond-all"]
          .decoyActualAcks >
          matrix[
            purpose
          ][
            "ideal-semantic-oracle"
          ].decoyActualAcks,
    );

  const rackSurfacePass =
    directionalControlPass(
      matrix,
      "rack-surface-only",
      "rack",
    );

  const rackSpeakerPass =
    directionalControlPass(
      matrix,
      "rack-speaker-only",
      "rack",
    );

  const sourceSurfacePass =
    directionalControlPass(
      matrix,
      "source-surface-only",
      "source",
    );

  const sourceSpeakerPass =
    directionalControlPass(
      matrix,
      "source-speaker-only",
      "source",
    );

  const idealAggregate =
    aggregatePersistent(
      matrix,
      "ideal-semantic-oracle",
    );

  const respondAggregate =
    aggregatePersistent(
      matrix,
      "respond-all",
    );

  const communicationAdvantage =
    idealAggregate
      .totalCommunicationActions <
      respondAggregate
        .totalCommunicationActions ||
    (
      idealAggregate
        .relevantRepeatReports ===
        respondAggregate
          .relevantRepeatReports &&
      idealAggregate
        .totalActualAcks <
        respondAggregate
          .totalActualAcks &&
      idealAggregate
        .decoyActualAcks ===
        0
    );

  const consumerGatePass =
    idealPrimaryAckPass &&
    idealZeroDecoyPass &&
    ignoreVsIdealPass &&
    respondAllPass &&
    rackSurfacePass &&
    rackSpeakerPass &&
    sourceSurfacePass &&
    sourceSpeakerPass &&
    communicationAdvantage;

  return {
    groundingPass,
    repeatPressurePass,
    idealPrimaryAckPass,
    idealZeroDecoyPass,
    ignoreVsIdealPass,
    respondAllPass,
    rackSurfacePass,
    rackSpeakerPass,
    sourceSurfacePass,
    sourceSpeakerPass,
    communicationAdvantage,
    idealAggregate,
    respondAggregate,
    matrix,
    consumerGatePass,
  };
}

function persistentSummary(
  summary:
    RunSummary,
) {
  const relevant =
    summary.reports.filter(
      (report) =>
        report.domain ===
        summary.purpose,
    );
  const decoy =
    summary.reports.filter(
      (report) =>
        report.domain !==
        summary.purpose,
    );

  const relevantPrimaryReports =
    relevant.filter(
      (report) =>
        report.primary,
    ).length;

  const relevantRepeatReports =
    relevant.filter(
      (report) =>
        report.repeat,
    ).length;

  const relevantActualAcks =
    summary.purpose ===
      "rack"
      ? summary.rackAckCount
      : summary.sourceAckCount;

  const decoyActualAcks =
    summary.purpose ===
      "rack"
      ? summary.sourceAckCount
      : summary.rackAckCount;

  return {
    relevantPrimaryReports,
    relevantPrimaryActualAcks:
      Math.min(
        relevantActualAcks,
        relevantPrimaryReports,
      ),
    relevantRepeatReports,
    relevantActualAcks,
    decoyReportCount:
      decoy.length,
    decoyActualAcks,
    totalActualAcks:
      summary.totalAckCount,
    totalCommunicationActions:
      summary.reports.length +
      summary.totalAckCount,
    processingCompletedCount:
      summary.processingCompletedCount,
  };
}

function directionalControlPass(
  matrix:
    Record<
      R3GroundedMaterialPurpose,
      Record<
        R3GroundedMaterialConsumerMode,
        ReturnType<
          typeof persistentSummary
        >
      >
    >,
  mode:
    R3GroundedMaterialConsumerMode,
  matchingPurpose:
    R3GroundedMaterialPurpose,
): boolean {
  const other:
    R3GroundedMaterialPurpose =
      matchingPurpose ===
        "rack"
        ? "source"
        : "rack";

  const matching =
    matrix[
      matchingPurpose
    ][mode];
  const matchingIgnore =
    matrix[
      matchingPurpose
    ]["ignore-all"];
  const nonmatching =
    matrix[
      other
    ][mode];
  const nonmatchingIgnore =
    matrix[
      other
    ]["ignore-all"];

  return (
    matching.relevantActualAcks >
      0 &&
    matching.relevantRepeatReports <
      matchingIgnore
        .relevantRepeatReports &&
    nonmatching.relevantActualAcks ===
      0 &&
    nonmatching.relevantRepeatReports >=
      nonmatchingIgnore
        .relevantRepeatReports
  );
}

function aggregatePersistent(
  matrix:
    Record<
      R3GroundedMaterialPurpose,
      Record<
        R3GroundedMaterialConsumerMode,
        ReturnType<
          typeof persistentSummary
        >
      >
    >,
  mode:
    R3GroundedMaterialConsumerMode,
) {
  const values =
    PURPOSES.map(
      (purpose) =>
        matrix[
          purpose
        ][mode],
    );

  return {
    relevantRepeatReports:
      values.reduce(
        (sum, value) =>
          sum +
          value.relevantRepeatReports,
        0,
      ),
    decoyActualAcks:
      values.reduce(
        (sum, value) =>
          sum +
          value.decoyActualAcks,
        0,
      ),
    totalActualAcks:
      values.reduce(
        (sum, value) =>
          sum +
          value.totalActualAcks,
        0,
      ),
    totalCommunicationActions:
      values.reduce(
        (sum, value) =>
          sum +
          value.totalCommunicationActions,
        0,
      ),
  };
}

function aggregateAccuracy(
  summaries:
    readonly RunSummary[],
  mode:
    R3GroundedMaterialConsumerMode,
): number {
  const selected =
    summaries.filter(
      (summary) =>
        summary.mode ===
        mode,
    );

  const correct =
    selected.reduce(
      (sum, summary) =>
        sum +
        summary.correctRelationDecisions,
      0,
    );

  const total =
    selected.reduce(
      (sum, summary) =>
        sum +
        summary.relationDecisionCount,
      0,
    );

  return total > 0
    ? correct / total
    : 0;
}

function findSummary(
  summaries:
    readonly RunSummary[],
  purpose:
    R3GroundedMaterialPurpose,
  mode:
    R3GroundedMaterialConsumerMode,
): RunSummary {
  const result =
    summaries.find(
      (summary) =>
        summary.purpose ===
          purpose &&
        summary.mode ===
          mode,
    );

  if (!result) {
    throw new Error(
      "missing run summary " +
        purpose +
        "/" +
        mode,
    );
  }

  return result;
}

function countDomain(
  reports:
    readonly GroundedReportRecord[],
  domain:
    R3GroundedMaterialDomain,
): number {
  return reports.filter(
    (report) =>
      report.domain ===
      domain,
  ).length;
}

function auditGroundedReports(
  experiences:
    readonly ResidentPrivateExperience[],
): readonly GroundedReportRecord[] {
  return [
    ...auditDomain(
      experiences,
      "rack",
      "resident:janek",
    ),
    ...auditDomain(
      experiences,
      "source",
      "resident:mira",
    ),
  ].sort(
    (left, right) =>
      left.tick -
        right.tick ||
      left.domain.localeCompare(
        right.domain,
      ),
  );
}

function auditDomain(
  experiences:
    readonly ResidentPrivateExperience[],
  domain:
    R3GroundedMaterialDomain,
  residentId:
    "resident:janek" |
    "resident:mira",
): readonly GroundedReportRecord[] {
  const ordered =
    experiences
      .filter(
        (experience) =>
          experience.residentId ===
          residentId,
      )
      .sort(
        (left, right) =>
          left.tick -
          right.tick,
      );

  let episodeActive =
    false;
  let reportCountInEpisode = 0;
  const output:
    GroundedReportRecord[] =
      [];

  for (
    const experience of
      ordered
  ) {
    const place =
      domain === "rack"
        ? R3_GROUNDED_MATERIAL_PLACES
            .input_rack
        : R3_GROUNDED_MATERIAL_PLACES
            .source;

    const inspected =
      distance(
        experience.observation.self
          .position,
        place.position,
      ) <= 2.5;

    if (inspected) {
      const empty =
        !visibleRawAt(
          experience,
          domain,
        );

      if (
        empty &&
        !episodeActive
      ) {
        episodeActive =
          true;
        reportCountInEpisode =
          0;
      } else if (!empty) {
        episodeActive =
          false;
        reportCountInEpisode =
          0;
      }
    }

    const intent =
      experience.decision
        .intent;

    if (
      intent.kind !==
        "speak" ||
      intent.text !==
        R3_GROUNDED_MATERIAL_REPORTS[
          domain
        ]
    ) {
      continue;
    }

    const outcome =
      experience
        .factualOutcomeEvents.find(
          (event) =>
            event.kind ===
              "speech" &&
            event.actorId ===
              residentId &&
            event.payload.text ===
              R3_GROUNDED_MATERIAL_REPORTS[
                domain
              ],
        );

    output.push({
      tick:
        experience.tick,
      eventId:
        outcome?.id ??
        null,
      domain,
      primary:
        reportCountInEpisode ===
        0,
      repeat:
        reportCountInEpisode >
        0,
      grounded:
        inspected &&
        !visibleRawAt(
          experience,
          domain,
        ),
    });

    reportCountInEpisode += 1;
  }

  return output;
}

function reportTimeline(
  events:
    readonly LifeEvent[],
): readonly string[] {
  return events
    .map(
      (event) => {
        const domain =
          reportEventDomain(
            event,
          );
        return domain
          ? event.tick +
              ":" +
              domain
          : null;
      },
    )
    .filter(
      (
        item,
      ): item is string =>
        item !== null,
    );
}

function reportEventDomain(
  event:
    LifeEvent,
):
R3GroundedMaterialDomain | null {
  if (
    event.kind !== "speech"
  ) {
    return null;
  }

  if (
    event.actorId ===
      "resident:janek" &&
    event.payload.text ===
      R3_GROUNDED_MATERIAL_REPORTS
        .rack
  ) {
    return "rack";
  }

  if (
    event.actorId ===
      "resident:mira" &&
    event.payload.text ===
      R3_GROUNDED_MATERIAL_REPORTS
        .source
  ) {
    return "source";
  }

  return null;
}

function listenerCannotDirectlyInspectEitherPlace(
  experience:
    ResidentPrivateExperience,
): boolean {
  return (
    distance(
      experience.observation.self
        .position,
      R3_GROUNDED_MATERIAL_PLACES
        .source.position,
    ) > 0.75 &&
    distance(
      experience.observation.self
        .position,
      R3_GROUNDED_MATERIAL_PLACES
        .input_rack.position,
    ) > 0.75
  );
}

function visibleRawAt(
  experience:
    ResidentPrivateExperience,
  domain:
    R3GroundedMaterialDomain,
): boolean {
  const place =
    domain === "rack"
      ? R3_GROUNDED_MATERIAL_PLACES
          .input_rack
      : R3_GROUNDED_MATERIAL_PLACES
          .source;

  return experience.observation
    .visibleObjects.some(
      (object) =>
        object.kind ===
          "raw_blank" &&
        object.location.kind ===
          "free" &&
        distance(
          object.location.position,
          place.position,
        ) <= 0.75,
    );
}
