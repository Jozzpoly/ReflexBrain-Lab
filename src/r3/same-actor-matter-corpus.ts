import type {
  ResidentMatter,
  ResidentPrivateExperience,
} from "./life-contracts";
import type {
  R3EcologyId,
} from "./learning-corpus";
import type {
  R3MatterWording,
} from "./matter-relation-corpus";
import type {
  R3TransitionMatterCorpus,
  R3TransitionMatterExample,
} from "./transition-matter-corpus";

export type R3SameActorMatterResident =
  | "resident:janek"
  | "resident:ida";

export interface R3SameActorMatterExample {
  residentId: R3SameActorMatterResident;
  ecology: R3EcologyId;
  wording: R3MatterWording;
  anchorTick: number;
  transitionHistory: readonly string[];
  positiveMatter: ResidentMatter;
  candidateMatters: readonly ResidentMatter[];
  eventful: boolean;
}

export interface R3SameActorMatterCorpus {
  examples: readonly R3SameActorMatterExample[];
}

export interface R3SameActorMatterDiversityAudit {
  residentId: R3SameActorMatterResident;
  wording: R3MatterWording;
  rawExampleCount: number;
  candidateCount: number;
  uniqueLabeledQueryCount: number;
  uniqueTransitionHistoryCount: number;
  ambiguousTransitionHistoryCount: number;
  ambiguousTransitionHistoryRate: number;
  sourceEcologies: readonly R3EcologyId[];
  eventfulRawCount: number;
  eventfulUniqueLabeledQueryCount: number;
}

export interface R3SameActorMatterLexicalAudit {
  residentId: R3SameActorMatterResident;
  wording: R3MatterWording;
  exampleCount: number;
  candidateCount: number;
  chanceTop1: number;
  top1Accuracy: number;
  eventfulExampleCount: number;
  eventfulTop1Accuracy: number;
  tieRate: number;
}

export function buildR3SameActorMatterCorpus(
  transitionCorpus: R3TransitionMatterCorpus,
): R3SameActorMatterCorpus {
  const residents: readonly R3SameActorMatterResident[] = [
    "resident:janek",
    "resident:ida",
  ];
  const wordings: readonly R3MatterWording[] = [
    "baseline",
    "paraphrase",
  ];

  const examples: R3SameActorMatterExample[] = [];

  for (const residentId of residents) {
    for (const wording of wordings) {
      const source = transitionCorpus.examples.filter(
        (example) =>
          example.residentId === residentId &&
          example.wording === wording,
      );

      const candidates = uniquePositiveMatters(source);
      if (candidates.length < 2) {
        throw new Error(
          "same-actor matter probe requires >=2 matters for " +
            residentId +
            "/" +
            wording,
        );
      }

      for (const example of source) {
        examples.push({
          residentId,
          ecology: example.ecology,
          wording,
          anchorTick: example.anchorTick,
          transitionHistory: [...example.transitionHistory],
          positiveMatter: structuredClone(
            example.positiveMatter,
          ),
          candidateMatters: candidates.map((matter) =>
            structuredClone(matter),
          ),
          eventful: example.eventful,
        });
      }
    }
  }

  return { examples };
}

export function auditR3SameActorMatterDiversity(
  corpus: R3SameActorMatterCorpus,
  residentId: R3SameActorMatterResident,
  wording: R3MatterWording,
): R3SameActorMatterDiversityAudit {
  const raw = subset(corpus, residentId, wording);
  const unique = uniqueR3SameActorMatterExamples(
    corpus,
    residentId,
    wording,
  );

  const historyToMatters =
    new Map<string, Set<string>>();
  for (const example of raw) {
    const signature =
      transitionHistorySignature(example);
    const matters =
      historyToMatters.get(signature) ??
      new Set<string>();
    matters.add(example.positiveMatter.id);
    historyToMatters.set(signature, matters);
  }

  const ambiguous =
    [...historyToMatters.values()].filter(
      (matters) => matters.size > 1,
    ).length;

  return {
    residentId,
    wording,
    rawExampleCount: raw.length,
    candidateCount:
      unique[0]?.candidateMatters.length ?? 0,
    uniqueLabeledQueryCount: unique.length,
    uniqueTransitionHistoryCount:
      historyToMatters.size,
    ambiguousTransitionHistoryCount: ambiguous,
    ambiguousTransitionHistoryRate:
      historyToMatters.size > 0
        ? ambiguous / historyToMatters.size
        : 0,
    sourceEcologies: [
      ...new Set(raw.map((example) => example.ecology)),
    ].sort(),
    eventfulRawCount: raw.filter(
      (example) => example.eventful,
    ).length,
    eventfulUniqueLabeledQueryCount: unique.filter(
      (example) => example.eventful,
    ).length,
  };
}

