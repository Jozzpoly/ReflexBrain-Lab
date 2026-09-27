import type {
  LifeEvent,
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  createR3GroundedMaterialSemanticRun,
  R3_GROUNDED_MATERIAL_MATTER_ID,
  R3_GROUNDED_MATERIAL_PLACES,
  R3_GROUNDED_MATERIAL_REPORTS,
  type R3GroundedMaterialDomain,
  type R3GroundedMaterialPurpose,
  type R3GroundedMaterialRegime,
} from "./grounded-material-semantic-consumer-run";
import {
  distance,
} from "./life-world";

export type R3SemanticSupervisionDisposition =
  | "candidate_fact_supervision"
  | "representation_context_only"
  | "research_causal_only"
  | "evaluation_only"
  | "circular_reject"
  | "noninformative"
  | "invariance_only";

export interface R3SemanticSupervisionChannelAudit {
  id: string;
  available: boolean;
  actorPrivateOrCausal: boolean;
  usesEvaluationOracle: boolean;
  purposeAwareGenerator: boolean;
  identityGated: boolean;
  teachesGroundedFactMeaning: boolean;
  teachesActorRelativePurposeRelation: boolean;
  legalForLocalRelationTraining: boolean;
  disposition: R3SemanticSupervisionDisposition;
  reason: string;
}

export interface R3LexicalRetrievalAudit {
  count: number;
  correct: number;
  accuracy: number;
  tieCount: number;
  tieRate: number;
}

export type R3SemanticSupervisionProvenanceClassification =
  | "SEMANTIC_SUPERVISION_PROVENANCE_INVALID"
  | "GROUNDED_RELATION_SUPERVISION_AVAILABLE"
  | "GROUNDED_FACT_SUPERVISION_ONLY"
  | "SEMANTIC_SUPERVISION_EMPTY";

export interface R3SemanticSupervisionProvenanceAudit {
  stageA: {
    matterIdSame: boolean;
    matterStatementsDiffer: boolean;
    reportTimelineIdentical: boolean;
    nonMatterIdaPrivateTrajectoryIdentical: boolean;
    reportPairCount: number;
    relationLabelFlipCount: number;
    relationLabelFlipRate: number | null;
    rackGroundedCount: number;
    rackReportCount: number;
    sourceGroundedCount: number;
    sourceReportCount: number;
    rackGroundingRate: number | null;
    sourceGroundingRate: number | null;
  };
  stageBLeakage: {
    rackPurposeRackReports: number;
    rackPurposeSourceReports: number;
    sourcePurposeRackReports: number;
    sourcePurposeSourceReports: number;
    reportTimelineIdenticalAcrossPurposes: boolean;
    purposeChangesRetryPressure: boolean;
  };
  lexical: {
    baseline: R3LexicalRetrievalAudit;
    evaluationParaphrase: R3LexicalRetrievalAudit;
  };
  channels: readonly R3SemanticSupervisionChannelAudit[];
  groundedFactSupervisionAvailable: boolean;
  groundedRelationSupervisionAvailable: boolean;
  classification: R3SemanticSupervisionProvenanceClassification;
  reasons: readonly string[];
}

interface CompactProvenanceRun {
  purpose: R3GroundedMaterialPurpose;
  regime: R3GroundedMaterialRegime;
  matterId: string;
  matterStatement: string;
  idaPrivateSignatures: readonly string[];
  reports: readonly {
    tick: number;
    eventId: string;
    domain: R3GroundedMaterialDomain;
    grounded: boolean;
  }[];
  timeline: readonly string[];
}

const REPORT_PARAPHRASES = {
  rack: [
    "No unfinished blank is available at the workshop intake.",
    "The worker feed point has run out of raw stock.",
    "There is no raw piece left at the bench input.",
  ],
  source: [
    "The raw-material reserve has been depleted.",
    "No unfinished stock remains at the supply point.",
    "The feedstock store has run dry.",
  ],
} as const;

