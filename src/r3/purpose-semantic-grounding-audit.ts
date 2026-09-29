import {
  createAutonomousContactRun,
  r3ContactAuthoredMatters,
} from "./autonomous-contact-run";
import {
  createAutonomousLifeRun,
  r3MaterialAuthoredMatters,
} from "./autonomous-life-run";
import {
  createR3GroundedMaterialSemanticRun,
  R3_GROUNDED_MATERIAL_MATTER_ID,
  R3_GROUNDED_MATERIAL_REPORTS,
} from "./grounded-material-semantic-consumer-run";
import type {
  AutonomousLifeStep,
  ResidentDecision,
  ResidentId,
  ResidentMatter,
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  r3ContactParaphraseMatters,
  r3MaterialParaphraseMatters,
} from "./matter-relation-corpus";

export type R3PurposeSemanticGroundingClassification =
  | "PURPOSE_SEMANTIC_GROUNDING_AVAILABLE"
  | "PURPOSE_COMMITMENT_IDENTITY_ONLY"
  | "PURPOSE_GROUNDING_AUDIT_INVALID";

export interface R3PurposeSemanticGroundingChannelAudit {
  id: string;
  actorPrivate: boolean;
  identityGated: boolean;
  oracleGenerated: boolean;
  changesWithPurposeMeaning: boolean;
  stableUnderSameMeaningParaphrase: boolean;
  causallyRelatedToOrdinaryLife: boolean;
  availableBeforeDecision: boolean;
  qualifiesPurposeSemanticGrounding: boolean;
  reason: string;
}

export interface R3PurposeSemanticGroundingAudit {
  statementPermutation: {
    materialTicks: number;
    contactTicks: number;
    materialWorldTrajectoryIdentical: boolean;
    materialPrivateCausalTrajectoryIdentical: boolean;
    contactWorldTrajectoryIdentical: boolean;
    contactPrivateCausalTrajectoryIdentical: boolean;
    statementsChanged: boolean;
    matterIdsPreserved: boolean;
  };
  wordingParaphrase: {
    materialWorldTrajectoryIdentical: boolean;
    materialPrivateCausalTrajectoryIdentical: boolean;
    contactWorldTrajectoryIdentical: boolean;
    contactPrivateCausalTrajectoryIdentical: boolean;
    allStatementsChanged: boolean;
    allMatterIdsPreserved: boolean;
    allEstablishedTicksPreserved: boolean;
    allSourcesPreserved: boolean;
  };
  identityPresenceCausality: {
    materialResident: ResidentId;
    materialDecisionChangedAfterMatterRemoval: boolean;
    contactResident: ResidentId;
    contactDecisionChangedAfterMatterRemoval: boolean;
  };
  semanticConsumerBoundary: {
    ticks: number;
    sameMatterId: boolean;
    matterId: string;
    purposeStatementsDiffer: boolean;
    nonMatterPrivateTrajectoryIdentical: boolean;
    groundedReportTimelineIdentical: boolean;
    groundedReportCount: number;
  };
  channels: readonly R3PurposeSemanticGroundingChannelAudit[];
  qualifiedChannelCount: number;
  classification: R3PurposeSemanticGroundingClassification;
  reasons: readonly string[];
}

const AUDIT_TICKS = 420;
const IDENTITY_INTERVENTION_TICK = 20;

