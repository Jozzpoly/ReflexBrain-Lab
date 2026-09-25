import {
  MIXED_PRESSURE_MATTER_IDS,
} from "./mixed-pressure-fixture-policy";

export type R3TemporalRelationState =
  | "complete"
  | "delayed"
  | "suspended";

export type R3TemporalRelationSplit =
  | "train"
  | "heldout-current-state"
  | "heldout-history-state";

export interface R3TemporalConsumerRelationExample {
  id: string;
  split: R3TemporalRelationSplit;
  matterId: string;
  matterStatement: string;
  priorAcknowledgedState:
    R3TemporalRelationState;
  currentState:
    R3TemporalRelationState;
  priorAcknowledgedText: string;
  currentMessageText: string;
  shouldRespond: boolean;
}

export interface R3TemporalConsumerRelationCorpus {
  examples:
    readonly R3TemporalConsumerRelationExample[];
}

export interface R3TemporalRelationMetrics {
  count: number;
  positives: number;
  negatives: number;
  accuracy: number;
  balancedAccuracy: number;
  truePositiveRate: number;
  trueNegativeRate: number;
}

export interface R3TemporalRelationShortcutAudit {
  trainCount: number;
  heldOutCurrentCount: number;
  heldOutHistoryCount: number;
  trainPositiveRate: number;
  heldOutCurrentPositiveRate: number;
  heldOutHistoryPositiveRate: number;
  heldOutCurrent: R3TemporalRelationControlMetrics;
  heldOutHistory: R3TemporalRelationControlMetrics;
}

export interface R3TemporalRelationControlMetrics {
  majority: R3TemporalRelationMetrics;
  exactTriple: R3TemporalRelationMetrics;
  currentOnly: R3TemporalRelationMetrics;
  historyOnly: R3TemporalRelationMetrics;
  unigram: R3TemporalRelationMetrics;
  crossTokenPair: R3TemporalRelationMetrics;
}

const TRAIN_MATTER =
  "acknowledge changes in depot inspection status, but do not re-acknowledge equivalent restatements already handled";

const HELDOUT_MATTER =
  "respond when the storage-check condition changes; ignore paraphrases of a state you have already confirmed";

const TRAIN_SURFACES: Readonly<
  Record<
    Exclude<
      R3TemporalRelationState,
      "suspended"
    >,
    readonly [string, string]
  >
> = {
  complete: [
    "Janek, the depot inspection is complete.",
    "Janek, the depot inspection has finished.",
  ],
  delayed: [
    "Janek, the depot inspection is delayed.",
    "Janek, the depot inspection will take longer.",
  ],
};

const HELDOUT_SURFACES: Readonly<
  Record<
    R3TemporalRelationState,
    readonly [string, string]
  >
> = {
  complete: [
    "Janek, the storage audit has concluded.",
    "Janek, the warehouse review is done.",
  ],
  delayed: [
    "Janek, the storage audit is running late.",
    "Janek, the warehouse review needs more time.",
  ],
  suspended: [
    "Janek, the stockroom assessment is paused.",
    "Janek, the goods-area review has been put on hold.",
  ],
};