const MATTER_PARAPHRASES = {
  rack: [
    "monitor shortages where unfinished stock is presented to the worker; depletion of the upstream reserve is outside this duty",
    "respond to reports that the workshop feed point lacks raw material, not to upstream storage depletion",
  ],
  source: [
    "monitor depletion of the upstream raw-material reserve; workstation intake shortages are outside this duty",
    "respond to reports that the supply reserve has run out, not to shortages at the worker feed point",
  ],
} as const;

export function auditR3GroundedSemanticSupervisionProvenance():
R3SemanticSupervisionProvenanceAudit {
  const rackRelation = runCompact(
    "rack",
    "relation",
  );
  const sourceRelation = runCompact(
    "source",
    "relation",
  );

  const stageA =
    auditStageACounterfactual(
      rackRelation,
      sourceRelation,
    );

  const rackPersistent = runCompact(
    "rack",
    "persistent",
  );
  const sourcePersistent = runCompact(
    "source",
    "persistent",
  );

  const stageBLeakage = {
    rackPurposeRackReports:
      countDomain(
        rackPersistent,
        "rack",
      ),
    rackPurposeSourceReports:
      countDomain(
        rackPersistent,
        "source",
      ),
    sourcePurposeRackReports:
      countDomain(
        sourcePersistent,
        "rack",
      ),
    sourcePurposeSourceReports:
      countDomain(
        sourcePersistent,
        "source",
      ),
    reportTimelineIdenticalAcrossPurposes:
      JSON.stringify(
        rackPersistent.timeline,
      ) ===
      JSON.stringify(
        sourcePersistent.timeline,
      ),
    purposeChangesRetryPressure:
      countDomain(
        rackPersistent,
        "rack",
      ) !==
        countDomain(
          sourcePersistent,
          "rack",
        ) ||
      countDomain(
        rackPersistent,
        "source",
      ) !==
        countDomain(
          sourcePersistent,
          "source",
        ),
  };

  const baseline =
    lexicalRetrievalAudit(
      [
        {
          text:
            R3_GROUNDED_MATERIAL_REPORTS
              .rack,
          target: "rack",
        },
        {
          text:
            R3_GROUNDED_MATERIAL_REPORTS
              .source,
          target: "source",
        },
      ],
      [
        matterStatementFor(
          rackRelation,
        ),
        matterStatementFor(
          sourceRelation,
        ),
      ],
    );

  const evaluationParaphrase =
    lexicalRetrievalAudit(
      [
        ...REPORT_PARAPHRASES.rack.map(
          (text) => ({
            text,
            target:
              "rack" as const,
          }),
        ),
        ...REPORT_PARAPHRASES.source.map(
          (text) => ({
            text,
            target:
              "source" as const,
          }),
        ),
      ],
      [
        ...MATTER_PARAPHRASES.rack.map(
          (text, index) => ({
            purpose:
              "rack" as const,
            text,
            pairIndex: index,
          }),
        ),
        ...MATTER_PARAPHRASES.source.map(
          (text, index) => ({
            purpose:
              "source" as const,
            text,
            pairIndex: index,
          }),
        ),
      ],
      true,
    );

  const factualGroundingAvailable =
    stageA.rackReportCount >=
      20 &&
    stageA.sourceReportCount >=
      20 &&
    stageA.rackGroundingRate ===
      1 &&
    stageA.sourceGroundingRate ===
      1;

  const channels =
    buildChannelLedger(
      factualGroundingAvailable,
      stageBLeakage
        .purposeChangesRetryPressure,
    );

  const groundedRelationSupervisionAvailable =
    channels.some(
      (channel) =>
        channel.available &&
        channel
          .teachesActorRelativePurposeRelation &&
        channel
          .legalForLocalRelationTraining,
    );

  const provenanceValid =
    factualGroundingAvailable &&
    stageA.matterIdSame &&
    stageA
      .matterStatementsDiffer &&
    stageA
      .reportTimelineIdentical &&
    stageA
      .nonMatterIdaPrivateTrajectoryIdentical &&
    stageA.reportPairCount >=
      20 &&
    stageA
      .relationLabelFlipRate ===
      1;

  const reasons: string[] = [];

  if (!provenanceValid) {
    reasons.push(
      "Stage-A grounded purpose counterfactual or factual provenance failed",
    );
  }

  if (
    factualGroundingAvailable &&
    !groundedRelationSupervisionAvailable
  ) {
    reasons.push(
      "grounded fact supervision exists but no non-circular local signal distinguishes fact×purpose relevance",
    );
  }

  if (
    stageBLeakage
      .purposeChangesRetryPressure
  ) {
    reasons.push(
      "persistent retry pressure changes with purpose before listener response, so retry consequences encode the evaluation relation upstream",
    );
  }

  let classification:
    R3SemanticSupervisionProvenanceClassification;

  if (!provenanceValid) {
    classification =
      "SEMANTIC_SUPERVISION_PROVENANCE_INVALID";
  } else if (
    groundedRelationSupervisionAvailable
  ) {
    classification =
      "GROUNDED_RELATION_SUPERVISION_AVAILABLE";
  } else if (
    factualGroundingAvailable
  ) {
    classification =
      "GROUNDED_FACT_SUPERVISION_ONLY";
  } else {
    classification =
      "SEMANTIC_SUPERVISION_EMPTY";
  }

  return {
    stageA,
    stageBLeakage,
    lexical: {
      baseline,
      evaluationParaphrase,
    },
    channels,
    groundedFactSupervisionAvailable:
      factualGroundingAvailable,
    groundedRelationSupervisionAvailable,
    classification,
    reasons,
  };
}