export function auditR3PurposeSemanticGrounding():
R3PurposeSemanticGroundingAudit {
  const statementPermutation =
    auditStatementPermutation();

  const wordingParaphrase =
    auditWordingParaphrase();

  const identityPresenceCausality = {
    materialResident:
      "resident:janek" as const,
    materialDecisionChangedAfterMatterRemoval:
      decisionChangesAfterMatterRemoval(
        "material",
        "resident:janek",
      ),
    contactResident:
      "resident:janek" as const,
    contactDecisionChangedAfterMatterRemoval:
      decisionChangesAfterMatterRemoval(
        "contact",
        "resident:janek",
      ),
  };

  const semanticConsumerBoundary =
    auditSemanticConsumerBoundary();

  const channels =
    buildPurposeChannelLedger({
      statementPermutation,
      wordingParaphrase,
      identityPresenceCausality,
      semanticConsumerBoundary,
    });

  const qualifiedChannelCount =
    channels.filter(
      (channel) =>
        channel.qualifiesPurposeSemanticGrounding,
    ).length;

  const pairedAuditValid =
    statementPermutation.statementsChanged &&
    statementPermutation.matterIdsPreserved &&
    wordingParaphrase.allStatementsChanged &&
    wordingParaphrase.allMatterIdsPreserved &&
    wordingParaphrase.allEstablishedTicksPreserved &&
    wordingParaphrase.allSourcesPreserved &&
    semanticConsumerBoundary.sameMatterId &&
    semanticConsumerBoundary.purposeStatementsDiffer &&
    semanticConsumerBoundary.groundedReportCount > 0;

  const statementInert =
    statementPermutation
      .materialWorldTrajectoryIdentical &&
    statementPermutation
      .materialPrivateCausalTrajectoryIdentical &&
    statementPermutation
      .contactWorldTrajectoryIdentical &&
    statementPermutation
      .contactPrivateCausalTrajectoryIdentical;

  const paraphraseInvariant =
    wordingParaphrase
      .materialWorldTrajectoryIdentical &&
    wordingParaphrase
      .materialPrivateCausalTrajectoryIdentical &&
    wordingParaphrase
      .contactWorldTrajectoryIdentical &&
    wordingParaphrase
      .contactPrivateCausalTrajectoryIdentical;

  const identityCausal =
    identityPresenceCausality
      .materialDecisionChangedAfterMatterRemoval &&
    identityPresenceCausality
      .contactDecisionChangedAfterMatterRemoval;

  const cleanSemanticBoundary =
    semanticConsumerBoundary
      .nonMatterPrivateTrajectoryIdentical &&
    semanticConsumerBoundary
      .groundedReportTimelineIdentical;

  const reasons: string[] = [];

  if (!pairedAuditValid) {
    reasons.push(
      "paired statement/identity interventions did not preserve the frozen comparison contract",
    );
  }

  if (
    statementInert &&
    paraphraseInvariant &&
    identityCausal &&
    cleanSemanticBoundary &&
    qualifiedChannelCount === 0
  ) {
    reasons.push(
      "ordinary life causally consumes matter commitment identity while statement meaning remains inert across semantic permutation and paraphrase",
    );
    reasons.push(
      "the semantic consumer can evaluate alternate same-id purpose meanings, but no non-oracle actor-private purpose structure grounds those meanings in ordinary life",
    );
  }

  let classification:
    R3PurposeSemanticGroundingClassification;

  if (!pairedAuditValid) {
    classification =
      "PURPOSE_GROUNDING_AUDIT_INVALID";
  } else if (
    qualifiedChannelCount > 0
  ) {
    classification =
      "PURPOSE_SEMANTIC_GROUNDING_AVAILABLE";
  } else if (
    statementInert &&
    paraphraseInvariant &&
    identityCausal &&
    cleanSemanticBoundary
  ) {
    classification =
      "PURPOSE_COMMITMENT_IDENTITY_ONLY";
  } else {
    classification =
      "PURPOSE_GROUNDING_AUDIT_INVALID";
  }

  return {
    statementPermutation,
    wordingParaphrase,
    identityPresenceCausality,
    semanticConsumerBoundary,
    channels,
    qualifiedChannelCount,
    classification,
    reasons,
  };
}