export function buildR3TemporalConsumerRelationCorpus():
R3TemporalConsumerRelationCorpus {
  const examples:
    R3TemporalConsumerRelationExample[] = [];

  const trainStates:
    readonly Exclude<
      R3TemporalRelationState,
      "suspended"
    >[] = [
      "complete",
      "delayed",
    ];

  for (const priorState of trainStates) {
    for (
      let priorIndex = 0;
      priorIndex < 2;
      priorIndex += 1
    ) {
      for (
        const currentState of
          trainStates
      ) {
        for (
          let currentIndex = 0;
          currentIndex < 2;
          currentIndex += 1
        ) {
          examples.push(
            makeExample({
              split: "train",
              matterStatement:
                TRAIN_MATTER,
              priorState,
              currentState,
              priorText:
                TRAIN_SURFACES[
                  priorState
                ][priorIndex]!,
              currentText:
                TRAIN_SURFACES[
                  currentState
                ][currentIndex]!,
              suffix:
                priorState +
                ":" +
                priorIndex +
                ":" +
                currentState +
                ":" +
                currentIndex,
            }),
          );
        }
      }
    }
  }

  // Held-out-current: the CURRENT semantic state was never seen in TRAIN.
  // Balance 4 positive change cases against 4 same-state negatives.
  for (
    let currentIndex = 0;
    currentIndex < 2;
    currentIndex += 1
  ) {
    for (
      let priorIndex = 0;
      priorIndex < 2;
      priorIndex += 1
    ) {
      examples.push(
        makeExample({
          split:
            "heldout-current-state",
          matterStatement:
            HELDOUT_MATTER,
          priorState: "suspended",
          currentState: "suspended",
          priorText:
            HELDOUT_SURFACES
              .suspended[
                priorIndex
              ]!,
          currentText:
            HELDOUT_SURFACES
              .suspended[
                currentIndex
              ]!,
          suffix:
            "same-suspended:" +
            priorIndex +
            ":" +
            currentIndex,
        }),
      );
    }
  }

  for (
    const priorState of [
      "complete",
      "delayed",
    ] as const
  ) {
    for (
      let index = 0;
      index < 2;
      index += 1
    ) {
      examples.push(
        makeExample({
          split:
            "heldout-current-state",
          matterStatement:
            HELDOUT_MATTER,
          priorState,
          currentState: "suspended",
          priorText:
            HELDOUT_SURFACES[
              priorState
            ][index]!,
          currentText:
            HELDOUT_SURFACES
              .suspended[index]!,
          suffix:
            "change-to-suspended:" +
            priorState +
            ":" +
            index,
        }),
      );
    }
  }

  // Held-out-history: the ACKNOWLEDGED semantic history state was never seen
  // in TRAIN. Again balance 4 same-state negatives against 4 changes.
  for (
    let priorIndex = 0;
    priorIndex < 2;
    priorIndex += 1
  ) {
    for (
      let currentIndex = 0;
      currentIndex < 2;
      currentIndex += 1
    ) {
      examples.push(
        makeExample({
          split:
            "heldout-history-state",
          matterStatement:
            HELDOUT_MATTER,
          priorState: "suspended",
          currentState: "suspended",
          priorText:
            HELDOUT_SURFACES
              .suspended[
                priorIndex
              ]!,
          currentText:
            HELDOUT_SURFACES
              .suspended[
                currentIndex
              ]!,
          suffix:
            "same-suspended:" +
            priorIndex +
            ":" +
            currentIndex,
        }),
      );
    }
  }

  for (
    const currentState of [
      "complete",
      "delayed",
    ] as const
  ) {
    for (
      let index = 0;
      index < 2;
      index += 1
    ) {
      examples.push(
        makeExample({
          split:
            "heldout-history-state",
          matterStatement:
            HELDOUT_MATTER,
          priorState: "suspended",
          currentState,
          priorText:
            HELDOUT_SURFACES
              .suspended[index]!,
          currentText:
            HELDOUT_SURFACES[
              currentState
            ][index]!,
          suffix:
            "change-from-suspended:" +
            currentState +
            ":" +
            index,
        }),
      );
    }
  }

  return { examples };
}

export function auditR3TemporalConsumerRelationShortcuts(
  corpus:
    R3TemporalConsumerRelationCorpus,
): R3TemporalRelationShortcutAudit {
  const train = subset(
    corpus,
    "train",
  );
  const heldOutCurrent = subset(
    corpus,
    "heldout-current-state",
  );
  const heldOutHistory = subset(
    corpus,
    "heldout-history-state",
  );

  assertBalanced(train, "train");
  assertBalanced(
    heldOutCurrent,
    "heldout-current-state",
  );
  assertBalanced(
    heldOutHistory,
    "heldout-history-state",
  );

  const fallback =
    positiveRate(train) >= 0.5;

  const exactTriple =
    trainExactMemorizer(
      train,
      (example) =>
        example.matterStatement +
        "\n<HISTORY>\n" +
        example.priorAcknowledgedText +
        "\n<CURRENT>\n" +
        example.currentMessageText,
      fallback,
    );
  const currentOnly =
    trainExactMemorizer(
      train,
      (example) =>
        example.currentMessageText,
      fallback,
    );
  const historyOnly =
    trainExactMemorizer(
      train,
      (example) =>
        example.priorAcknowledgedText,
      fallback,
    );
  const unigram =
    trainUnigramMemorizer(
      train,
      positiveRate(train),
    );
  const crossTokenPair =
    trainCrossTokenPairMemorizer(
      train,
      positiveRate(train),
    );

  return {
    trainCount: train.length,
    heldOutCurrentCount:
      heldOutCurrent.length,
    heldOutHistoryCount:
      heldOutHistory.length,
    trainPositiveRate:
      positiveRate(train),
    heldOutCurrentPositiveRate:
      positiveRate(
        heldOutCurrent,
      ),
    heldOutHistoryPositiveRate:
      positiveRate(
        heldOutHistory,
      ),
    heldOutCurrent:
      evaluateControls(
        heldOutCurrent,
        fallback,
        exactTriple,
        currentOnly,
        historyOnly,
        unigram,
        crossTokenPair,
      ),
    heldOutHistory:
      evaluateControls(
        heldOutHistory,
        fallback,
        exactTriple,
        currentOnly,
        historyOnly,
        unigram,
        crossTokenPair,
      ),
  };
}

