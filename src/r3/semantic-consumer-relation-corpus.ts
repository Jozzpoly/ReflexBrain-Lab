import {
  MIXED_PRESSURE_MATTER_IDS,
} from "./mixed-pressure-fixture-policy";

export type R3SemanticConsumerRelationWording =
  | "train-surface"
  | "heldout-paraphrase";

export type R3SemanticConsumerRelationDomain =
  | "depot"
  | "courtyard";

export interface R3SemanticConsumerRelationExample {
  id: string;
  wording: R3SemanticConsumerRelationWording;
  matterId: string;
  matterDomain: R3SemanticConsumerRelationDomain;
  messageDomain: R3SemanticConsumerRelationDomain;
  matterStatement: string;
  messageText: string;
  shouldRespond: boolean;
}

export interface R3SemanticConsumerRelationCorpus {
  examples: readonly R3SemanticConsumerRelationExample[];
}

export interface R3BinaryRelationMetrics {
  count: number;
  positives: number;
  negatives: number;
  accuracy: number;
  balancedAccuracy: number;
  truePositiveRate: number;
  trueNegativeRate: number;
}

export interface R3SemanticConsumerRelationShortcutAudit {
  trainCount: number;
  heldOutCount: number;
  trainPositiveRate: number;
  heldOutPositiveRate: number;
  majorityHeldOut: R3BinaryRelationMetrics;
  exactPairHeldOut: R3BinaryRelationMetrics;
  messageOnlyHeldOut: R3BinaryRelationMetrics;
  matterOnlyHeldOut: R3BinaryRelationMetrics;
  unigramHeldOut: R3BinaryRelationMetrics;
  lexicalOverlapTrain: R3BinaryRelationMetrics;
  lexicalOverlapHeldOut: R3BinaryRelationMetrics;
  lexicalOverlapThreshold: number;
}

const TRAIN_MATTERS: Readonly<
  Record<
    R3SemanticConsumerRelationDomain,
    readonly string[]
  >
> = {
  depot: [
    "acknowledge depot inspection status reports when they arrive",
    "respond to completed depot inspection updates",
    "treat depot inspection completion notices as requiring acknowledgement",
  ],
  courtyard: [
    "acknowledge courtyard flower condition reports when they arrive",
    "respond to courtyard flower condition updates",
    "treat courtyard bloom condition notices as requiring acknowledgement",
  ],
};

const TRAIN_MESSAGES: Readonly<
  Record<
    R3SemanticConsumerRelationDomain,
    readonly string[]
  >
> = {
  depot: [
    "Janek, the depot inspection status is complete.",
    "Janek, depot inspection is finished.",
    "Janek, the depot inspection has been completed.",
  ],
  courtyard: [
    "Janek, the courtyard flowers are blooming.",
    "Janek, courtyard flower condition is good.",
    "Janek, the courtyard blooms are healthy.",
  ],
};

const HELDOUT_MATTERS: Readonly<
  Record<
    R3SemanticConsumerRelationDomain,
    readonly string[]
  >
> = {
  depot: [
    "respond when you receive completion news about the warehouse audit",
    "acknowledge notice that the inventory-site examination has ended",
    "confirm completion updates concerning the goods-store assessment",
  ],
  courtyard: [
    "respond to condition news about the garden vegetation",
    "acknowledge updates concerning the yard plants",
    "confirm reports on the floral display's condition",
  ],
};

const HELDOUT_MESSAGES: Readonly<
  Record<
    R3SemanticConsumerRelationDomain,
    readonly string[]
  >
> = {
  depot: [
    "Janek, the storage check is over.",
    "Janek, the depot review is done.",
    "Janek, the stockroom inspection has concluded.",
  ],
  courtyard: [
    "Janek, the blossoms look healthy.",
    "Janek, the blooms are doing well.",
    "Janek, the flowers are thriving.",
  ],
};

export function buildR3SemanticConsumerRelationCorpus():
R3SemanticConsumerRelationCorpus {
  return {
    examples: [
      ...buildWordingExamples(
        "train-surface",
        TRAIN_MATTERS,
        TRAIN_MESSAGES,
      ),
      ...buildWordingExamples(
        "heldout-paraphrase",
        HELDOUT_MATTERS,
        HELDOUT_MESSAGES,
      ),
    ],
  };
}

