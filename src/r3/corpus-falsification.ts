import type {
  R3CrossEcologyCorpus,
  R3EcologyId,
  R3LearningExample,
} from "./learning-corpus";
import { splitR3CorpusByHeldOutEcology } from "./learning-corpus";

export type R3ProbeTarget = "future_activity_phase_change";

export interface R3BinaryProbeExample {
  source: R3LearningExample;
  label: boolean;
}

export interface R3BinaryMetrics {
  count: number;
  positives: number;
  negatives: number;
  accuracy: number;
  balancedAccuracy: number;
  truePositiveRate: number;
  trueNegativeRate: number;
}

export interface R3NegativeControlResult {
  heldOutEcology: R3EcologyId;
  trainClassRate: number;
  majority: R3BinaryMetrics;
  exactInputMemorizer: R3BinaryMetrics;
  tokenMemorizer: R3BinaryMetrics;
}

export function toR3BinaryProbeExamples(
  examples: readonly R3LearningExample[],
  target: R3ProbeTarget,
): readonly R3BinaryProbeExample[] {
  return examples.map((source) => ({
    source,
    label: targetLabel(source, target),
  }));
}

/**
 * Negative controls are deliberately stupid.
 *
 * If one of them performs extremely well under strict ecology holdout, the
 * candidate target is probably shortcut-shaped and must not be promoted to a
 * learned representation experiment yet.
 */
export function auditR3ProbeNegativeControls(
  corpus: R3CrossEcologyCorpus,
  target: R3ProbeTarget,
  heldOutEcology: R3EcologyId,
): R3NegativeControlResult {
  const split = splitR3CorpusByHeldOutEcology(corpus, heldOutEcology);
  const train = toR3BinaryProbeExamples(split.train, target);
  const heldOut = toR3BinaryProbeExamples(split.heldOut, target);

  assertBinarySupport(train, "train");
  assertBinarySupport(heldOut, "heldOut");

  const positiveRate =
    train.filter((example) => example.label).length / train.length;
  const majorityPrediction = positiveRate >= 0.5;

  const exact = trainExactInputMemorizer(train, majorityPrediction);
  const token = trainTokenMemorizer(train, positiveRate);

  return {
    heldOutEcology,
    trainClassRate: positiveRate,
    majority: evaluateBinary(
      heldOut,
      () => majorityPrediction,
    ),
    exactInputMemorizer: evaluateBinary(
      heldOut,
      (example) => exact.predict(example),
    ),
    tokenMemorizer: evaluateBinary(
      heldOut,
      (example) => token.predict(example),
    ),
  };
}

export function exactLearningInputSignature(
  example: R3LearningExample,
): string {
  return JSON.stringify(example.input);
}

export function semanticTokens(
  example: R3LearningExample,
): readonly string[] {
  const joined = example.input.history
    .map((frame) => frame.semanticText)
    .join("\n");

  return [
    ...new Set(
      joined
        .toLowerCase()
        .match(/[a-z]+(?:'[a-z]+)?/g) ?? [],
    ),
  ].sort();
}

function targetLabel(
  example: R3LearningExample,
  target: R3ProbeTarget,
): boolean {
  switch (target) {
    case "future_activity_phase_change":
      return example.evaluation.futureDelta.activityPhaseChanged;
  }
}

function trainExactInputMemorizer(
  train: readonly R3BinaryProbeExample[],
  fallback: boolean,
): { predict(example: R3BinaryProbeExample): boolean } {
  const counts = new Map<
    string,
    { positive: number; negative: number }
  >();

  for (const example of train) {
    const key = exactLearningInputSignature(example.source);
    const current = counts.get(key) ?? {
      positive: 0,
      negative: 0,
    };
    if (example.label) current.positive += 1;
    else current.negative += 1;
    counts.set(key, current);
  }

  return {
    predict(example) {
      const found = counts.get(
        exactLearningInputSignature(example.source),
      );
      if (!found) return fallback;
      return found.positive >= found.negative;
    },
  };
}

function trainTokenMemorizer(
  train: readonly R3BinaryProbeExample[],
  globalPositiveRate: number,
): { predict(example: R3BinaryProbeExample): boolean } {
  const tokenStats = new Map<
    string,
    { positive: number; total: number }
  >();

  for (const example of train) {
    for (const token of semanticTokens(example.source)) {
      const current = tokenStats.get(token) ?? {
        positive: 0,
        total: 0,
      };
      current.total += 1;
      if (example.label) current.positive += 1;
      tokenStats.set(token, current);
    }
  }

  return {
    predict(example) {
      const rates = semanticTokens(example.source)
        .map((token) => tokenStats.get(token))
        .filter(
          (
            value,
          ): value is { positive: number; total: number } =>
            value !== undefined && value.total >= 2,
        )
        .map((value) => value.positive / value.total);

      if (rates.length === 0) {
        return globalPositiveRate >= 0.5;
      }

      const mean =
        rates.reduce((sum, rate) => sum + rate, 0) /
        rates.length;

      return mean >= globalPositiveRate;
    },
  };
}

function evaluateBinary(
  examples: readonly R3BinaryProbeExample[],
  predict: (example: R3BinaryProbeExample) => boolean,
): R3BinaryMetrics {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;

  for (const example of examples) {
    const predicted = predict(example);
    if (example.label && predicted) tp += 1;
    else if (!example.label && !predicted) tn += 1;
    else if (!example.label && predicted) fp += 1;
    else fn += 1;
  }

  const positives = tp + fn;
  const negatives = tn + fp;
  const tpr = positives > 0 ? tp / positives : 0;
  const tnr = negatives > 0 ? tn / negatives : 0;

  return {
    count: examples.length,
    positives,
    negatives,
    accuracy: (tp + tn) / examples.length,
    balancedAccuracy: (tpr + tnr) / 2,
    truePositiveRate: tpr,
    trueNegativeRate: tnr,
  };
}

function assertBinarySupport(
  examples: readonly R3BinaryProbeExample[],
  label: string,
): void {
  if (examples.length === 0) {
    throw new Error(label + " probe set is empty");
  }

  const positives = examples.filter(
    (example) => example.label,
  ).length;
  if (positives === 0 || positives === examples.length) {
    throw new Error(
      label +
        " probe set lacks both target classes: positives=" +
        positives +
        " total=" +
        examples.length,
    );
  }
}
