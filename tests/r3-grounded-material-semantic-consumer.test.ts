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
  type R3GroundedMaterialSemanticRun,
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

type RunTable = Record<
  R3GroundedMaterialPurpose,
  Record<
    R3GroundedMaterialConsumerMode,
    R3GroundedMaterialSemanticRun
  >
>;

interface GroundedReportRecord {
  tick: number;
  eventId: string | null;
  domain: R3GroundedMaterialDomain;
  primary: boolean;
  repeat: boolean;
  grounded: boolean;
}

describe(
  "R3 grounded material semantic consumer",
  () => {
    it(
      "executes the frozen relation and persistent consumer gates without a learner",
      () => {
        const relation =
          runRegime(
            "relation",
          );
        const persistent =
          runRegime(
            "persistent",
          );

        const stageA =
          auditStageA(
            relation,
          );
        const stageB =
          auditStageB(
            persistent,
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
          allRunsAtHorizon(
            relation,
            5400,
          ),
        ).toBe(true);
        expect(
          allRunsAtHorizon(
            persistent,
            5400,
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
      360_000,
    );
  },
);

function runRegime(
  regime:
    R3GroundedMaterialRegime,
): RunTable {
  return Object.fromEntries(
    PURPOSES.map(
      (purpose) => [
        purpose,
        Object.fromEntries(
          MODES.map(
            (mode) => {
              const run =
                createR3GroundedMaterialSemanticRun(
                  purpose,
                  mode,
                  regime,
                );
              run.runTicks(
                5400,
              );
              return [
                mode,
                run,
              ];
            },
          ),
        ),
      ],
    ),
  ) as RunTable;
}

function auditStageA(
  runs: RunTable,
) {
  const audits =
    collectRunAudits(
      runs,
    );

  const groundingPass =
    audits.every(
      (audit) =>
        audit.reports.every(
          (report) =>
            report.grounded,
        ),
    );

  const allReportsHeard =
    audits.every(
      (audit) =>
        audit.listenerDecisionCount ===
        audit.reports.length,
    );

  const listenerDirectSightExcluded =
    audits.every(
      (audit) =>
        audit.listenerReportExperiences.every(
          (experience) =>
            !visibleRawAt(
              experience,
              "rack",
            ) &&
            !visibleRawAt(
              experience,
              "source",
            ),
        ),
    );

  const minRackReports =
    Math.min(
      ...audits.map(
        (audit) =>
          audit.reports.filter(
            (report) =>
              report.domain ===
              "rack",
          ).length,
      ),
    );

  const minSourceReports =
    Math.min(
      ...audits.map(
        (audit) =>
          audit.reports.filter(
            (report) =>
              report.domain ===
              "source",
          ).length,
      ),
    );

  const timelineInvariant =
    PURPOSES.every(
      (purpose) => {
        const baseline =
          JSON.stringify(
            reportTimeline(
              runs[
                purpose
              ]["ignore-all"]
                .allEvents(),
            ),
          );

        return MODES.every(
          (mode) =>
            JSON.stringify(
              reportTimeline(
                runs[
                  purpose
                ][
                  mode
                ].allEvents(),
              ),
            ) ===
            baseline,
        );
      },
    );

  const idealAccuracy =
    aggregateRelationAccuracy(
      runs,
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
          aggregateRelationAccuracy(
            runs,
            mode as R3GroundedMaterialConsumerMode,
          ),
        ],
      ),
    );

  const baselineTargets =
    PURPOSES.flatMap(
      (purpose) =>
        runs[
          purpose
        ]["ignore-all"]
          .listenerDebug()
          .decisions.map(
            (decision) =>
              decision.domain ===
              purpose,
          ),
    );

  const positives =
    baselineTargets.filter(
      Boolean,
    ).length;
  const majorityAccuracy =
    baselineTargets.length > 0
      ? Math.max(
          positives,
          baselineTargets.length -
            positives,
        ) /
        baselineTargets.length
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
  runs: RunTable,
) {
  const audits =
    collectRunAudits(
      runs,
    );

  const groundingPass =
    audits.every(
      (audit) =>
        audit.reports.every(
          (report) =>
            report.grounded,
        ),
    );

  const summaries =
    Object.fromEntries(
      PURPOSES.map(
        (purpose) => [
          purpose,
          Object.fromEntries(
            MODES.map(
              (mode) => [
                mode,
                persistentSummary(
                  runs[
                    purpose
                  ][mode],
                  purpose,
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
        summaries[
          purpose
        ]["ignore-all"]
          .relevantRepeatReports >
        0,
    );

  const idealPrimaryAckPass =
    PURPOSES.every(
      (purpose) => {
        const value =
          summaries[
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
        summaries[
          purpose
        ][
          "ideal-semantic-oracle"
        ].decoyActualAcks ===
        0,
    );

  const ignoreVsIdealPass =
    PURPOSES.every(
      (purpose) =>
        summaries[
          purpose
        ]["ignore-all"]
          .relevantRepeatReports >
        summaries[
          purpose
        ][
          "ideal-semantic-oracle"
        ].relevantRepeatReports,
    );

  const respondAllPass =
    PURPOSES.every(
      (purpose) =>
        summaries[
          purpose
        ]["respond-all"]
          .relevantRepeatReports <
          summaries[
            purpose
          ]["ignore-all"]
            .relevantRepeatReports &&
        summaries[
          purpose
        ]["respond-all"]
          .decoyActualAcks >
          summaries[
            purpose
          ][
            "ideal-semantic-oracle"
          ].decoyActualAcks,
    );

  const rackSurfacePass =
    directionalControlPass(
      summaries,
      "rack-surface-only",
      "rack",
    );

  const rackSpeakerPass =
    directionalControlPass(
      summaries,
      "rack-speaker-only",
      "rack",
    );

  const sourceSurfacePass =
    directionalControlPass(
      summaries,
      "source-surface-only",
      "source",
    );

  const sourceSpeakerPass =
    directionalControlPass(
      summaries,
      "source-speaker-only",
      "source",
    );

  const idealAggregate =
    aggregatePersistent(
      summaries,
      "ideal-semantic-oracle",
    );

  const respondAggregate =
    aggregatePersistent(
      summaries,
      "respond-all",
    );

  const communicationAdvantage =
    idealAggregate.totalCommunicationActions <
      respondAggregate.totalCommunicationActions ||
    (
      idealAggregate.relevantRepeatReports ===
        respondAggregate.relevantRepeatReports &&
      idealAggregate.totalActualAcks <
        respondAggregate.totalActualAcks &&
      idealAggregate.decoyActualAcks ===
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
    summaries,
    consumerGatePass,
  };
}

function collectRunAudits(
  runs: RunTable,
) {
  return PURPOSES.flatMap(
    (purpose) =>
      MODES.map(
        (mode) => {
          const run =
            runs[
              purpose
            ][mode];
          const reports =
            auditGroundedReports(
              run.privateExperiences(),
            );
          const listener =
            run.listenerDebug();
          const listenerReportExperiences =
            run.privateExperiences().filter(
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

          return {
            purpose,
            mode,
            reports,
            listenerDecisionCount:
              listener.decisions.length,
            listenerReportExperiences,
          };
        },
      ),
  );
}

function persistentSummary(
  run:
    R3GroundedMaterialSemanticRun,
  purpose:
    R3GroundedMaterialPurpose,
) {
  const reports =
    auditGroundedReports(
      run.privateExperiences(),
    );
  const debug =
    run.listenerDebug();
  const decisions =
    new Map(
      debug.decisions.map(
        (decision) => [
          decision.eventId,
          decision,
        ],
      ),
    );

  const relevant =
    reports.filter(
      (report) =>
        report.domain ===
        purpose,
    );
  const decoy =
    reports.filter(
      (report) =>
        report.domain !==
        purpose,
    );

  const metrics =
    run.metrics();

  const relevantActualAcks =
    purpose === "rack"
      ? metrics.rackAckCount
      : metrics.sourceAckCount;

  const decoyActualAcks =
    purpose === "rack"
      ? metrics.sourceAckCount
      : metrics.rackAckCount;

  const relevantPrimaryReports =
    relevant.filter(
      (report) =>
        report.primary,
    );

  const relevantPrimaryDecisionAcks =
    relevantPrimaryReports.filter(
      (report) =>
        report.eventId !== null &&
        decisions.get(
          report.eventId,
        )?.shouldAcknowledge ===
          true,
    ).length;

  const relevantRepeatReports =
    relevant.filter(
      (report) =>
        report.repeat,
    ).length;

  const decoyDecisionAcks =
    decoy.filter(
      (report) =>
        report.eventId !== null &&
        decisions.get(
          report.eventId,
        )?.shouldAcknowledge ===
          true,
    ).length;

  return {
    reportCount:
      reports.length,
    allReportsHeard:
      reports.every(
        (report) =>
          report.eventId !==
            null &&
          decisions.has(
            report.eventId,
          ),
      ),
    relevantPrimaryReports:
      relevantPrimaryReports.length,
    relevantPrimaryDecisionAcks,
    relevantPrimaryActualAcks:
      Math.min(
        relevantActualAcks,
        relevantPrimaryReports.length,
      ),
    relevantRepeatReports,
    relevantActualAcks,
    decoyReportCount:
      decoy.length,
    decoyDecisionAcks,
    decoyActualAcks,
    totalActualAcks:
      metrics.totalAckCount,
    totalCommunicationActions:
      reports.length +
      metrics.totalAckCount,
    processingCompletedCount:
      metrics.processingCompletedCount,
  };
}

function directionalControlPass(
  summaries:
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
    summaries[
      matchingPurpose
    ][mode];

  const matchingIgnore =
    summaries[
      matchingPurpose
    ]["ignore-all"];

  const nonmatching =
    summaries[
      other
    ][mode];

  const nonmatchingIgnore =
    summaries[
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
  summaries:
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
        summaries[
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

function aggregateRelationAccuracy(
  runs: RunTable,
  mode:
    R3GroundedMaterialConsumerMode,
): number {
  const decisions =
    PURPOSES.flatMap(
      (purpose) =>
        runs[
          purpose
        ][mode]
          .listenerDebug()
          .decisions.map(
            (decision) => ({
              predicted:
                decision.shouldAcknowledge,
              target:
                decision.domain ===
                purpose,
            }),
          ),
    );

  if (
    decisions.length === 0
  ) {
    return 0;
  }

  return (
    decisions.filter(
      (item) =>
        item.predicted ===
        item.target,
    ).length /
    decisions.length
  );
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

    const grounded =
      inspected &&
      !visibleRawAt(
        experience,
        domain,
      );

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
      grounded,
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

function allRunsAtHorizon(
  runs: RunTable,
  ticks: number,
): boolean {
  return PURPOSES.every(
    (purpose) =>
      MODES.every(
        (mode) =>
          runs[
            purpose
          ][mode]
            .metrics()
            .ticks ===
          ticks,
      ),
  );
}