function auditStatementPermutation() {
  const materialIds: readonly ResidentId[] = [
    "resident:mira",
    "resident:janek",
    "resident:ida",
  ];

  const materialBaseline =
    Object.fromEntries(
      materialIds.map(
        (residentId) => [
          residentId,
          r3MaterialAuthoredMatters(
            residentId,
          ),
        ],
      ),
    ) as Record<
      ResidentId,
      readonly ResidentMatter[]
    >;

  const materialStatements =
    materialIds.map(
      (residentId) =>
        materialBaseline[
          residentId
        ][0]!.statement,
    );

  const materialPermuted: Partial<
    Record<
      ResidentId,
      readonly ResidentMatter[]
    >
  > = {
    "resident:mira": [
      withStatement(
        materialBaseline[
          "resident:mira"
        ][0]!,
        materialStatements[1]!,
      ),
    ],
    "resident:janek": [
      withStatement(
        materialBaseline[
          "resident:janek"
        ][0]!,
        materialStatements[2]!,
      ),
    ],
    "resident:ida": [
      withStatement(
        materialBaseline[
          "resident:ida"
        ][0]!,
        materialStatements[0]!,
      ),
    ],
  };

  const ordinaryMaterial =
    createAutonomousLifeRun();
  const ordinaryMaterialSteps =
    ordinaryMaterial.runTicks(
      AUDIT_TICKS,
    );

  const alteredMaterial =
    createAutonomousLifeRun({
      matterOverrides:
        materialPermuted,
    });
  const alteredMaterialSteps =
    alteredMaterial.runTicks(
      AUDIT_TICKS,
    );

  const janekContact =
    r3ContactAuthoredMatters(
      "resident:janek",
    )[0]!;
  const idaContact =
    r3ContactAuthoredMatters(
      "resident:ida",
    )[0]!;

  const ordinaryContact =
    createAutonomousContactRun();
  const ordinaryContactSteps =
    ordinaryContact.runTicks(
      AUDIT_TICKS,
    );

  const alteredContact =
    createAutonomousContactRun({
      matterOverrides: {
        "resident:janek": [
          withStatement(
            janekContact,
            idaContact.statement,
          ),
        ],
        "resident:ida": [
          withStatement(
            idaContact,
            janekContact.statement,
          ),
        ],
      },
    });
  const alteredContactSteps =
    alteredContact.runTicks(
      AUDIT_TICKS,
    );

  return {
    materialTicks:
      AUDIT_TICKS,
    contactTicks:
      AUDIT_TICKS,
    materialWorldTrajectoryIdentical:
      stable(
        alteredMaterialSteps,
      ) ===
      stable(
        ordinaryMaterialSteps,
      ),
    materialPrivateCausalTrajectoryIdentical:
      stable(
        causalPrivateProjection(
          alteredMaterial
            .privateExperiences(),
        ),
      ) ===
      stable(
        causalPrivateProjection(
          ordinaryMaterial
            .privateExperiences(),
        ),
      ),
    contactWorldTrajectoryIdentical:
      stable(
        alteredContactSteps,
      ) ===
      stable(
        ordinaryContactSteps,
      ),
    contactPrivateCausalTrajectoryIdentical:
      stable(
        causalPrivateProjection(
          alteredContact
            .privateExperiences(),
        ),
      ) ===
      stable(
        causalPrivateProjection(
          ordinaryContact
            .privateExperiences(),
        ),
      ),
    statementsChanged:
      materialIds.every(
        (residentId) =>
          materialPermuted[
            residentId
          ]![0]!.statement !==
          materialBaseline[
            residentId
          ][0]!.statement,
      ) &&
      janekContact.statement !==
        idaContact.statement,
    matterIdsPreserved:
      materialIds.every(
        (residentId) =>
          materialPermuted[
            residentId
          ]![0]!.id ===
          materialBaseline[
            residentId
          ][0]!.id,
      ) &&
      alteredContact
        .residentDebug(
          "resident:janek",
        )!.matters[0]!.id ===
        janekContact.id &&
      alteredContact
        .residentDebug(
          "resident:ida",
        )!.matters[0]!.id ===
        idaContact.id,
  };
}

