import {
  createAutonomousContactRun,
  r3ContactAuthoredMatters,
} from "./autonomous-contact-run";
import {
  createAutonomousLifeRun,
  r3MaterialAuthoredMatters,
} from "./autonomous-life-run";
import type {
  ResidentDecision,
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
  serializeR3PrivateTransition,
} from "./private-transition-view";
import type {
  R3SameActorMatterResident,
} from "./same-actor-matter-corpus";

export interface R3CausalMatterResponsibilityExample {
  residentId: R3SameActorMatterResident;
  ecology: R3EcologyId;
  wording: R3MatterWording;
  anchorTick: number;
  transitionHistory: readonly string[];
  candidateMatters: readonly ResidentMatter[];
  causallyResponsibleMatterId: string;
  baselineDecision: ResidentDecision;
  ablationDecisionByMatterId: Readonly<
    Record<string, ResidentDecision>
  >;
}

export interface R3CausalMatterResponsibilityCorpus {
  examples: readonly R3CausalMatterResponsibilityExample[];
}

export interface R3CausalMatterResponsibilityAudit {
  residentId: R3SameActorMatterResident;
  wording: R3MatterWording;
  exampleCount: number;
  uniqueTransitionHistoryCount: number;
  ambiguousTransitionHistoryCount: number;
  ambiguousTransitionHistoryRate: number;
  sourceEcologies: readonly R3EcologyId[];
  responsibilityCounts: Readonly<Record<string, number>>;
  lexicalTop1Accuracy: number;
  lexicalTieRate: number;
  chanceTop1: number;
}

const DEFAULT_SAMPLE_TICKS = [
  8,
  20,
  45,
  80,
  130,
  210,
  340,
  520,
  800,
] as const;

/**
 * Build supervision from a real local causal intervention.
 *
 * Baseline and each ablation replay the same deterministic prefix with BOTH
 * same-actor matters present. Only immediately before the sampled next
 * decision does the variant remove one matter.
 *
 * The query is derived from the baseline actor-private transition history
 * BEFORE intervention. Matter identity/text never appears in the query.
 */
export function buildR3CausalMatterResponsibilityCorpus(
  options: {
    historyLength?: number;
    sampleTicks?: readonly number[];
    wordings?: readonly R3MatterWording[];
  } = {},
): R3CausalMatterResponsibilityCorpus {
  const historyLength = options.historyLength ?? 8;
  if (historyLength < 2) {
    throw new Error(
      "causal matter corpus requires historyLength >= 2",
    );
  }

  const sampleTicks =
    options.sampleTicks ?? DEFAULT_SAMPLE_TICKS;
  const wordings =
    options.wordings ??
    (["baseline", "paraphrase"] as const);

  const examples: R3CausalMatterResponsibilityExample[] = [];

  for (const wording of wordings) {
    for (const residentId of [
      "resident:janek",
      "resident:ida",
    ] as const) {
      for (const ecology of [
        "material-work",
        "moving-contact",
      ] as const) {
        for (const anchorTick of sampleTicks) {
          if (anchorTick < historyLength) continue;
          const example = buildOneCausalExample({
            residentId,
            ecology,
            wording,
            anchorTick,
            historyLength,
          });
          if (example) examples.push(example);
        }
      }
    }
  }

  return { examples };
}

export function auditR3CausalMatterResponsibility(
  corpus: R3CausalMatterResponsibilityCorpus,
  residentId: R3SameActorMatterResident,
  wording: R3MatterWording,
): R3CausalMatterResponsibilityAudit {
  const examples = corpus.examples.filter(
    (example) =>
      example.residentId === residentId &&
      example.wording === wording,
  );

  if (examples.length === 0) {
    throw new Error(
      "causal matter audit subset is empty: " +
        residentId +
        "/" +
        wording,
    );
  }

  const historyToResponsible = new Map<
    string,
    Set<string>
  >();
  const counts: Record<string, number> = {};
  let lexicalCorrect = 0;
  let lexicalTies = 0;

  for (const example of examples) {
    const signature = JSON.stringify(
      example.transitionHistory,
    );
    const responsible =
      historyToResponsible.get(signature) ??
      new Set<string>();
    responsible.add(
      example.causallyResponsibleMatterId,
    );
    historyToResponsible.set(
      signature,
      responsible,
    );

    counts[example.causallyResponsibleMatterId] =
      (counts[
        example.causallyResponsibleMatterId
      ] ?? 0) + 1;

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
    if (best.length > 1) lexicalTies += 1;

    const predicted = [...best].sort(
      (a, b) =>
        a.matter.id.localeCompare(b.matter.id),
    )[0]!.matter.id;
    if (
      predicted ===
      example.causallyResponsibleMatterId
    ) {
      lexicalCorrect += 1;
    }
  }

  const ambiguous =
    [...historyToResponsible.values()].filter(
      (responsible) => responsible.size > 1,
    ).length;

  return {
    residentId,
    wording,
    exampleCount: examples.length,
    uniqueTransitionHistoryCount:
      historyToResponsible.size,
    ambiguousTransitionHistoryCount: ambiguous,
    ambiguousTransitionHistoryRate:
      historyToResponsible.size > 0
        ? ambiguous /
          historyToResponsible.size
        : 0,
    sourceEcologies: [
      ...new Set(
        examples.map((example) => example.ecology),
      ),
    ].sort(),
    responsibilityCounts: counts,
    lexicalTop1Accuracy:
      lexicalCorrect / examples.length,
    lexicalTieRate:
      lexicalTies / examples.length,
    chanceTop1:
      1 / examples[0]!.candidateMatters.length,
  };
}

