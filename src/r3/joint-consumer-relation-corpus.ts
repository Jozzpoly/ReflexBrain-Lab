import {
  MIXED_PRESSURE_MATTER_IDS,
} from "./mixed-pressure-fixture-policy";
import type {
  R3JointSemanticDomain,
  R3JointSemanticState,
} from "./joint-semantic-temporal-consumer-run";

export type R3JointRelationSplit =
  | "train"
  | "heldout-three-way";

export type R3JointRelationLabelSource =
  "authored-semantic-teacher";

export interface R3JointConsumerRelationExample {
  id: string;
  split: R3JointRelationSplit;
  labelSource: R3JointRelationLabelSource;
  matterId: string;
  matterDomain: R3JointSemanticDomain;
  matterStatement: string;
  priorAcknowledgedDomain:
    R3JointSemanticDomain;
  priorAcknowledgedState:
    R3JointSemanticState;
  priorAcknowledgedText: string;
  currentDomain: R3JointSemanticDomain;
  currentState: R3JointSemanticState;
  currentMessageText: string;
  shouldRespond: boolean;
}

export interface R3JointConsumerRelationCorpus {
  examples:
    readonly R3JointConsumerRelationExample[];
}

export interface R3JointRelationMetrics {
  count: number;
  positives: number;
  negatives: number;
  accuracy: number;
  balancedAccuracy: number;
  truePositiveRate: number;
  trueNegativeRate: number;
}

export interface R3JointRelationShortcutAudit {
  trainCount: number;
  heldOutCount: number;
  trainPositiveRate: number;
  heldOutPositiveRate: number;
  majority: R3JointRelationMetrics;
  exactTriple: R3JointRelationMetrics;
  exactNoPurpose: R3JointRelationMetrics;
  exactNoHistory: R3JointRelationMetrics;
  exactNoCurrent: R3JointRelationMetrics;
  unigram: R3JointRelationMetrics;
  crossSegmentTokenPairs:
    R3JointRelationMetrics;
  purposeOnlyOracle:
    R3JointRelationMetrics;
  temporalOnlyOracle:
    R3JointRelationMetrics;
  exactTextPurposeOracle:
    R3JointRelationMetrics;
}

const TRAIN_MATTERS: Readonly<
  Record<R3JointSemanticDomain, string>
> = {
  depot:
    "acknowledge changes in depot inspection status, but do not re-acknowledge equivalent restatements already handled",
  courtyard:
    "acknowledge changes in courtyard flower-condition status, but do not re-acknowledge equivalent restatements already handled",
};

const HELDOUT_MATTERS: Readonly<
  Record<R3JointSemanticDomain, string>
> = {
  depot:
    "respond when the storage-area condition becomes meaningfully different from what you already confirmed; skip equivalent repeats",
  courtyard:
    "respond when the garden-condition report meaningfully changes from what you already confirmed; skip equivalent repeats",
};

const TRAIN_SURFACES: Readonly<
  Record<
    R3JointSemanticDomain,
    Readonly<
      Record<
        Exclude<
          R3JointSemanticState,
          "suspended"
        >,
        readonly [string, string]
      >
    >
  >
> = {
  depot: {
    complete: [
      "Janek, the depot inspection is complete.",
      "Janek, the depot inspection has finished.",
    ],
    delayed: [
      "Janek, the depot inspection is delayed.",
      "Janek, the depot inspection will take longer.",
    ],
  },
  courtyard: {
    complete: [
      "Janek, the courtyard flower inspection is complete.",
      "Janek, the courtyard flower check has finished.",
    ],
    delayed: [
      "Janek, the courtyard flower inspection is delayed.",
      "Janek, the courtyard flower check will take longer.",
    ],
  },
};

const HELDOUT_SURFACES: Readonly<
  Record<
    R3JointSemanticDomain,
    Readonly<
      Record<
        R3JointSemanticState,
        readonly [string, string]
      >
    >
  >
> = {
  depot: {
    complete: [
      "Janek, the warehouse review is done.",
      "Janek, the storage-area check has concluded.",
    ],
    delayed: [
      "Janek, the warehouse review needs more time.",
      "Janek, the storage-area check is running late.",
    ],
    suspended: [
      "Janek, the stockroom assessment is paused.",
      "Janek, the goods-area review has been put on hold.",
    ],
  },
  courtyard: {
    complete: [
      "Janek, the garden survey is done.",
      "Janek, the flower-area check has concluded.",
    ],
    delayed: [
      "Janek, the garden survey needs more time.",
      "Janek, the flower-area check is running late.",
    ],
    suspended: [
      "Janek, the garden survey is paused.",
      "Janek, the flower-area review has been put on hold.",
    ],
  },
};

