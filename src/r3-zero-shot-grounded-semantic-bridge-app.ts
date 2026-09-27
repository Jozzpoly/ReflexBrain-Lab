import {
  R3SemanticEncoderClient,
} from "./r3/semantic-encoder-client";
import {
  evaluateR3ZeroShotGroundedSemanticEmbeddings,
  r3ZeroShotTextItems,
} from "./r3/zero-shot-grounded-semantic-bridge";

const statusElement =
  document.querySelector<HTMLElement>(
    "#status",
  );
const resultElement =
  document.querySelector<HTMLElement>(
    "#result",
  );

if (
  !statusElement ||
  !resultElement
) {
  throw new Error(
    "zero-shot grounded semantic bridge page is missing output elements",
  );
}

const statusOutput =
  statusElement;
const resultOutput =
  resultElement;

void run();

async function run():
Promise<void> {
  try {
    if (
      !("gpu" in navigator)
    ) {
      throw new Error(
        "WebGPU is unavailable",
      );
    }

    const items =
      r3ZeroShotTextItems();

    if (
      items.length !== 14
    ) {
      throw new Error(
        "frozen zero-shot text set drifted from contract",
      );
    }

    setStatus(
      "Loading pinned frozen MiniLM-L3 q8 and embedding 14 zero-shot report/purpose texts…",
    );

    const client =
      new R3SemanticEncoderClient();

    const embedded =
      await client.embed(
        items,
        (progress) => {
          const percent =
            progress.progress ===
              null
              ? ""
              : " · " +
                progress.progress.toFixed(
                  1,
                ) +
                "%";
          const file =
            progress.file
              ? " · " +
                progress.file
              : "";

          setStatus(
            progress.status +
              percent +
              file,
          );
        },
      );

    const evaluation =
      evaluateR3ZeroShotGroundedSemanticEmbeddings(
        embedded,
      );

    const result = {
      status:
        evaluation
          .classification ===
        "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_EXECUTION_FAIL"
          ? "FAIL_EXECUTION"
          : "PASS_EXECUTION",
      classification:
        evaluation
          .classification,
      interpretationBoundary:
        "Frozen externally pretrained semantic geometry evaluated zero-shot. No local oracle fitting, no threshold tuning, no actor authority, no Owner/product claim.",
      training: {
        localRelationTraining:
          false,
        oracleLabelsUsedForFit:
          false,
        thresholdTuned:
          false,
        projectionTrained:
          false,
        modelSweepCount:
          1,
      },
      encoder: {
        modelId:
          embedded.modelId,
        modelRevision:
          embedded.modelRevision,
        dtype:
          embedded.dtype,
        device:
          embedded.device,
        batchSize:
          embedded.batchSize,
        dimensions:
          embedded.dimensions,
        uniqueTextCount:
          embedded.itemCount,
        loadMs:
          embedded.loadMs,
        embeddingMs:
          embedded.embeddingMs,
      },
      ...evaluation,
    };

    resultOutput.textContent =
      JSON.stringify(
        result,
        null,
        2,
      );

    document.documentElement
      .dataset
      .r3ZeroShotGroundedSemanticBridge =
      "complete";

    setStatus(
      "R3 frozen zero-shot grounded semantic bridge complete: " +
        evaluation
          .classification,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    resultOutput.textContent =
      JSON.stringify(
        {
          status:
            "FAIL_EXECUTION",
          classification:
            "ZERO_SHOT_GROUNDED_SEMANTIC_BRIDGE_EXECUTION_FAIL",
          error:
            message,
        },
        null,
        2,
      );

    document.documentElement
      .dataset
      .r3ZeroShotGroundedSemanticBridge =
      "failed";

    setStatus(
      "R3 zero-shot grounded semantic bridge execution failed: " +
        message,
    );
  }
}

function setStatus(
  value: string,
): void {
  statusOutput.textContent =
    value;
}
