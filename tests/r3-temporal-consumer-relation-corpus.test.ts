import { describe, expect, it } from "vitest";
import {
  auditR3TemporalConsumerRelationShortcuts,
  buildR3TemporalConsumerRelationCorpus,
} from "../src/r3/temporal-consumer-relation-corpus";
import {
  MIXED_PRESSURE_MATTER_IDS,
} from "../src/r3/mixed-pressure-fixture-policy";

describe(
  "R3 temporal consumer relation corpus",
  () => {
    it("requires prior acknowledged semantic history as well as current report meaning", () => {
      const corpus =
        buildR3TemporalConsumerRelationCorpus();

      const train =
        corpus.examples.filter(
          (example) =>
            example.split === "train",
        );
      const heldOutCurrent =
        corpus.examples.filter(
          (example) =>
            example.split ===
            "heldout-current-state",
        );
      const heldOutHistory =
        corpus.examples.filter(
          (example) =>
            example.split ===
            "heldout-history-state",
        );

      expect(train).toHaveLength(16);
      expect(
        heldOutCurrent,
      ).toHaveLength(8);
      expect(
        heldOutHistory,
      ).toHaveLength(8);

      for (const subset of [
        train,
        heldOutCurrent,
        heldOutHistory,
      ]) {
        expect(
          subset.filter(
            (example) =>
              example.shouldRespond,
          ),
        ).toHaveLength(
          subset.length / 2,
        );
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
      }

      // Held-out state is absent from TRAIN but occupies either side of the
      // temporal relation during evaluation.
      expect(
        train.some(
          (example) =>
            example.priorAcknowledgedState ===
              "suspended" ||
            example.currentState ===
              "suspended",
        ),
      ).toBe(false);

      expect(
        heldOutCurrent.every(
          (example) =>
            example.currentState ===
            "suspended",
        ),
      ).toBe(true);
      expect(
        heldOutHistory.every(
          (example) =>
            example.priorAcknowledgedState ===
            "suspended",
        ),
      ).toBe(true);

      // Same current semantic state appears with both labels according to
      // private history; same prior state likewise appears with both labels
      // according to current evidence.
      expect(
        new Set(
          heldOutCurrent.map(
            (example) =>
              example.shouldRespond,
          ),
        ),
      ).toEqual(
        new Set([false, true]),
      );
      expect(
        new Set(
          heldOutHistory.map(
            (example) =>
              example.shouldRespond,
          ),
        ),
      ).toEqual(
        new Set([false, true]),
      );
    });

    it("shows that the current temporal target does not yet require actor-relative matter meaning", () => {
      const corpus =
        buildR3TemporalConsumerRelationCorpus();

      const byTemporalEvidence = new Map<
        string,
        {
          matterStatements: Set<string>;
          labels: Set<boolean>;
        }
      >();

      for (const example of corpus.examples) {
        const key =
          example.priorAcknowledgedText +
          "\n<CURRENT>\n" +
          example.currentMessageText;
        const entry =
          byTemporalEvidence.get(key) ?? {
            matterStatements: new Set<string>(),
            labels: new Set<boolean>(),
          };
        entry.matterStatements.add(
          example.matterStatement,
        );
        entry.labels.add(
          example.shouldRespond,
        );
        byTemporalEvidence.set(key, entry);
      }

      const matterCounterfactualSignatures =
        [...byTemporalEvidence.values()].filter(
          (entry) =>
            entry.matterStatements.size > 1,
        );
      const matterDependentLabelSwitches =
        matterCounterfactualSignatures.filter(
          (entry) => entry.labels.size > 1,
        );

      expect(
        matterCounterfactualSignatures,
      ).toHaveLength(0);
      expect(
        matterDependentLabelSwitches,
      ).toHaveLength(0);

      // The label constructor itself is temporal-state inequality. Matter
      // text is present in model-visible input, but changing actor purpose is
      // not represented as a counterfactual that can alter the target.
      for (const example of corpus.examples) {
        expect(example.shouldRespond).toBe(
          example.priorAcknowledgedState !==
            example.currentState,
        );
      }

      console.info(
        "R3_TEMPORAL_RELATION_MATTER_DEPENDENCE_AUDIT",
        JSON.stringify({
          exampleCount: corpus.examples.length,
          matterCounterfactualSignatureCount:
            matterCounterfactualSignatures.length,
          matterDependentLabelSwitchCount:
            matterDependentLabelSwitches.length,
          result:
            "current temporal target can be solved without actor-relative matter meaning",
        }),
      );
    });

    it("makes exact/current/history/token shortcuts fail on an unseen semantic state", () => {
      const corpus =
        buildR3TemporalConsumerRelationCorpus();
      const audit =
        auditR3TemporalConsumerRelationShortcuts(
          corpus,
        );

      expect(
        audit.trainPositiveRate,
      ).toBe(0.5);
      expect(
        audit.heldOutCurrentPositiveRate,
      ).toBe(0.5);
      expect(
        audit.heldOutHistoryPositiveRate,
      ).toBe(0.5);

      for (const controls of [
        audit.heldOutCurrent,
        audit.heldOutHistory,
      ]) {
        expect(
          controls.majority
            .balancedAccuracy,
        ).toBe(0.5);
        expect(
          controls.exactTriple
            .balancedAccuracy,
        ).toBe(0.5);
        expect(
          controls.currentOnly
            .balancedAccuracy,
        ).toBe(0.5);
        expect(
          controls.historyOnly
            .balancedAccuracy,
        ).toBe(0.5);

        // Surface statistics are allowed to become anti-correlated; they are
        // not allowed to solve the unseen-state temporal relation.
        expect(
          controls.unigram
            .balancedAccuracy,
        ).toBeLessThanOrEqual(
          0.6,
        );
        expect(
          controls.crossTokenPair
            .balancedAccuracy,
        ).toBeLessThanOrEqual(
          0.6,
        );
      }

      console.info(
        "R3_TEMPORAL_RELATION_SHORTCUT_AUDIT",
        JSON.stringify(audit),
      );
    });
  },
);
