import type {
  ResidentDecision,
  ResidentMatter,
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  createR3MixedPressureRun,
} from "./mixed-pressure-run";
import {
  MIXED_PRESSURE_MATTER_IDS,
  r3MixedPressureJanekMatters,
  type R3MixedPressureMatterWording,
} from "./mixed-pressure-fixture-policy";
import {
  MATERIAL_FIXTURE_MATTER_IDS,
} from "./life-fixture-policies";
import {
  serializeR3PrivateTransition,
} from "./private-transition-view";

export interface R3MixedPressureCausalExample {
  wording: R3MixedPressureMatterWording;
  anchorTick: number;
  queryEndTick: number;
  transitionHistory: readonly string[];
  candidateMatters: readonly ResidentMatter[];
  causallyResponsibleMatterId: string;
  baselineDecision: ResidentDecision;
  ablationDecisionByMatterId: Readonly<
    Record<string, ResidentDecision>
  >;
}

export interface R3MixedPressureCausalCorpus {
  examples: readonly R3MixedPressureCausalExample[];
}

export interface R3MixedPressureCausalAudit {
  wording: R3MixedPressureMatterWording;
  exampleCount: number;
  uniqueTransitionHistoryCount: number;
  ambiguousTransitionHistoryCount: number;
  ambiguousTransitionHistoryRate: number;
  responsibilityCounts: Readonly<Record<string, number>>;
  lexicalTop1Accuracy: number;
  lexicalTieRate: number;
  chanceTop1: number;
  reportResponsibleCount: number;
  workshopResponsibleCount: number;
}

export function buildR3MixedPressureCausalCorpus(
  options: {
    scanTicks?: number;
    historyLength?: number;
    maxPerMatter?: number;
  } = {},
): R3MixedPressureCausalCorpus {
  const scanTicks = options.scanTicks ?? 700;
  const historyLength = options.historyLength ?? 8;
  const maxPerMatter = options.maxPerMatter ?? 6;

  if (!Number.isSafeInteger(scanTicks) || scanTicks < 120) {
    throw new Error(
      "mixed causal scanTicks must be a safe integer >= 120",
    );
  }
  if (!Number.isSafeInteger(historyLength) || historyLength < 2) {
    throw new Error(
      "mixed causal historyLength must be >= 2",
    );
  }
  if (!Number.isSafeInteger(maxPerMatter) || maxPerMatter < 2) {
    throw new Error(
      "mixed causal maxPerMatter must be >= 2",
    );
  }

  const examples: R3MixedPressureCausalExample[] = [];

  for (const wording of [
    "baseline",
    "paraphrase",
  ] as const) {
    const candidateTicks = surveyCandidateTicks(
      wording,
      scanTicks,
      historyLength,
    );

    const raw = candidateTicks.flatMap((anchorTick) => {
      const example = buildOneMixedCausalExample({
        wording,
        anchorTick,
        historyLength,
      });
      return example ? [example] : [];
    });

    const workshop = raw
      .filter(
        (example) =>
          example.causallyResponsibleMatterId ===
          MATERIAL_FIXTURE_MATTER_IDS.worker,
      )
      .slice(0, maxPerMatter);
    const report = raw
      .filter(
        (example) =>
          example.causallyResponsibleMatterId ===
          MIXED_PRESSURE_MATTER_IDS.reportResponse,
      )
      .slice(0, maxPerMatter);

    const balanced = Math.min(
      workshop.length,
      report.length,
      maxPerMatter,
    );

    if (balanced < 2) {
      throw new Error(
        "mixed-pressure causal corpus did not produce enough responsibility switching for " +
          wording,
      );
    }

    examples.push(
      ...workshop.slice(0, balanced),
      ...report.slice(0, balanced),
    );
  }

  return {
    examples: examples.sort(
      (a, b) =>
        a.wording.localeCompare(b.wording) ||
        a.anchorTick - b.anchorTick,
    ),
  };
}