export function auditR3SemanticConsumerRelationShortcuts(
  corpus: R3SemanticConsumerRelationCorpus,
): R3SemanticConsumerRelationShortcutAudit {
  const train = subset(
    corpus,
    "train-surface",
  );
  const heldOut = subset(
    corpus,
    "heldout-paraphrase",
  );

  assertBinarySupport(train, "train-surface");
  assertBinarySupport(
    heldOut,
    "heldout-paraphrase",
  );

  const trainPositiveRate =
    train.filter(
      (example) => example.shouldRespond,
    ).length / train.length;
  const heldOutPositiveRate =
    heldOut.filter(
      (example) => example.shouldRespond,
    ).length / heldOut.length;
  const fallback =
    trainPositiveRate >= 0.5;

  const exactPair = trainExactMemorizer(
    train,
    (example) =>
      example.matterStatement +
      "\n<PAIR>\n" +
      example.messageText,
    fallback,
  );
  const messageOnly = trainExactMemorizer(
    train,
    (example) => example.messageText,
    fallback,
  );
  const matterOnly = trainExactMemorizer(
    train,
    (example) => example.matterStatement,
    fallback,
  );
  const unigram = trainUnigramMemorizer(
    train,
    trainPositiveRate,
  );

  const lexical =
    trainLexicalOverlapThreshold(train);

  return {
    trainCount: train.length,
    heldOutCount: heldOut.length,
    trainPositiveRate,
    heldOutPositiveRate,
    majorityHeldOut: evaluate(
      heldOut,
      () => fallback,
    ),
    exactPairHeldOut: evaluate(
      heldOut,
      (example) =>
        exactPair.predict(example),
    ),
    messageOnlyHeldOut: evaluate(
      heldOut,
      (example) =>
        messageOnly.predict(example),
    ),
    matterOnlyHeldOut: evaluate(
      heldOut,
      (example) =>
        matterOnly.predict(example),
    ),
    unigramHeldOut: evaluate(
      heldOut,
      (example) => unigram.predict(example),
    ),
    lexicalOverlapTrain: evaluate(
      train,
      (example) =>
        lexicalOverlap(example) >=
        lexical.threshold,
    ),
    lexicalOverlapHeldOut: evaluate(
      heldOut,
      (example) =>
        lexicalOverlap(example) >=
        lexical.threshold,
    ),
    lexicalOverlapThreshold:
      lexical.threshold,
  };
}

function buildWordingExamples(
  wording: R3SemanticConsumerRelationWording,
  matters: Readonly<
    Record<
      R3SemanticConsumerRelationDomain,
      readonly string[]
    >
  >,
  messages: Readonly<
    Record<
      R3SemanticConsumerRelationDomain,
      readonly string[]
    >
  >,
): R3SemanticConsumerRelationExample[] {
  const domains:
    readonly R3SemanticConsumerRelationDomain[] = [
      "depot",
      "courtyard",
    ];
  const examples:
    R3SemanticConsumerRelationExample[] = [];

  for (const matterDomain of domains) {
    for (
      let matterIndex = 0;
      matterIndex <
      matters[matterDomain].length;
      matterIndex += 1
    ) {
      const matterStatement =
        matters[matterDomain][matterIndex]!;

      for (const messageDomain of domains) {
        for (
          let messageIndex = 0;
          messageIndex <
          messages[messageDomain].length;
          messageIndex += 1
        ) {
          examples.push({
            id: [
              "r3:semantic-consumer-relation",
              wording,
              matterDomain,
              String(matterIndex),
              messageDomain,
              String(messageIndex),
            ].join(":"),
            wording,
            matterId:
              MIXED_PRESSURE_MATTER_IDS.reportResponse,
            matterDomain,
            messageDomain,
            matterStatement,
            messageText:
              messages[messageDomain][
                messageIndex
              ]!,
            shouldRespond:
              matterDomain === messageDomain,
          });
        }
      }
    }
  }

  return examples;
}

function subset(
  corpus: R3SemanticConsumerRelationCorpus,
  wording: R3SemanticConsumerRelationWording,
): R3SemanticConsumerRelationExample[] {
  return corpus.examples.filter(
    (example) =>
      example.wording === wording,
  );
}

function trainExactMemorizer(
  train:
    readonly R3SemanticConsumerRelationExample[],
  key: (
    example: R3SemanticConsumerRelationExample,
  ) => string,
  fallback: boolean,
): {
  predict(
    example: R3SemanticConsumerRelationExample,
  ): boolean;
} {
  const counts = new Map<
    string,
    { positive: number; negative: number }
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
    counts.set(signature, current);
  }

  return {
    predict(example) {
      const found = counts.get(key(example));
      if (!found) return fallback;
      return (
        found.positive >= found.negative
      );
    },
  };
}

