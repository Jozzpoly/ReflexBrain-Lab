import {
  describe,
  expect,
  it,
} from "vitest";
import {
  auditR3PurposeSemanticGrounding,
  r3PurposeIdentityInterventionTick,
  r3PurposeSemanticGroundingAuditTicks,
} from "../src/r3/purpose-semantic-grounding-audit";

describe(
  "R3 purpose semantic grounding audit",
  () => {
    it(
      "distinguishes statement meaning from identity-gated commitment before another semantic model probe",
      () => {
        const audit =
          auditR3PurposeSemanticGrounding();

        console.log(
          "R3_PURPOSE_SEMANTIC_GROUNDING " +
            JSON.stringify(audit),
        );

        expect(
          r3PurposeSemanticGroundingAuditTicks(),
        ).toBe(420);
        expect(
          r3PurposeIdentityInterventionTick(),
        ).toBe(20);

        expect(
          audit.statementPermutation
            .statementsChanged,
        ).toBe(true);
        expect(
          audit.statementPermutation
            .matterIdsPreserved,
        ).toBe(true);
        expect(
          audit.statementPermutation
            .materialWorldTrajectoryIdentical,
        ).toBe(true);
        expect(
          audit.statementPermutation
            .materialPrivateCausalTrajectoryIdentical,
        ).toBe(true);
        expect(
          audit.statementPermutation
            .contactWorldTrajectoryIdentical,
        ).toBe(true);
        expect(
          audit.statementPermutation
            .contactPrivateCausalTrajectoryIdentical,
        ).toBe(true);

        expect(
          audit.wordingParaphrase
            .allStatementsChanged,
        ).toBe(true);
        expect(
          audit.wordingParaphrase
            .allMatterIdsPreserved,
        ).toBe(true);
        expect(
          audit.wordingParaphrase
            .allEstablishedTicksPreserved,
        ).toBe(true);
        expect(
          audit.wordingParaphrase
            .allSourcesPreserved,
        ).toBe(true);
        expect(
          audit.wordingParaphrase
            .materialWorldTrajectoryIdentical,
        ).toBe(true);
        expect(
          audit.wordingParaphrase
            .materialPrivateCausalTrajectoryIdentical,
        ).toBe(true);
        expect(
          audit.wordingParaphrase
            .contactWorldTrajectoryIdentical,
        ).toBe(true);
        expect(
          audit.wordingParaphrase
            .contactPrivateCausalTrajectoryIdentical,
        ).toBe(true);

        expect(
          audit.identityPresenceCausality
            .materialDecisionChangedAfterMatterRemoval,
        ).toBe(true);
        expect(
          audit.identityPresenceCausality
            .contactDecisionChangedAfterMatterRemoval,
        ).toBe(true);

        expect(
          audit.semanticConsumerBoundary
            .sameMatterId,
        ).toBe(true);
        expect(
          audit.semanticConsumerBoundary
            .purposeStatementsDiffer,
        ).toBe(true);
        expect(
          audit.semanticConsumerBoundary
            .nonMatterPrivateTrajectoryIdentical,
        ).toBe(true);
        expect(
          audit.semanticConsumerBoundary
            .groundedReportTimelineIdentical,
        ).toBe(true);
        expect(
          audit.semanticConsumerBoundary
            .groundedReportCount,
        ).toBeGreaterThan(0);

        expect(
          audit.qualifiedChannelCount,
        ).toBe(0);

        const identity =
          audit.channels.find(
            (channel) =>
              channel.id ===
              "matter-id-presence",
          );
        const statement =
          audit.channels.find(
            (channel) =>
              channel.id ===
              "matter-statement-text",
          );
        const activity =
          audit.channels.find(
            (channel) =>
              channel.id ===
              "activity-and-lived-trajectory",
          );
        const oracle =
          audit.channels.find(
            (channel) =>
              channel.id ===
              "semantic-consumer-oracle",
          );

        expect(
          identity
            ?.causallyRelatedToOrdinaryLife,
        ).toBe(true);
        expect(
          identity?.identityGated,
        ).toBe(true);
        expect(
          identity
            ?.qualifiesPurposeSemanticGrounding,
        ).toBe(false);

        expect(
          statement
            ?.changesWithPurposeMeaning,
        ).toBe(true);
        expect(
          statement
            ?.causallyRelatedToOrdinaryLife,
        ).toBe(false);
        expect(
          statement
            ?.qualifiesPurposeSemanticGrounding,
        ).toBe(false);

        expect(
          activity
            ?.changesWithPurposeMeaning,
        ).toBe(false);
        expect(
          activity
            ?.qualifiesPurposeSemanticGrounding,
        ).toBe(false);

        expect(
          oracle?.oracleGenerated,
        ).toBe(true);
        expect(
          oracle
            ?.qualifiesPurposeSemanticGrounding,
        ).toBe(false);

        expect(
          audit.classification,
        ).toBe(
          "PURPOSE_COMMITMENT_IDENTITY_ONLY",
        );
      },
      90_000,
    );
  },
);
