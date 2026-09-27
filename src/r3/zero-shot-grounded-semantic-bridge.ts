import {
  R3_SEMANTIC_ENCODER_BATCH_SIZE,
  R3_SEMANTIC_ENCODER_DTYPE,
  R3_SEMANTIC_ENCODER_MODEL_ID,
  R3_SEMANTIC_ENCODER_MODEL_REVISION,
  type R3SemanticEmbeddingResult,
} from "./semantic-encoder-contract";

export type R3ZeroShotGroundedSemanticDomain =
  | "rack"
  | "source";

export type R3ZeroShotGroundedSemanticFamilyId =
  | "baseline-exact"
  | "report-paraphrase-baseline-purpose"
  | "baseline-report-purpose-paraphrase"
  | "cross-paraphrase";

export const R3_ZERO_SHOT_BASELINE_REPORTS:
  Readonly<
    Record<
      R3ZeroShotGroundedSemanticDomain,
      string
    >
  > = {
    rack: "The input rack is empty.",
    source: "The raw source is empty.",
  };

export const R3_ZERO_SHOT_BASELINE_PURPOSES:
  Readonly<
    Record<
      R3ZeroShotGroundedSemanticDomain,
      string
    >
  > = {
    rack:
      "acknowledge grounded reports about whether the workshop input rack is empty; source-empty reports are not part of this monitoring responsibility",
    source:
      "acknowledge grounded reports about whether the raw source is empty; rack-empty reports are not part of this monitoring responsibility",
  };

export const R3_ZERO_SHOT_REPORT_PARAPHRASES:
  Readonly<
    Record<
      R3ZeroShotGroundedSemanticDomain,
      readonly string[]
    >
  > = {
    rack: [
      "No unfinished blank is available at the workshop intake.",
      "The worker feed point has run out of raw stock.",
      "There is no raw piece left at the bench input.",
    ],
    source: [
      "The raw-material reserve has been depleted.",
      "No unfinished stock remains at the supply point.",
      "The feedstock store has run dry.",
    ],
  };

export const R3_ZERO_SHOT_PURPOSE_PARAPHRASE_PAIRS:
  readonly Readonly<
    Record<
      R3ZeroShotGroundedSemanticDomain,
      string
    >
  >[] = [
    {
      rack:
        "monitor shortages where unfinished stock is presented to the worker; depletion of the upstream reserve is outside this duty",
      source:
        "monitor depletion of the upstream raw-material reserve; workstation intake shortages are outside this duty",
    },
    {
      rack:
        "respond to reports that the workshop feed point lacks raw material, not to upstream storage depletion",
      source:
        "respond to reports that the supply reserve has run out, not to shortages at the worker feed point",
    },
  ];

export interface R3ZeroShotRankingCase {
  id: string;
  family:
    R3ZeroShotGroundedSemanticFamilyId;
  reportDomain:
    R3ZeroShotGroundedSemanticDomain;
  reportText: string;
  rackPurposeText: string;
  sourcePurposeText: string;
}

export interface R3ZeroShotRankingPrediction {
  id: string;
  family:
    R3ZeroShotGroundedSemanticFamilyId;
  reportDomain:
    R3ZeroShotGroundedSemanticDomain;
  matchingScore: number;
  nonmatchingScore: number;
  margin: number;
  predictedDomain:
    R3ZeroShotGroundedSemanticDomain | "tie";
  correct: boolean;
}

export interface R3ZeroShotFamilyMetrics {
  family:
    R3ZeroShotGroundedSemanticFamilyId;
  count: number;
  correct: number;
  accuracy: number;
  meanMargin: number;
  medianMargin: number;
  predictions:
    readonly R3ZeroShotRankingPrediction[];
}

export interface R3ZeroShotBridgeMetrics {
  baselineExact:
    R3ZeroShotFamilyMetrics;
  reportParaphraseBaselinePurpose:
    R3ZeroShotFamilyMetrics;
  baselineReportPurposeParaphrase:
    R3ZeroShotFamilyMetrics;
  crossParaphrase:
    R3ZeroShotFamilyMetrics;
}

