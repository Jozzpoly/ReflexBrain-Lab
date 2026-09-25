import {
  auditR3JointConsumerRelationShortcuts,
  buildR3JointConsumerRelationCorpus,
  type R3JointConsumerRelationExample,
} from "./r3/joint-consumer-relation-corpus";
import {
  buildR3JointRelationFeatures,
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

const REQUIRED_PRIVILEGED_BASELINE_BA =
  0.9642857142857143;
const MIN_COUNTERFACTUAL_PAIR_SUCCESS = 0.9;
const MIN_CLASS_RATE = 0.9;

const statusElement =
  document.querySelector<HTMLElement>("#status");
const resultElement =
  document.querySelector<HTMLElement>("#result");

if (!statusElement || !resultElement) {
  throw new Error(
    "joint relation probe page is missing output elements",
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
      "Building frozen three-way relation corpus and verifying contract…",
    );

    const corpus =
      buildR3JointConsumerRelationCorpus();
    const audit =
      auditR3JointConsumerRelationShortcuts(
        corpus,
      );

    if (
      corpus.examples.filter(
        (example) =>
          example.split === "train",
      ).length !== 128 ||
      corpus.examples.filter(
        (example) =>
          example.split ===
          "heldout-three-way",
      ).length !== 288
    ) {
      throw new Error(
        "joint relation corpus size drifted from frozen probe contract",
      );
    }

    if (
      Math.abs(
        audit.exactTextPurposeOracle
          .balancedAccuracy -
          REQUIRED_PRIVILEGED_BASELINE_BA,
      ) > 1e-12
    ) {
      throw new Error(
        "privileged exact-text+purpose baseline drifted from frozen probe contract",
      );
    }

    for (const example of corpus.examples) {
      if (
        example.labelSource !==
        "authored-semantic-teacher"
      ) {
        throw new Error(
          "unexpected supervision provenance " +
            example.labelSource,
        );
      }
    }

    const texts = uniqueTexts(
      corpus.examples,
    );
    const items = texts.map(
      (text, index) => ({
        id: "joint-text:" + index,
        text,
      }),
    );
    const textById =
      new Map(
        items.map(
          (item) => [
            item.id,
            item.text,
          ],
        ),
      );

    setStatus(
      "Loading pinned frozen MiniLM-L3 q8 and embedding " +
        items.length +
        " unique purpose/history/current texts one-by-one…",
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

    if (
      embedded.dimensions !== 384
    ) {
      throw new Error(
        "frozen encoder dimension drifted from contract: " +
          embedded.dimensions,
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

    const trainExamples =
      corpus.examples.filter(
        (example) =>
          example.split ===
          "train",
      );
    const heldOutExamples =
      corpus.examples.filter(
        (example) =>
          example.split ===
          "heldout-three-way",
      );

    const trainFeatures =
      trainExamples.map(
        (example) =>
          featureExample(
            example,
            embeddingByText,
          ),
      );
    const heldOutFeatures =
      heldOutExamples.map(
        (example) =>
          featureExample(
            example,
            embeddingByText,
          ),
      );

    setStatus(
      "Training one frozen deterministic class-balanced linear joint head on TRAIN only…",
    );

    const head =
      trainR3JointLinearHead(
        trainFeatures,
      );

    const trainPredictions =
      trainFeatures.map(
        (example) =>
          predictR3JointLinearHead(
            head,
            example,
          ),
      );
    const heldOutPredictions =
      heldOutFeatures.map(
        (example) =>
          predictR3JointLinearHead(
            head,
            example,
          ),
      );

    const trainMetrics =
      evaluateR3JointPredictions(
        trainPredictions,
      );
    const heldOutMetrics =
      evaluateR3JointPredictions(
        heldOutPredictions,
      );

    const predictionById =
      new Map(
        heldOutPredictions.map(
          (prediction) => [
            prediction.id,
            prediction,
          ],
        ),
      );

    const counterfactuals =
      evaluateCounterfactualFamilies(
        heldOutExamples,
        predictionById,
      );

    const failureDiagnostics =
      buildFailureDiagnostics(
        heldOutExamples,
        predictionById,
      );

    const gates = {
      beatsPrivilegedPartialBaseline:
        heldOutMetrics
          .balancedAccuracy >
        REQUIRED_PRIVILEGED_BASELINE_BA,
      truePositiveRate:
        heldOutMetrics
          .truePositiveRate >=
        MIN_CLASS_RATE,
      trueNegativeRate:
        heldOutMetrics
          .trueNegativeRate >=
        MIN_CLASS_RATE,
      purposeCounterfactuals:
        counterfactuals.purpose.rate >=
        MIN_COUNTERFACTUAL_PAIR_SUCCESS,
      historyCounterfactuals:
        counterfactuals.history.rate >=
        MIN_COUNTERFACTUAL_PAIR_SUCCESS,
      currentCounterfactuals:
        counterfactuals.current.rate >=
        MIN_COUNTERFACTUAL_PAIR_SUCCESS,
    };

    const allQualified =
      Object.values(gates).every(
        Boolean,
      );

    const aboveChance =
      heldOutMetrics
        .balancedAccuracy >
      0.55;

    const classification =
      allQualified
        ? "QUALIFIED_FIRST_LEARNED_THREE_WAY_RELATION"
        : aboveChance
          ? "PARTIAL_SIGNAL_NO_PROMOTION"
          : "FAIL_FROZEN_LINEAR_HEAD_HYPOTHESIS";

    const result = {
      status:
        "PASS_EXECUTION",
      classification,
      interpretationBoundary:
        "Supervised approximation of an authored, causally useful three-way semantic consumer boundary. No actor authority, no autonomous learning claim, no Owner/product claim.",
      supervision: {
        labelSource:
          "authored-semantic-teacher",
        trainCount:
          trainExamples.length,
        heldOutCount:
          heldOutExamples.length,
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
      learnedHead: {
        featureFamily:
          "[abs(P-C), abs(H-C)]",
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
      train:
        trainMetrics,
      heldOut:
        heldOutMetrics,
      privilegedPartialBaseline: {
        exactTextPurposeBalancedAccuracy:
          audit
            .exactTextPurposeOracle
            .balancedAccuracy,
        purposeOnlyBalancedAccuracy:
          audit
            .purposeOnlyOracle
            .balancedAccuracy,
        temporalOnlyBalancedAccuracy:
          audit
            .temporalOnlyOracle
            .balancedAccuracy,
      },
      counterfactuals,
      failureDiagnostics,
      gates,
    };

    resultOutput.textContent =
      JSON.stringify(
        result,
        null,
        2,
      );
    document.documentElement.dataset
      .r3JointRelationProbe =
      "complete";

    setStatus(
      "R3 frozen learned joint relation probe complete: " +
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
          error: message,
        },
        null,
        2,
      );
    document.documentElement.dataset
      .r3JointRelationProbe =
      "failed";

    setStatus(
      "R3 joint relation probe failed: " +
        message,
    );
  }
}

function featureExample(
  example:
    R3JointConsumerRelationExample,
  embeddingByText:
    ReadonlyMap<
      string,
      readonly number[]
    >,
): R3JointHeadTrainingExample {
  const purpose =
    requiredEmbedding(
      embeddingByText,
      example.matterStatement,
    );
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
      buildR3JointRelationFeatures(
        purpose,
        history,
        current,
      ),
    label:
      example.shouldRespond,
  };
}

function uniqueTexts(
  examples:
    readonly R3JointConsumerRelationExample[],
): readonly string[] {
  return [
    ...new Set(
      examples.flatMap(
        (example) => [
          example.matterStatement,
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

function evaluateCounterfactualFamilies(
  heldOut:
    readonly R3JointConsumerRelationExample[],
  predictionById:
    ReadonlyMap<
      string,
      R3JointHeadPrediction
    >,
  positiveFilter: (
    example:
      R3JointConsumerRelationExample,
  ) => boolean = () => true,
) {
  const positives =
    heldOut.filter(
      (example) =>
        example.shouldRespond &&
        positiveFilter(example),
    );

  return {
    purpose:
      pairFamily(
        positives,
        (positive) =>
          heldOut.find(
            (candidate) =>
              candidate.matterDomain !==
                positive.matterDomain &&
              candidate.priorAcknowledgedDomain ===
                positive.priorAcknowledgedDomain &&
              candidate.priorAcknowledgedState ===
                positive.priorAcknowledgedState &&
              candidate.priorAcknowledgedText ===
                positive.priorAcknowledgedText &&
              candidate.currentDomain ===
                positive.currentDomain &&
              candidate.currentState ===
                positive.currentState &&
              candidate.currentMessageText ===
                positive.currentMessageText &&
              !candidate.shouldRespond,
          ) ?? null,
        predictionById,
      ),
    history:
      pairFamily(
        positives,
        (positive) =>
          heldOut.find(
            (candidate) =>
              candidate.matterDomain ===
                positive.matterDomain &&
              candidate.matterStatement ===
                positive.matterStatement &&
              candidate.currentDomain ===
                positive.currentDomain &&
              candidate.currentState ===
                positive.currentState &&
              candidate.currentMessageText ===
                positive.currentMessageText &&
              candidate.priorAcknowledgedDomain ===
                positive.currentDomain &&
              candidate.priorAcknowledgedState ===
                positive.currentState &&
              !candidate.shouldRespond,
          ) ?? null,
        predictionById,
      ),
    current:
      pairFamily(
        positives,
        (positive) =>
          heldOut.find(
            (candidate) =>
              candidate.matterDomain ===
                positive.matterDomain &&
              candidate.matterStatement ===
                positive.matterStatement &&
              candidate.priorAcknowledgedDomain ===
                positive.priorAcknowledgedDomain &&
              candidate.priorAcknowledgedState ===
                positive.priorAcknowledgedState &&
              candidate.priorAcknowledgedText ===
                positive.priorAcknowledgedText &&
              candidate.currentDomain !==
                positive.currentDomain &&
              candidate.currentState ===
                positive.currentState &&
              !candidate.shouldRespond,
          ) ?? null,
        predictionById,
      ),
  };
}

function pairFamily(
  positives:
    readonly R3JointConsumerRelationExample[],
  findCounterfactual: (
    positive:
      R3JointConsumerRelationExample,
  ) =>
    | R3JointConsumerRelationExample
    | null,
  predictionById:
    ReadonlyMap<
      string,
      R3JointHeadPrediction
    >,
) {
  let success = 0;
  let orderingSuccess = 0;
  let orderingTies = 0;
  let probabilityMarginSum = 0;
  let count = 0;

  for (const positive of positives) {
    const counterfactual =
      findCounterfactual(
        positive,
      );
    if (!counterfactual) {
      throw new Error(
        "missing held-out label-flipping counterfactual for " +
          positive.id,
      );
    }

    const positivePrediction =
      predictionById.get(
        positive.id,
      );
    const negativePrediction =
      predictionById.get(
        counterfactual.id,
      );

    if (
      !positivePrediction ||
      !negativePrediction
    ) {
      throw new Error(
        "missing prediction for counterfactual pair",
      );
    }

    count += 1;
    if (
      positivePrediction.predicted &&
      !negativePrediction.predicted
    ) {
      success += 1;
    }

    const probabilityMargin =
      positivePrediction.probability -
      negativePrediction.probability;
    probabilityMarginSum +=
      probabilityMargin;

    if (probabilityMargin > 0) {
      orderingSuccess += 1;
    } else if (probabilityMargin === 0) {
      orderingTies += 1;
    }
  }

  return {
    count,
    success,
    rate:
      count > 0
        ? success / count
        : 0,
    orderingSuccess,
    orderingTies,
    orderingRate:
      count > 0
        ? (
            orderingSuccess +
            orderingTies * 0.5
          ) / count
        : 0,
    meanProbabilityMargin:
      count > 0
        ? probabilityMarginSum /
          count
        : 0,
  };
}

function buildFailureDiagnostics(
  heldOut:
    readonly R3JointConsumerRelationExample[],
  predictionById:
    ReadonlyMap<
      string,
      R3JointHeadPrediction
    >,
) {
  const states = [
    "complete",
    "delayed",
    "suspended",
  ] as const;

  const seenStatesOnly = (
    example:
      R3JointConsumerRelationExample,
  ) =>
    example.priorAcknowledgedState !==
      "suspended" &&
    example.currentState !==
      "suspended";

  const anySuspended = (
    example:
      R3JointConsumerRelationExample,
  ) =>
    !seenStatesOnly(example);

  return {
    modelContractUnchanged: true,
    heldOutAll:
      subsetDiagnostics(
        heldOut,
        predictionById,
        () => true,
      ),
    heldOutSeenStatesOnly:
      subsetDiagnostics(
        heldOut,
        predictionById,
        seenStatesOnly,
      ),
    heldOutAnySuspended:
      subsetDiagnostics(
        heldOut,
        predictionById,
        anySuspended,
      ),
    byCurrentState:
      Object.fromEntries(
        states.map((state) => [
          state,
          subsetDiagnostics(
            heldOut,
            predictionById,
            (example) =>
              example.currentState ===
              state,
          ),
        ]),
      ),
    byPriorState:
      Object.fromEntries(
        states.map((state) => [
          state,
          subsetDiagnostics(
            heldOut,
            predictionById,
            (example) =>
              example.priorAcknowledgedState ===
              state,
          ),
        ]),
      ),
    bySuspendedPosition: {
      neither:
        subsetDiagnostics(
          heldOut,
          predictionById,
          (example) =>
            example.priorAcknowledgedState !==
              "suspended" &&
            example.currentState !==
              "suspended",
        ),
      currentOnly:
        subsetDiagnostics(
          heldOut,
          predictionById,
          (example) =>
            example.priorAcknowledgedState !==
              "suspended" &&
            example.currentState ===
              "suspended",
        ),
      historyOnly:
        subsetDiagnostics(
          heldOut,
          predictionById,
          (example) =>
            example.priorAcknowledgedState ===
              "suspended" &&
            example.currentState !==
              "suspended",
        ),
      both:
        subsetDiagnostics(
          heldOut,
          predictionById,
          (example) =>
            example.priorAcknowledgedState ===
              "suspended" &&
            example.currentState ===
              "suspended",
        ),
    },
    byMatterDomain: {
      depot:
        subsetDiagnostics(
          heldOut,
          predictionById,
          (example) =>
            example.matterDomain ===
            "depot",
        ),
      courtyard:
        subsetDiagnostics(
          heldOut,
          predictionById,
          (example) =>
            example.matterDomain ===
            "courtyard",
        ),
    },
    counterfactualsSeenStatesOnly:
      evaluateCounterfactualFamilies(
        heldOut,
        predictionById,
        seenStatesOnly,
      ),
    counterfactualsAnySuspended:
      evaluateCounterfactualFamilies(
        heldOut,
        predictionById,
        anySuspended,
      ),
  };
}

function subsetDiagnostics(
  heldOut:
    readonly R3JointConsumerRelationExample[],
  predictionById:
    ReadonlyMap<
      string,
      R3JointHeadPrediction
    >,
  include: (
    example:
      R3JointConsumerRelationExample,
  ) => boolean,
) {
  const examples =
    heldOut.filter(include);
  if (examples.length === 0) {
    throw new Error(
      "failure diagnostic subset is empty",
    );
  }

  const predictions =
    examples.map((example) => {
      const prediction =
        predictionById.get(
          example.id,
        );
      if (!prediction) {
        throw new Error(
          "missing prediction for diagnostic example " +
            example.id,
        );
      }
      return prediction;
    });

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
    metrics:
      evaluateR3JointPredictions(
        predictions,
      ),
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
    wins + ties * 0.5
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
