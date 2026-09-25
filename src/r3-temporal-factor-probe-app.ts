import {
  auditR3TemporalConsumerRelationShortcuts,
  buildR3TemporalConsumerRelationCorpus,
  type R3TemporalConsumerRelationExample,
} from "./r3/temporal-consumer-relation-corpus";
import {
  evaluateR3JointPredictions,
  predictR3JointLinearHead,
  trainR3JointLinearHead,
  R3_JOINT_HEAD_BASE_LEARNING_RATE,
  R3_JOINT_HEAD_ITERATIONS,
  R3_JOINT_HEAD_L2,
  R3_JOINT_HEAD_THRESHOLD,
  type R3JointHeadPrediction,
  type R3JointHeadTrainingExample,
} from "./r3/joint-relation-linear-head";
import {
  R3SemanticEncoderClient,
} from "./r3/semantic-encoder-client";
import {
  buildR3TemporalFactorFeatures,
} from "./r3/temporal-factor-features";

const MIN_BA = 0.875;
const MIN_AUC = 0.875;
const MIN_CLASS_RATE = 0.75;

const statusElement =
  document.querySelector<HTMLElement>("#status");
const resultElement =
  document.querySelector<HTMLElement>("#result");

if (!statusElement || !resultElement) {
  throw new Error(
    "temporal factor probe page is missing output elements",
  );
}

const statusOutput = statusElement;
const resultOutput = resultElement;

void run();

