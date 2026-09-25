import { describe, expect, it } from "vitest";
import {
  auditR3JointConsumerRelationShortcuts,
  buildR3JointConsumerRelationCorpus,
  serializeR3JointRelationModelInput,
} from "../src/r3/joint-consumer-relation-corpus";
import {
  MIXED_PRESSURE_MATTER_IDS,
} from "../src/r3/mixed-pressure-fixture-policy";

describe(
  "R3 three-way consumer relation corpus",
  () => {
    it("keeps supervision provenance explicit and model input actor-private/textual", () => {
      const corpus =
        buildR3JointConsumerRelationCorpus();

      expect(
        corpus.examples.length,
      ).toBe(416);

      for (
        const example of
          corpus.examples
      ) {
        expect(
          example.labelSource,
        ).toBe(
          "authored-semantic-teacher",
        );
        expect(
          example.matterId,
        ).toBe(
          MIXED_PRESSURE_MATTER_IDS.reportResponse,
        );

        const input =
          serializeR3JointRelationModelInput(
            example,
          );

        expect(input).toContain(
          example.matterStatement,
        );
        expect(input).toContain(
          example.priorAcknowledgedText,
        );
        expect(input).toContain(
          example.currentMessageText,
        );

        expect(input).not.toContain(
          example.matterId,
        );
        expect(input).not.toContain(
          "authored-semantic-teacher",
        );
        expect(input).not.toContain(
          "heldout-three-way",
        );
        expect(input).not.toContain(
          "<LABEL>",
        );

        expect(
          example.shouldRespond,
        ).toBe(
          example.currentDomain ===
            example.matterDomain &&
            (
              example.priorAcknowledgedDomain !==
                example.currentDomain ||
              example.priorAcknowledgedState !==
                example.currentState
            ),
        );
      }
    });

    it("holds an unseen semantic state and all evaluation wording outside TRAIN", () => {
      const corpus =
        buildR3JointConsumerRelationCorpus();
      const train =
        corpus.examples.filter(
          (example) =>
            example.split ===
            "train",
        );
      const heldOut =
        corpus.examples.filter(
          (example) =>
            example.split ===
            "heldout-three-way",
        );

      expect(train).toHaveLength(128);
      expect(heldOut).toHaveLength(288);

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
        heldOut.some(
          (example) =>
            example.priorAcknowledgedState ===
              "suspended",
        ),
      ).toBe(true);
      expect(
        heldOut.some(
          (example) =>
            example.currentState ===
              "suspended",
        ),
      ).toBe(true);

      const trainInputs =
        new Set(
          train.map(
            (example) =>
              serializeR3JointRelationModelInput(
                example,
              ),
          ),
        );
      expect(
        heldOut.some(
          (example) =>
            trainInputs.has(
              serializeR3JointRelationModelInput(
                example,
              ),
            ),
        ),
      ).toBe(false);

      expect(
        new Set(
          train.map(
            (example) =>
              example.matterStatement,
          ),
        ),
      ).not.toEqual(
        new Set(
          heldOut.map(
            (example) =>
              example.matterStatement,
          ),
        ),
      );
    });

    it("contains explicit purpose, history and current-evidence counterfactual label switches", () => {
      const heldOut =
        buildR3JointConsumerRelationCorpus()
          .examples.filter(
            (example) =>
              example.split ===
              "heldout-three-way",
          );

      const positives =
        heldOut.filter(
          (example) =>
            example.shouldRespond,
        );

      let purposeSwitches = 0;
      let historySwitches = 0;
      let currentSwitches = 0;

      for (const positive of positives) {
        const purposeCounterfactual =
          heldOut.find(
            (candidate) =>
              candidate.matterDomain !==
                positive.matterDomain &&
              candidate.priorAcknowledgedDomain ===
                positive.priorAcknowledgedDomain &&
              candidate.priorAcknowledgedState ===
                positive.priorAcknowledgedState &&
              candidate.priorAcknowledgedText ===
                positive.priorAcknowledgedText &&
              candidate.currentDomain ===
                positive.currentDomain &&
              candidate.currentState ===
                positive.currentState &&
              candidate.currentMessageText ===
                positive.currentMessageText,
          );
        if (
          purposeCounterfactual &&
          !purposeCounterfactual.shouldRespond
        ) {
          purposeSwitches += 1;
        }

        const historyCounterfactual =
          heldOut.find(
            (candidate) =>
              candidate.matterDomain ===
                positive.matterDomain &&
              candidate.matterStatement ===
                positive.matterStatement &&
              candidate.currentDomain ===
                positive.currentDomain &&
              candidate.currentState ===
                positive.currentState &&
              candidate.currentMessageText ===
                positive.currentMessageText &&
              candidate.priorAcknowledgedDomain ===
                positive.currentDomain &&
              candidate.priorAcknowledgedState ===
                positive.currentState &&
              !candidate.shouldRespond,
          );
        if (historyCounterfactual) {
          historySwitches += 1;
        }

        const currentCounterfactual =
          heldOut.find(
            (candidate) =>
              candidate.matterDomain ===
                positive.matterDomain &&
              candidate.matterStatement ===
                positive.matterStatement &&
              candidate.priorAcknowledgedDomain ===
                positive.priorAcknowledgedDomain &&
              candidate.priorAcknowledgedState ===
                positive.priorAcknowledgedState &&
              candidate.priorAcknowledgedText ===
                positive.priorAcknowledgedText &&
              candidate.currentDomain !==
                positive.currentDomain &&
              !candidate.shouldRespond,
          );
        if (currentCounterfactual) {
          currentSwitches += 1;
        }
      }

      expect(positives.length).toBe(120);
      expect(purposeSwitches).toBe(
        positives.length,
      );
      expect(historySwitches).toBe(
        positives.length,
      );
      expect(currentSwitches).toBe(
        positives.length,
      );

      console.info(
        "R3_JOINT_RELATION_COUNTERFACTUAL_STRUCTURE",
        JSON.stringify({
          heldOutCount:
            heldOut.length,
          positiveCount:
            positives.length,
          purposeSwitches,
          historySwitches,
          currentSwitches,
        }),
      );
    });

    it("rejects memorization and every two-factor semantic ablation on held-out three-way pressure", () => {
      const corpus =
        buildR3JointConsumerRelationCorpus();
      const audit =
        auditR3JointConsumerRelationShortcuts(
          corpus,
        );

      expect(
        audit.trainCount,
      ).toBe(128);
      expect(
        audit.heldOutCount,
      ).toBe(288);

      expect(
        audit.majority
          .balancedAccuracy,
      ).toBe(0.5);
      expect(
        audit.exactTriple
          .balancedAccuracy,
      ).toBe(0.5);
      expect(
        audit.exactNoPurpose
          .balancedAccuracy,
      ).toBe(0.5);
      expect(
        audit.exactNoHistory
          .balancedAccuracy,
      ).toBe(0.5);
      expect(
        audit.exactNoCurrent
          .balancedAccuracy,
      ).toBe(0.5);

      expect(
        audit.unigram
          .balancedAccuracy,
      ).toBeLessThanOrEqual(
        0.85,
      );
      expect(
        audit.crossSegmentTokenPairs
          .balancedAccuracy,
      ).toBeLessThanOrEqual(
        0.9,
      );

      // Privileged semantic ablations know more than a surface memorizer, but
      // each is still structurally incapable of solving the full relation.
      expect(
        audit.purposeOnlyOracle
          .balancedAccuracy,
      ).toBeGreaterThan(0.5);
      expect(
        audit.purposeOnlyOracle
          .balancedAccuracy,
      ).toBeLessThan(1);

      expect(
        audit.temporalOnlyOracle
          .balancedAccuracy,
      ).toBeGreaterThan(0.5);
      expect(
        audit.temporalOnlyOracle
          .balancedAccuracy,
      ).toBeLessThan(1);

      expect(
        audit.exactTextPurposeOracle
          .balancedAccuracy,
      ).toBeGreaterThan(
        audit.purposeOnlyOracle
          .balancedAccuracy,
      );
      expect(
        audit.exactTextPurposeOracle
          .balancedAccuracy,
      ).toBeLessThan(1);

      console.info(
        "R3_JOINT_RELATION_SHORTCUT_AUDIT",
        JSON.stringify(audit),
      );
    });
  },
);
