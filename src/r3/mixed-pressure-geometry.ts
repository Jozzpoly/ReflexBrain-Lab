import type {
  R3MixedPressureCausalCorpus,
  R3MixedPressureCausalExample,
} from "./mixed-pressure-causal-responsibility";
import type {
  R3MixedPressureMatterWording,
} from "./mixed-pressure-fixture-policy";
import {
  cosineSimilarity,
} from "./matter-relation-geometry";

export type R3MixedPressureContextMode =
  | "last-transition"
  | "mean-transitions";

export interface R3MixedPressureEmbeddingPrediction {
  anchorTick: number;
  predictedMatterId: string;
  responsibleMatterId: string;
  responsibleScore: number;
  bestOtherScore: number;
  margin: number;
}

export interface R3MixedPressureEmbeddingMetrics {
  wording: R3MixedPressureMatterWording;
  mode: R3MixedPressureContextMode;
  queryCount: number;
  candidateCount: number;
  chanceTop1: number;
  top1Accuracy: number;
  meanResponsibleMargin: number;
  perMatterAccuracy: Readonly<Record<string, number>>;
  predictions: readonly R3MixedPressureEmbeddingPrediction[];
}

export interface R3MixedPressureWordingStability {
  mode: R3MixedPressureContextMode;
  pairedQueries: number;
  predictionAgreement: number;
  responsiblePredictionAgreement: number;
}

export function collectR3MixedPressureProbeTexts(
  corpus: R3MixedPressureCausalCorpus,
): readonly string[] {
  const texts = new Set<string>();

  for (const example of corpus.examples) {
    for (const transition of example.transitionHistory) {
      texts.add(transition);
    }
    for (const matter of example.candidateMatters) {
      texts.add(matter.statement);
    }
  }

  return [...texts].sort();
}

export function evaluateR3MixedPressureEmbeddingRetrieval(
  corpus: R3MixedPressureCausalCorpus,
  embeddings: ReadonlyMap<string, readonly number[]>,
  wording: R3MixedPressureMatterWording,
  mode: R3MixedPressureContextMode,
): R3MixedPressureEmbeddingMetrics {
  const examples = corpus.examples.filter(
    (example) => example.wording === wording,
  );

  if (examples.length === 0) {
    throw new Error(
      "mixed-pressure semantic subset is empty: " + wording,
    );
  }

  const predictions = examples.map((example) =>
    predict(example, embeddings, mode),
  );

  const correctByMatter = new Map<
    string,
    { correct: number; total: number }
  >();

  for (const prediction of predictions) {
    const current =
      correctByMatter.get(
        prediction.responsibleMatterId,
      ) ?? { correct: 0, total: 0 };

    current.total += 1;
    if (
      prediction.predictedMatterId ===
      prediction.responsibleMatterId
    ) {
      current.correct += 1;
    }

    correctByMatter.set(
      prediction.responsibleMatterId,
      current,
    );
  }

  return {
    wording,
    mode,
    queryCount: predictions.length,
    candidateCount:
      examples[0]!.candidateMatters.length,
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
    perMatterAccuracy: Object.fromEntries(
      [...correctByMatter.entries()].map(
        ([matterId, value]) => [
          matterId,
          value.correct / value.total,
        ],
      ),
    ),
    predictions,
  };
}

export function compareR3MixedPressureWordingStability(
  baseline: R3MixedPressureEmbeddingMetrics,
  paraphrase: R3MixedPressureEmbeddingMetrics,
): R3MixedPressureWordingStability {
  if (baseline.mode !== paraphrase.mode) {
    throw new Error(
      "mixed-pressure wording stability requires matching context mode",
    );
  }

  const rightByTick = new Map(
    paraphrase.predictions.map((prediction) => [
      prediction.anchorTick,
      prediction,
    ]),
  );

  let paired = 0;
  let samePrediction = 0;
  let bothResponsible = 0;

  for (const left of baseline.predictions) {
    const right = rightByTick.get(left.anchorTick);
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
    mode: baseline.mode,
    pairedQueries: paired,
    predictionAgreement:
      paired > 0 ? samePrediction / paired : 0,
    responsiblePredictionAgreement:
      paired > 0 ? bothResponsible / paired : 0,
  };
}

function predict(
  example: R3MixedPressureCausalExample,
  embeddings: ReadonlyMap<string, readonly number[]>,
  mode: R3MixedPressureContextMode,
): R3MixedPressureEmbeddingPrediction {
  const context = contextEmbedding(
    example,
    embeddings,
    mode,
  );

  const scored = example.candidateMatters.map(
    (matter) => ({
      matterId: matter.id,
      score: cosineSimilarity(
        context,
        requiredEmbedding(
          embeddings,
          matter.statement,
        ),
      ),
    }),
  );

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
      "mixed-pressure retrieval requires responsible and negative matters",
    );
  }

  return {
    anchorTick: example.anchorTick,
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
  example: R3MixedPressureCausalExample,
  embeddings: ReadonlyMap<string, readonly number[]>,
  mode: R3MixedPressureContextMode,
): number[] {
  if (example.transitionHistory.length === 0) {
    throw new Error(
      "mixed-pressure transition history is empty",
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
        "mixed-pressure embedding dimension changed within history",
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
      "missing mixed-pressure semantic embedding for text: " +
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
      "mixed-pressure mean vector has invalid norm",
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
    values.reduce(
      (sum, value) => sum + value,
      0,
    ) / values.length
  );
}