function trainUnigramMemorizer(
  train:
    readonly R3SemanticConsumerRelationExample[],
  globalPositiveRate: number,
): {
  predict(
    example: R3SemanticConsumerRelationExample,
  ): boolean;
} {
  const stats = new Map<
    string,
    { positive: number; total: number }
  >();

  for (const example of train) {
    for (const token of combinedTokens(example)) {
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
      const rates = combinedTokens(example)
        .map((token) => stats.get(token))
        .filter(
          (
            value,
          ): value is {
            positive: number;
            total: number;
          } =>
            value !== undefined &&
            value.total >= 2,
        )
        .map(
          (value) =>
            value.positive / value.total,
        );

      if (rates.length === 0) {
        return globalPositiveRate >= 0.5;
      }

      const mean =
        rates.reduce(
          (sum, rate) => sum + rate,
          0,
        ) / rates.length;

      return mean >= globalPositiveRate;
    },
  };
}

function trainLexicalOverlapThreshold(
  train:
    readonly R3SemanticConsumerRelationExample[],
): { threshold: number } {
  const scores = [
    ...new Set(
      train.map(lexicalOverlap),
    ),
  ].sort((a, b) => a - b);

  const thresholds: number[] = [];
  if (scores.length === 0) {
    return { threshold: 1 };
  }

  thresholds.push(scores[0]! - 1e-9);
  for (
    let index = 0;
    index < scores.length - 1;
    index += 1
  ) {
    thresholds.push(
      (
        scores[index]! +
        scores[index + 1]!
      ) / 2,
    );
  }
  thresholds.push(
    scores[scores.length - 1]! + 1e-9,
  );

  let bestThreshold = thresholds[0]!;
  let bestBalancedAccuracy = -1;

  for (const threshold of thresholds) {
    const metrics = evaluate(
      train,
      (example) =>
        lexicalOverlap(example) >=
        threshold,
    );
    if (
      metrics.balancedAccuracy >
      bestBalancedAccuracy
    ) {
      bestBalancedAccuracy =
        metrics.balancedAccuracy;
      bestThreshold = threshold;
    }
  }

  return { threshold: bestThreshold };
}

function combinedTokens(
  example:
    R3SemanticConsumerRelationExample,
): readonly string[] {
  return [
    ...new Set([
      ...tokenSet(
        example.matterStatement,
      ),
      ...tokenSet(example.messageText),
    ]),
  ].sort();
}

function lexicalOverlap(
  example:
    R3SemanticConsumerRelationExample,
): number {
  const left =
    tokenSet(example.matterStatement);
  const right =
    tokenSet(example.messageText);

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  const union =
    new Set([...left, ...right]).size;
  return union > 0
    ? intersection / union
    : 0;
}

function tokenSet(
  text: string,
): ReadonlySet<string> {
  return new Set(
    text
      .toLowerCase()
      .match(/[a-z]+(?:'[a-z]+)?/g) ?? [],
  );
}

function evaluate(
  examples:
    readonly R3SemanticConsumerRelationExample[],
  predict: (
    example: R3SemanticConsumerRelationExample,
  ) => boolean,
): R3BinaryRelationMetrics {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;

  for (const example of examples) {
    const predicted = predict(example);
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
  const truePositiveRate =
    positives > 0 ? tp / positives : 0;
  const trueNegativeRate =
    negatives > 0 ? tn / negatives : 0;

  return {
    count: examples.length,
    positives,
    negatives,
    accuracy:
      examples.length > 0
        ? (tp + tn) / examples.length
        : 0,
    balancedAccuracy:
      (
        truePositiveRate +
        trueNegativeRate
      ) / 2,
    truePositiveRate,
    trueNegativeRate,
  };
}

function assertBinarySupport(
  examples:
    readonly R3SemanticConsumerRelationExample[],
  label: string,
): void {
  if (examples.length === 0) {
    throw new Error(
      label + " relation set is empty",
    );
  }

  const positives = examples.filter(
    (example) => example.shouldRespond,
  ).length;

  if (
    positives === 0 ||
    positives === examples.length
  ) {
    throw new Error(
      label +
        " relation set lacks both classes: positives=" +
        positives +
        " total=" +
        examples.length,
    );
  }
}