export type R3ZeroShotGroundedSemanticBridgeClassification =
  | "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_QUALIFIED"
  | "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_PARTIAL"
  | "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_FAIL"
  | "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_EXECUTION_FAIL";

export interface R3ZeroShotGroundedSemanticBridgeEvaluation {
  embedding:
    R3ZeroShotBridgeMetrics;
  lexical:
    R3ZeroShotBridgeMetrics;
  executionGates: {
    modelId: boolean;
    modelRevision: boolean;
    dtype: boolean;
    device: boolean;
    batchSize: boolean;
    dimensions: boolean;
    itemCount: boolean;
    finiteEmbeddings: boolean;
    all: boolean;
  };
  semanticGates: {
    baselineExact: boolean;
    reportParaphraseBaselinePurpose:
      boolean;
    baselineReportPurposeParaphrase:
      boolean;
    crossParaphrase: boolean;
    crossBeatsLexical: boolean;
    positiveMeanMargins: boolean;
    nonnegativeMedianMargins: boolean;
    all: boolean;
  };
  classification:
    R3ZeroShotGroundedSemanticBridgeClassification;
}

export function buildR3ZeroShotGroundedSemanticCases():
readonly R3ZeroShotRankingCase[] {
  const cases:
    R3ZeroShotRankingCase[] = [];

  for (const domain of domains()) {
    cases.push({
      id:
        "baseline:" +
        domain,
      family:
        "baseline-exact",
      reportDomain:
        domain,
      reportText:
        R3_ZERO_SHOT_BASELINE_REPORTS[
          domain
        ],
      rackPurposeText:
        R3_ZERO_SHOT_BASELINE_PURPOSES
          .rack,
      sourcePurposeText:
        R3_ZERO_SHOT_BASELINE_PURPOSES
          .source,
    });
  }

  for (const domain of domains()) {
    R3_ZERO_SHOT_REPORT_PARAPHRASES[
      domain
    ].forEach(
      (text, index) => {
        cases.push({
          id:
            "report-paraphrase:" +
            domain +
            ":" +
            index,
          family:
            "report-paraphrase-baseline-purpose",
          reportDomain:
            domain,
          reportText:
            text,
          rackPurposeText:
            R3_ZERO_SHOT_BASELINE_PURPOSES
              .rack,
          sourcePurposeText:
            R3_ZERO_SHOT_BASELINE_PURPOSES
              .source,
        });
      },
    );
  }

  R3_ZERO_SHOT_PURPOSE_PARAPHRASE_PAIRS
    .forEach(
      (pair, pairIndex) => {
        for (
          const domain of
            domains()
        ) {
          cases.push({
            id:
              "purpose-paraphrase:" +
              pairIndex +
              ":" +
              domain,
            family:
              "baseline-report-purpose-paraphrase",
            reportDomain:
              domain,
            reportText:
              R3_ZERO_SHOT_BASELINE_REPORTS[
                domain
              ],
            rackPurposeText:
              pair.rack,
            sourcePurposeText:
              pair.source,
          });
        }
      },
    );

  R3_ZERO_SHOT_PURPOSE_PARAPHRASE_PAIRS
    .forEach(
      (pair, pairIndex) => {
        for (
          const domain of
            domains()
        ) {
          R3_ZERO_SHOT_REPORT_PARAPHRASES[
            domain
          ].forEach(
            (
              reportText,
              reportIndex,
            ) => {
              cases.push({
                id:
                  "cross-paraphrase:" +
                  pairIndex +
                  ":" +
                  domain +
                  ":" +
                  reportIndex,
                family:
                  "cross-paraphrase",
                reportDomain:
                  domain,
                reportText,
                rackPurposeText:
                  pair.rack,
                sourcePurposeText:
                  pair.source,
              });
            },
          );
        }
      },
    );

  return cases;
}

export function collectR3ZeroShotGroundedSemanticTexts():
readonly string[] {
  return [
    ...new Set(
      buildR3ZeroShotGroundedSemanticCases()
        .flatMap(
          (item) => [
            item.reportText,
            item.rackPurposeText,
            item.sourcePurposeText,
          ],
        ),
    ),
  ].sort();
}

