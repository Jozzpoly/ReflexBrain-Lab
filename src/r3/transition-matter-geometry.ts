import type {
  R3TransitionMatterCorpus,
  R3TransitionMatterExample,
} from "./transition-matter-corpus";
import {
  uniqueTransitionExamples,
} from "./transition-matter-corpus";
import type {
  R3EcologyId,
} from "./learning-corpus";
import type {
  R3MatterWording,
} from "./matter-relation-corpus";
import {
  cosineSimilarity,
} from "./matter-relation-geometry";

export type R3TransitionContextMode =
  | "last-transition"
  | "mean-transitions";

export interface R3TransitionEmbeddingPrediction {
  key: string;
  predictedMatterId: string;
  positiveMatterId: string;
  positiveScore: number;
  bestNegativeScore: number;
  margin: number;
  eventful: boolean;
}

export interface R3TransitionEmbeddingRetrievalMetrics {
  ecology: R3EcologyId;
  wording: R3MatterWording;
  mode: R3TransitionContextMode;
  queryCount: number;
  candidateCount: number;
  chanceTop1: number;
  top1Accuracy: number;
  eventfulQueryCount: number;
  eventfulTop1Accuracy: number;
  meanPositiveMargin: number;
  eventfulMeanPositiveMargin: number;
  predictions: readonly R3TransitionEmbeddingPrediction[];
}

export interface R3TransitionWordingStability {
  ecology: R3EcologyId;
  mode: R3TransitionContextMode;
  pairedQueries: number;
  predictionAgreement: number;
  positivePredictionAgreement: number;
}

export function collectR3TransitionProbeTexts(
  corpus: R3TransitionMatterCorpus,
): readonly string[] {
  const texts = new Set<string>();

  for (const example of corpus.examples) {
    for (const frame of example.transitionHistory) {
      texts.add(frame);
    }
    for (const matter of example.candidateMatters) {
      texts.add(matter.statement);
    }
  }

  return [...texts].sort();
}

export function evaluateR3TransitionEmbeddingRetrieval(
  corpus: R3TransitionMatterCorpus,
  embeddings: ReadonlyMap<string, readonly number[]>,
  ecology: R3EcologyId,
  wording: R3MatterWording,
  mode: R3TransitionContextMode,
): R3TransitionEmbeddingRetrievalMetrics {
  const examples = uniqueTransitionExamples(
    corpus,
    ecology,
    wording,
  );

  if (examples.length === 0) {
    throw new Error(
      "R3 transition embedding subset is empty: " +
        ecology +
        "/" +
        wording,
    );
  }

  const predictions = examples.map((example) =>
    predictTransitionMatter(
      example,
      embeddings,
      mode,
    ),
  );

  const correct = predictions.filter(
    (prediction) =>
      prediction.predictedMatterId ===
      prediction.positiveMatterId,
  ).length;

  const eventful = predictions.filter(
    (prediction) => prediction.eventful,
  );
  const eventfulCorrect = eventful.filter(
    (prediction) =>
      prediction.predictedMatterId ===
      prediction.positiveMatterId,
  ).length;

  return {
    ecology,
    wording,
    mode,
    queryCount: predictions.length,
    candidateCount: examples[0]!.candidateMatters.length,
    chanceTop1: 1 / examples[0]!.candidateMatters.length,
    top1Accuracy: correct / predictions.length,
    eventfulQueryCount: eventful.length,
    eventfulTop1Accuracy:
      eventful.length > 0
        ? eventfulCorrect / eventful.length
        : 0,
    meanPositiveMargin: mean(
      predictions.map(
        (prediction) => prediction.margin,
      ),
    ),
    eventfulMeanPositiveMargin:
      eventful.length > 0
        ? mean(
            eventful.map(
              (prediction) => prediction.margin,
            ),
          )
        : 0,
    predictions,
  };
}

