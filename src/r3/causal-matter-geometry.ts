import type {
  R3CausalMatterResponsibilityCorpus,
  R3CausalMatterResponsibilityExample,
} from "./causal-matter-responsibility";
import type {
  R3MatterWording,
} from "./matter-relation-corpus";
import type {
  R3SameActorMatterResident,
} from "./same-actor-matter-corpus";
import {
  cosineSimilarity,
} from "./matter-relation-geometry";

export type R3CausalMatterContextMode =
  | "last-transition"
  | "mean-transitions";

export interface R3CausalMatterEmbeddingPrediction {
  key: string;
  predictedMatterId: string;
  responsibleMatterId: string;
  responsibleScore: number;
  bestOtherScore: number;
  margin: number;
}

export interface R3CausalMatterEmbeddingMetrics {
  residentId: R3SameActorMatterResident;
  wording: R3MatterWording;
  mode: R3CausalMatterContextMode;
  queryCount: number;
  chanceTop1: number;
  top1Accuracy: number;
  meanResponsibleMargin: number;
  predictions: readonly R3CausalMatterEmbeddingPrediction[];
}

export interface R3CausalMatterWordingStability {
  residentId: R3SameActorMatterResident;
  mode: R3CausalMatterContextMode;
  pairedQueries: number;
  predictionAgreement: number;
  responsiblePredictionAgreement: number;
}

export function evaluateR3CausalMatterEmbeddingRetrieval(
  corpus: R3CausalMatterResponsibilityCorpus,
  embeddings: ReadonlyMap<string, readonly number[]>,
  residentId: R3SameActorMatterResident,
  wording: R3MatterWording,
  mode: R3CausalMatterContextMode,
): R3CausalMatterEmbeddingMetrics {
  const examples = corpus.examples.filter(
    (example) =>
      example.residentId === residentId &&
      example.wording === wording,
  );

  if (examples.length === 0) {
    throw new Error(
      "causal semantic subset is empty: " +
        residentId +
        "/" +
        wording,
    );
  }

  const predictions = examples.map((example) =>
    predict(example, embeddings, mode),
  );

  return {
    residentId,
    wording,
    mode,
    queryCount: predictions.length,
    chanceTop1:
      1 / examples[0]!.candidateMatters.length,
    top1Accuracy:
      predictions.filter(
        (prediction) =>
          prediction.predictedMatterId ===
          prediction.responsibleMatterId,
      ).length / predictions.length,
    meanResponsibleMargin: mean(
      predictions.map(
        (prediction) => prediction.margin,
      ),
    ),
    predictions,
  };
}

export function compareR3CausalMatterWordingStability(
  baseline: R3CausalMatterEmbeddingMetrics,
  paraphrase: R3CausalMatterEmbeddingMetrics,
): R3CausalMatterWordingStability {
  if (
    baseline.residentId !== paraphrase.residentId ||
    baseline.mode !== paraphrase.mode
  ) {
    throw new Error(
      "causal wording stability requires matching resident/mode",
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
  let bothResponsible = 0;

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
        left.responsibleMatterId &&
      right.predictedMatterId ===
        right.responsibleMatterId
    ) {
      bothResponsible += 1;
    }
  }

  return {
    residentId: baseline.residentId,
    mode: baseline.mode,
    pairedQueries: paired,
    predictionAgreement:
      paired > 0 ? samePrediction / paired : 0,
    responsiblePredictionAgreement:
      paired > 0 ? bothResponsible / paired : 0,
  };
}

function predict(
  example: R3CausalMatterResponsibilityExample,
  embeddings: ReadonlyMap<string, readonly number[]>,
  mode: R3CausalMatterContextMode,
): R3CausalMatterEmbeddingPrediction {
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

  const responsible = scored.find(
    (entry) =>
      entry.matterId ===
      example.causallyResponsibleMatterId,
  );
  const other = scored.find(
    (entry) =>
      entry.matterId !==
      example.causallyResponsibleMatterId,
  );

  if (!responsible || !other) {
    throw new Error(
      "causal semantic retrieval requires responsible + other matter",
    );
  }

  return {
    key:
      example.ecology +
      ":" +
      example.anchorTick,
    predictedMatterId: scored[0]!.matterId,
    responsibleMatterId:
      example.causallyResponsibleMatterId,
    responsibleScore: responsible.score,
    bestOtherScore: other.score,
    margin:
      responsible.score - other.score,
  };
}

function contextEmbedding(
  example: R3CausalMatterResponsibilityExample,
  embeddings: ReadonlyMap<string, readonly number[]>,
  mode: R3CausalMatterContextMode,
): number[] {
  if (example.transitionHistory.length === 0) {
    throw new Error(
      "causal transition history is empty",
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
        "causal semantic embedding dimension changed",
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
      "missing causal semantic embedding for text: " +
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
      "causal semantic mean vector has invalid norm",
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
