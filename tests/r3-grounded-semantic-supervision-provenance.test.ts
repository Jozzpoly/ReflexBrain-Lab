import {
  describe,
  expect,
  it,
} from "vitest";
import {
  auditR3GroundedSemanticSupervisionProvenance,
} from "../src/r3/grounded-semantic-supervision-provenance";

describe(
  "R3 grounded semantic supervision provenance",
  () => {
    it(
      "separates legal grounded fact signals from circular purpose-relation labels before any learner",
      () => {
        const audit =
          auditR3GroundedSemanticSupervisionProvenance();

        console.log(
          "R3_GROUNDED_SEMANTIC_SUPERVISION_PROVENANCE " +
            JSON.stringify(
              audit,
            ),
        );

        expect(
          audit.stageA
            .matterIdSame,
        ).toBe(true);
        expect(
          audit.stageA
            .matterStatementsDiffer,
        ).toBe(true);
        expect(
          audit.stageA
            .reportTimelineIdentical,
        ).toBe(true);
        expect(
          audit.stageA
            .nonMatterIdaPrivateTrajectoryIdentical,
        ).toBe(true);
        expect(
          audit.stageA
            .reportPairCount,
        ).toBeGreaterThanOrEqual(
          20,
        );
        expect(
          audit.stageA
            .relationLabelFlipRate,
        ).toBe(1);

        expect(
          audit.stageA
            .rackReportCount,
        ).toBeGreaterThanOrEqual(
          20,
        );
        expect(
          audit.stageA
            .sourceReportCount,
        ).toBeGreaterThanOrEqual(
          20,
        );
        expect(
          audit.stageA
            .rackGroundingRate,
        ).toBe(1);
        expect(
          audit.stageA
            .sourceGroundingRate,
        ).toBe(1);

        expect(
          audit.stageBLeakage
            .purposeChangesRetryPressure,
        ).toBe(true);
        expect(
          audit.stageBLeakage
            .reportTimelineIdenticalAcrossPurposes,
        ).toBe(false);

        const retry =
          audit.channels.find(
            (channel) =>
              channel.id ===
              "stage-b-retry-pattern",
          );
        const oracle =
          audit.channels.find(
            (channel) =>
              channel.id ===
              "stage-a-ideal-relation",
          );
        const fact =
          audit.channels.find(
            (channel) =>
              channel.id ===
              "same-observation-report-fact",
          );

        expect(
          retry?.disposition,
        ).toBe(
          "circular_reject",
        );
        expect(
          retry?.legalForLocalRelationTraining,
        ).toBe(false);

        expect(
          oracle?.disposition,
        ).toBe(
          "evaluation_only",
        );
        expect(
          oracle?.legalForLocalRelationTraining,
        ).toBe(false);

        expect(
          fact?.disposition,
        ).toBe(
          "candidate_fact_supervision",
        );
        expect(
          fact?.teachesGroundedFactMeaning,
        ).toBe(true);
        expect(
          fact?.teachesActorRelativePurposeRelation,
        ).toBe(false);

        expect(
          audit.lexical.baseline
            .count,
        ).toBe(2);
        expect(
          audit.lexical
            .evaluationParaphrase
            .count,
        ).toBe(12);

        expect(
          [
            "SEMANTIC_SUPERVISION_PROVENANCE_INVALID",
            "GROUNDED_RELATION_SUPERVISION_AVAILABLE",
            "GROUNDED_FACT_SUPERVISION_ONLY",
            "SEMANTIC_SUPERVISION_EMPTY",
          ],
        ).toContain(
          audit.classification,
        );
      },
      90_000,
    );
  },
);