function auditWordingParaphrase() {
  const ordinaryMaterial =
    createAutonomousLifeRun();
  const ordinaryMaterialSteps =
    ordinaryMaterial.runTicks(
      AUDIT_TICKS,
    );

  const paraphraseMaterial =
    createAutonomousLifeRun({
      matterOverrides:
        r3MaterialParaphraseMatters(),
    });
  const paraphraseMaterialSteps =
    paraphraseMaterial.runTicks(
      AUDIT_TICKS,
    );

  const ordinaryContact =
    createAutonomousContactRun();
  const ordinaryContactSteps =
    ordinaryContact.runTicks(
      AUDIT_TICKS,
    );

  const paraphraseContact =
    createAutonomousContactRun({
      matterOverrides:
        r3ContactParaphraseMatters(),
    });
  const paraphraseContactSteps =
    paraphraseContact.runTicks(
      AUDIT_TICKS,
    );

  const matterPairs = [
    ...([
      "resident:mira",
      "resident:janek",
      "resident:ida",
    ] as const).map(
      (residentId) => [
        r3MaterialAuthoredMatters(
          residentId,
        )[0]!,
        r3MaterialParaphraseMatters()[
          residentId
        ]![0]!,
      ] as const,
    ),
    ...([
      "resident:janek",
      "resident:ida",
    ] as const).map(
      (residentId) => [
        r3ContactAuthoredMatters(
          residentId,
        )[0]!,
        r3ContactParaphraseMatters()[
          residentId
        ]![0]!,
      ] as const,
    ),
  ];

  return {
    materialWorldTrajectoryIdentical:
      stable(
        paraphraseMaterialSteps,
      ) ===
      stable(
        ordinaryMaterialSteps,
      ),
    materialPrivateCausalTrajectoryIdentical:
      stable(
        causalPrivateProjection(
          paraphraseMaterial
            .privateExperiences(),
        ),
      ) ===
      stable(
        causalPrivateProjection(
          ordinaryMaterial
            .privateExperiences(),
        ),
      ),
    contactWorldTrajectoryIdentical:
      stable(
        paraphraseContactSteps,
      ) ===
      stable(
        ordinaryContactSteps,
      ),
    contactPrivateCausalTrajectoryIdentical:
      stable(
        causalPrivateProjection(
          paraphraseContact
            .privateExperiences(),
        ),
      ) ===
      stable(
        causalPrivateProjection(
          ordinaryContact
            .privateExperiences(),
        ),
      ),
    allStatementsChanged:
      matterPairs.every(
        ([baseline, paraphrase]) =>
          baseline.statement !==
          paraphrase.statement,
      ),
    allMatterIdsPreserved:
      matterPairs.every(
        ([baseline, paraphrase]) =>
          baseline.id ===
          paraphrase.id,
      ),
    allEstablishedTicksPreserved:
      matterPairs.every(
        ([baseline, paraphrase]) =>
          baseline.establishedTick ===
          paraphrase.establishedTick,
      ),
    allSourcesPreserved:
      matterPairs.every(
        ([baseline, paraphrase]) =>
          baseline.source ===
          paraphrase.source,
      ),
  };
}

function decisionChangesAfterMatterRemoval(
  ecology:
    | "material"
    | "contact",
  residentId:
    "resident:janek",
): boolean {
  const baseline =
    ecology === "material"
      ? createAutonomousLifeRun()
      : createAutonomousContactRun();

  baseline.runTicks(
    IDENTITY_INTERVENTION_TICK,
  );
  baseline.advanceOneTick();

  const baselineRow =
    rowAtTick(
      baseline.privateExperiences(),
      residentId,
      IDENTITY_INTERVENTION_TICK,
    );

  const altered =
    ecology === "material"
      ? createAutonomousLifeRun()
      : createAutonomousContactRun();

  altered.runTicks(
    IDENTITY_INTERVENTION_TICK,
  );
  altered.researchReplaceResidentMatters(
    residentId,
    [],
  );
  altered.advanceOneTick();

  const alteredRow =
    rowAtTick(
      altered.privateExperiences(),
      residentId,
      IDENTITY_INTERVENTION_TICK,
    );

  return (
    stableDecision(
      baselineRow.decision,
    ) !==
    stableDecision(
      alteredRow.decision,
    )
  );
}

function auditSemanticConsumerBoundary() {
  const rack =
    createR3GroundedMaterialSemanticRun(
      "rack",
      "ignore-all",
      "relation",
    );
  rack.runTicks(AUDIT_TICKS);

  const source =
    createR3GroundedMaterialSemanticRun(
      "source",
      "ignore-all",
      "relation",
    );
  source.runTicks(AUDIT_TICKS);

  const rackIda =
    rack.privateExperiences().filter(
      (row) =>
        row.residentId ===
        "resident:ida",
    );
  const sourceIda =
    source.privateExperiences().filter(
      (row) =>
        row.residentId ===
        "resident:ida",
    );

  const rackMatter =
    requiredSemanticMatter(
      rackIda,
    );
  const sourceMatter =
    requiredSemanticMatter(
      sourceIda,
    );

  const rackTimeline =
    reportTimeline(
      rack.allEvents(),
    );
  const sourceTimeline =
    reportTimeline(
      source.allEvents(),
    );

  return {
    ticks: AUDIT_TICKS,
    sameMatterId:
      rackMatter.id ===
        sourceMatter.id &&
      rackMatter.id ===
        R3_GROUNDED_MATERIAL_MATTER_ID,
    matterId:
      rackMatter.id,
    purposeStatementsDiffer:
      rackMatter.statement !==
      sourceMatter.statement,
    nonMatterPrivateTrajectoryIdentical:
      stable(
        nonMatterPrivateProjection(
          rackIda,
        ),
      ) ===
      stable(
        nonMatterPrivateProjection(
          sourceIda,
        ),
      ),
    groundedReportTimelineIdentical:
      stable(rackTimeline) ===
      stable(sourceTimeline),
    groundedReportCount:
      rackTimeline.length,
  };
}

