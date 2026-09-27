import {
  describe,
  expect,
  it,
} from "vitest";
import {
  R3_ZERO_SHOT_BASELINE_PURPOSES,
  R3_ZERO_SHOT_BASELINE_REPORTS,
  R3_ZERO_SHOT_PURPOSE_PARAPHRASE_PAIRS,
  R3_ZERO_SHOT_REPORT_PARAPHRASES,
  buildR3ZeroShotGroundedSemanticCases,
  collectR3ZeroShotGroundedSemanticTexts,
  evaluateR3ZeroShotGroundedSemanticEmbeddings,
  evaluateR3ZeroShotGroundedSemanticLexical,
  r3ZeroShotTextItems,
} from "../src/r3/zero-shot-grounded-semantic-bridge";
import {
  R3_SEMANTIC_ENCODER_BATCH_SIZE,
  R3_SEMANTIC_ENCODER_DTYPE,
  R3_SEMANTIC_ENCODER_MODEL_ID,
  R3_SEMANTIC_ENCODER_MODEL_REVISION,
  type R3SemanticEmbeddingResult,
} from "../src/r3/semantic-encoder-contract";

describe(
  "R3 frozen zero-shot grounded semantic bridge contract",
  () => {
    it(
      "freezes the exact 24 ranking cases and 14 unique texts",
      () => {
        const cases =
          buildR3ZeroShotGroundedSemanticCases();
        const texts =
          collectR3ZeroShotGroundedSemanticTexts();

        expect(
          cases.filter(
            (item) =>
              item.family ===
              "baseline-exact",
          ).length,
        ).toBe(2);
        expect(
          cases.filter(
            (item) =>
              item.family ===
              "report-paraphrase-baseline-purpose",
          ).length,
        ).toBe(6);
        expect(
          cases.filter(
            (item) =>
              item.family ===
              "baseline-report-purpose-paraphrase",
          ).length,
        ).toBe(4);
        expect(
          cases.filter(
            (item) =>
              item.family ===
              "cross-paraphrase",
          ).length,
        ).toBe(12);
        expect(
          texts.length,
        ).toBe(14);
        expect(
          r3ZeroShotTextItems().length,
        ).toBe(14);
      },
    );

    it(
      "reproduces the frozen lexical warning",
      () => {
        const lexical =
          evaluateR3ZeroShotGroundedSemanticLexical();

        expect(
          lexical
            .baselineExact
            .accuracy,
        ).toBe(1);
        expect(
          lexical
            .crossParaphrase
            .count,
        ).toBe(12);
        expect(
          lexical
            .crossParaphrase
            .correct,
        ).toBe(8);
        expect(
          lexical
            .crossParaphrase
            .accuracy,
        ).toBeCloseTo(
          2 / 3,
          12,
        );
      },
    );

    it(
      "qualifies only a zero-shot embedding geometry that clears all frozen wording gates",
      () => {
        const result =
          evaluateR3ZeroShotGroundedSemanticEmbeddings(
            mockResult(
              perfectSemanticVector,
            ),
          );

        expect(
          result.executionGates.all,
        ).toBe(true);
        expect(
          result.semanticGates.all,
        ).toBe(true);
        expect(
          result.classification,
        ).toBe(
          "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_QUALIFIED",
        );
      },
    );

    it(
      "separates encoder execution drift from semantic failure",
      () => {
        const wrong =
          mockResult(
            perfectSemanticVector,
          );

        const result =
          evaluateR3ZeroShotGroundedSemanticEmbeddings({
            ...wrong,
            modelRevision:
              "wrong-revision",
          });

        expect(
          result.executionGates.all,
        ).toBe(false);
        expect(
          result.classification,
        ).toBe(
          "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_EXECUTION_FAIL",
        );
      },
    );
  },
);

function mockResult(
  vectorFor:
    (text: string) =>
      readonly number[],
):
R3SemanticEmbeddingResult {
  const items =
    r3ZeroShotTextItems();

  return {
    modelId:
      R3_SEMANTIC_ENCODER_MODEL_ID,
    modelRevision:
      R3_SEMANTIC_ENCODER_MODEL_REVISION,
    dtype:
      R3_SEMANTIC_ENCODER_DTYPE,
    device:
      "webgpu",
    batchSize:
      R3_SEMANTIC_ENCODER_BATCH_SIZE,
    loadMs: 1,
    embeddingMs: 1,
    dimensions: 384,
    itemCount:
      items.length,
    embeddings:
      items.map(
        (item) => ({
          id:
            item.id,
          vector:
            vectorFor(
              item.text,
            ),
        }),
      ),
  };
}

function perfectSemanticVector(
  text: string,
): readonly number[] {
  const rack =
    isRackText(text);

  const vector =
    Array.from(
      {
        length: 384,
      },
      () => 0,
    );

  vector[
    rack ? 0 : 1
  ] = 1;

  return vector;
}

function isRackText(
  text: string,
): boolean {
  if (
    text ===
      R3_ZERO_SHOT_BASELINE_REPORTS
        .rack ||
    text ===
      R3_ZERO_SHOT_BASELINE_PURPOSES
        .rack ||
    R3_ZERO_SHOT_REPORT_PARAPHRASES
      .rack.includes(text)
  ) {
    return true;
  }

  if (
    R3_ZERO_SHOT_PURPOSE_PARAPHRASE_PAIRS
      .some(
        (pair) =>
          pair.rack ===
          text,
      )
  ) {
    return true;
  }

  if (
    text ===
      R3_ZERO_SHOT_BASELINE_REPORTS
        .source ||
    text ===
      R3_ZERO_SHOT_BASELINE_PURPOSES
        .source ||
    R3_ZERO_SHOT_REPORT_PARAPHRASES
      .source.includes(text) ||
    R3_ZERO_SHOT_PURPOSE_PARAPHRASE_PAIRS
      .some(
        (pair) =>
          pair.source ===
          text,
      )
  ) {
    return false;
  }

  throw new Error(
    "unknown frozen zero-shot text",
  );
}