export function buildR3JointConsumerRelationCorpus():
R3JointConsumerRelationCorpus {
  const examples:
    R3JointConsumerRelationExample[] = [];

  const trainStates:
    readonly Exclude<
      R3JointSemanticState,
      "suspended"
    >[] = [
      "complete",
      "delayed",
    ];

  appendCartesian({
    examples,
    split: "train",
    matterStatements: TRAIN_MATTERS,
    states: trainStates,
    surfaces: TRAIN_SURFACES,
  });

  appendCartesian({
    examples,
    split: "heldout-three-way",
    matterStatements: HELDOUT_MATTERS,
    states: [
      "complete",
      "delayed",
      "suspended",
    ],
    surfaces: HELDOUT_SURFACES,
  });

  return { examples };
}

export function serializeR3JointRelationModelInput(
  example: R3JointConsumerRelationExample,
): string {
  return [
    "<PURPOSE>",
    example.matterStatement,
    "<SETTLED_PRIVATE_HISTORY>",
    example.priorAcknowledgedText,
    "<CURRENT_PRIVATE_EVIDENCE>",
    example.currentMessageText,
  ].join("\n");
}

export function auditR3JointConsumerRelationShortcuts(
  corpus: R3JointConsumerRelationCorpus,
): R3JointRelationShortcutAudit {
  const train = subset(
    corpus,
    "train",
  );
  const heldOut = subset(
    corpus,
    "heldout-three-way",
  );

  const fallback =
    positiveRate(train) >= 0.5;

  const exactTriple =
    trainExactMemorizer(
      train,
      (example) =>
        serializeR3JointRelationModelInput(
          example,
        ),
      fallback,
    );

  const exactNoPurpose =
    trainExactMemorizer(
      train,
      (example) =>
        example.priorAcknowledgedText +
        "\n<CURRENT>\n" +
        example.currentMessageText,
      fallback,
    );

  const exactNoHistory =
    trainExactMemorizer(
      train,
      (example) =>
        example.matterStatement +
        "\n<CURRENT>\n" +
        example.currentMessageText,
      fallback,
    );

  const exactNoCurrent =
    trainExactMemorizer(
      train,
      (example) =>
        example.matterStatement +
        "\n<HISTORY>\n" +
        example.priorAcknowledgedText,
      fallback,
    );

  const unigram =
    trainUnigramMemorizer(
      train,
      positiveRate(train),
    );

  const crossSegmentTokenPairs =
    trainCrossSegmentTokenPairMemorizer(
      train,
      positiveRate(train),
    );

  return {
    trainCount: train.length,
    heldOutCount: heldOut.length,
    trainPositiveRate:
      positiveRate(train),
    heldOutPositiveRate:
      positiveRate(heldOut),
    majority: evaluate(
      heldOut,
      () => fallback,
    ),
    exactTriple: evaluate(
      heldOut,
      (example) =>
        exactTriple.predict(
          example,
        ),
    ),
    exactNoPurpose: evaluate(
      heldOut,
      (example) =>
        exactNoPurpose.predict(
          example,
        ),
    ),
    exactNoHistory: evaluate(
      heldOut,
      (example) =>
        exactNoHistory.predict(
          example,
        ),
    ),
    exactNoCurrent: evaluate(
      heldOut,
      (example) =>
        exactNoCurrent.predict(
          example,
        ),
    ),
    unigram: evaluate(
      heldOut,
      (example) =>
        unigram.predict(
          example,
        ),
    ),
    crossSegmentTokenPairs:
      evaluate(
        heldOut,
        (example) =>
          crossSegmentTokenPairs.predict(
            example,
          ),
      ),
    purposeOnlyOracle:
      evaluate(
        heldOut,
        (example) =>
          example.currentDomain ===
          example.matterDomain,
      ),
    temporalOnlyOracle:
      evaluate(
        heldOut,
        (example) =>
          (
            example.priorAcknowledgedDomain !==
              example.currentDomain ||
            example.priorAcknowledgedState !==
              example.currentState
          ),
      ),
    exactTextPurposeOracle:
      evaluate(
        heldOut,
        (example) =>
          example.currentDomain ===
            example.matterDomain &&
          example.currentMessageText !==
            example.priorAcknowledgedText,
      ),
  };
}

function appendCartesian<
  TState extends R3JointSemanticState,
