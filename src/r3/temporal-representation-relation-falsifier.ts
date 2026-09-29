import {
  buildR3TemporalConsumerRelationCorpus,
  type R3TemporalRelationState,
} from "./temporal-consumer-relation-corpus";

export interface R3TemporalStateProbeExample {
  id: string;
  text: string;
  state: "complete" | "delayed";
  label: boolean;
}

export interface R3TemporalKnownRelationExample {
  id: string;
  historyText: string;
  currentText: string;
  historyState: "complete" | "delayed";
  currentState: "complete" | "delayed";
  shouldRespond: boolean;
}

export const R3_TEMPORAL_HELDOUT_KNOWN_SURFACES = {
  complete: [
    "Janek, the depot review has wrapped up.",
    "Janek, the storage-area checks are all signed off.",
    "Janek, the warehouse assessment is now concluded.",
    "Janek, the stock-area inspection work is over.",
  ],
  delayed: [
    "Janek, the depot review is behind schedule.",
    "Janek, the storage-area checks need additional time.",
    "Janek, the warehouse assessment is taking longer than planned.",
    "Janek, the stock-area inspection work is running late.",
  ],
} as const;

export function buildR3TemporalTrainStateProbeExamples():
readonly R3TemporalStateProbeExample[] {
  const corpus = buildR3TemporalConsumerRelationCorpus();
  const byText = new Map<string, "complete" | "delayed">();

  for (const example of corpus.examples) {
    if (example.split !== "train") {
      continue;
    }
    addKnownState(byText, example.priorAcknowledgedText, example.priorAcknowledgedState);
    addKnownState(byText, example.currentMessageText, example.currentState);
  }

  return [...byText.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([text, state], index) => ({
      id: "r3:temporal-rep-rel:train-state:" + index,
      text,
      state,
      label: state === "complete",
    }));
}

export function buildR3TemporalHeldoutKnownStateProbeExamples():
readonly R3TemporalStateProbeExample[] {
  const result: R3TemporalStateProbeExample[] = [];

  for (const state of ["complete", "delayed"] as const) {
    for (let index = 0; index < R3_TEMPORAL_HELDOUT_KNOWN_SURFACES[state].length; index += 1) {
      const text = R3_TEMPORAL_HELDOUT_KNOWN_SURFACES[state][index]!;
      result.push({
        id: "r3:temporal-rep-rel:heldout-state:" + state + ":" + index,
        text,
        state,
        label: state === "complete",
      });
    }
  }

  return result;
}

export function buildR3TemporalHeldoutKnownRelationExamples():
readonly R3TemporalKnownRelationExample[] {
  const stateExamples = buildR3TemporalHeldoutKnownStateProbeExamples();
  const result: R3TemporalKnownRelationExample[] = [];

  for (const history of stateExamples) {
    for (const current of stateExamples) {
      result.push({
        id: "r3:temporal-rep-rel:heldout-relation:" + history.id + "=>" + current.id,
        historyText: history.text,
        currentText: current.text,
        historyState: history.state,
        currentState: current.state,
        shouldRespond: history.state !== current.state,
      });
    }
  }

  return result;
}

export function buildR3TemporalJointPairText(
  historyText: string,
  currentText: string,
): string {
  return (
    "Previous acknowledged report: " +
    historyText +
    "\nCurrent report: " +
    currentText
  );
}

export function evaluateR3TemporalStateExactTextBaseline(
  train: readonly R3TemporalStateProbeExample[],
  heldOut: readonly R3TemporalStateProbeExample[],
): readonly boolean[] {
  const labels = new Map(train.map((example) => [example.text, example.label] as const));
  const fallback = positiveRate(train) >= 0.5;
  return heldOut.map((example) => labels.get(example.text) ?? fallback);
}

export function evaluateR3TemporalStateUnigramBaseline(
  train: readonly R3TemporalStateProbeExample[],
  heldOut: readonly R3TemporalStateProbeExample[],
): readonly boolean[] {
  const stats = new Map<string, { positive: number; negative: number }>();

  for (const example of train) {
    for (const token of tokenSet(example.text)) {
      const found = stats.get(token) ?? { positive: 0, negative: 0 };
      if (example.label) {
        found.positive += 1;
      } else {
        found.negative += 1;
      }
      stats.set(token, found);
    }
  }

  return heldOut.map((example) => {
    let score = 0;
    for (const token of tokenSet(example.text)) {
      const found = stats.get(token);
      if (!found) {
        continue;
      }
      score += Math.log((found.positive + 1) / (found.negative + 1));
    }
    return score >= 0;
  });
}

export function evaluateR3TemporalKnownRelationExactPairBaseline(
  trainPairs: readonly {
    historyText: string;
    currentText: string;
    shouldRespond: boolean;
  }[],
  heldOut: readonly R3TemporalKnownRelationExample[],
): readonly boolean[] {
  const labels = new Map(
    trainPairs.map((example) => [
      example.historyText + "\n=>\n" + example.currentText,
      example.shouldRespond,
    ] as const),
  );
  const fallback =
    trainPairs.filter((example) => example.shouldRespond).length /
      trainPairs.length >=
    0.5;

  return heldOut.map(
    (example) =>
      labels.get(example.historyText + "\n=>\n" + example.currentText) ??
      fallback,
  );
}

function addKnownState(
  byText: Map<string, "complete" | "delayed">,
  text: string,
  state: R3TemporalRelationState,
): void {
  if (state === "suspended") {
    throw new Error("suspended state entered representation TRAIN");
  }
  const existing = byText.get(text);
  if (existing && existing !== state) {
    throw new Error("same TRAIN text mapped to multiple semantic states");
  }
  byText.set(text, state);
}

function positiveRate(
  examples: readonly R3TemporalStateProbeExample[],
): number {
  return examples.filter((example) => example.label).length / examples.length;
}

function tokenSet(text: string): readonly string[] {
  return [
    ...new Set(
      text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [],
    ),
  ];
}
