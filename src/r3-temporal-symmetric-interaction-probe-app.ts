import {
  auditR3TemporalConsumerRelationShortcuts,
  buildR3TemporalConsumerRelationCorpus,
  type R3TemporalConsumerRelationExample,
} from "./r3/temporal-consumer-relation-corpus";
import {
  buildR3TemporalHeldoutKnownRelationExamples,
  evaluateR3TemporalKnownRelationExactPairBaseline,
  type R3TemporalKnownRelationExample,
} from "./r3/temporal-representation-relation-falsifier";
import {
  buildR3TemporalSymmetricInteractionFeatures,
} from "./r3/temporal-factor-features";
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

const MIN_BA = 0.875;
const MIN_AUC = 0.875;
const MIN_CLASS_RATE = 0.75;

const statusElement =
  document.querySelector<HTMLElement>("#status");
const resultElement =
  document.querySelector<HTMLElement>("#result");

if (!statusElement || !resultElement) {
  throw new Error(
    "temporal symmetric interaction probe page is missing output elements",
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
      "Building frozen temporal relation corpus and verifying contract…",
    );

    const corpus =
      buildR3TemporalConsumerRelationCorpus();
    const controls =
      auditR3TemporalConsumerRelationShortcuts(
        corpus,
      );

    const train =
      corpus.examples.filter(
        (example) =>
          example.split === "train",
      );
    const unseenCurrent =
      corpus.examples.filter(
        (example) =>
          example.split ===
          "heldout-current-state",
      );
    const unseenHistory =
      corpus.examples.filter(
        (example) =>
          example.split ===
          "heldout-history-state",
      );
    const known =
      buildR3TemporalHeldoutKnownRelationExamples();

    if (
      train.length !== 16 ||
      known.length !== 64 ||
      unseenCurrent.length !== 8 ||
      unseenHistory.length !== 8
    ) {
      throw new Error(
        "symmetric interaction corpus size drifted from frozen contract",
      );
    }

    const knownPositiveCount =
      known.filter(
        (example) =>
          example.shouldRespond,
      ).length;
    if (knownPositiveCount !== 32) {
      throw new Error(
        "known relation balance drifted from frozen contract",
      );
    }

    for (const split of [
      controls.heldOutCurrent,
      controls.heldOutHistory,
    ]) {
      if (
        split.majority.balancedAccuracy !== 0.5 ||
        split.exactTriple.balancedAccuracy !== 0.5 ||
        split.currentOnly.balancedAccuracy !== 0.5 ||
        split.historyOnly.balancedAccuracy !== 0.5 ||
        split.unigram.balancedAccuracy > 0.6 ||
        split.crossTokenPair.balancedAccuracy > 0.6
      ) {
        throw new Error(
          "unseen-state negative-control contract drifted",
        );
      }
    }

    const exactKnown =
      booleanMetrics(
        known.map(
          (example) =>
            example.shouldRespond,
        ),
        evaluateR3TemporalKnownRelationExactPairBaseline(
          train.map(
            (example) => ({
              historyText:
                example.priorAcknowledgedText,
              currentText:
                example.currentMessageText,
              shouldRespond:
                example.shouldRespond,
            }),
          ),
          known,
        ),
      );

    if (
      exactKnown.balancedAccuracy !== 0.5
    ) {
      throw new Error(
        "known exact-pair baseline drifted from frozen contract",
      );
    }

    const allPairs = [
      ...train.map(toPairShape),
      ...known.map(toKnownPairShape),
      ...unseenCurrent.map(toPairShape),
      ...unseenHistory.map(toPairShape),
    ];

    const texts = [
      ...new Set(
        allPairs.flatMap(
          (example) => [
            example.historyText,
            example.currentText,
          ],
        ),
      ),
    ].sort();

    const items =
      texts.map(
        (text, index) => ({
          id:
            "temporal-symmetric-interaction-text:" +
            index,
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
        " frozen sentence texts one-by-one…",
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

    if (
      embedded.dimensions !== 384 ||
      embedded.batchSize !== 1
    ) {
      throw new Error(
        "frozen encoder runtime drifted from contract",
      );
    }

    const embeddingByText =
      new Map<
        string,
        readonly number[]
      >();

    for (
      const item of
        embedded.embeddings
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

    setStatus(
      "Training the single frozen symmetric interaction linear head on TRAIN only…",
    );

    const trainFeatures =
      train.map((example) =>
        temporalFeature(
          example,
          embeddingByText,
        ),
      );
    const knownFeatures =
      known.map((example) =>
        knownFeature(
          example,
          embeddingByText,
        ),
      );
    const currentFeatures =
      unseenCurrent.map((example) =>
        temporalFeature(
          example,
          embeddingByText,
        ),
      );
    const historyFeatures =
      unseenHistory.map((example) =>
        temporalFeature(
          example,
          embeddingByText,
        ),
      );

    for (const feature of [
      ...trainFeatures,
      ...knownFeatures,
      ...currentFeatures,
      ...historyFeatures,
    ]) {
      if (feature.features.length !== 768) {
        throw new Error(
          "symmetric interaction feature dimensions drifted from frozen contract",
        );
      }
    }

    const head =
      trainR3JointLinearHead(
        trainFeatures,
      );

    const trainReport =
      reportPredictions(
        trainFeatures.map(
          (example) =>
            predictR3JointLinearHead(
              head,
              example,
            ),
        ),
      );
    const knownReport =
      reportPredictions(
        knownFeatures.map(
          (example) =>
            predictR3JointLinearHead(
              head,
              example,
            ),
        ),
      );
    const currentReport =
      reportPredictions(
        currentFeatures.map(
          (example) =>
            predictR3JointLinearHead(
              head,
              example,
            ),
        ),
      );
    const historyReport =
      reportPredictions(
        historyFeatures.map(
          (example) =>
            predictR3JointLinearHead(
              head,
              example,
            ),
        ),
      );

    const gates = {
      known:
        passesGate(knownReport),
      unseenCurrent:
        passesGate(currentReport),
      unseenHistory:
        passesGate(historyReport),
    };

    let classification:
      | "SYMMETRIC_INTERACTION_FAIL_KNOWN"
      | "KNOWN_INTERACTION_SUPPORT_UNSEEN_FAIL"
      | "SYMMETRIC_INTERACTION_TEMPORAL_SUPPORT";

    if (!gates.known) {
      classification =
        "SYMMETRIC_INTERACTION_FAIL_KNOWN";
    } else if (
      !gates.unseenCurrent ||
      !gates.unseenHistory
    ) {
      classification =
        "KNOWN_INTERACTION_SUPPORT_UNSEEN_FAIL";
    } else {
      classification =
        "SYMMETRIC_INTERACTION_TEMPORAL_SUPPORT";
    }

    const result = {
      status:
        "PASS_EXECUTION",
      classification,
      interpretationBoundary:
        "Isolated temporal relation only. No full three-way ReflexBrain or Owner/product claim.",
      supervision: {
        relationProbe:
          "authored-temporal-state-relation",
        semanticStateLabelsModelVisible:
          false,
        suspendedInTrain:
          false,
        heldOutUsedForTraining:
          false,
        thresholdTuned:
          false,
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
      feature: {
        family:
          "[abs(H-C), H⊙C]",
        dimensions: 768,
        symmetric: true,
        cosineScalar: false,
        dotProductScalar: false,
      },
      optimizer: {
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
      },
      controls: {
        knownMajority: {
          balancedAccuracy:
            0.5,
        },
        knownExactPair:
          exactKnown,
        unseen:
          controls,
      },
      frozenReferences: {
        legARepresentation: {
          balancedAccuracy:
            0.875,
          truePositiveRate:
            1,
          trueNegativeRate:
            0.75,
          auc:
            0.9375,
          gate: true,
        },
        absKnownRelation: {
          balancedAccuracy:
            0.59375,
          truePositiveRate:
            0.9375,
          trueNegativeRate:
            0.25,
          auc:
            0.66015625,
          gate: false,
        },
        jointKnownRelation: {
          balancedAccuracy:
            0.515625,
          truePositiveRate:
            0.25,
          trueNegativeRate:
            0.78125,
          auc:
            0.5771484375,
          gate: false,
        },
        jointUnseenCurrent: {
          balancedAccuracy:
            0.5,
          truePositiveRate:
            0,
          trueNegativeRate:
            1,
          auc:
            0.8125,
          gate: false,
        },
        jointUnseenHistory: {
          balancedAccuracy:
            0.625,
          truePositiveRate:
            0.25,
          trueNegativeRate:
            1,
          auc:
            0.8125,
          gate: false,
        },
      },
      train: {
        count:
          trainFeatures.length,
        report:
          trainReport,
      },
      heldOutKnown: {
        count:
          knownFeatures.length,
        report:
          knownReport,
        gate:
          gates.known,
      },
      heldOutCurrent: {
        count:
          currentFeatures.length,
        report:
          currentReport,
        gate:
          gates.unseenCurrent,
      },
      heldOutHistory: {
        count:
          historyFeatures.length,
        report:
          historyReport,
        gate:
          gates.unseenHistory,
      },
      gates,
    };

    resultOutput.textContent =
      JSON.stringify(
        result,
        null,
        2,
      );

    document.documentElement.dataset
      .r3TemporalSymmetricInteractionProbe =
      "complete";

    setStatus(
      "R3 temporal symmetric interaction probe complete: " +
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
          status:
            "FAIL_EXECUTION",
          error:
            message,
        },
        null,
        2,
      );

    document.documentElement.dataset
      .r3TemporalSymmetricInteractionProbe =
      "failed";

    setStatus(
      "R3 temporal symmetric interaction probe failed: " +
        message,
    );
  }
}

function temporalFeature(
  example:
    R3TemporalConsumerRelationExample,
  embeddingByText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
): R3JointHeadTrainingExample {
  return {
    id:
      example.id,
    features:
      buildR3TemporalSymmetricInteractionFeatures(
        requiredEmbedding(
          embeddingByText,
          example.priorAcknowledgedText,
        ),
        requiredEmbedding(
          embeddingByText,
          example.currentMessageText,
        ),
      ),
    label:
      example.shouldRespond,
  };
}

function knownFeature(
  example:
    R3TemporalKnownRelationExample,
  embeddingByText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
): R3JointHeadTrainingExample {
  return {
    id:
      example.id,
    features:
      buildR3TemporalSymmetricInteractionFeatures(
        requiredEmbedding(
          embeddingByText,
          example.historyText,
        ),
        requiredEmbedding(
          embeddingByText,
          example.currentText,
        ),
      ),
    label:
      example.shouldRespond,
  };
}

function toPairShape(
  example:
    R3TemporalConsumerRelationExample,
) {
  return {
    historyText:
      example.priorAcknowledgedText,
    currentText:
      example.currentMessageText,
  };
}

function toKnownPairShape(
  example:
    R3TemporalKnownRelationExample,
) {
  return {
    historyText:
      example.historyText,
    currentText:
      example.currentText,
  };
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

function passesGate(
  report: ReturnType<
    typeof reportPredictions
  >,
): boolean {
  return (
    report.metrics
      .balancedAccuracy >=
      MIN_BA &&
    report.auc !== null &&
    report.auc >=
      MIN_AUC &&
    report.metrics
      .truePositiveRate >=
      MIN_CLASS_RATE &&
    report.metrics
      .trueNegativeRate >=
      MIN_CLASS_RATE
  );
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

function booleanMetrics(
  labels:
    readonly boolean[],
  predictions:
    readonly boolean[],
) {
  if (
    labels.length === 0 ||
    labels.length !==
      predictions.length
  ) {
    throw new Error(
      "baseline metric length mismatch",
    );
  }

  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;

  for (
    let index = 0;
    index <
    labels.length;
    index += 1
  ) {
    const label =
      labels[index]!;
    const prediction =
      predictions[index]!;

    if (
      label &&
      prediction
    ) {
      tp += 1;
    } else if (
      !label &&
      !prediction
    ) {
      tn += 1;
    } else if (
      !label &&
      prediction
    ) {
      fp += 1;
    } else {
      fn += 1;
    }
  }

  const tpr =
    tp /
    (tp + fn);
  const tnr =
    tn /
    (tn + fp);

  return {
    count:
      labels.length,
    truePositive:
      tp,
    trueNegative:
      tn,
    falsePositive:
      fp,
    falseNegative:
      fn,
    balancedAccuracy:
      (tpr + tnr) /
      2,
    truePositiveRate:
      tpr,
    trueNegativeRate:
      tnr,
  };
}

function setStatus(
  value: string,
): void {
  statusOutput.textContent =
    value;
}
