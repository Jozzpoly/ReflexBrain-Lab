import {
  createAutonomousContactRun,
} from "./autonomous-contact-run";
import {
  createAutonomousLifeRun,
} from "./autonomous-life-run";
import type {
  ResidentMatter,
  ResidentPrivateExperience,
} from "./life-contracts";
import type {
  R3EcologyId,
} from "./learning-corpus";
import {
  r3ContactParaphraseMatters,
  r3MaterialParaphraseMatters,
  type R3MatterWording,
} from "./matter-relation-corpus";
import {
  buildR3PrivateTrajectoryWindows,
} from "./private-trajectory";
import {
  serializeR3PrivateTransition,
} from "./private-transition-view";

export interface R3TransitionMatterExample {
  ecology: R3EcologyId;
  wording: R3MatterWording;
  residentId: ResidentPrivateExperience["residentId"];
  anchorTick: number;
  transitionHistory: readonly string[];
  positiveMatter: ResidentMatter;
  candidateMatters: readonly ResidentMatter[];
  eventful: boolean;
}

export interface R3TransitionMatterCorpus {
  examples: readonly R3TransitionMatterExample[];
}

export interface R3TransitionSemanticDiversityAudit {
  ecology: R3EcologyId;
  wording: R3MatterWording;
  rawExampleCount: number;
  uniqueLabeledQueryCount: number;
  uniqueTransitionHistoryCount: number;
  uniqueTransitionFrameCount: number;
  compressionRatio: number;
  ambiguousTransitionHistoryCount: number;
  ambiguousTransitionHistoryRate: number;
  eventfulRawCount: number;
  eventfulUniqueLabeledQueryCount: number;
}

export interface R3TransitionLexicalRetrievalAudit {
  ecology: R3EcologyId;
  wording: R3MatterWording;
  exampleCount: number;
  candidateCount: number;
  top1Accuracy: number;
  eventfulExampleCount: number;
  eventfulTop1Accuracy: number;
  tieRate: number;
}

export function buildR3TransitionMatterCorpus(options: {
  materialTicks?: number;
  contactTicks?: number;
  historyLength?: number;
} = {}): R3TransitionMatterCorpus {
  const historyLength = options.historyLength ?? 8;
  if (historyLength < 2) {
    throw new Error(
      "transition matter corpus requires historyLength >= 2",
    );
  }

  const materialTicks = options.materialTicks ?? 900;
  const contactTicks = options.contactTicks ?? 900;

  const materialBaseline = createAutonomousLifeRun();
  materialBaseline.runTicks(materialTicks);

  const materialParaphrase = createAutonomousLifeRun({
    matterOverrides: r3MaterialParaphraseMatters(),
  });
  materialParaphrase.runTicks(materialTicks);

  const contactBaseline = createAutonomousContactRun();
  contactBaseline.runTicks(contactTicks);

  const contactParaphrase = createAutonomousContactRun({
    matterOverrides: r3ContactParaphraseMatters(),
  });
  contactParaphrase.runTicks(contactTicks);

  return {
    examples: [
      ...transitionExamples(
        "material-work",
        "baseline",
        materialBaseline.privateExperiences(),
        historyLength,
      ),
      ...transitionExamples(
        "material-work",
        "paraphrase",
        materialParaphrase.privateExperiences(),
        historyLength,
      ),
      ...transitionExamples(
        "moving-contact",
        "baseline",
        contactBaseline.privateExperiences(),
        historyLength,
      ),
      ...transitionExamples(
        "moving-contact",
        "paraphrase",
        contactParaphrase.privateExperiences(),
        historyLength,
      ),
    ],
  };
}

export function auditR3TransitionSemanticDiversity(
  corpus: R3TransitionMatterCorpus,
  ecology: R3EcologyId,
  wording: R3MatterWording,
): R3TransitionSemanticDiversityAudit {
  const raw = subset(corpus, ecology, wording);
  const unique = uniqueTransitionExamples(
    corpus,
    ecology,
    wording,
  );

  const historyToMatters = new Map<string, Set<string>>();
  const frames = new Set<string>();

  for (const example of raw) {
    const signature = transitionHistorySignature(example);
    const matters =
      historyToMatters.get(signature) ?? new Set<string>();
    matters.add(example.positiveMatter.id);
    historyToMatters.set(signature, matters);

    for (const frame of example.transitionHistory) {
      frames.add(frame);
    }
  }

  const ambiguous = [...historyToMatters.values()].filter(
    (matters) => matters.size > 1,
  ).length;

  return {
    ecology,
    wording,
    rawExampleCount: raw.length,
    uniqueLabeledQueryCount: unique.length,
    uniqueTransitionHistoryCount: historyToMatters.size,
    uniqueTransitionFrameCount: frames.size,
    compressionRatio: unique.length / raw.length,
    ambiguousTransitionHistoryCount: ambiguous,
    ambiguousTransitionHistoryRate:
      historyToMatters.size > 0
        ? ambiguous / historyToMatters.size
        : 0,
    eventfulRawCount: raw.filter(
      (example) => example.eventful,
    ).length,
    eventfulUniqueLabeledQueryCount: unique.filter(
      (example) => example.eventful,
    ).length,
  };
}