export function auditR3MixedPressureCausalResponsibility(
  corpus: R3MixedPressureCausalCorpus,
  wording: R3MixedPressureMatterWording,
): R3MixedPressureCausalAudit {
  const examples = corpus.examples.filter(
    (example) => example.wording === wording,
  );

  if (examples.length === 0) {
    throw new Error(
      "mixed causal audit subset is empty: " + wording,
    );
  }

  const historyToLabels = new Map<string, Set<string>>();
  const responsibilityCounts: Record<string, number> = {};
  let lexicalCorrect = 0;
  let lexicalTies = 0;

  for (const example of examples) {
    const signature = JSON.stringify(
      example.transitionHistory,
    );
    const labels =
      historyToLabels.get(signature) ?? new Set<string>();
    labels.add(example.causallyResponsibleMatterId);
    historyToLabels.set(signature, labels);

    responsibilityCounts[
      example.causallyResponsibleMatterId
    ] =
      (responsibilityCounts[
        example.causallyResponsibleMatterId
      ] ?? 0) + 1;

    const query = tokenSet(
      example.transitionHistory.join("\n"),
    );
    const scored = example.candidateMatters.map((matter) => ({
      matter,
      score: lexicalJaccard(
        query,
        tokenSet(matter.statement),
      ),
    }));
    const bestScore = Math.max(
      ...scored.map((entry) => entry.score),
    );
    const best = scored.filter(
      (entry) => entry.score === bestScore,
    );
    if (best.length > 1) lexicalTies += 1;

    const predicted = [...best].sort((a, b) =>
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
    [...historyToLabels.values()].filter(
      (labels) => labels.size > 1,
    ).length;

  return {
    wording,
    exampleCount: examples.length,
    uniqueTransitionHistoryCount:
      historyToLabels.size,
    ambiguousTransitionHistoryCount: ambiguous,
    ambiguousTransitionHistoryRate:
      historyToLabels.size > 0
        ? ambiguous / historyToLabels.size
        : 0,
    responsibilityCounts,
    lexicalTop1Accuracy:
      lexicalCorrect / examples.length,
    lexicalTieRate:
      lexicalTies / examples.length,
    chanceTop1:
      1 / examples[0]!.candidateMatters.length,
    reportResponsibleCount:
      responsibilityCounts[
        MIXED_PRESSURE_MATTER_IDS.reportResponse
      ] ?? 0,
    workshopResponsibleCount:
      responsibilityCounts[
        MATERIAL_FIXTURE_MATTER_IDS.worker
      ] ?? 0,
  };
}

function surveyCandidateTicks(
  wording: R3MixedPressureMatterWording,
  scanTicks: number,
  historyLength: number,
): number[] {
  const run = createR3MixedPressureRun({
    janekMatterWording: wording,
  });
  run.runTicks(scanTicks);

  const janek = run
    .privateExperiences()
    .filter(
      (experience) =>
        experience.residentId === "resident:janek" &&
        experience.tick >= historyLength - 1,
    );

  const reportTicks = janek
    .filter(hasDirectIdaSpeech)
    .map((experience) => experience.tick);

  // Ordinary candidates are selected independently of matter identity and
  // spread across the same continuous ecology. Paired ablation remains the
  // only authority on the responsibility label.
  const ordinaryPool = janek.filter(
    (experience) =>
      !hasDirectIdaSpeech(experience) &&
      experience.decision.activity !== null,
  );

  const ordinaryTarget = Math.max(
    reportTicks.length * 2,
    12,
  );
  const ordinaryTicks = evenlySampleTicks(
    ordinaryPool.map((row) => row.tick),
    ordinaryTarget,
  );

  return [
    ...new Set([
      ...reportTicks,
      ...ordinaryTicks,
    ]),
  ].sort((a, b) => a - b);
}

function buildOneMixedCausalExample(options: {
  wording: R3MixedPressureMatterWording;
  anchorTick: number;
  historyLength: number;
}): R3MixedPressureCausalExample | null {
  const candidates = r3MixedPressureJanekMatters(
    options.wording,
  );

  const baseline = createR3MixedPressureRun({
    janekMatterOverrides: candidates,
  });
  baseline.runTicks(options.anchorTick);

  const priorHistory = residentHistory(
    baseline.privateExperiences(),
    options.historyLength - 1,
  );
  if (
    priorHistory.length <
    options.historyLength - 1
  ) {
    return null;
  }

  baseline.advanceOneTick();
  const baselineRow = requiredJanekRow(
    baseline.privateExperiences(),
    options.anchorTick,
  );

  const ablationDecisionByMatterId:
    Record<string, ResidentDecision> = {};
  const responsible: string[] = [];

  for (const matter of candidates) {
    const variant = createR3MixedPressureRun({
      janekMatterOverrides: candidates,
    });
    variant.runTicks(options.anchorTick);
    variant.researchReplaceResidentMatters(
      "resident:janek",
      candidates.filter(
        (candidate) =>
          candidate.id !== matter.id,
      ),
    );
    variant.advanceOneTick();

    const variantRow = requiredJanekRow(
      variant.privateExperiences(),
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

  if (responsible.length !== 1) {
    return null;
  }

  const alignedHistory = [
    ...priorHistory,
    baselineRow,
  ];
  const transitionHistory: string[] = [];

  for (
    let index = 1;
    index < alignedHistory.length;
    index += 1
  ) {
    transitionHistory.push(
      serializeR3PrivateTransition(
        alignedHistory[index - 1]!,
        alignedHistory[index]!,
      ).semanticText,
    );
  }

  return {
    wording: options.wording,
    anchorTick: options.anchorTick,
    queryEndTick: baselineRow.tick,
    transitionHistory,
    candidateMatters: candidates.map((matter) =>
      structuredClone(matter),
    ),
    causallyResponsibleMatterId:
      responsible[0]!,
    baselineDecision:
      structuredClone(baselineRow.decision),
    ablationDecisionByMatterId,
  };
}

function residentHistory(
  experiences: readonly ResidentPrivateExperience[],
  length: number,
): ResidentPrivateExperience[] {
  return experiences
    .filter(
      (experience) =>
        experience.residentId === "resident:janek",
    )
    .slice(-length)
    .map((experience) =>
      structuredClone(experience),
    );
}

function requiredJanekRow(
  experiences: readonly ResidentPrivateExperience[],
  tick: number,
): ResidentPrivateExperience {
  const row = experiences.find(
    (experience) =>
      experience.residentId === "resident:janek" &&
      experience.tick === tick,
  );

  if (!row) {
    throw new Error(
      "missing mixed-pressure Janek experience at tick " +
        tick,
    );
  }

  return row;
}

function hasDirectIdaSpeech(
  experience: ResidentPrivateExperience,
): boolean {
  return experience.observation.heardEvents.some(
    (event) =>
      event.kind === "speech" &&
      event.actorId === "resident:ida",
  );
}

function evenlySampleTicks(
  ticks: readonly number[],
  count: number,
): number[] {
  if (ticks.length <= count) return [...ticks];

  const selected: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const sourceIndex = Math.floor(
      (index * (ticks.length - 1)) /
        Math.max(1, count - 1),
    );
    selected.push(ticks[sourceIndex]!);
  }
  return [...new Set(selected)];
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