export function compareR3TransitionWordingStability(
  baseline: R3TransitionEmbeddingRetrievalMetrics,
  paraphrase: R3TransitionEmbeddingRetrievalMetrics,
): R3TransitionWordingStability {
  if (
    baseline.ecology !== paraphrase.ecology ||
    baseline.mode !== paraphrase.mode
  ) {
    throw new Error(
      "transition wording stability requires matching ecology/mode",
    );
  }

  const rightByKey = new Map(
    paraphrase.predictions.map((prediction) => [
      prediction.key,
      prediction,
    ]),
  );

  let paired = 0;
  let samePrediction = 0;
  let bothPositive = 0;

  for (const left of baseline.predictions) {
    const right = rightByKey.get(left.key);
    if (!right) continue;

    paired += 1;
    if (
      left.predictedMatterId ===
      right.predictedMatterId
    ) {
      samePrediction += 1;
    }
    if (
      left.predictedMatterId ===
        left.positiveMatterId &&
      right.predictedMatterId ===
        right.positiveMatterId
    ) {
      bothPositive += 1;
    }
  }

  return {
    ecology: baseline.ecology,
    mode: baseline.mode,
    pairedQueries: paired,
    predictionAgreement:
      paired > 0 ? samePrediction / paired : 0,
    positivePredictionAgreement:
      paired > 0 ? bothPositive / paired : 0,
  };
}

function predictTransitionMatter(
  example: R3TransitionMatterExample,
  embeddings: ReadonlyMap<string, readonly number[]>,
  mode: R3TransitionContextMode,
): R3TransitionEmbeddingPrediction {
  const context = transitionContextEmbedding(
    example,
    embeddings,
    mode,
  );

  const scored = example.candidateMatters.map((matter) => ({
    matterId: matter.id,
    score: cosineSimilarity(
      context,
      requiredEmbedding(
        embeddings,
        matter.statement,
      ),
    ),
  }));

  scored.sort(
    (left, right) =>
      right.score - left.score ||
      left.matterId.localeCompare(right.matterId),
  );

  const positive = scored.find(
    (entry) =>
      entry.matterId === example.positiveMatter.id,
  );
  const bestNegative = scored.find(
    (entry) =>
      entry.matterId !== example.positiveMatter.id,
  );

  if (!positive || !bestNegative) {
    throw new Error(
      "transition retrieval requires positive and negative matters",
    );
  }

  return {
    key:
      example.residentId + ":" + example.anchorTick,
    predictedMatterId: scored[0]!.matterId,
    positiveMatterId: example.positiveMatter.id,
    positiveScore: positive.score,
    bestNegativeScore: bestNegative.score,
    margin: positive.score - bestNegative.score,
    eventful: example.eventful,
  };
}

function transitionContextEmbedding(
  example: R3TransitionMatterExample,
  embeddings: ReadonlyMap<string, readonly number[]>,
  mode: R3TransitionContextMode,
): number[] {
  if (example.transitionHistory.length === 0) {
    throw new Error(
      "transition relation history is empty",
    );
  }

  if (mode === "last-transition") {
    return [
      ...requiredEmbedding(
        embeddings,
        example.transitionHistory[
          example.transitionHistory.length - 1
        ]!,
      ),
    ];
  }

  const rows = example.transitionHistory.map((text) =>
    requiredEmbedding(embeddings, text),
  );
  const dimensions = rows[0]!.length;
  const vector =
    new Array<number>(dimensions).fill(0);

  for (const row of rows) {
    if (row.length !== dimensions) {
      throw new Error(
        "transition semantic embedding dimension changed",
      );
    }
    for (
      let index = 0;
      index < dimensions;
      index += 1
    ) {
      vector[index]! += row[index]!;
    }
  }

  for (
    let index = 0;
    index < dimensions;
    index += 1
  ) {
    vector[index]! /= rows.length;
  }

  normalizeInPlace(vector);
  return vector;
}

function requiredEmbedding(
  embeddings: ReadonlyMap<string, readonly number[]>,
  text: string,
): readonly number[] {
  const value = embeddings.get(text);
  if (!value) {
    throw new Error(
      "missing transition semantic embedding for text: " +
        text,
    );
  }
  return value;
}

function normalizeInPlace(vector: number[]): void {
  let squared = 0;
  for (const value of vector) {
    squared += value * value;
  }
  const norm = Math.sqrt(squared);
  if (!Number.isFinite(norm) || norm <= 0) {
    throw new Error(
      "transition semantic mean vector has invalid norm",
    );
  }
  for (
    let index = 0;
    index < vector.length;
    index += 1
  ) {
    vector[index]! /= norm;
  }
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}