function buildPurposeChannelLedger(
  evidence: {
    statementPermutation:
      ReturnType<
        typeof auditStatementPermutation
      >;
    wordingParaphrase:
      ReturnType<
        typeof auditWordingParaphrase
      >;
    identityPresenceCausality: {
      materialDecisionChangedAfterMatterRemoval:
        boolean;
      contactDecisionChangedAfterMatterRemoval:
        boolean;
    };
    semanticConsumerBoundary:
      ReturnType<
        typeof auditSemanticConsumerBoundary
      >;
  },
): readonly R3PurposeSemanticGroundingChannelAudit[] {
  const statementInert =
    evidence.statementPermutation
      .materialPrivateCausalTrajectoryIdentical &&
    evidence.statementPermutation
      .contactPrivateCausalTrajectoryIdentical;

  const paraphraseInvariant =
    evidence.wordingParaphrase
      .materialPrivateCausalTrajectoryIdentical &&
    evidence.wordingParaphrase
      .contactPrivateCausalTrajectoryIdentical;

  const identityCausal =
    evidence.identityPresenceCausality
      .materialDecisionChangedAfterMatterRemoval &&
    evidence.identityPresenceCausality
      .contactDecisionChangedAfterMatterRemoval;

  const boundaryClean =
    evidence.semanticConsumerBoundary
      .nonMatterPrivateTrajectoryIdentical &&
    evidence.semanticConsumerBoundary
      .groundedReportTimelineIdentical;

  return [
    {
      id: "matter-statement-text",
      actorPrivate: true,
      identityGated: false,
      oracleGenerated: false,
      changesWithPurposeMeaning:
        evidence.semanticConsumerBoundary
          .purposeStatementsDiffer,
      stableUnderSameMeaningParaphrase:
        false,
      causallyRelatedToOrdinaryLife:
        !statementInert,
      availableBeforeDecision: true,
      qualifiesPurposeSemanticGrounding:
        false,
      reason:
        "statement text carries authored semantic content, but ordinary material/contact life remains causally identical when meanings are permuted across fixed ids; raw wording also changes under same-meaning paraphrase",
    },
    {
      id: "matter-id-presence",
      actorPrivate: true,
      identityGated: true,
      oracleGenerated: false,
      changesWithPurposeMeaning:
        false,
      stableUnderSameMeaningParaphrase:
        paraphraseInvariant,
      causallyRelatedToOrdinaryLife:
        identityCausal,
      availableBeforeDecision: true,
      qualifiesPurposeSemanticGrounding:
        false,
      reason:
        "matter presence is causally consumed by fixture policy, but the same id can carry alternate statement meanings and therefore identifies commitment wiring rather than semantic purpose content",
    },
    {
      id: "established-tick-and-source",
      actorPrivate: true,
      identityGated: false,
      oracleGenerated: false,
      changesWithPurposeMeaning:
        false,
      stableUnderSameMeaningParaphrase:
        evidence.wordingParaphrase
          .allEstablishedTicksPreserved &&
        evidence.wordingParaphrase
          .allSourcesPreserved,
      causallyRelatedToOrdinaryLife:
        false,
      availableBeforeDecision: true,
      qualifiesPurposeSemanticGrounding:
        false,
      reason:
        "current matter metadata is unchanged across semantic counterfactuals and contains no purpose-content distinction",
    },
    {
      id: "activity-and-lived-trajectory",
      actorPrivate: true,
      identityGated: true,
      oracleGenerated: false,
      changesWithPurposeMeaning:
        !statementInert,
      stableUnderSameMeaningParaphrase:
        paraphraseInvariant,
      causallyRelatedToOrdinaryLife:
        true,
      availableBeforeDecision: false,
      qualifiesPurposeSemanticGrounding:
        false,
      reason:
        "activity and trajectory are downstream consequences of identity-gated fixture policy; they remain invariant under statement permutation and cannot independently ground the statement meaning that supposedly caused them",
    },
    {
      id: "observation-and-private-memory",
      actorPrivate: true,
      identityGated: false,
      oracleGenerated: false,
      changesWithPurposeMeaning:
        !boundaryClean,
      stableUnderSameMeaningParaphrase:
        paraphraseInvariant,
      causallyRelatedToOrdinaryLife:
        true,
      availableBeforeDecision: true,
      qualifiesPurposeSemanticGrounding:
        false,
      reason:
        "private world evidence is legitimate but remains identical across the same-id purpose counterfactual; it grounds facts, not which purpose the actor has",
    },
    {
      id: "semantic-consumer-oracle",
      actorPrivate: false,
      identityGated: false,
      oracleGenerated: true,
      changesWithPurposeMeaning:
        true,
      stableUnderSameMeaningParaphrase:
        false,
      causallyRelatedToOrdinaryLife:
        false,
      availableBeforeDecision: false,
      qualifiesPurposeSemanticGrounding:
        false,
      reason:
        "research evaluation can interpret the statement distinction, but that interpretation is precisely the authored semantic oracle and cannot be reused as life-grounded purpose structure",
    },
  ];
}