export function auditR3SameActorMatterLexicalRetrieval(
  corpus: R3SameActorMatterCorpus,
  residentId: R3SameActorMatterResident,
  wording: R3MatterWording,
): R3SameActorMatterLexicalAudit {
  const examples = uniqueR3SameActorMatterExamples(
    corpus,
    residentId,
    wording,
  );

  let correct = 0;
  let eventfulCorrect = 0;
  let eventfulCount = 0;
  let ties = 0;

  for (const example of examples) {
    const query = tokenSet(
      example.transitionHistory.join("\n"),
    );
    const scored = example.candidateMatters.map(
      (matter) => ({
        matter,
        score: lexicalJaccard(
          query,
          tokenSet(matter.statement),
        ),
      }),
    );
    const bestScore = Math.max(
      ...scored.map((entry) => entry.score),
    );
    const best = scored.filter(
      (entry) => entry.score === bestScore,
    );
    if (best.length > 1) ties += 1;

    const predicted = [...best].sort((a, b) =>
      a.matter.id.localeCompare(b.matter.id),
    )[0]!.matter.id;
    const hit =
      predicted === example.positiveMatter.id;

    if (hit) correct += 1;
    if (example.eventful) {
      eventfulCount += 1;
      if (hit) eventfulCorrect += 1;
    }
  }

  const candidateCount =
    examples[0]?.candidateMatters.length ?? 0;

  return {
    residentId,
    wording,
    exampleCount: examples.length,
    candidateCount,
    chanceTop1:
      candidateCount > 0 ? 1 / candidateCount : 0,
    top1Accuracy:
      examples.length > 0
        ? correct / examples.length
        : 0,
    eventfulExampleCount: eventfulCount,
    eventfulTop1Accuracy:
      eventfulCount > 0
        ? eventfulCorrect / eventfulCount
        : 0,
    tieRate:
      examples.length > 0
        ? ties / examples.length
        : 0,
  };
}

export function uniqueR3SameActorMatterExamples(
  corpus: R3SameActorMatterCorpus,
  residentId: R3SameActorMatterResident,
  wording: R3MatterWording,
): readonly R3SameActorMatterExample[] {
  const bySignature =
    new Map<string, R3SameActorMatterExample>();

  for (const example of subset(
    corpus,
    residentId,
    wording,
  )) {
    const signature = JSON.stringify({
      transitionHistory:
        transitionHistorySignature(example),
      positiveMatterId: example.positiveMatter.id,
    });
    if (!bySignature.has(signature)) {
      bySignature.set(signature, example);
    }
  }

  return [...bySignature.values()];
}

function subset(
  corpus: R3SameActorMatterCorpus,
  residentId: R3SameActorMatterResident,
  wording: R3MatterWording,
): R3SameActorMatterExample[] {
  return corpus.examples.filter(
    (example) =>
      example.residentId === residentId &&
      example.wording === wording,
  );
}

function uniquePositiveMatters(
  examples: readonly R3TransitionMatterExample[],
): ResidentMatter[] {
  const byId = new Map<string, ResidentMatter>();
  for (const example of examples) {
    byId.set(
      example.positiveMatter.id,
      structuredClone(example.positiveMatter),
    );
  }
  return [...byId.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
}

function transitionHistorySignature(
  example: Pick<
    R3SameActorMatterExample,
    "transitionHistory"
  >,
): string {
  return JSON.stringify(example.transitionHistory);
}

function tokenSet(text: string): ReadonlySet<string> {
  return new Set(
    text
      .toLowerCase()
      .match(/[a-z]+(?:'[a-z]+)?/g) ?? [],
  );
}

function lexicalJaccard(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): number {
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  const union = new Set([...left, ...right]).size;
  return union > 0 ? intersection / union : 0;
}