export function evaluateR3ZeroShotGroundedSemanticEmbeddings(
  embedded:
    R3SemanticEmbeddingResult,
):
R3ZeroShotGroundedSemanticBridgeEvaluation {
  const texts =
    collectR3ZeroShotGroundedSemanticTexts();

  const byText =
    new Map<
      string,
      readonly number[]
    >();

  const textById =
    new Map(
      texts.map(
        (text, index) => [
          textId(index),
          text,
        ],
      ),
    );

  let finiteEmbeddings =
    true;

  for (
    const item of
      embedded.embeddings
  ) {
    const text =
      textById.get(
        item.id,
      );

    if (!text) {
      continue;
    }

    if (
      item.vector.length !==
        384 ||
      item.vector.some(
        (value) =>
          !Number.isFinite(
            value,
          ),
      )
    ) {
      finiteEmbeddings =
        false;
    }

    byText.set(
      text,
      item.vector,
    );
  }

  const executionGates = {
    modelId:
      embedded.modelId ===
      R3_SEMANTIC_ENCODER_MODEL_ID,
    modelRevision:
      embedded.modelRevision ===
      R3_SEMANTIC_ENCODER_MODEL_REVISION,
    dtype:
      embedded.dtype ===
      R3_SEMANTIC_ENCODER_DTYPE,
    device:
      embedded.device ===
      "webgpu",
    batchSize:
      embedded.batchSize ===
      R3_SEMANTIC_ENCODER_BATCH_SIZE,
    dimensions:
      embedded.dimensions ===
      384,
    itemCount:
      embedded.itemCount ===
        texts.length &&
      byText.size ===
        texts.length,
    finiteEmbeddings,
    all: false,
  };
  executionGates.all =
    Object.entries(
      executionGates,
    )
      .filter(
        ([key]) =>
          key !== "all",
      )
      .every(
        ([, value]) =>
          value === true,
      );

  if (
    !executionGates.all
  ) {
    return {
      embedding:
        emptyMetrics(),
      lexical:
        evaluateR3ZeroShotGroundedSemanticLexical(),
      executionGates,
      semanticGates:
        emptySemanticGates(),
      classification:
        "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_EXECUTION_FAIL",
    };
  }

  const embedding =
    evaluateCases(
      (left, right) =>
        cosine(
          requiredVector(
            byText,
            left,
          ),
          requiredVector(
            byText,
            right,
          ),
        ),
    );

  const lexical =
    evaluateR3ZeroShotGroundedSemanticLexical();

  const semanticGates =
    semanticGateReport(
      embedding,
      lexical,
    );

  const baselinePass =
    semanticGates
      .baselineExact;
  const anyParaphraseLift =
    (
      embedding
        .reportParaphraseBaselinePurpose
        .accuracy >
        lexical
          .reportParaphraseBaselinePurpose
          .accuracy &&
      embedding
        .reportParaphraseBaselinePurpose
        .accuracy >
        0.5
    ) ||
    (
      embedding
        .baselineReportPurposeParaphrase
        .accuracy >
        lexical
          .baselineReportPurposeParaphrase
          .accuracy &&
      embedding
        .baselineReportPurposeParaphrase
        .accuracy >
        0.5
    ) ||
    (
      embedding
        .crossParaphrase
        .accuracy >
        lexical
          .crossParaphrase
          .accuracy &&
      embedding
        .crossParaphrase
        .accuracy >
        0.5
    );

  const classification:
    R3ZeroShotGroundedSemanticBridgeClassification =
      semanticGates.all
        ? "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_QUALIFIED"
        : baselinePass &&
            anyParaphraseLift
          ? "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_PARTIAL"
          : "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_FAIL";

  return {
    embedding,
    lexical,
    executionGates,
    semanticGates,
    classification,
  };
}

export function evaluateR3ZeroShotGroundedSemanticLexical():
R3ZeroShotBridgeMetrics {
  return evaluateCases(
    (left, right) =>
      lexicalJaccard(
        tokenSet(left),
        tokenSet(right),
      ),
  );
}

