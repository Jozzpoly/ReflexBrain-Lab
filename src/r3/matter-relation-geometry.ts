import type {
  R3MatterRelationCorpus,
  R3MatterRelationExample,
  R3MatterWording,
} from "./matter-relation-corpus";
import {
  uniqueR3MatterRelationExamples,
} from "./matter-relation-corpus";
import type { R3EcologyId } from "./learning-corpus";

export type R3MatterContextMode =
  | "last-frame"
  | "mean-history";

export interface R3MatterEmbeddingPrediction {
  key: string;
  predictedMatterId: string;
  positiveMatterId: string;
  positiveScore: number;
  bestNegativeScore: number;
  margin: number;
  eventful: boolean;
}

export interface R3MatterEmbeddingRetrievalMetrics {
  ecology: R3EcologyId;
  wording: R3MatterWording;
  mode: R3MatterContextMode;
  queryCount: number;
  candidateCount: number;
  chanceTop1: number;
  top1Accuracy: number;
  eventfulQueryCount: number;
  eventfulTop1Accuracy: number;
  meanPositiveMargin: number;
  eventfulMeanPositiveMargin: number;
  predictions: readonly R3MatterEmbeddingPrediction[];
}

export interface R3MatterWordingStability {
  ecology: R3EcologyId;
  mode: R3MatterContextMode;
  pairedQueries: number;
  predictionAgreement: number;
  positivePredictionAgreement: number;
}

export function collectR3MatterProbeTexts(
  corpus: R3MatterRelationCorpus,
): readonly string[] {
  const texts = new Set<string>();

  for (const example of corpus.examples) {
    for (const frame of example.context) {
      texts.add(frame.semanticText);
    }
    for (const matter of example.candidateMatters) {
      texts.add(matter.statement);
    }
  }

  return [...texts].sort();
}

export function evaluateR3MatterEmbeddingRetrieval(
  corpus: R3MatterRelationCorpus,
  embeddings: ReadonlyMap<string, readonly number[]>,
  ecology: R3EcologyId,
  wording: R3MatterWording,
  mode: R3MatterContextMode,
): R3MatterEmbeddingRetrievalMetrics {
  const examples = uniqueR3MatterRelationExamples(
    corpus,
    ecology,
    wording,
  );

  if (examples.length === 0) {
    throw new Error(
      "R3 matter embedding subset is empty: " +
        ecology +
        "/" +
        wording,
    );
  }

  const predictions = examples.map((example) =>
    predictMatter(example, embeddings, mode),
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
      predictions.map((prediction) => prediction.margin),
    ),
    eventfulMeanPositiveMargin:
      eventful.length > 0
        ? mean(eventful.map((prediction) => prediction.margin))
        : 0,
    predictions,
  };
}

export function compareR3MatterWordingStability(
  baseline: R3MatterEmbeddingRetrievalMetrics,
  paraphrase: R3MatterEmbeddingRetrievalMetrics,
): R3MatterWordingStability {
  if (
    baseline.ecology !== paraphrase.ecology ||
    baseline.mode !== paraphrase.mode
  ) {
    throw new Error(
      "wording stability requires matching ecology and context mode",
    );
  }

  const paraphraseByKey = new Map(
    paraphrase.predictions.map((prediction) => [
      prediction.key,
      prediction,
    ]),
  );

  let paired = 0;
  let samePrediction = 0;
  let bothPositive = 0;

  for (const left of baseline.predictions) {
    const right = paraphraseByKey.get(left.key);
    if (!right) continue;

    paired += 1;
    if (
      left.predictedMatterId === right.predictedMatterId
    ) {
      samePrediction += 1;
    }
    if (
      left.predictedMatterId === left.positiveMatterId &&
      right.predictedMatterId === right.positiveMatterId
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

function predictMatter(
  example: R3MatterRelationExample,
  embeddings: ReadonlyMap<string, readonly number[]>,
  mode: R3MatterContextMode,
): R3MatterEmbeddingPrediction {
  const context = contextEmbedding(
    example,
    embeddings,
    mode,
  );

  const scored = example.candidateMatters.map((matter) => ({
    matterId: matter.id,
    score: cosineSimilarity(
      context,
      requiredEmbedding(embeddings, matter.statement),
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
  if (!positive) {
    throw new Error(
      "positive matter missing from scored candidates: " +
        example.id,
    );
  }

  const bestNegative = scored.find(
    (entry) =>
      entry.matterId !== example.positiveMatter.id,
  );
  if (!bestNegative) {
    throw new Error(
      "matter retrieval requires at least one negative candidate",
    );
  }

  return {
    key: example.residentId + ":" + example.anchorTick,
    predictedMatterId: scored[0]!.matterId,
    positiveMatterId: example.positiveMatter.id,
    positiveScore: positive.score,
    bestNegativeScore: bestNegative.score,
    margin: positive.score - bestNegative.score,
    eventful: example.eventful,
  };
}

function contextEmbedding(
  example: R3MatterRelationExample,
  embeddings: ReadonlyMap<string, readonly number[]>,
  mode: R3MatterContextMode,
): number[] {
  if (example.context.length === 0) {
    throw new Error("matter relation context is empty");
  }

  if (mode === "last-frame") {
    return [
      ...requiredEmbedding(
        embeddings,
        example.context[example.context.length - 1]!
          .semanticText,
      ),
    ];
  }

  const rows = example.context.map((frame) =>
    requiredEmbedding(embeddings, frame.semanticText),
  );
  const dimensions = rows[0]!.length;
  const meanVector = new Array<number>(dimensions).fill(0);

  for (const row of rows) {
    if (row.length !== dimensions) {
      throw new Error(
        "R3 semantic embedding dimension changed within history",
      );
    }
    for (let index = 0; index < dimensions; index += 1) {
      meanVector[index]! += row[index]!;
    }
  }

  for (let index = 0; index < dimensions; index += 1) {
    meanVector[index]! /= rows.length;
  }

  normalizeInPlace(meanVector);
  return meanVector;
}

function requiredEmbedding(
  embeddings: ReadonlyMap<string, readonly number[]>,
  text: string,
): readonly number[] {
  const value = embeddings.get(text);
  if (!value) {
    throw new Error(
      "missing R3 semantic embedding for text: " + text,
    );
  }
  return value;
}

export function cosineSimilarity(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
): number {
  if (left.length !== right.length || left.length === 0) {
    throw new Error(
      "cosine vectors must have equal non-zero length",
    );
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    const a = Number(left[index]);
    const b = Number(right[index]);
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }

  const denominator =
    Math.sqrt(leftNorm) * Math.sqrt(rightNorm);

  if (!Number.isFinite(denominator) || denominator <= 0) {
    throw new Error("cosine vector norm is invalid");
  }

  return dot / denominator;
}

function normalizeInPlace(vector: number[]): void {
  let normSquared = 0;
  for (const value of vector) {
    normSquared += value * value;
  }
  const norm = Math.sqrt(normSquared);
  if (!Number.isFinite(norm) || norm <= 0) {
    throw new Error("R3 semantic mean vector has invalid norm");
  }
  for (let index = 0; index < vector.length; index += 1) {
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
