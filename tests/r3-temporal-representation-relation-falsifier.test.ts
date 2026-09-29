import { describe, expect, it } from "vitest";
import {
  R3_TEMPORAL_HELDOUT_KNOWN_SURFACES,
  buildR3TemporalHeldoutKnownRelationExamples,
  buildR3TemporalHeldoutKnownStateProbeExamples,
  buildR3TemporalJointPairText,
  buildR3TemporalTrainStateProbeExamples,
  evaluateR3TemporalKnownRelationExactPairBaseline,
  evaluateR3TemporalStateExactTextBaseline,
  evaluateR3TemporalStateUnigramBaseline,
} from "../src/r3/temporal-representation-relation-falsifier";
import {
  buildR3TemporalConsumerRelationCorpus,
} from "../src/r3/temporal-consumer-relation-corpus";

describe("R3 temporal representation-vs-relation falsifier", () => {
  it("freezes four TRAIN and eight held-out known-state sentence surfaces", () => {
    const train = buildR3TemporalTrainStateProbeExamples();
    const heldOut = buildR3TemporalHeldoutKnownStateProbeExamples();

    expect(train).toHaveLength(4);
    expect(heldOut).toHaveLength(8);
    expect(train.filter((example) => example.label)).toHaveLength(2);
    expect(heldOut.filter((example) => example.label)).toHaveLength(4);
    expect(new Set(train.map((example) => example.text)).size).toBe(4);
    expect(new Set(heldOut.map((example) => example.text)).size).toBe(8);

    for (const text of heldOut.map((example) => example.text)) {
      expect(train.some((example) => example.text === text)).toBe(false);
    }

    expect(R3_TEMPORAL_HELDOUT_KNOWN_SURFACES.complete).toHaveLength(4);
    expect(R3_TEMPORAL_HELDOUT_KNOWN_SURFACES.delayed).toHaveLength(4);
  });

  it("builds a balanced 64-pair held-out known-state relation set", () => {
    const heldOut = buildR3TemporalHeldoutKnownRelationExamples();

    expect(heldOut).toHaveLength(64);
    expect(heldOut.filter((example) => example.shouldRespond)).toHaveLength(32);
    expect(heldOut.filter((example) => !example.shouldRespond)).toHaveLength(32);
  });

  it("keeps suspended entirely outside TRAIN", () => {
    const corpus = buildR3TemporalConsumerRelationCorpus();
    const train = corpus.examples.filter((example) => example.split === "train");

    expect(
      train.some(
        (example) =>
          example.priorAcknowledgedState === "suspended" ||
          example.currentState === "suspended",
      ),
    ).toBe(false);
  });

  it("freezes the joint-pair wrapper without answer-bearing text", () => {
    expect(
      buildR3TemporalJointPairText("history text", "current text"),
    ).toBe(
      "Previous acknowledged report: history text\nCurrent report: current text",
    );
  });

  it("simple single-sentence and exact-pair memorization controls do not solve held-out known paraphrases", () => {
    const stateTrain = buildR3TemporalTrainStateProbeExamples();
    const stateHeldOut = buildR3TemporalHeldoutKnownStateProbeExamples();

    const exact = evaluateR3TemporalStateExactTextBaseline(stateTrain, stateHeldOut);
    const unigram = evaluateR3TemporalStateUnigramBaseline(stateTrain, stateHeldOut);

    const stateAccuracy = (predictions: readonly boolean[]) =>
      predictions.filter((prediction, index) => prediction === stateHeldOut[index]!.label)
        .length / predictions.length;

    expect(stateAccuracy(exact)).toBe(0.5);
    expect(stateAccuracy(unigram)).toBeLessThanOrEqual(0.75);

    const temporal = buildR3TemporalConsumerRelationCorpus();
    const relationTrain = temporal.examples
      .filter((example) => example.split === "train")
      .map((example) => ({
        historyText: example.priorAcknowledgedText,
        currentText: example.currentMessageText,
        shouldRespond: example.shouldRespond,
      }));
    const relationHeldOut = buildR3TemporalHeldoutKnownRelationExamples();
    const pairPredictions = evaluateR3TemporalKnownRelationExactPairBaseline(
      relationTrain,
      relationHeldOut,
    );
    const pairAccuracy =
      pairPredictions.filter(
        (prediction, index) =>
          prediction === relationHeldOut[index]!.shouldRespond,
      ).length / pairPredictions.length;

    expect(pairAccuracy).toBe(0.5);
  });
});
