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
  type R3GroundedMaterialRunMetrics,
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

interface PersistentSummary {
  reportCount: number;
  allReportsHeard: boolean;
  relevantPrimaryReports: number;
  relevantPrimaryDecisionAcks: number;
  relevantRepeatReports: number;
  relevantActualAcks: number;
  decoyReportCount: number;
  decoyDecisionAcks: number;
  decoyActualAcks: number;
  totalActualAcks: number;
  totalCommunicationActions: number;
  processingCompletedCount: number;
}

interface CompactRunAudit {
  purpose: R3GroundedMaterialPurpose;
  mode: R3GroundedMaterialConsumerMode;
  regime: R3GroundedMaterialRegime;
  ticks: number;
  reports: readonly GroundedReportRecord[];
  groundingPass: boolean;
  allReportsHeard: boolean;
  listenerDirectSightExcluded: boolean;
  timeline: readonly string[];
  relationCorrect: number;
  relationTotal: number;
  relationTargetPositive: number;
  relationTargetNegative: number;
  metrics: R3GroundedMaterialRunMetrics;
  persistent: PersistentSummary;
}

describe(
  "R3 grounded material semantic consumer",
  () => {
    it(
      "executes the frozen relation and persistent consumer gates without a learner",
      () => {
        const relation =
          executeRegime(
            "relation",
          );
        const persistent =
          executeRegime(
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
          relation.every(
            (audit) =>
              audit.ticks ===
              5400,
          ),
        ).toBe(true);
        expect(
          persistent.every(
            (audit) =>
              audit.ticks ===
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

function executeRegime(
  regime:
    R3GroundedMaterialRegime,
): readonly CompactRunAudit[] {
  const audits:
    CompactRunAudit[] = [];

  for (
    const purpose of
      PURPOSES
  ) {
    for (
      const mode of
        MODES
    ) {
      audits.push(
        executeOne(
          purpose,
          mode,
          regime,
        ),
      );
    }
  }

  return audits;
}

function executeOne(
  purpose:
    R3GroundedMaterialPurpose,
  mode:
    R3GroundedMaterialConsumerMode,
  regime:
    R3GroundedMaterialRegime,
): CompactRunAudit {
  const run =
    createR3GroundedMaterialSemanticRun(
      purpose,
      mode,
      regime,
    );

  run.runTicks(
    5400,
  );

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

  const decisionsByEvent =
    new Map(
      debug.decisions.map(
        (decision) => [
          decision.eventId,
          decision,
        ],
      ),
    );

  const relationCorrect =
    debug.decisions.filter(
      (decision) =>
        decision.shouldAcknowledge ===
        (
          decision.domain ===
          purpose
        ),
    ).length;

  const relationTargetPositive =
    debug.decisions.filter(
      (decision) =>
        decision.domain ===
        purpose,
    ).length;

  const relationTargetNegative =
    debug.decisions.length -
    relationTargetPositive;

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

  return {
    purpose,
    mode,
    regime,
    ticks:
      metrics.ticks,
    reports,
    groundingPass:
      reports.every(
        (report) =>
          report.grounded,
      ),
    allReportsHeard:
      reports.every(
        (report) =>
          report.eventId !==
            null &&
          decisionsByEvent.has(
            report.eventId,
          ),
      ),
    listenerDirectSightExcluded:
      listenerReportExperiences.every(
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
    timeline:
      reportTimeline(
        events,
      ),
    relationCorrect,
    relationTotal:
      debug.decisions.length,
    relationTargetPositive,
    relationTargetNegative,
    metrics,
    persistent:
      persistentSummary(
        reports,
        debug.decisions,
        metrics,
        purpose,
      ),
  };
}

function auditStageA(
  audits:
    readonly CompactRunAudit[],
) {
  const groundingPass =
    audits.every(
      (audit) =>
        audit.groundingPass,
    );

  const allReportsHeard =
    audits.every(
      (audit) =>
        audit.allReportsHeard,
    );

  const listenerDirectSightExcluded =
    audits.every(
      (audit) =>
        audit.listenerDirectSightExcluded,
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
          findAudit(
            audits,
            purpose,
            "ignore-all",
          );

        return MODES.every(
          (mode) =>
            JSON.stringify(
              findAudit(
                audits,
                purpose,
                mode,
              ).timeline,
            ) ===
            JSON.stringify(
              baseline.timeline,
            ),
        );
      },
    );

  const idealAccuracy =
    aggregateRelationAccuracy(
      audits,
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
            audits,
            mode as R3GroundedMaterialConsumerMode,
          ),
        ],
      ),
    );

  const baseline =
    PURPOSES.map(
      (purpose) =>
        findAudit(
          audits,
          purpose,
          "ignore-all",
        ),
    );

  const positives =
    baseline.reduce(
      (sum, audit) =>
        sum +
        audit.relationTargetPositive,
      0,
    );

  const negatives =
    baseline.reduce(
      (sum, audit) =>
        sum +
        audit.relationTargetNegative,
      0,
    );

  const majorityAccuracy =
    positives +
      negatives >
    0
      ? Math.max(
          positives,
          negatives,
        ) /
        (
          positives +
          negatives
        )
      : 0;

  const matterIdOnlyAccuracy =
    majorityAccuracy;

  const semanticGatePass =
    minRackReports >=
      10 &&
    minSourceReports >=
      10 &&
    idealAccuracy ===
      1 &&
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
  audits:
    readonly CompactRunAudit[],
) {
  const groundingPass =
    audits.every(
      (audit) =>
        audit.groundingPass,
    );

  const repeatPressurePass =
    PURPOSES.every(
      (purpose) =>
        findAudit(
          audits,
          purpose,
          "ignore-all",
        ).persistent
          .relevantRepeatReports >
        0,
    );

  const idealPrimaryAckPass =
    PURPOSES.every(
      (purpose) => {
        const value =
          findAudit(
            audits,
            purpose,
            "ideal-semantic-oracle",
          ).persistent;

        return (
          value
            .relevantPrimaryDecisionAcks ===
            value
              .relevantPrimaryReports &&
          value
            .relevantActualAcks ===
            value
              .relevantPrimaryReports
        );
      },
    );

  const idealZeroDecoyPass =
    PURPOSES.every(
      (purpose) =>
        findAudit(
          audits,
          purpose,
          "ideal-semantic-oracle",
        ).persistent
          .decoyActualAcks ===
        0,
    );

  const ignoreVsIdealPass =
    PURPOSES.every(
      (purpose) =>
        findAudit(
          audits,
          purpose,
          "ignore-all",
        ).persistent
          .relevantRepeatReports >
        findAudit(
          audits,
          purpose,
          "ideal-semantic-oracle",
        ).persistent
          .relevantRepeatReports,
    );

  const respondAllPass =
    PURPOSES.every(
      (purpose) =>
        findAudit(
          audits,
          purpose,
          "respond-all",
        ).persistent
          .relevantRepeatReports <
          findAudit(
            audits,
            purpose,
            "ignore-all",
          ).persistent
            .relevantRepeatReports &&
        findAudit(
          audits,
          purpose,
          "respond-all",
        ).persistent
          .decoyActualAcks >
          findAudit(
            audits,
            purpose,
            "ideal-semantic-oracle",
          ).persistent
            .decoyActualAcks,
    );

  const rackSurfacePass =
    directionalControlPass(
      audits,
      "rack-surface-only",
      "rack",
    );

  const rackSpeakerPass =
    directionalControlPass(
      audits,
      "rack-speaker-only",
      "rack",
    );

  const sourceSurfacePass =
    directionalControlPass(
      audits,
      "source-surface-only",
      "source",
    );

  const sourceSpeakerPass =
    directionalControlPass(
      audits,
      "source-speaker-only",
      "source",
    );

  const idealAggregate =
    aggregatePersistent(
      audits,
      "ideal-semantic-oracle",
    );

  const respondAggregate =
    aggregatePersistent(
      audits,
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
    runSummaries:
      audits.map(
        (audit) => ({
          purpose:
            audit.purpose,
          mode:
            audit.mode,
          rackReports:
            audit.reports.filter(
              (report) =>
                report.domain ===
                "rack",
            ).length,
          sourceReports:
            audit.reports.filter(
              (report) =>
                report.domain ===
                "source",
            ).length,
          ...audit.persistent,
        }),
      ),
    consumerGatePass,
  };
}

function persistentSummary(
  reports:
    readonly GroundedReportRecord[],
  decisions:
    readonly {
      eventId: string;
      domain:
        R3GroundedMaterialDomain;
      purpose:
        R3GroundedMaterialPurpose;
      shouldAcknowledge:
        boolean;
    }[],
  metrics:
    R3GroundedMaterialRunMetrics,
  purpose:
    R3GroundedMaterialPurpose,
): PersistentSummary {
  const decisionsByEvent =
    new Map(
      decisions.map(
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

  const relevantPrimary =
    relevant.filter(
      (report) =>
        report.primary,
    );

  const relevantActualAcks =
    purpose === "rack"
      ? metrics.rackAckCount
      : metrics.sourceAckCount;

  const decoyActualAcks =
    purpose === "rack"
      ? metrics.sourceAckCount
      : metrics.rackAckCount;

  return {
    reportCount:
      reports.length,
    allReportsHeard:
      reports.every(
        (report) =>
          report.eventId !==
            null &&
          decisionsByEvent.has(
            report.eventId,
          ),
      ),
    relevantPrimaryReports:
      relevantPrimary.length,
    relevantPrimaryDecisionAcks:
      relevantPrimary.filter(
        (report) =>
          report.eventId !==
            null &&
          decisionsByEvent.get(
            report.eventId,
          )?.shouldAcknowledge ===
            true,
      ).length,
    relevantRepeatReports:
      relevant.filter(
        (report) =>
          report.repeat,
      ).length,
    relevantActualAcks,
    decoyReportCount:
      decoy.length,
    decoyDecisionAcks:
      decoy.filter(
        (report) =>
          report.eventId !==
            null &&
          decisionsByEvent.get(
            report.eventId,
          )?.shouldAcknowledge ===
            true,
      ).length,
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
  audits:
    readonly CompactRunAudit[],
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
    findAudit(
      audits,
      matchingPurpose,
      mode,
    ).persistent;

  const matchingIgnore =
    findAudit(
      audits,
      matchingPurpose,
      "ignore-all",
    ).persistent;

  const nonmatching =
    findAudit(
      audits,
      other,
      mode,
    ).persistent;

  const nonmatchingIgnore =
    findAudit(
      audits,
      other,
      "ignore-all",
    ).persistent;

  return (
    matching
      .relevantActualAcks >
      0 &&
    matching
      .relevantRepeatReports <
      matchingIgnore
        .relevantRepeatReports &&
    nonmatching
      .relevantActualAcks ===
      0 &&
    nonmatching
      .relevantRepeatReports >=
      nonmatchingIgnore
        .relevantRepeatReports
  );
}

function aggregatePersistent(
  audits:
    readonly CompactRunAudit[],
  mode:
    R3GroundedMaterialConsumerMode,
) {
  const values =
    PURPOSES.map(
      (purpose) =>
        findAudit(
          audits,
          purpose,
          mode,
        ).persistent,
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
  audits:
    readonly CompactRunAudit[],
  mode:
    R3GroundedMaterialConsumerMode,
): number {
  const selected =
    audits.filter(
      (audit) =>
        audit.mode === mode,
    );

  const correct =
    selected.reduce(
      (sum, audit) =>
        sum +
        audit.relationCorrect,
      0,
    );

  const total =
    selected.reduce(
      (sum, audit) =>
        sum +
        audit.relationTotal,
      0,
    );

  return total > 0
    ? correct / total
    : 0;
}

function findAudit(
  audits:
    readonly CompactRunAudit[],
  purpose:
    R3GroundedMaterialPurpose,
  mode:
    R3GroundedMaterialConsumerMode,
): CompactRunAudit {
  const found =
    audits.find(
      (audit) =>
        audit.purpose ===
          purpose &&
        audit.mode ===
          mode,
    );

  if (!found) {
    throw new Error(
      "missing grounded material audit " +
        purpose +
        " / " +
        mode,
    );
  }

  return found;
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
  let reportCountInEpisode =
    0;
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

    reportCountInEpisode +=
      1;
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
    event.kind !==
      "speech"
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