function runCompact(
  purpose:
    R3GroundedMaterialPurpose,
  regime:
    R3GroundedMaterialRegime,
): CompactProvenanceRun {
  const run =
    createR3GroundedMaterialSemanticRun(
      purpose,
      "ignore-all",
      regime,
    );

  run.runTicks(
    5400,
  );

  const experiences =
    run.privateExperiences();
  const events =
    run.allEvents();

  const ida =
    experiences.filter(
      (experience) =>
        experience.residentId ===
        "resident:ida",
    );

  const matter =
    ida[0]?.matters.find(
      (candidate) =>
        candidate.id ===
        R3_GROUNDED_MATERIAL_MATTER_ID,
    );

  if (!matter) {
    throw new Error(
      "grounded semantic provenance run missing Ida matter",
    );
  }

  const reports =
    collectGroundedReports(
      experiences,
    );

  return {
    purpose,
    regime,
    matterId:
      matter.id,
    matterStatement:
      matter.statement,
    idaPrivateSignatures:
      ida.map(
        nonMatterPrivateSignature,
      ),
    reports,
    timeline:
      events
        .map(
          (event) => {
            const domain =
              reportDomain(
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
            value,
          ): value is string =>
            value !== null,
        ),
  };
}

function auditStageACounterfactual(
  rack:
    CompactProvenanceRun,
  source:
    CompactProvenanceRun,
) {
  const rackByKey =
    new Map(
      rack.reports.map(
        (report) => [
          report.tick +
            ":" +
            report.domain,
          report,
        ],
      ),
    );

  const sourceByKey =
    new Map(
      source.reports.map(
        (report) => [
          report.tick +
            ":" +
            report.domain,
          report,
        ],
      ),
    );

  const sharedKeys =
    [...rackByKey.keys()]
      .filter(
        (key) =>
          sourceByKey.has(
            key,
          ),
      )
      .sort();

  let flips = 0;

  for (const key of sharedKeys) {
    const left =
      rackByKey.get(
        key,
      )!;
    const right =
      sourceByKey.get(
        key,
      )!;

    const rackTarget =
      left.domain ===
      "rack";
    const sourceTarget =
      right.domain ===
      "source";

    if (
      rackTarget !==
      sourceTarget
    ) {
      flips += 1;
    }
  }

  const rackReports =
    rack.reports.filter(
      (report) =>
        report.domain ===
        "rack",
    );
  const sourceReports =
    rack.reports.filter(
      (report) =>
        report.domain ===
        "source",
    );

  return {
    matterIdSame:
      rack.matterId ===
      source.matterId,
    matterStatementsDiffer:
      rack.matterStatement !==
      source.matterStatement,
    reportTimelineIdentical:
      JSON.stringify(
        rack.timeline,
      ) ===
      JSON.stringify(
        source.timeline,
      ),
    nonMatterIdaPrivateTrajectoryIdentical:
      JSON.stringify(
        rack.idaPrivateSignatures,
      ) ===
      JSON.stringify(
        source.idaPrivateSignatures,
      ),
    reportPairCount:
      sharedKeys.length,
    relationLabelFlipCount:
      flips,
    relationLabelFlipRate:
      sharedKeys.length > 0
        ? flips /
          sharedKeys.length
        : null,
    rackGroundedCount:
      rackReports.filter(
        (report) =>
          report.grounded,
      ).length,
    rackReportCount:
      rackReports.length,
    sourceGroundedCount:
      sourceReports.filter(
        (report) =>
          report.grounded,
      ).length,
    sourceReportCount:
      sourceReports.length,
    rackGroundingRate:
      rackReports.length > 0
        ? rackReports.filter(
            (report) =>
              report.grounded,
          ).length /
          rackReports.length
        : null,
    sourceGroundingRate:
      sourceReports.length > 0
        ? sourceReports.filter(
            (report) =>
              report.grounded,
          ).length /
          sourceReports.length
        : null,
  };
}

function buildChannelLedger(
  factualGroundingAvailable:
    boolean,
  stageBPurposeLeak:
    boolean,
): readonly R3SemanticSupervisionChannelAudit[] {
  return [
    {
      id:
        "same-observation-report-fact",
      available:
        factualGroundingAvailable,
      actorPrivateOrCausal:
        true,
      usesEvaluationOracle:
        false,
      purposeAwareGenerator:
        false,
      identityGated:
        false,
      teachesGroundedFactMeaning:
        true,
      teachesActorRelativePurposeRelation:
        false,
      legalForLocalRelationTraining:
        false,
      disposition:
        "candidate_fact_supervision",
      reason:
        "speaker-private fact and emitted report correspond without consulting listener purpose; this can ground factual meaning but does not say whether the fact matters to another actor",
    },
    {
      id:
        "cross-actor-material-multiview",
      available:
        true,
      actorPrivateOrCausal:
        true,
      usesEvaluationOracle:
        false,
      purposeAwareGenerator:
        false,
      identityGated:
        false,
      teachesGroundedFactMeaning:
        true,
      teachesActorRelativePurposeRelation:
        false,
      legalForLocalRelationTraining:
        false,
      disposition:
        "candidate_fact_supervision",
      reason:
        "previously qualified private multi-view material donor can align factual representations but carries no purpose relevance target",
    },
    {
      id:
        "matter-lived-trajectory-cooccurrence",
      available:
        true,
      actorPrivateOrCausal:
        true,
      usesEvaluationOracle:
        false,
      purposeAwareGenerator:
        false,
      identityGated:
        true,
      teachesGroundedFactMeaning:
        false,
      teachesActorRelativePurposeRelation:
        false,
      legalForLocalRelationTraining:
        false,
      disposition:
        "representation_context_only",
      reason:
        "ordinary fixture policy consumes matter identity; wording-only paraphrase can leave life invariant, so trajectory cooccurrence does not prove statement meaning",
    },
    {
      id:
        "paired-matter-ablation-responsibility",
      available:
        true,
      actorPrivateOrCausal:
        true,
      usesEvaluationOracle:
        false,
      purposeAwareGenerator:
        false,
      identityGated:
        true,
      teachesGroundedFactMeaning:
        false,
      teachesActorRelativePurposeRelation:
        false,
      legalForLocalRelationTraining:
        false,
      disposition:
        "research_causal_only",
      reason:
        "paired ablation proves causal responsibility of fixture matter slots/ids whose policies are identity-gated, not semantic truth of their statements",
    },
    {
      id:
        "stage-a-ideal-relation",
      available:
        true,
      actorPrivateOrCausal:
        false,
      usesEvaluationOracle:
        true,
      purposeAwareGenerator:
        false,
      identityGated:
        false,
      teachesGroundedFactMeaning:
        false,
      teachesActorRelativePurposeRelation:
        true,
      legalForLocalRelationTraining:
        false,
      disposition:
        "evaluation_only",
      reason:
        "domain×purpose match is the answer used to score the consumer and would be circular if copied into TRAIN",
    },
    {
      id:
        "stage-b-retry-pattern",
      available:
        stageBPurposeLeak,
      actorPrivateOrCausal:
        false,
      usesEvaluationOracle:
        false,
      purposeAwareGenerator:
        true,
      identityGated:
        false,
      teachesGroundedFactMeaning:
        false,
      teachesActorRelativePurposeRelation:
        true,
      legalForLocalRelationTraining:
        false,
      disposition:
        "circular_reject",
      reason:
        "the pressure generator receives the purpose and changes which reporter retries before the listener does anything",
    },
    {
      id:
        "ideal-listener-ack-action",
      available:
        true,
      actorPrivateOrCausal:
        false,
      usesEvaluationOracle:
        true,
      purposeAwareGenerator:
        false,
      identityGated:
        false,
      teachesGroundedFactMeaning:
        false,
      teachesActorRelativePurposeRelation:
        true,
      legalForLocalRelationTraining:
        false,
      disposition:
        "circular_reject",
      reason:
        "the acknowledgement action is generated by the authored semantic oracle itself",
    },
    {
      id:
        "physical-throughput-outcome",
      available:
        true,
      actorPrivateOrCausal:
        true,
      usesEvaluationOracle:
        false,
      purposeAwareGenerator:
        false,
      identityGated:
        false,
      teachesGroundedFactMeaning:
        false,
      teachesActorRelativePurposeRelation:
        false,
      legalForLocalRelationTraining:
        false,
      disposition:
        "noninformative",
      reason:
        "qualified consumer modes preserve the same 47 processing completions per run, so throughput does not distinguish semantic routing",
    },
    {
      id:
        "authored-paraphrase-invariance",
      available:
        true,
      actorPrivateOrCausal:
        false,
      usesEvaluationOracle:
        false,
      purposeAwareGenerator:
        false,
      identityGated:
        false,
      teachesGroundedFactMeaning:
        false,
      teachesActorRelativePurposeRelation:
        false,
      legalForLocalRelationTraining:
        false,
      disposition:
        "invariance_only",
      reason:
        "authored semantic-equivalence assumptions can support held-out evaluation or regularization but are not an independent relevance label",
    },
    {
      id:
        "actor-private-indistinguishability",
      available:
        true,
      actorPrivateOrCausal:
        true,
      usesEvaluationOracle:
        false,
      purposeAwareGenerator:
        false,
      identityGated:
        false,
      teachesGroundedFactMeaning:
        false,
      teachesActorRelativePurposeRelation:
        false,
      legalForLocalRelationTraining:
        false,
      disposition:
        "invariance_only",
      reason:
        "identical legal private state supports equality constraints but provides no positive direction for which grounded fact matters to which purpose",
    },
  ];
}

function collectGroundedReports(
  experiences:
    readonly ResidentPrivateExperience[],
) {
  return [
    ...collectDomainReports(
      experiences,
      "rack",
      "resident:janek",
    ),
    ...collectDomainReports(
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

function collectDomainReports(
  experiences:
    readonly ResidentPrivateExperience[],
  domain:
    R3GroundedMaterialDomain,
  residentId:
    "resident:janek" |
    "resident:mira",
) {
  const place =
    domain === "rack"
      ? R3_GROUNDED_MATERIAL_PLACES
          .input_rack
      : R3_GROUNDED_MATERIAL_PLACES
          .source;

  return experiences
    .filter(
      (experience) =>
        experience.residentId ===
          residentId &&
        experience.decision
          .intent.kind ===
          "speak" &&
        experience.decision
          .intent.text ===
          R3_GROUNDED_MATERIAL_REPORTS[
            domain
          ],
    )
    .map(
      (experience) => {
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

        const inspected =
          distance(
            experience
              .observation.self
              .position,
            place.position,
          ) <= 2.5;

        const hasRaw =
          experience
            .observation
            .visibleObjects.some(
              (object) =>
                object.kind ===
                  "raw_blank" &&
                object.location
                  .kind ===
                  "free" &&
                distance(
                  object.location
                    .position,
                  place.position,
                ) <= 0.75,
            );

        return {
          tick:
            experience.tick,
          eventId:
            outcome?.id ??
            "missing",
          domain,
          grounded:
            inspected &&
            !hasRaw,
        };
      },
    );
}

function nonMatterPrivateSignature(
  experience:
    ResidentPrivateExperience,
): string {
  return JSON.stringify({
    tick:
      experience.tick,
    activityBefore:
      experience.activityBefore,
    observation:
      experience.observation,
    memory:
      experience.memory,
    decision:
      experience.decision,
    factualOutcomeEvents:
      experience
        .factualOutcomeEvents,
  });
}

function reportDomain(
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

function countDomain(
  run:
    CompactProvenanceRun,
  domain:
    R3GroundedMaterialDomain,
): number {
  return run.reports.filter(
    (report) =>
      report.domain ===
      domain,
  ).length;
}

function matterStatementFor(
  run:
    CompactProvenanceRun,
) {
  return {
    purpose:
      run.purpose,
    text:
      run.matterStatement,
  };
}

function lexicalRetrievalAudit(
  reports:
    readonly {
      text: string;
      target:
        R3GroundedMaterialPurpose;
    }[],
  matters:
    readonly {
      purpose:
        R3GroundedMaterialPurpose;
      text: string;
      pairIndex?: number;
    }[],
  pairedByIndex = false,
): R3LexicalRetrievalAudit {
  let count = 0;
  let correct = 0;
  let ties = 0;

  for (const report of reports) {
    const candidateSets =
      pairedByIndex
        ? [
            0,
            1,
          ].map(
            (pairIndex) =>
              matters.filter(
                (matter) =>
                  matter.pairIndex ===
                  pairIndex,
              ),
          )
        : [matters];

    for (
      const candidates of
        candidateSets
    ) {
      if (
        candidates.length !==
        2
      ) {
        throw new Error(
          "lexical provenance audit requires exactly two candidate matters",
        );
      }

      count += 1;

      const scored =
        candidates.map(
          (matter) => ({
            matter,
            score:
              lexicalJaccard(
                tokenSet(
                  report.text,
                ),
                tokenSet(
                  matter.text,
                ),
              ),
          }),
        );

      const best =
        Math.max(
          ...scored.map(
            (item) =>
              item.score,
          ),
        );

      const winners =
        scored.filter(
          (item) =>
            item.score ===
            best,
        );

      if (
        winners.length >
        1
      ) {
        ties += 1;
      }

      const predicted =
        [...winners].sort(
          (left, right) =>
            left.matter.purpose.localeCompare(
              right.matter.purpose,
            ),
        )[0]!.matter.purpose;

      if (
        predicted ===
        report.target
      ) {
        correct += 1;
      }
    }
  }

  return {
    count,
    correct,
    accuracy:
      count > 0
        ? correct /
          count
        : 0,
    tieCount:
      ties,
    tieRate:
      count > 0
        ? ties /
          count
        : 0,
  };
}

function tokenSet(
  text: string,
): ReadonlySet<string> {
  return new Set(
    text
      .toLowerCase()
      .match(
        /[a-z]+(?:'[a-z]+)?/g,
      ) ?? [],
  );
}

function lexicalJaccard(
  left:
    ReadonlySet<string>,
  right:
    ReadonlySet<string>,
): number {
  let intersection =
    0;

  for (
    const token of
      left
  ) {
    if (
      right.has(
        token,
      )
    ) {
      intersection +=
        1;
    }
  }

  const union =
    new Set([
      ...left,
      ...right,
    ]).size;

  return union > 0
    ? intersection /
        union
    : 0;
}