function makeExample(input: {
  split: R3TemporalRelationSplit;
  matterStatement: string;
  priorState: R3TemporalRelationState;
  currentState: R3TemporalRelationState;
  priorText: string;
  currentText: string;
  suffix: string;
}): R3TemporalConsumerRelationExample {
  return {
    id:
      "r3:temporal-consumer-relation:" +
      input.split +
      ":" +
      input.suffix,
    split: input.split,
    matterId:
      MIXED_PRESSURE_MATTER_IDS.reportResponse,
    matterStatement:
      input.matterStatement,
    priorAcknowledgedState:
      input.priorState,
    currentState:
      input.currentState,
    priorAcknowledgedText:
      input.priorText,
    currentMessageText:
      input.currentText,
    shouldRespond:
      input.priorState !==
      input.currentState,
  };
}

function evaluateControls(
  examples:
    readonly R3TemporalConsumerRelationExample[],
  fallback: boolean,
  exactTriple: Predictor,
  currentOnly: Predictor,
  historyOnly: Predictor,
  unigram: Predictor,
  crossTokenPair: Predictor,
): R3TemporalRelationControlMetrics {
  return {
    majority: evaluate(
      examples,
      () => fallback,
    ),
    exactTriple: evaluate(
      examples,
      (example) =>
        exactTriple.predict(
          example,
        ),
    ),
    currentOnly: evaluate(
      examples,
      (example) =>
        currentOnly.predict(
          example,
        ),
    ),
    historyOnly: evaluate(
      examples,
      (example) =>
        historyOnly.predict(
          example,
        ),
    ),
    unigram: evaluate(
      examples,
      (example) =>
        unigram.predict(
          example,
        ),
    ),
    crossTokenPair: evaluate(
      examples,
      (example) =>
        crossTokenPair.predict(
          example,
        ),
    ),
  };
}

interface Predictor {
  predict(
    example:
      R3TemporalConsumerRelationExample,
  ): boolean;
}

function trainExactMemorizer(
  train:
    readonly R3TemporalConsumerRelationExample[],
  key: (
    example:
      R3TemporalConsumerRelationExample,
  ) => string,
  fallback: boolean,
): Predictor {
  const counts = new Map<
    string,
    {
      positive: number;
      negative: number;
    }
  >();

  for (const example of train) {
    const signature = key(example);
    const current =
      counts.get(signature) ?? {
        positive: 0,
        negative: 0,
      };
    if (example.shouldRespond) {
      current.positive += 1;
    } else {
      current.negative += 1;
    }
    counts.set(
      signature,
      current,
    );
  }

  return {
    predict(example) {
      const found =
        counts.get(key(example));
      if (!found) {
        return fallback;
      }
      return (
        found.positive >=
        found.negative
      );
    },
  };
}

function trainUnigramMemorizer(
  train:
    readonly R3TemporalConsumerRelationExample[],
  globalPositiveRate: number,
): Predictor {
  const stats = new Map<
    string,
    {
      positive: number;
      total: number;
    }
  >();

  for (const example of train) {
    for (
      const token of
        combinedTokens(example)
    ) {
      const current =
        stats.get(token) ?? {
          positive: 0,
          total: 0,
        };
      current.total += 1;
      if (example.shouldRespond) {
        current.positive += 1;
      }
      stats.set(token, current);
    }
  }

  return {
    predict(example) {
      const rates =
        combinedTokens(example)
          .map(
            (token) =>
              stats.get(token),
          )
          .filter(
            (
              value,
            ): value is {
              positive: number;
              total: number;
            } =>
              value !==
                undefined &&
              value.total >= 2,
          )
          .map(
            (value) =>
              value.positive /
              value.total,
          );

      if (rates.length === 0) {
        return (
          globalPositiveRate >=
          0.5
        );
      }

      const mean =
        rates.reduce(
          (sum, rate) =>
            sum + rate,
          0,
        ) / rates.length;

      return (
        mean >=
        globalPositiveRate
      );
    },
  };
}