function buildOneCausalExample(options: {
  residentId: R3SameActorMatterResident;
  ecology: R3EcologyId;
  wording: R3MatterWording;
  anchorTick: number;
  historyLength: number;
}): R3CausalMatterResponsibilityExample | null {
  const candidates = concurrentMatters(
    options.residentId,
    options.wording,
  );

  const baseline = createRun(
    options.ecology,
    options.residentId,
    candidates,
  );
  baseline.runTicks(options.anchorTick);

  const history = residentHistory(
    baseline.privateExperiences(),
    options.residentId,
    options.historyLength,
  );
  if (history.length < options.historyLength) {
    return null;
  }

  baseline.advanceOneTick();
  const baselineRow = requiredRowAtTick(
    baseline.privateExperiences(),
    options.residentId,
    options.anchorTick,
  );

  const ablationDecisionByMatterId:
    Record<string, ResidentDecision> = {};
  const responsible: string[] = [];

  for (const matter of candidates) {
    const variant = createRun(
      options.ecology,
      options.residentId,
      candidates,
    );
    variant.runTicks(options.anchorTick);
    variant.researchReplaceResidentMatters(
      options.residentId,
      candidates.filter(
        (candidate) =>
          candidate.id !== matter.id,
      ),
    );
    variant.advanceOneTick();

    const variantRow = requiredRowAtTick(
      variant.privateExperiences(),
      options.residentId,
      options.anchorTick,
    );
    ablationDecisionByMatterId[matter.id] =
      structuredClone(variantRow.decision);

    if (
      stableDecision(variantRow.decision) !==
      stableDecision(baselineRow.decision)
    ) {
      responsible.push(matter.id);
    }
  }

  // We only keep clean causal examples. Zero or multiple responsible matters
  // are evidence that this fixture state cannot supervise the relation.
  if (responsible.length !== 1) {
    return null;
  }

  const transitionHistory: string[] = [];
  for (
    let index = 1;
    index < history.length;
    index += 1
  ) {
    transitionHistory.push(
      serializeR3PrivateTransition(
        history[index - 1]!,
        history[index]!,
      ).semanticText,
    );
  }

  return {
    residentId: options.residentId,
    ecology: options.ecology,
    wording: options.wording,
    anchorTick: options.anchorTick,
    transitionHistory,
    candidateMatters: candidates.map(
      (matter) => structuredClone(matter),
    ),
    causallyResponsibleMatterId:
      responsible[0]!,
    baselineDecision:
      structuredClone(baselineRow.decision),
    ablationDecisionByMatterId,
  };
}

function createRun(
  ecology: R3EcologyId,
  targetResident: R3SameActorMatterResident,
  targetMatters: readonly ResidentMatter[],
): {
  runTicks(count: number): unknown;
  advanceOneTick(): unknown;
  privateExperiences(): readonly ResidentPrivateExperience[];
  researchReplaceResidentMatters(
    residentId: R3SameActorMatterResident,
    matters: readonly ResidentMatter[],
  ): void;
} {
  const overrides = {
    [targetResident]: targetMatters,
  };

  if (ecology === "material-work") {
    return createAutonomousLifeRun({
      matterOverrides: overrides,
    });
  }

  return createAutonomousContactRun({
    matterOverrides: overrides,
  });
}

function concurrentMatters(
  residentId: R3SameActorMatterResident,
  wording: R3MatterWording,
): ResidentMatter[] {
  if (wording === "baseline") {
    return [
      ...r3MaterialAuthoredMatters(residentId),
      ...r3ContactAuthoredMatters(residentId),
    ].map((matter) => structuredClone(matter));
  }

  const material =
    r3MaterialParaphraseMatters()[residentId] ?? [];
  const contact =
    r3ContactParaphraseMatters()[residentId] ?? [];

  return [...material, ...contact].map(
    (matter) => structuredClone(matter),
  );
}

function residentHistory(
  experiences: readonly ResidentPrivateExperience[],
  residentId: R3SameActorMatterResident,
  length: number,
): ResidentPrivateExperience[] {
  return experiences
    .filter(
      (experience) =>
        experience.residentId === residentId,
    )
    .slice(-length)
    .map((experience) =>
      structuredClone(experience),
    );
}

function requiredRowAtTick(
  experiences: readonly ResidentPrivateExperience[],
  residentId: R3SameActorMatterResident,
  tick: number,
): ResidentPrivateExperience {
  const row = experiences.find(
    (experience) =>
      experience.residentId === residentId &&
      experience.tick === tick,
  );
  if (!row) {
    throw new Error(
      "missing resident experience at tick " +
        tick +
        " for " +
        residentId,
    );
  }
  return row;
}

function stableDecision(
  decision: ResidentDecision,
): string {
  return JSON.stringify(decision);
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

function lexicalJaccard(
  left: ReadonlySet<string>,
  right: ReadonlySet<string>,
): number {
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  const union =
    new Set([...left, ...right]).size;
  return union > 0
    ? intersection / union
    : 0;
}
