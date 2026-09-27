import {
  auditR3TemporalConsumerRelationShortcuts,
  buildR3TemporalConsumerRelationCorpus,
  type R3TemporalConsumerRelationExample,
} from "./r3/temporal-consumer-relation-corpus";
import {
  buildR3TemporalHeldoutKnownRelationExamples,
  buildR3TemporalHeldoutKnownStateProbeExamples,
  buildR3TemporalTrainStateProbeExamples,
  evaluateR3TemporalKnownRelationExactPairBaseline,
  evaluateR3TemporalStateExactTextBaseline,
  evaluateR3TemporalStateUnigramBaseline,
  type R3TemporalKnownRelationExample,
  type R3TemporalStateProbeExample,
} from "./r3/temporal-representation-relation-falsifier";
import {
  buildR3ProjectedTemporalRelationFeature,
} from "./r3/temporal-project-then-compare";
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
  type R3JointLinearHead,
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
    "project-then-compare diagnostic page is missing output elements",
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
      "Building frozen privileged projection diagnostic and verifying contract…",
    );

    const corpus =
      buildR3TemporalConsumerRelationCorpus();
    const shortcutControls =
      auditR3TemporalConsumerRelationShortcuts(
        corpus,
      );

    const trainPairs =
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
        "project-then-compare corpus size drifted from frozen contract",
      );
    }

    if (
      knownRelations.filter(
        (example) =>
          example.shouldRespond,
      ).length !== 32
    ) {
      throw new Error(
        "known relation balance drifted from frozen contract",
      );
    }

    for (const controls of [
      shortcutControls.heldOutCurrent,
      shortcutControls.heldOutHistory,
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

    const stateExactBaseline =
      booleanMetrics(
        stateHeldOut.map(
          (example) =>
            example.label,
        ),
        evaluateR3TemporalStateExactTextBaseline(
          stateTrain,
          stateHeldOut,
        ),
      );
    const stateUnigramBaseline =
      booleanMetrics(
        stateHeldOut.map(
          (example) =>
            example.label,
        ),
        evaluateR3TemporalStateUnigramBaseline(
          stateTrain,
          stateHeldOut,
        ),
      );
    const knownExactBaseline =
      booleanMetrics(
        knownRelations.map(
          (example) =>
            example.shouldRespond,
        ),
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
      stateExactBaseline.balancedAccuracy !== 0.5 ||
      stateUnigramBaseline.balancedAccuracy > 0.75 ||
      knownExactBaseline.balancedAccuracy !== 0.5
    ) {
      throw new Error(
        "project-then-compare baseline contract drifted",
      );
    }

    const texts = [
      ...new Set([
        ...stateTrain.map(
          (example) => example.text,
        ),
        ...stateHeldOut.map(
          (example) => example.text,
        ),
        ...trainPairs.flatMap(
          (example) => [
            example.priorAcknowledgedText,
            example.currentMessageText,
          ],
        ),
        ...knownRelations.flatMap(
          (example) => [
            example.historyText,
            example.currentText,
          ],
        ),
        ...unseenCurrent.flatMap(
          (example) => [
            example.priorAcknowledgedText,
            example.currentMessageText,
          ],
        ),
        ...unseenHistory.flatMap(
          (example) => [
            example.priorAcknowledgedText,
            example.currentMessageText,
          ],
        ),
      ]),
    ].sort();

    const items =
      texts.map(
        (text, index) => ({
          id:
            "temporal-project-then-compare-text:" +
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
      "Training frozen privileged state projection on authored TRAIN state labels…",
    );

    const stateTrainFeatures =
      stateTrain.map(
        (example) =>
          stateFeature(
            example,
            embeddingByText,
          ),
      );
    const stateHeldOutFeatures =
      stateHeldOut.map(
        (example) =>
          stateFeature(
            example,
            embeddingByText,
          ),
      );

    const stateHead =
      trainR3JointLinearHead(
        stateTrainFeatures,
      );
    const stateTrainReport =
      reportPredictions(
        stateTrainFeatures.map(
          (example) =>
            predictR3JointLinearHead(
              stateHead,
              example,
            ),
        ),
      );
    const stateHeldOutPredictions =
      stateHeldOutFeatures.map(
        (example) =>
          predictR3JointLinearHead(
            stateHead,
            example,
          ),
      );
    const stateHeldOutReport =
      reportPredictions(
        stateHeldOutPredictions,
      );
    const stateGate =
      passesGate(
        stateHeldOutReport,
      );

    setStatus(
      "Projecting each history/current sentence to one privileged semantic coordinate, then training the frozen 1-D temporal relation head…",
    );

    const projectedTrain =
      trainPairs.map((example) =>
        projectedTemporalFeature(
          example,
          embeddingByText,
          stateHead,
        ),
      );
    const projectedKnown =
      knownRelations.map((example) =>
        projectedKnownFeature(
          example,
          embeddingByText,
          stateHead,
        ),
      );
    const projectedCurrent =
      unseenCurrent.map((example) =>
        projectedTemporalFeature(
          example,
          embeddingByText,
          stateHead,
        ),
      );
    const projectedHistory =
      unseenHistory.map((example) =>
        projectedTemporalFeature(
          example,
          embeddingByText,
          stateHead,
        ),
      );

    for (const example of [
      ...projectedTrain,
      ...projectedKnown,
      ...projectedCurrent,
      ...projectedHistory,
    ]) {
      if (
        example.features.length !== 1
      ) {
        throw new Error(
          "projected temporal relation feature must be exactly 1-D",
        );
      }
    }

    const relationHead =
      trainR3JointLinearHead(
        projectedTrain,
      );

    const trainRelationReport =
      reportPredictions(
        projectedTrain.map(
          (example) =>
            predictR3JointLinearHead(
              relationHead,
              example,
            ),
        ),
      );
    const knownRelationReport =
      reportPredictions(
        projectedKnown.map(
          (example) =>
            predictR3JointLinearHead(
              relationHead,
              example,
            ),
        ),
      );
    const currentRelationReport =
      reportPredictions(
        projectedCurrent.map(
          (example) =>
            predictR3JointLinearHead(
              relationHead,
              example,
            ),
        ),
      );
    const historyRelationReport =
      reportPredictions(
        projectedHistory.map(
          (example) =>
            predictR3JointLinearHead(
              relationHead,
              example,
            ),
        ),
      );

    const gates = {
      stateProjection:
        stateGate,
      knownRelation:
        passesGate(
          knownRelationReport,
        ),
      unseenCurrent:
        passesGate(
          currentRelationReport,
        ),
      unseenHistory:
        passesGate(
          historyRelationReport,
        ),
    };

    let classification:
      | "PRIVILEGED_STATE_PROJECTION_REPRO_FAIL"
      | "PRIVILEGED_PROJECT_THEN_COMPARE_FAIL_KNOWN"
      | "PRIVILEGED_PROJECTED_KNOWN_SUPPORT_UNSEEN_FAIL"
      | "PRIVILEGED_PROJECTED_TEMPORAL_SUPPORT";

    if (!gates.stateProjection) {
      classification =
        "PRIVILEGED_STATE_PROJECTION_REPRO_FAIL";
    } else if (
      !gates.knownRelation
    ) {
      classification =
        "PRIVILEGED_PROJECT_THEN_COMPARE_FAIL_KNOWN";
    } else if (
      !gates.unseenCurrent ||
      !gates.unseenHistory
    ) {
      classification =
        "PRIVILEGED_PROJECTED_KNOWN_SUPPORT_UNSEEN_FAIL";
    } else {
      classification =
        "PRIVILEGED_PROJECTED_TEMPORAL_SUPPORT";
    }

    const result = {
      status:
        "PASS_EXECUTION",
      classification,
      interpretationBoundary:
        "Privileged authored-state projection diagnostic only. No acceptable ReflexBrain supervision or Owner/product claim.",
      supervision: {
        stage1StateProjection:
          "authored-known-semantic-state",
        stage2Relation:
          "authored-temporal-state-relation",
        suspendedInStateTrain:
          false,
        suspendedInRelationTrain:
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
      stage1: {
        coordinate:
          "z(E)=P(complete|E)",
        trainCount:
          stateTrainFeatures.length,
        heldOutCount:
          stateHeldOutFeatures.length,
        train:
          stateTrainReport,
        heldOut:
          stateHeldOutReport,
        heldOutCoordinateMeans:
          stateCoordinateMeans(
            stateHeldOut,
            stateHeldOutPredictions,
          ),
        gate:
          gates.stateProjection,
      },
      stage2: {
        feature:
          "abs(z(H)-z(C))",
        dimensions: 1,
        trainCount:
          projectedTrain.length,
        train: {
          report:
            trainRelationReport,
          distanceMeans:
            featureMeans(
              projectedTrain,
            ),
        },
        heldOutKnown: {
          report:
            knownRelationReport,
          distanceMeans:
            featureMeans(
              projectedKnown,
            ),
          gate:
            gates.knownRelation,
        },
        heldOutCurrent: {
          report:
            currentRelationReport,
          distanceMeans:
            featureMeans(
              projectedCurrent,
            ),
          gate:
            gates.unseenCurrent,
        },
        heldOutHistory: {
          report:
            historyRelationReport,
          distanceMeans:
            featureMeans(
              projectedHistory,
            ),
          gate:
            gates.unseenHistory,
        },
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
        stage1HiddenLayers: 0,
        stage2HiddenLayers: 0,
        sweepCount: 1,
      },
      controls: {
        stateHeldOutExactText:
          stateExactBaseline,
        stateHeldOutUnigram:
          stateUnigramBaseline,
        knownRelationMajority: {
          balancedAccuracy:
            0.5,
        },
        knownRelationExactPair:
          knownExactBaseline,
        unseen:
          shortcutControls,
      },
      frozenReferences: {
        legARepresentation: {
          balancedAccuracy:
            0.875,
          auc:
            0.9375,
          gate: true,
        },
        absKnownRelation: {
          balancedAccuracy:
            0.59375,
          auc:
            0.66015625,
          gate: false,
        },
        symmetricInteractionKnown: {
          balancedAccuracy:
            0.59375,
          auc:
            0.66015625,
          gate: false,
        },
        jointKnownRelation: {
          balancedAccuracy:
            0.515625,
          auc:
            0.5771484375,
          gate: false,
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
      .r3TemporalProjectThenCompareDiagnostic =
      "complete";

    setStatus(
      "R3 temporal project-then-compare diagnostic complete: " +
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
      .r3TemporalProjectThenCompareDiagnostic =
      "failed";

    setStatus(
      "R3 temporal project-then-compare diagnostic failed: " +
        message,
    );
  }
}

function stateFeature(
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

function projectedTemporalFeature(
  example:
    R3TemporalConsumerRelationExample,
  embeddingByText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
  stateHead:
    R3JointLinearHead,
): R3JointHeadTrainingExample {
  return {
    id:
      example.id,
    features:
      buildR3ProjectedTemporalRelationFeature(
        stateProbability(
          stateHead,
          embeddingByText,
          example.priorAcknowledgedText,
        ),
        stateProbability(
          stateHead,
          embeddingByText,
          example.currentMessageText,
        ),
      ),
    label:
      example.shouldRespond,
  };
}

function projectedKnownFeature(
  example:
    R3TemporalKnownRelationExample,
  embeddingByText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
  stateHead:
    R3JointLinearHead,
): R3JointHeadTrainingExample {
  return {
    id:
      example.id,
    features:
      buildR3ProjectedTemporalRelationFeature(
        stateProbability(
          stateHead,
          embeddingByText,
          example.historyText,
        ),
        stateProbability(
          stateHead,
          embeddingByText,
          example.currentText,
        ),
      ),
    label:
      example.shouldRespond,
  };
}

function stateProbability(
  stateHead:
    R3JointLinearHead,
  embeddingByText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
  text: string,
): number {
  return predictR3JointLinearHead(
    stateHead,
    {
      id:
        "state-coordinate:" +
        text,
      features:
        requiredEmbedding(
          embeddingByText,
          text,
        ),
      label: false,
    },
  ).probability;
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

function stateCoordinateMeans(
  examples:
    readonly R3TemporalStateProbeExample[],
  predictions:
    readonly R3JointHeadPrediction[],
) {
  const complete =
    predictions.filter(
      (_, index) =>
        examples[index]!.state ===
        "complete",
    );
  const delayed =
    predictions.filter(
      (_, index) =>
        examples[index]!.state ===
        "delayed",
    );

  return {
    complete:
      meanProbability(complete),
    delayed:
      meanProbability(delayed),
  };
}

function featureMeans(
  examples:
    readonly R3JointHeadTrainingExample[],
) {
  const positive =
    examples.filter(
      (example) =>
        example.label,
    );
  const negative =
    examples.filter(
      (example) =>
        !example.label,
    );

  return {
    positive:
      meanFeature(positive),
    negative:
      meanFeature(negative),
  };
}

function meanFeature(
  examples:
    readonly R3JointHeadTrainingExample[],
): number | null {
  if (examples.length === 0) {
    return null;
  }
  return (
    examples.reduce(
      (sum, example) =>
        sum +
        example.features[0]!,
      0,
    ) /
    examples.length
  );
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
