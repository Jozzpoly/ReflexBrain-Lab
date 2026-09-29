import {
  auditR3TemporalConsumerRelationShortcuts,
  buildR3TemporalConsumerRelationCorpus,
  type R3TemporalConsumerRelationExample,
} from "./r3/temporal-consumer-relation-corpus";
import {
  buildR3TemporalFactorFeatures,
} from "./r3/temporal-factor-features";
import {
  buildR3TemporalHeldoutKnownRelationExamples,
  buildR3TemporalHeldoutKnownStateProbeExamples,
  buildR3TemporalJointPairText,
  buildR3TemporalTrainStateProbeExamples,
  evaluateR3TemporalKnownRelationExactPairBaseline,
  evaluateR3TemporalStateExactTextBaseline,
  evaluateR3TemporalStateUnigramBaseline,
  type R3TemporalKnownRelationExample,
  type R3TemporalStateProbeExample,
} from "./r3/temporal-representation-relation-falsifier";
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
    "temporal representation-relation falsifier page is missing output elements",
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
      "Building frozen representation-vs-relation corpus and verifying contract…",
    );

    const temporalCorpus =
      buildR3TemporalConsumerRelationCorpus();
    const unseenAudit =
      auditR3TemporalConsumerRelationShortcuts(
        temporalCorpus,
      );

    const trainPairs =
      temporalCorpus.examples.filter(
        (example) =>
          example.split === "train",
      );
    const unseenCurrent =
      temporalCorpus.examples.filter(
        (example) =>
          example.split ===
          "heldout-current-state",
      );
    const unseenHistory =
      temporalCorpus.examples.filter(
        (example) =>
          example.split ===
          "heldout-history-state",
      );
    const stateTrain =
      buildR3TemporalTrainStateProbeExamples();
    const stateHeldOut =
      buildR3TemporalHeldoutKnownStateProbeExamples();
    const knownRelations =
      buildR3TemporalHeldoutKnownRelationExamples();

    if (
      trainPairs.length !== 16 ||
      unseenCurrent.length !== 8 ||
      unseenHistory.length !== 8 ||
      stateTrain.length !== 4 ||
      stateHeldOut.length !== 8 ||
      knownRelations.length !== 64
    ) {
      throw new Error(
        "representation-vs-relation corpus size drifted from frozen contract",
      );
    }

    const knownPositiveCount =
      knownRelations.filter(
        (example) =>
          example.shouldRespond,
      ).length;
    if (knownPositiveCount !== 32) {
      throw new Error(
        "held-out known relation balance drifted from frozen contract",
      );
    }

    for (const controls of [
      unseenAudit.heldOutCurrent,
      unseenAudit.heldOutHistory,
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
          "unseen-state negative-control contract drifted",
        );
      }
    }

    const exactStateBaseline =
      baselineStateReport(
        stateHeldOut,
        evaluateR3TemporalStateExactTextBaseline(
          stateTrain,
          stateHeldOut,
        ),
      );
    const unigramStateBaseline =
      baselineStateReport(
        stateHeldOut,
        evaluateR3TemporalStateUnigramBaseline(
          stateTrain,
          stateHeldOut,
        ),
      );

    const exactKnownRelationBaseline =
      baselineKnownRelationReport(
        knownRelations,
        evaluateR3TemporalKnownRelationExactPairBaseline(
          trainPairs.map(
            (example) => ({
              historyText:
                example.priorAcknowledgedText,
              currentText:
                example.currentMessageText,
              shouldRespond:
                example.shouldRespond,
            }),
          ),
          knownRelations,
        ),
      );

    if (
      exactStateBaseline.balancedAccuracy !== 0.5 ||
      unigramStateBaseline.balancedAccuracy > 0.75 ||
      exactKnownRelationBaseline.balancedAccuracy !== 0.5
    ) {
      throw new Error(
        "known-state diagnostic baseline contract drifted",
      );
    }

    const allPairExamples = [
      ...trainPairs.map(toPairShape),
      ...knownRelations.map(
        (example) => ({
          id: example.id,
          historyText:
            example.historyText,
          currentText:
            example.currentText,
          label:
            example.shouldRespond,
        }),
      ),
      ...unseenCurrent.map(toPairShape),
      ...unseenHistory.map(toPairShape),
    ];

    const texts = [
      ...stateTrain.map(
        (example) => example.text,
      ),
      ...stateHeldOut.map(
        (example) => example.text,
      ),
      ...allPairExamples.flatMap(
        (example) => [
          example.historyText,
          example.currentText,
          buildR3TemporalJointPairText(
            example.historyText,
            example.currentText,
          ),
        ],
      ),
    ];

    const unique = [
      ...new Set(texts),
    ].sort();

    const items = unique.map(
      (text, index) => ({
        id:
          "temporal-rep-rel-text:" +
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
        " frozen single/joint texts one-by-one…",
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

    setStatus(
      "Training frozen Leg A/B/C linear diagnostics on TRAIN only…",
    );

    const stateTrainFeatures =
      stateTrain.map((example) =>
        rawStateFeature(
          example,
          embeddingByText,
        ),
      );
    const stateHeldOutFeatures =
      stateHeldOut.map((example) =>
        rawStateFeature(
          example,
          embeddingByText,
        ),
      );

    const stateHead =
      trainR3JointLinearHead(
        stateTrainFeatures,
      );
    const stateReport =
      reportPredictions(
        stateHeldOutFeatures.map(
          (example) =>
            predictR3JointLinearHead(
              stateHead,
              example,
            ),
        ),
      );

    const absTrainFeatures =
      trainPairs.map((example) =>
        absPairFeature(
          example,
          embeddingByText,
        ),
      );
    const absKnownFeatures =
      knownRelations.map((example) =>
        absKnownPairFeature(
          example,
          embeddingByText,
        ),
      );
    const absHead =
      trainR3JointLinearHead(
        absTrainFeatures,
      );
    const absKnownReport =
      reportPredictions(
        absKnownFeatures.map(
          (example) =>
            predictR3JointLinearHead(
              absHead,
              example,
            ),
        ),
      );

    const jointTrainFeatures =
      trainPairs.map((example) =>
        jointTemporalFeature(
          example,
          embeddingByText,
        ),
      );
    const jointKnownFeatures =
      knownRelations.map(
        (example) =>
          jointKnownFeature(
            example,
            embeddingByText,
          ),
      );
    const jointCurrentFeatures =
      unseenCurrent.map((example) =>
        jointTemporalFeature(
          example,
          embeddingByText,
        ),
      );
    const jointHistoryFeatures =
      unseenHistory.map((example) =>
        jointTemporalFeature(
          example,
          embeddingByText,
        ),
      );

    const jointHead =
      trainR3JointLinearHead(
        jointTrainFeatures,
      );
    const jointKnownReport =
      reportPredictions(
        jointKnownFeatures.map(
          (example) =>
            predictR3JointLinearHead(
              jointHead,
              example,
            ),
        ),
      );
    const jointCurrentReport =
      reportPredictions(
        jointCurrentFeatures.map(
          (example) =>
            predictR3JointLinearHead(
              jointHead,
              example,
            ),
        ),
      );
    const jointHistoryReport =
      reportPredictions(
        jointHistoryFeatures.map(
          (example) =>
            predictR3JointLinearHead(
              jointHead,
              example,
            ),
        ),
      );

    const gates = {
      representation:
        passesGate(stateReport),
      absKnownRelation:
        passesGate(absKnownReport),
      jointKnownRelation:
        passesGate(
          jointKnownReport,
        ),
      jointUnseenCurrent:
        passesGate(
          jointCurrentReport,
        ),
      jointUnseenHistory:
        passesGate(
          jointHistoryReport,
        ),
    };

    const jointUnseen =
      gates.jointUnseenCurrent &&
      gates.jointUnseenHistory;

    let classification:
      | "REPRESENTATION_INSUFFICIENCY_EVIDENCE"
      | "RELATION_FORMULATION_FAIL_KNOWN"
      | "RELATION_FORMULATION_PRIMARY"
      | "UNSEEN_STATE_RELATIONAL_GENERALIZATION_FAIL"
      | "PAIR_RELATION_READOUT_FAIL"
      | "STRONG_DIAGNOSTIC_SUPPORT";

    if (!gates.representation) {
      classification =
        "REPRESENTATION_INSUFFICIENCY_EVIDENCE";
    } else if (
      gates.absKnownRelation &&
      jointUnseen
    ) {
      classification =
        "STRONG_DIAGNOSTIC_SUPPORT";
    } else if (
      gates.jointKnownRelation &&
      jointUnseen
    ) {
      classification =
        "RELATION_FORMULATION_PRIMARY";
    } else if (
      gates.absKnownRelation
    ) {
      classification =
        "UNSEEN_STATE_RELATIONAL_GENERALIZATION_FAIL";
    } else if (
      gates.jointKnownRelation
    ) {
      classification =
        "RELATION_FORMULATION_FAIL_KNOWN";
    } else {
      classification =
        "PAIR_RELATION_READOUT_FAIL";
    }

    const result = {
      status:
        "PASS_EXECUTION",
      classification,
      interpretationBoundary:
        "Failure localization only. Same pinned encoder; no full three-way ReflexBrain or Owner/product claim.",
      supervision: {
        stateProbe:
          "authored-known-semantic-state",
        relationProbe:
          "authored-temporal-state-relation",
        suspendedInTrain: false,
        heldOutUsedForTraining:
          false,
        thresholdTuned: false,
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
        stateHeldOutExactText:
          exactStateBaseline,
        stateHeldOutUnigram:
          unigramStateBaseline,
        knownRelationMajority: {
          balancedAccuracy:
            0.5,
        },
        knownRelationExactPair:
          exactKnownRelationBaseline,
        unseen:
          unseenAudit,
      },
      legARepresentation: {
        trainCount:
          stateTrain.length,
        heldOutCount:
          stateHeldOut.length,
        report:
          stateReport,
        gate:
          gates.representation,
      },
      legBAbsKnownRelation: {
        featureFamily:
          "abs(H-C)",
        trainCount:
          trainPairs.length,
        heldOutKnownCount:
          knownRelations.length,
        report:
          absKnownReport,
        gate:
          gates.absKnownRelation,
        frozenUnseenReference: {
          heldOutCurrent: {
            balancedAccuracy:
              0.75,
            truePositiveRate:
              1,
            trueNegativeRate:
              0.5,
            auc:
              0.5,
          },
          heldOutHistory: {
            balancedAccuracy:
              0.75,
            truePositiveRate:
              1,
            trueNegativeRate:
              0.5,
            auc:
              0.5,
          },
          source:
            "docs/R3_TEMPORAL_FACTOR_PROBE_RESULT_2026-09-27.md",
        },
      },
      legCJointRelation: {
        pairWrapper:
          "Previous acknowledged report: <H>\\nCurrent report: <C>",
        featureFamily:
          "single frozen joint-pair embedding",
        trainCount:
          trainPairs.length,
        heldOutKnown:
          jointKnownReport,
        heldOutCurrent:
          jointCurrentReport,
        heldOutHistory:
          jointHistoryReport,
        gates: {
          known:
            gates.jointKnownRelation,
          unseenCurrent:
            gates.jointUnseenCurrent,
          unseenHistory:
            gates.jointUnseenHistory,
        },
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
      .r3TemporalRepresentationRelationFalsifier =
      "complete";

    setStatus(
      "R3 temporal representation-vs-relation falsifier complete: " +
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
      .r3TemporalRepresentationRelationFalsifier =
      "failed";

    setStatus(
      "R3 temporal representation-vs-relation falsifier failed: " +
        message,
    );
  }
}

function rawStateFeature(
  example:
    R3TemporalStateProbeExample,
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
      requiredEmbedding(
        embeddingByText,
        example.text,
      ),
    label:
      example.label,
  };
}

function absPairFeature(
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
      buildR3TemporalFactorFeatures(
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

function absKnownPairFeature(
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
      buildR3TemporalFactorFeatures(
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

function jointTemporalFeature(
  example:
    R3TemporalConsumerRelationExample,
  embeddingByText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
): R3JointHeadTrainingExample {
  const text =
    buildR3TemporalJointPairText(
      example.priorAcknowledgedText,
      example.currentMessageText,
    );

  return {
    id:
      example.id,
    features:
      requiredEmbedding(
        embeddingByText,
        text,
      ),
    label:
      example.shouldRespond,
  };
}

function jointKnownFeature(
  example:
    R3TemporalKnownRelationExample,
  embeddingByText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
): R3JointHeadTrainingExample {
  const text =
    buildR3TemporalJointPairText(
      example.historyText,
      example.currentText,
    );

  return {
    id:
      example.id,
    features:
      requiredEmbedding(
        embeddingByText,
        text,
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
    id:
      example.id,
    historyText:
      example.priorAcknowledgedText,
    currentText:
      example.currentMessageText,
    label:
      example.shouldRespond,
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

function baselineStateReport(
  examples:
    readonly R3TemporalStateProbeExample[],
  predictions:
    readonly boolean[],
) {
  return booleanMetrics(
    examples.map(
      (example) =>
        example.label,
    ),
    predictions,
  );
}

function baselineKnownRelationReport(
  examples:
    readonly R3TemporalKnownRelationExample[],
  predictions:
    readonly boolean[],
) {
  return booleanMetrics(
    examples.map(
      (example) =>
        example.shouldRespond,
    ),
    predictions,
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