async function run(): Promise<void> {
  try {
    if (!("gpu" in navigator)) {
      throw new Error("WebGPU is unavailable");
    }

    setStatus(
      "Building frozen temporal-factor corpus and verifying contract…",
    );

    const corpus =
      buildR3TemporalConsumerRelationCorpus();
    const audit =
      auditR3TemporalConsumerRelationShortcuts(
        corpus,
      );

    const train =
      corpus.examples.filter(
        (example) =>
          example.split === "train",
      );
    const heldOutCurrent =
      corpus.examples.filter(
        (example) =>
          example.split ===
          "heldout-current-state",
      );
    const heldOutHistory =
      corpus.examples.filter(
        (example) =>
          example.split ===
          "heldout-history-state",
      );

    if (
      train.length !== 16 ||
      heldOutCurrent.length !== 8 ||
      heldOutHistory.length !== 8
    ) {
      throw new Error(
        "temporal factor corpus size drifted from frozen contract",
      );
    }

    for (const controls of [
      audit.heldOutCurrent,
      audit.heldOutHistory,
    ]) {
      if (
        controls.majority.balancedAccuracy !== 0.5 ||
        controls.exactTriple.balancedAccuracy !== 0.5 ||
        controls.currentOnly.balancedAccuracy !== 0.5 ||
        controls.historyOnly.balancedAccuracy !== 0.5 ||
        controls.unigram.balancedAccuracy > 0.6 ||
        controls.crossTokenPair.balancedAccuracy > 0.6
      ) {
        throw new Error(
          "temporal factor negative-control contract drifted",
        );
      }
    }

    const texts = uniqueTexts(corpus.examples);
    const items = texts.map(
      (text, index) => ({
        id: "temporal-factor-text:" + index,
        text,
      }),
    );
    const textById =
      new Map(
        items.map((item) => [
          item.id,
          item.text,
        ]),
      );

    setStatus(
      "Loading pinned frozen MiniLM-L3 q8 and embedding " +
        items.length +
        " history/current texts one-by-one…",
    );

    const client =
      new R3SemanticEncoderClient();
    const embedded =
      await client.embed(
        items,
        (progress) => {
          const percent =
            progress.progress === null
              ? ""
              : " · " +
                progress.progress.toFixed(1) +
                "%";
          const file =
            progress.file
              ? " · " + progress.file
              : "";
          setStatus(
            progress.status +
              percent +
              file,
          );
        },
      );

    if (embedded.dimensions !== 384) {
      throw new Error(
        "frozen encoder dimension drifted from contract: " +
          embedded.dimensions,
      );
    }
    if (embedded.batchSize !== 1) {
      throw new Error(
        "frozen encoder batch size drifted from contract: " +
          embedded.batchSize,
      );
    }

    const embeddingByText =
      new Map<
        string,
        readonly number[]
      >();

    for (
      const item of embedded.embeddings
    ) {
      const text =
        textById.get(item.id);
      if (!text) {
        throw new Error(
          "encoder returned unknown text id " +
            item.id,
        );
      }
      embeddingByText.set(
        text,
        item.vector,
      );
    }

    const trainFeatures =
      train.map((example) =>
        featureExample(
          example,
          embeddingByText,
        ),
      );
    const currentFeatures =
      heldOutCurrent.map(
        (example) =>
          featureExample(
            example,
            embeddingByText,
          ),
      );
    const historyFeatures =
      heldOutHistory.map(
        (example) =>
          featureExample(
            example,
            embeddingByText,
          ),
      );

    setStatus(
      "Training one frozen deterministic H↔C linear factor head on TRAIN only…",
    );

    const head =
      trainR3JointLinearHead(
        trainFeatures,
      );

    const trainPredictions =
      trainFeatures.map((example) =>
        predictR3JointLinearHead(
          head,
          example,
        ),
      );
    const currentPredictions =
      currentFeatures.map((example) =>
        predictR3JointLinearHead(
          head,
          example,
        ),
      );
    const historyPredictions =
      historyFeatures.map((example) =>
        predictR3JointLinearHead(
          head,
          example,
        ),
      );
    const combinedHeldOut = [
      ...currentPredictions,
      ...historyPredictions,
    ];

    const trainReport =
      reportPredictions(
        trainPredictions,
      );
    const currentReport =
      reportPredictions(
        currentPredictions,
      );
    const historyReport =
      reportPredictions(
        historyPredictions,
      );
    const combinedReport =
      reportPredictions(
        combinedHeldOut,
      );

    const gates = {
      heldOutCurrentBalancedAccuracy:
        currentReport.metrics
          .balancedAccuracy >=
        MIN_BA,
      heldOutHistoryBalancedAccuracy:
        historyReport.metrics
          .balancedAccuracy >=
        MIN_BA,
      heldOutCurrentAuc:
        currentReport.auc !== null &&
        currentReport.auc >=
          MIN_AUC,
      heldOutHistoryAuc:
        historyReport.auc !== null &&
        historyReport.auc >=
          MIN_AUC,
      heldOutCurrentTpr:
        currentReport.metrics
          .truePositiveRate >=
        MIN_CLASS_RATE,
      heldOutCurrentTnr:
        currentReport.metrics
          .trueNegativeRate >=
        MIN_CLASS_RATE,
      heldOutHistoryTpr:
        historyReport.metrics
          .truePositiveRate >=
        MIN_CLASS_RATE,
      heldOutHistoryTnr:
        historyReport.metrics
          .trueNegativeRate >=
        MIN_CLASS_RATE,
    };

    const qualified =
      Object.values(gates).every(
        Boolean,
      );

    const partial =
      currentReport.metrics
        .balancedAccuracy > 0.6 ||
      historyReport.metrics
        .balancedAccuracy > 0.6 ||
      (
        currentReport.auc !== null &&
        currentReport.auc > 0.65
      ) ||
      (
        historyReport.auc !== null &&
        historyReport.auc > 0.65
      );

    const classification =
      qualified
        ? "QUALIFIED_TEMPORAL_FACTOR_SUPPORT"
        : partial
          ? "PARTIAL_TEMPORAL_FACTOR_SIGNAL"
          : "FAIL_TEMPORAL_FACTOR_HYPOTHESIS";

    const result = {
      status: "PASS_EXECUTION",
      classification,
      interpretationBoundary:
        "Diagnostic support test for same-domain settled-history × current semantic novelty only. Not a full actor-relative ReflexBrain target.",
      supervision: {
        source:
          "authored-temporal-state-relation",
        trainCount: train.length,
        heldOutCurrentCount:
          heldOutCurrent.length,
        heldOutHistoryCount:
          heldOutHistory.length,
        heldOutUsedForTraining:
          false,
        thresholdTuned: false,
        purposeUsedAsFeature: false,
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
      learnedFactor: {
        featureFamily:
          "abs(H-C)",
        featureDimensions:
          head.featureDimensions,
        iterations:
          R3_JOINT_HEAD_ITERATIONS,
        baseLearningRate:
          R3_JOINT_HEAD_BASE_LEARNING_RATE,
        l2:
          R3_JOINT_HEAD_L2,
        threshold:
          R3_JOINT_HEAD_THRESHOLD,
        hiddenLayers: 0,
        sweepCount: 1,
        weightNorm:
          vectorNorm(
            head.weights,
          ),
        bias:
          head.bias,
      },
      negativeControls: audit,
      train: trainReport,
      heldOutCurrent:
        currentReport,
      heldOutHistory:
        historyReport,
      heldOutCombined:
        combinedReport,
      gates,
    };

    resultOutput.textContent =
      JSON.stringify(
        result,
        null,
        2,
      );

    document.documentElement.dataset
      .r3TemporalFactorProbe =
      "complete";

    setStatus(
      "R3 temporal semantic factor probe complete: " +
        classification,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    resultOutput.textContent =
      JSON.stringify(
        {
          status: "FAIL_EXECUTION",
          error: message,
        },
        null,
        2,
      );

    document.documentElement.dataset
      .r3TemporalFactorProbe =
      "failed";

    setStatus(
      "R3 temporal semantic factor probe failed: " +
        message,
    );
  }
}

function featureExample(
  example:
    R3TemporalConsumerRelationExample,
  embeddingByText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
): R3JointHeadTrainingExample {
  const history =
    requiredEmbedding(
      embeddingByText,
      example.priorAcknowledgedText,
    );
  const current =
    requiredEmbedding(
      embeddingByText,
      example.currentMessageText,
    );

  return {
    id: example.id,
    features:
      buildR3TemporalFactorFeatures(
        history,
        current,
      ),
    label:
      example.shouldRespond,
  };
}

function uniqueTexts(
  examples:
    readonly R3TemporalConsumerRelationExample[],
): readonly string[] {
  return [
    ...new Set(
      examples.flatMap(
        (example) => [
          example.priorAcknowledgedText,
          example.currentMessageText,
        ],
      ),
    ),
  ].sort();
}

function requiredEmbedding(
  embeddingByText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
  text: string,
): readonly number[] {
  const embedding =
    embeddingByText.get(text);
  if (!embedding) {
    throw new Error(
      "missing frozen embedding for text: " +
        text,
    );
  }
  return embedding;
}

function reportPredictions(
  predictions:
    readonly R3JointHeadPrediction[],
) {
  const metrics =
    evaluateR3JointPredictions(
      predictions,
    );
  const positives =
    predictions.filter(
      (prediction) =>
        prediction.label,
    );
  const negatives =
    predictions.filter(
      (prediction) =>
        !prediction.label,
    );

  return {
    metrics,
    auc:
      pairwiseAuc(
        positives,
        negatives,
      ),
    meanPositiveProbability:
      meanProbability(positives),
    meanNegativeProbability:
      meanProbability(negatives),
  };
}

function pairwiseAuc(
  positives:
    readonly R3JointHeadPrediction[],
  negatives:
    readonly R3JointHeadPrediction[],
): number | null {
  if (
    positives.length === 0 ||
    negatives.length === 0
  ) {
    return null;
  }

  let wins = 0;
  let ties = 0;

  for (const positive of positives) {
    for (const negative of negatives) {
      if (
        positive.probability >
        negative.probability
      ) {
        wins += 1;
      } else if (
        positive.probability ===
        negative.probability
      ) {
        ties += 1;
      }
    }
  }

  return (
    wins +
    ties * 0.5
  ) /
  (
    positives.length *
    negatives.length
  );
}

function meanProbability(
  predictions:
    readonly R3JointHeadPrediction[],
): number | null {
  if (predictions.length === 0) {
    return null;
  }

  return (
    predictions.reduce(
      (sum, prediction) =>
        sum +
        prediction.probability,
      0,
    ) /
    predictions.length
  );
}

function vectorNorm(
  vector: readonly number[],
): number {
  return Math.sqrt(
    vector.reduce(
      (sum, value) =>
        sum +
        value * value,
      0,
    ),
  );
}

function setStatus(
  value: string,
): void {
  statusOutput.textContent =
    value;
}