function withStatement(
  matter: ResidentMatter,
  statement: string,
): ResidentMatter {
  return {
    ...structuredClone(matter),
    statement,
  };
}

function causalPrivateProjection(
  experiences:
    readonly ResidentPrivateExperience[],
) {
  return experiences.map(
    (experience) => ({
      tick:
        experience.tick,
      residentId:
        experience.residentId,
      matters:
        experience.matters.map(
          (matter) => ({
            id: matter.id,
            establishedTick:
              matter.establishedTick,
            source:
              matter.source,
          }),
        ),
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
    }),
  );
}

function nonMatterPrivateProjection(
  experiences:
    readonly ResidentPrivateExperience[],
) {
  return experiences.map(
    (experience) => ({
      tick:
        experience.tick,
      residentId:
        experience.residentId,
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
    }),
  );
}

function rowAtTick(
  experiences:
    readonly ResidentPrivateExperience[],
  residentId: ResidentId,
  tick: number,
): ResidentPrivateExperience {
  const row =
    experiences.find(
      (experience) =>
        experience.residentId ===
          residentId &&
        experience.tick ===
          tick,
    );

  if (!row) {
    throw new Error(
      "missing purpose grounding row " +
        residentId +
        " tick=" +
        tick,
    );
  }

  return row;
}

function requiredSemanticMatter(
  rows:
    readonly ResidentPrivateExperience[],
): ResidentMatter {
  const matter =
    rows[0]?.matters.find(
      (candidate) =>
        candidate.id ===
        R3_GROUNDED_MATERIAL_MATTER_ID,
    );

  if (!matter) {
    throw new Error(
      "semantic consumer boundary missing Ida matter",
    );
  }

  return matter;
}

function reportTimeline(
  events:
    readonly import("./life-contracts").LifeEvent[],
): readonly string[] {
  return events
    .map(
      (event) => {
        if (
          event.kind !==
          "speech"
        ) {
          return null;
        }

        const text =
          event.payload.text;

        if (
          text ===
          R3_GROUNDED_MATERIAL_REPORTS.rack
        ) {
          return (
            event.tick +
            ":rack:" +
            event.actorId
          );
        }

        if (
          text ===
          R3_GROUNDED_MATERIAL_REPORTS.source
        ) {
          return (
            event.tick +
            ":source:" +
            event.actorId
          );
        }

        return null;
      },
    )
    .filter(
      (
        value,
      ): value is string =>
        value !== null,
    );
}

function stable(
  value: unknown,
): string {
  return JSON.stringify(
    value,
  );
}

function stableDecision(
  decision:
    ResidentDecision,
): string {
  return stable(decision);
}

export function r3PurposeSemanticGroundingAuditTicks(): number {
  return AUDIT_TICKS;
}

export function r3PurposeIdentityInterventionTick(): number {
  return IDENTITY_INTERVENTION_TICK;
}