export function auditR3TransitionLexicalRetrieval(
  corpus: R3TransitionMatterCorpus,
  ecology: R3EcologyId,
  wording: R3MatterWording,
): R3TransitionLexicalRetrievalAudit {
  const examples = uniqueTransitionExamples(
    corpus,
    ecology,
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
    const scores = example.candidateMatters.map((matter) => ({
      matter,
      score: lexicalJaccard(
        query,
        tokenSet(matter.statement),
      ),
    }));
    const bestScore = Math.max(
      ...scores.map((entry) => entry.score),
    );
    const best = scores.filter(
      (entry) => entry.score === bestScore,
    );
    if (best.length > 1) ties += 1;

    const predicted = [...best].sort((a, b) =>
      a.matter.id.localeCompare(b.matter.id),
    )[0]!.matter.id;

    const hit = predicted === example.positiveMatter.id;
    if (hit) correct += 1;

    if (example.eventful) {
      eventfulCount += 1;
      if (hit) eventfulCorrect += 1;
    }
  }

  return {
    ecology,
    wording,
    exampleCount: examples.length,
    candidateCount:
      examples[0]?.candidateMatters.length ?? 0,
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
      examples.length > 0 ? ties / examples.length : 0,
  };
}

export function uniqueTransitionExamples(
  corpus: R3TransitionMatterCorpus,
  ecology: R3EcologyId,
  wording: R3MatterWording,
): readonly R3TransitionMatterExample[] {
  const bySignature = new Map<
    string,
    R3TransitionMatterExample
  >();

  for (const example of subset(corpus, ecology, wording)) {
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

function transitionExamples(
  ecology: R3EcologyId,
  wording: R3MatterWording,
  experiences: readonly ResidentPrivateExperience[],
  historyLength: number,
): R3TransitionMatterExample[] {
  const matters = uniqueMatters(experiences);
  if (matters.length < 2) {
    throw new Error(
      "transition matter probe requires >=2 matters",
    );
  }

  return buildR3PrivateTrajectoryWindows(experiences, {
    historyLength,
    horizonTicks: 1,
  }).flatMap((window) => {
    const anchor =
      window.history[window.history.length - 1]!;
    const positive = anchor.matters[0];
    if (!positive) return [];

    const transitions = [];
    let eventful = false;
    for (
      let index = 1;
      index < window.history.length;
      index += 1
    ) {
      const frame = serializeR3PrivateTransition(
        window.history[index - 1]!,
        window.history[index]!,
      );
      transitions.push(frame.semanticText);
      eventful ||= frame.changed;
    }

    return [{
      ecology,
      wording,
      residentId: window.residentId,
      anchorTick: anchor.tick,
      transitionHistory: transitions,
      positiveMatter: structuredClone(positive),
      candidateMatters: matters.map(
        (matter) => structuredClone(matter),
      ),
      eventful,
    }];
  });
}

function subset(
  corpus: R3TransitionMatterCorpus,
  ecology: R3EcologyId,
  wording: R3MatterWording,
): R3TransitionMatterExample[] {
  return corpus.examples.filter(
    (example) =>
      example.ecology === ecology &&
      example.wording === wording,
  );
}

function uniqueMatters(
  experiences: readonly ResidentPrivateExperience[],
): ResidentMatter[] {
  const byId = new Map<string, ResidentMatter>();
  for (const experience of experiences) {
    for (const matter of experience.matters) {
      byId.set(matter.id, structuredClone(matter));
    }
  }
  return [...byId.values()].sort(
    (a, b) => a.id.localeCompare(b.id),
  );
}

function transitionHistorySignature(
  example: R3TransitionMatterExample,
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
