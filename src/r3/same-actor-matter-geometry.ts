import type {
  R3SameActorMatterCorpus,
  R3SameActorMatterExample,
  R3SameActorMatterResident,
} from "./same-actor-matter-corpus";
import {
  uniqueR3SameActorMatterExamples,
} from "./same-actor-matter-corpus";
import type {
  R3MatterWording,
} from "./matter-relation-corpus";
import {
  cosineSimilarity,
} from "./matter-relation-geometry";

export type R3SameActorContextMode =
  | "last-transition"
  | "mean-transitions";

export interface R3SameActorEmbeddingPrediction {
  key: string;
  predictedMatterId: string;
  positiveMatterId: string;
  positiveScore: number;
  bestNegativeScore: number;
  margin: number;
  eventful: boolean;
}

export interface R3SameActorEmbeddingMetrics {
  residentId: R3SameActorMatterResident;
  wording: R3MatterWording;
  mode: R3SameActorContextMode;
  queryCount: number;
  candidateCount: number;
  chanceTop1: number;
  top1Accuracy: number;
  eventfulQueryCount: number;
  eventfulTop1Accuracy: number;
  meanPositiveMargin: number;
  eventfulMeanPositiveMargin: number;
  predictions: readonly R3SameActorEmbeddingPrediction[];
}

export interface R3SameActorWordingStability {
  residentId: R3SameActorMatterResident;
  mode: R3SameActorContextMode;
  pairedQueries: number;
  predictionAgreement: number;
  positivePredictionAgreement: number;
}

export function evaluateR3SameActorEmbeddingRetrieval(
  corpus: R3SameActorMatterCorpus,
  embeddings: ReadonlyMap<string, readonly number[]>,
  residentId: R3SameActorMatterResident,
  wording: R3MatterWording,
  mode: R3SameActorContextMode,
): R3SameActorEmbeddingMetrics {
  const examples = uniqueR3SameActorMatterExamples(
    corpus,
    residentId,
    wording,
  );

  if (examples.length === 0) {
    throw new Error(
      "same-actor embedding subset is empty: " +
        residentId +
        "/" +
        wording,
    );
  }

  const predictions = examples.map((example) =>
    predict(example, embeddings, mode),
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
    residentId,
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

export function compareR3SameActorWordingStability(
  baseline: R3SameActorEmbeddingMetrics,
  paraphrase: R3SameActorEmbeddingMetrics,
): R3SameActorWordingStability {
  if (
    baseline.residentId !== paraphrase.residentId ||
    baseline.mode !== paraphrase.mode
  ) {
    throw new Error(
      "same-actor wording stability requires matching resident/mode",
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
    residentId: baseline.residentId,
    mode: baseline.mode,
    pairedQueries: paired,
    predictionAgreement:
      paired > 0 ? samePrediction / paired : 0,
    positivePredictionAgreement:
      paired > 0 ? bothPositive / paired : 0,
  };
}

function predict(
  example: R3SameActorMatterExample,
  embeddings: ReadonlyMap<string, readonly number[]>,
  mode: R3SameActorContextMode,
): R3SameActorEmbeddingPrediction {
  const context = contextEmbedding(
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
  const negative = scored.find(
    (entry) =>
      entry.matterId !== example.positiveMatter.id,
  );

  if (!positive || !negative) {
    throw new Error(
      "same-actor retrieval requires positive and negative",
    );
  }

  return {
    key:
      example.ecology +
      ":" +
      example.residentId +
      ":" +
      example.anchorTick,
    predictedMatterId: scored[0]!.matterId,
    positiveMatterId: example.positiveMatter.id,
    positiveScore: positive.score,
    bestNegativeScore: negative.score,
    margin: positive.score - negative.score,
    eventful: example.eventful,
  };
}

function contextEmbedding(
  example: R3SameActorMatterExample,
  embeddings: ReadonlyMap<string, readonly number[]>,
  mode: R3SameActorContextMode,
): number[] {
  if (example.transitionHistory.length === 0) {
    throw new Error(
      "same-actor transition history is empty",
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
        "same-actor embedding dimension changed",
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
      "missing same-actor embedding for text: " + text,
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
      "same-actor mean vector has invalid norm",
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
