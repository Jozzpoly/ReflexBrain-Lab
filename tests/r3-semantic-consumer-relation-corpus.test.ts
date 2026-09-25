import { describe, expect, it } from "vitest";
import {
  auditR3SemanticConsumerRelationShortcuts,
  buildR3SemanticConsumerRelationCorpus,
} from "../src/r3/semantic-consumer-relation-corpus";
import {
  MIXED_PRESSURE_MATTER_IDS,
} from "../src/r3/mixed-pressure-fixture-policy";

describe(
  "R3 consumer-shaped semantic relation corpus",
  () => {
    it("keeps the same matter id while balancing message×purpose relation labels across train and held-out paraphrase surfaces", () => {
      const corpus =
        buildR3SemanticConsumerRelationCorpus();

      const train = corpus.examples.filter(
        (example) =>
          example.wording ===
          "train-surface",
      );
      const heldOut =
        corpus.examples.filter(
          (example) =>
            example.wording ===
            "heldout-paraphrase",
        );

      expect(train).toHaveLength(36);
      expect(heldOut).toHaveLength(36);

      for (const subset of [
        train,
        heldOut,
      ]) {
        expect(
          subset.filter(
            (example) =>
              example.shouldRespond,
          ),
        ).toHaveLength(18);
        expect(
          new Set(
            subset.map(
              (example) =>
                example.matterId,
            ),
          ),
        ).toEqual(
          new Set([
            MIXED_PRESSURE_MATTER_IDS.reportResponse,
          ]),
        );

        for (const matterDomain of [
          "depot",
          "courtyard",
        ] as const) {
          const byMatter =
            subset.filter(
              (example) =>
                example.matterDomain ===
                matterDomain,
            );
          expect(
            byMatter.filter(
              (example) =>
                example.shouldRespond,
            ),
          ).toHaveLength(
            byMatter.length / 2,
          );
        }

        for (const messageDomain of [
          "depot",
          "courtyard",
        ] as const) {
          const byMessage =
            subset.filter(
              (example) =>
                example.messageDomain ===
                messageDomain,
            );
          expect(
            byMessage.filter(
              (example) =>
                example.shouldRespond,
            ),
          ).toHaveLength(
            byMessage.length / 2,
          );
        }
      }
    });

    it("makes lexical overlap look perfect on train surfaces but collapse on held-out semantic paraphrases", () => {
      const corpus =
        buildR3SemanticConsumerRelationCorpus();
      const audit =
        auditR3SemanticConsumerRelationShortcuts(
          corpus,
        );

      expect(audit.trainCount).toBe(36);
      expect(audit.heldOutCount).toBe(36);
      expect(
        audit.trainPositiveRate,
      ).toBe(0.5);
      expect(
        audit.heldOutPositiveRate,
      ).toBe(0.5);

      expect(
        audit.majorityHeldOut
          .balancedAccuracy,
      ).toBe(0.5);
      expect(
        audit.exactPairHeldOut
          .balancedAccuracy,
      ).toBe(0.5);
      expect(
        audit.messageOnlyHeldOut
          .balancedAccuracy,
      ).toBe(0.5);
      expect(
        audit.matterOnlyHeldOut
          .balancedAccuracy,
      ).toBe(0.5);
      expect(
        audit.unigramHeldOut
          .balancedAccuracy,
      ).toBe(0.5);

      // Surface overlap is intentionally a trap on TRAIN: shared words make
      // the relation look solved. Held-out wording removes that shortcut while
      // preserving the same semantic relation.
      expect(
        audit.lexicalOverlapTrain
          .balancedAccuracy,
      ).toBe(1);
      expect(
        audit.lexicalOverlapHeldOut
          .balancedAccuracy,
      ).toBe(0.5);

      console.info(
        "R3_SEMANTIC_CONSUMER_RELATION_SHORTCUT_AUDIT",
        JSON.stringify(audit),
      );
    });
  },
);