function trainCrossTokenPairMemorizer(
  train:
    readonly R3TemporalConsumerRelationExample[],
  globalPositiveRate: number,
): Predictor {
  const stats = new Map<
    string,
    {
      positive: number;
      total: number;
    }
  >();

  for (const example of train) {
    const prior =
      tokenSet(
        example.priorAcknowledgedText,
      );
    const current =
      tokenSet(
        example.currentMessageText,
      );

    for (const left of prior) {
      for (const right of current) {
        const key =
          left + "=>" + right;
        const found =
          stats.get(key) ?? {
            positive: 0,
            total: 0,
          };
        found.total += 1;
        if (
          example.shouldRespond
        ) {
          found.positive += 1;
        }
        stats.set(key, found);
      }
    }
  }

  return {
    predict(example) {
      const rates: number[] = [];
      const prior =
        tokenSet(
          example.priorAcknowledgedText,
        );
      const current =
        tokenSet(
          example.currentMessageText,
        );

      for (const left of prior) {
        for (const right of current) {
          const found =
            stats.get(
              left +
                "=>" +
                right,
            );
          if (
            found &&
            found.total >= 2
          ) {
            rates.push(
              found.positive /
                found.total,
            );
          }
        }
      }

      if (rates.length === 0) {
        return (
          globalPositiveRate >=
          0.5
        );
      }

      const mean =
        rates.reduce(
          (sum, rate) =>
            sum + rate,
          0,
        ) / rates.length;

      return (
        mean >=
        globalPositiveRate
      );
    },
  };
}

function combinedTokens(
  example:
    R3TemporalConsumerRelationExample,
): readonly string[] {
  return [
    ...new Set([
      ...tokenSet(
        example.matterStatement,
      ),
      ...tokenSet(
        example.priorAcknowledgedText,
      ),
      ...tokenSet(
        example.currentMessageText,
      ),
    ]),
  ].sort();
}

function tokenSet(
  text: string,
): ReadonlySet<string> {
  return new Set(
    text
      .toLowerCase()
      .match(
        /[a-z]+(?:'[a-z]+)?/g,
      ) ?? [],
  );
}

function subset(
  corpus:
    R3TemporalConsumerRelationCorpus,
  split: R3TemporalRelationSplit,
): R3TemporalConsumerRelationExample[] {
  return corpus.examples.filter(
    (example) =>
      example.split === split,
  );
}

function positiveRate(
  examples:
    readonly R3TemporalConsumerRelationExample[],
): number {
  return (
    examples.filter(
      (example) =>
        example.shouldRespond,
    ).length /
    examples.length
  );
}

function assertBalanced(
  examples:
    readonly R3TemporalConsumerRelationExample[],
  label: string,
): void {
  if (examples.length === 0) {
    throw new Error(
      label +
        " temporal relation set is empty",
    );
  }

  const rate =
    positiveRate(examples);
  if (
    Math.abs(rate - 0.5) >
    1e-12
  ) {
    throw new Error(
      label +
        " temporal relation set must be balanced; positiveRate=" +
        rate,
    );
  }
}

function evaluate(
  examples:
    readonly R3TemporalConsumerRelationExample[],
  predict: (
    example:
      R3TemporalConsumerRelationExample,
  ) => boolean,
): R3TemporalRelationMetrics {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;

  for (const example of examples) {
    const predicted =
      predict(example);

    if (
      example.shouldRespond &&
      predicted
    ) {
      tp += 1;
    } else if (
      !example.shouldRespond &&
      !predicted
    ) {
      tn += 1;
    } else if (
      !example.shouldRespond &&
      predicted
    ) {
      fp += 1;
    } else {
      fn += 1;
    }
  }

  const positives = tp + fn;
  const negatives = tn + fp;
  const tpr =
    positives > 0
      ? tp / positives
      : 0;
  const tnr =
    negatives > 0
      ? tn / negatives
      : 0;

  return {
    count: examples.length,
    positives,
    negatives,
    accuracy:
      examples.length > 0
        ? (tp + tn) /
          examples.length
        : 0,
    balancedAccuracy:
      (tpr + tnr) / 2,
    truePositiveRate: tpr,
    trueNegativeRate: tnr,
  };
}