export function r3ZeroShotTextItems():
readonly {
  id: string;
  text: string;
}[] {
  return collectR3ZeroShotGroundedSemanticTexts()
    .map(
      (text, index) => ({
        id:
          textId(index),
        text,
      }),
    );
}

function evaluateCases(
  score: (
    left: string,
    right: string,
  ) => number,
):
R3ZeroShotBridgeMetrics {
  const cases =
    buildR3ZeroShotGroundedSemanticCases();

  return {
    baselineExact:
      evaluateFamily(
        cases,
        "baseline-exact",
        score,
      ),
    reportParaphraseBaselinePurpose:
      evaluateFamily(
        cases,
        "report-paraphrase-baseline-purpose",
        score,
      ),
    baselineReportPurposeParaphrase:
      evaluateFamily(
        cases,
        "baseline-report-purpose-paraphrase",
        score,
      ),
    crossParaphrase:
      evaluateFamily(
        cases,
        "cross-paraphrase",
        score,
      ),
  };
}

function evaluateFamily(
  cases:
    readonly R3ZeroShotRankingCase[],
  family:
    R3ZeroShotGroundedSemanticFamilyId,
  score: (
    left: string,
    right: string,
  ) => number,
):
R3ZeroShotFamilyMetrics {
  const predictions =
    cases
      .filter(
        (item) =>
          item.family ===
          family,
      )
      .map(
        (item) => {
          const rackScore =
            score(
              item.reportText,
              item.rackPurposeText,
            );
          const sourceScore =
            score(
              item.reportText,
              item.sourcePurposeText,
            );

          const matchingScore =
            item.reportDomain ===
              "rack"
              ? rackScore
              : sourceScore;
          const nonmatchingScore =
            item.reportDomain ===
              "rack"
              ? sourceScore
              : rackScore;

          const predictedDomain =
            rackScore ===
              sourceScore
              ? "tie"
              : rackScore >
                  sourceScore
                ? "rack"
                : "source";

          return {
            id:
              item.id,
            family,
            reportDomain:
              item.reportDomain,
            matchingScore,
            nonmatchingScore,
            margin:
              matchingScore -
              nonmatchingScore,
            predictedDomain,
            correct:
              predictedDomain ===
              item.reportDomain,
          } satisfies
            R3ZeroShotRankingPrediction;
        },
      );

  const margins =
    predictions
      .map(
        (item) =>
          item.margin,
      )
      .sort(
        (a, b) =>
          a - b,
      );

  return {
    family,
    count:
      predictions.length,
    correct:
      predictions.filter(
        (item) =>
          item.correct,
      ).length,
    accuracy:
      predictions.length > 0
        ? predictions.filter(
            (item) =>
              item.correct,
          ).length /
          predictions.length
        : 0,
    meanMargin:
      mean(margins),
    medianMargin:
      median(margins),
    predictions,
  };
}

function semanticGateReport(
  embedding:
    R3ZeroShotBridgeMetrics,
  lexical:
    R3ZeroShotBridgeMetrics,
) {
  const positiveMeanMargins =
    families(embedding)
      .every(
        (family) =>
          family.meanMargin >
          0,
      );

  const nonnegativeMedianMargins =
    families(embedding)
      .every(
        (family) =>
          family.medianMargin >=
          0,
      );

  const gates = {
    baselineExact:
      embedding
        .baselineExact
        .count ===
        2 &&
      embedding
        .baselineExact
        .correct ===
        2,
    reportParaphraseBaselinePurpose:
      embedding
        .reportParaphraseBaselinePurpose
        .count ===
        6 &&
      embedding
        .reportParaphraseBaselinePurpose
        .correct >=
        5,
    baselineReportPurposeParaphrase:
      embedding
        .baselineReportPurposeParaphrase
        .count ===
        4 &&
      embedding
        .baselineReportPurposeParaphrase
        .correct ===
        4,
    crossParaphrase:
      embedding
        .crossParaphrase
        .count ===
        12 &&
      embedding
        .crossParaphrase
        .correct >=
        10,
    crossBeatsLexical:
      embedding
        .crossParaphrase
        .accuracy >
      lexical
        .crossParaphrase
        .accuracy,
    positiveMeanMargins,
    nonnegativeMedianMargins,
    all: false,
  };

  gates.all =
    Object.entries(gates)
      .filter(
        ([key]) =>
          key !== "all",
      )
      .every(
        ([, value]) =>
          value === true,
      );

  return gates;
}