>(input: {
  examples:
    R3JointConsumerRelationExample[];
  split: R3JointRelationSplit;
  matterStatements: Readonly<
    Record<
      R3JointSemanticDomain,
      string
    >
  >;
  states: readonly TState[];
  surfaces: Readonly<
    Record<
      R3JointSemanticDomain,
      Readonly<
        Record<
          TState,
          readonly [string, string]
        >
      >
    >
  >;
}): void {
  for (
    const matterDomain of [
      "depot",
      "courtyard",
    ] as const
  ) {
    for (
      const priorDomain of [
        "depot",
        "courtyard",
      ] as const
    ) {
      for (
        const priorState of
          input.states
      ) {
        for (
          let priorIndex = 0;
          priorIndex < 2;
          priorIndex += 1
        ) {
          for (
            const currentDomain of [
              "depot",
              "courtyard",
            ] as const
          ) {
            for (
              const currentState of
                input.states
            ) {
              for (
                let currentIndex = 0;
                currentIndex < 2;
                currentIndex += 1
              ) {
                input.examples.push({
                  id: [
                    "r3",
                    "joint-consumer-relation",
                    input.split,
                    matterDomain,
                    priorDomain,
                    priorState,
                    priorIndex,
                    currentDomain,
                    currentState,
                    currentIndex,
                  ].join(":"),
                  split: input.split,
                  labelSource:
                    "authored-semantic-teacher",
                  matterId:
                    MIXED_PRESSURE_MATTER_IDS.reportResponse,
                  matterDomain,
                  matterStatement:
                    input.matterStatements[
                      matterDomain
                    ],
                  priorAcknowledgedDomain:
                    priorDomain,
                  priorAcknowledgedState:
                    priorState,
                  priorAcknowledgedText:
                    input.surfaces[
                      priorDomain
                    ][priorState][
                      priorIndex
                    ]!,
                  currentDomain,
                  currentState,
                  currentMessageText:
                    input.surfaces[
                      currentDomain
                    ][currentState][
                      currentIndex
                    ]!,
                  shouldRespond:
                    currentDomain ===
                      matterDomain &&
                    (
                      priorDomain !==
                        currentDomain ||
                      priorState !==
                        currentState
                    ),
                });
              }
            }
          }
        }
      }
    }
  }
}

interface Predictor {
  predict(
    example:
      R3JointConsumerRelationExample,
  ): boolean;
}

function trainExactMemorizer(
  train:
    readonly R3JointConsumerRelationExample[],
  key: (
    example:
      R3JointConsumerRelationExample,
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
    const signature =
      key(example);
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
    readonly R3JointConsumerRelationExample[],
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
      stats.set(
        token,
        current,
      );
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

function trainCrossSegmentTokenPairMemorizer(
  train:
    readonly R3JointConsumerRelationExample[],
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
      const key of
        crossSegmentKeys(example)
    ) {
      const current =
        stats.get(key) ?? {
          positive: 0,
          total: 0,
        };
      current.total += 1;
      if (example.shouldRespond) {
        current.positive += 1;
      }
      stats.set(
        key,
        current,
      );
    }
  }

  return {
    predict(example) {
      const rates =
        crossSegmentKeys(example)
          .map(
            (key) =>
              stats.get(key),
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

function crossSegmentKeys(
  example:
    R3JointConsumerRelationExample,
): readonly string[] {
  const matter =
    tokenSet(
      example.matterStatement,
    );
  const history =
    tokenSet(
      example.priorAcknowledgedText,
    );
  const current =
    tokenSet(
      example.currentMessageText,
    );

  const keys = new Set<string>();

  for (const left of matter) {
    for (const right of current) {
      keys.add(
        "m>" +
          left +
          "=>" +
          right,
      );
    }
  }

  for (const left of history) {
    for (const right of current) {
      keys.add(
        "h>" +
          left +
          "=>" +
          right,
      );
    }
  }

  return [...keys].sort();
}

function combinedTokens(
  example:
    R3JointConsumerRelationExample,
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

function evaluate(
  examples:
    readonly R3JointConsumerRelationExample[],
  predict: (
    example:
      R3JointConsumerRelationExample,
  ) => boolean,
): R3JointRelationMetrics {
  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (const example of examples) {
    const predicted =
      predict(example);
    if (
      predicted &&
      example.shouldRespond
    ) {
      truePositive += 1;
    } else if (
      predicted &&
      !example.shouldRespond
    ) {
      falsePositive += 1;
    } else if (
      !predicted &&
      example.shouldRespond
    ) {
      falseNegative += 1;
    } else {
      trueNegative += 1;
    }
  }

  const positives =
    truePositive +
    falseNegative;
  const negatives =
    trueNegative +
    falsePositive;
  const truePositiveRate =
    positives > 0
      ? truePositive /
        positives
      : 0;
  const trueNegativeRate =
    negatives > 0
      ? trueNegative /
        negatives
      : 0;

  return {
    count: examples.length,
    positives,
    negatives,
    accuracy:
      (
        truePositive +
        trueNegative
      ) /
      examples.length,
    balancedAccuracy:
      (
        truePositiveRate +
        trueNegativeRate
      ) /
      2,
    truePositiveRate,
    trueNegativeRate,
  };
}

function subset(
  corpus:
    R3JointConsumerRelationCorpus,
  split: R3JointRelationSplit,
): R3JointConsumerRelationExample[] {
  return corpus.examples.filter(
    (example) =>
      example.split === split,
  );
}

function positiveRate(
  examples:
    readonly R3JointConsumerRelationExample[],
): number {
  return (
    examples.filter(
      (example) =>
        example.shouldRespond,
    ).length /
    examples.length
  );
}