function emptySemanticGates() {
  return {
    baselineExact:
      false,
    reportParaphraseBaselinePurpose:
      false,
    baselineReportPurposeParaphrase:
      false,
    crossParaphrase:
      false,
    crossBeatsLexical:
      false,
    positiveMeanMargins:
      false,
    nonnegativeMedianMargins:
      false,
    all:
      false,
  };
}

function emptyMetrics():
R3ZeroShotBridgeMetrics {
  const empty = (
    family:
      R3ZeroShotGroundedSemanticFamilyId,
  ):
  R3ZeroShotFamilyMetrics => ({
    family,
    count: 0,
    correct: 0,
    accuracy: 0,
    meanMargin: 0,
    medianMargin: 0,
    predictions: [],
  });

  return {
    baselineExact:
      empty(
        "baseline-exact",
      ),
    reportParaphraseBaselinePurpose:
      empty(
        "report-paraphrase-baseline-purpose",
      ),
    baselineReportPurposeParaphrase:
      empty(
        "baseline-report-purpose-paraphrase",
      ),
    crossParaphrase:
      empty(
        "cross-paraphrase",
      ),
  };
}

function families(
  metrics:
    R3ZeroShotBridgeMetrics,
) {
  return [
    metrics.baselineExact,
    metrics
      .reportParaphraseBaselinePurpose,
    metrics
      .baselineReportPurposeParaphrase,
    metrics.crossParaphrase,
  ];
}

function requiredVector(
  byText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
  text: string,
):
readonly number[] {
  const value =
    byText.get(text);
  if (!value) {
    throw new Error(
      "missing frozen zero-shot embedding for text: " +
        text,
    );
  }
  return value;
}

function cosine(
  left:
    readonly number[],
  right:
    readonly number[],
): number {
  if (
    left.length !==
      right.length ||
    left.length ===
      0
  ) {
    throw new Error(
      "zero-shot cosine dimension mismatch",
    );
  }

  let dot = 0;
  let leftSq = 0;
  let rightSq = 0;

  for (
    let index = 0;
    index <
    left.length;
    index += 1
  ) {
    const a =
      left[index]!;
    const b =
      right[index]!;

    dot += a * b;
    leftSq += a * a;
    rightSq += b * b;
  }

  const denom =
    Math.sqrt(leftSq) *
    Math.sqrt(rightSq);

  return denom > 0
    ? dot / denom
    : 0;
}

function tokenSet(
  text: string,
):
ReadonlySet<string> {
  return new Set(
    text
      .toLowerCase()
      .match(
        /[a-z]+(?:'[a-z]+)?/g,
      ) ?? [],
  );
}

function lexicalJaccard(
  left:
    ReadonlySet<string>,
  right:
    ReadonlySet<string>,
): number {
  let intersection = 0;

  for (
    const token of
      left
  ) {
    if (
      right.has(token)
    ) {
      intersection += 1;
    }
  }

  const union =
    new Set([
      ...left,
      ...right,
    ]).size;

  return union > 0
    ? intersection /
        union
    : 0;
}

function mean(
  values:
    readonly number[],
): number {
  return values.length > 0
    ? values.reduce(
        (sum, value) =>
          sum + value,
        0,
      ) /
        values.length
    : 0;
}

function median(
  sorted:
    readonly number[],
): number {
  if (
    sorted.length ===
    0
  ) {
    return 0;
  }

  const middle =
    Math.floor(
      sorted.length / 2,
    );

  return sorted.length %
    2 ===
    1
    ? sorted[middle]!
    : (
        sorted[middle - 1]! +
        sorted[middle]!
      ) /
        2;
}

function domains():
readonly R3ZeroShotGroundedSemanticDomain[] {
  return [
    "rack",
    "source",
  ];
}

function textId(
  index: number,
): string {
  return (
    "r3-zero-shot-grounded-semantic:" +
    index
  );
}
