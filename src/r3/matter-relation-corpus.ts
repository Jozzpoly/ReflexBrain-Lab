import { createAutonomousContactRun } from "./autonomous-contact-run";
import { createAutonomousLifeRun } from "./autonomous-life-run";
import {
  CONTACT_FIXTURE_MATTER_IDS,
} from "./contact-fixture-policies";
import {
  MATERIAL_FIXTURE_MATTER_IDS,
} from "./life-fixture-policies";
import type {
  MaterialKind,
  ResidentMatter,
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  buildR3PrivateTrajectoryWindows,
} from "./private-trajectory";
import type {
  R3EcologyId,
  R3StructuredPrivateLearningFrame,
} from "./learning-corpus";
import {
  structuredR3PrivateLearningFrame,
} from "./learning-corpus";

export type R3MatterWording = "baseline" | "paraphrase";

export interface R3MatterRelationFrame {
  semanticText: string;
  structured: R3StructuredPrivateLearningFrame;
}

export interface R3MatterRelationExample {
  id: string;
  ecology: R3EcologyId;
  wording: R3MatterWording;
  anchorTick: number;
  residentId: ResidentPrivateExperience["residentId"];
  context: readonly R3MatterRelationFrame[];
  positiveMatter: ResidentMatter;
  candidateMatters: readonly ResidentMatter[];
  eventful: boolean;
}

export interface R3MatterRelationCorpus {
  examples: readonly R3MatterRelationExample[];
}

export interface R3MatterSemanticDiversityAudit {
  ecology: R3EcologyId;
  wording: R3MatterWording;
  rawExampleCount: number;
  uniqueLabeledQueryCount: number;
  uniqueSemanticHistoryCount: number;
  uniqueSemanticFrameCount: number;
  compressionRatio: number;
  ambiguousSemanticHistoryCount: number;
  ambiguousSemanticHistoryRate: number;
  eventfulRawCount: number;
  eventfulUniqueLabeledQueryCount: number;
  residents: readonly {
    residentId: ResidentPrivateExperience["residentId"];
    rawExampleCount: number;
    uniqueLabeledQueryCount: number;
    uniqueSemanticHistoryCount: number;
  }[];
}

export interface R3MatterRetrievalMetrics {
  ecology: R3EcologyId;
  wording: R3MatterWording;
  exampleCount: number;
  candidateCount: number;
  top1Accuracy: number;
  eventfulExampleCount: number;
  eventfulTop1Accuracy: number;
  tieRate: number;
}

export function buildR3MatterRelationCorpus(options: {
  materialTicks?: number;
  contactTicks?: number;
  historyLength?: number;
} = {}): R3MatterRelationCorpus {
  const historyLength = options.historyLength ?? 8;
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
      ...relationExamples(
        "material-work",
        "baseline",
        materialBaseline.privateExperiences(),
        historyLength,
      ),
      ...relationExamples(
        "material-work",
        "paraphrase",
        materialParaphrase.privateExperiences(),
        historyLength,
      ),
      ...relationExamples(
        "moving-contact",
        "baseline",
        contactBaseline.privateExperiences(),
        historyLength,
      ),
      ...relationExamples(
        "moving-contact",
        "paraphrase",
        contactParaphrase.privateExperiences(),
        historyLength,
      ),
    ],
  };
}

/**
 * Zero-shot lexical baseline. It gets the exact same matter-free semantic
 * query and candidate statement text as a future semantic encoder.
 *
 * High performance here means the probe may be mostly surface overlap rather
 * than useful semantic geometry.
 */
export function auditR3MatterSemanticDiversity(
  corpus: R3MatterRelationCorpus,
  ecology: R3EcologyId,
  wording: R3MatterWording,
): R3MatterSemanticDiversityAudit {
  const raw = corpus.examples.filter(
    (example) =>
      example.ecology === ecology &&
      example.wording === wording,
  );
  if (raw.length === 0) {
    throw new Error(
      "matter relation diversity subset is empty: " +
        ecology +
        "/" +
        wording,
    );
  }

  const labeled = uniqueR3MatterRelationExamples(
    corpus,
    ecology,
    wording,
  );

  const semanticToMatters = new Map<string, Set<string>>();
  const frameTexts = new Set<string>();

  for (const example of raw) {
    const signature = semanticHistorySignature(example);
    const matters =
      semanticToMatters.get(signature) ?? new Set<string>();
    matters.add(example.positiveMatter.id);
    semanticToMatters.set(signature, matters);

    for (const frame of example.context) {
      frameTexts.add(frame.semanticText);
    }
  }

  const ambiguous = [...semanticToMatters.values()].filter(
    (matters) => matters.size > 1,
  ).length;

  const residentIds = [
    ...new Set(raw.map((example) => example.residentId)),
  ].sort();

  return {
    ecology,
    wording,
    rawExampleCount: raw.length,
    uniqueLabeledQueryCount: labeled.length,
    uniqueSemanticHistoryCount: semanticToMatters.size,
    uniqueSemanticFrameCount: frameTexts.size,
    compressionRatio: labeled.length / raw.length,
    ambiguousSemanticHistoryCount: ambiguous,
    ambiguousSemanticHistoryRate:
      semanticToMatters.size > 0
        ? ambiguous / semanticToMatters.size
        : 0,
    eventfulRawCount: raw.filter(
      (example) => example.eventful,
    ).length,
    eventfulUniqueLabeledQueryCount: labeled.filter(
      (example) => example.eventful,
    ).length,
    residents: residentIds.map((residentId) => {
      const residentRaw = raw.filter(
        (example) => example.residentId === residentId,
      );
      const residentLabeled = deduplicateRelationQueries(
        residentRaw,
      );
      return {
        residentId,
        rawExampleCount: residentRaw.length,
        uniqueLabeledQueryCount: residentLabeled.length,
        uniqueSemanticHistoryCount: new Set(
          residentRaw.map(semanticHistorySignature),
        ).size,
      };
    }),
  };
}

export function auditR3MatterLexicalRetrieval(
  corpus: R3MatterRelationCorpus,
  ecology: R3EcologyId,
  wording: R3MatterWording,
): R3MatterRetrievalMetrics {
  const examples = uniqueR3MatterRelationExamples(
    corpus,
    ecology,
    wording,
  );

  if (examples.length === 0) {
    throw new Error(
      "matter relation subset is empty: " +
        ecology +
        "/" +
        wording,
    );
  }

  let correct = 0;
  let eventfulCorrect = 0;
  let eventfulCount = 0;
  let ties = 0;

  for (const example of examples) {
    const queryTokens = relationContextTokens(example.context);
    const scores = example.candidateMatters.map((matter) => ({
      matter,
      score: lexicalJaccard(
        queryTokens,
        tokenSet(matter.statement),
      ),
    }));

    const bestScore = Math.max(...scores.map((entry) => entry.score));
    const best = scores.filter((entry) => entry.score === bestScore);
    if (best.length > 1) ties += 1;

    // Deterministic tie-break is intentionally conservative and tie rate is
    // reported separately.
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
    candidateCount: examples[0]!.candidateMatters.length,
    top1Accuracy: correct / examples.length,
    eventfulExampleCount: eventfulCount,
    eventfulTop1Accuracy:
      eventfulCount > 0 ? eventfulCorrect / eventfulCount : 0,
    tieRate: ties / examples.length,
  };
}

export function serializeR3MatterFreeSemanticFrame(
  experience: ResidentPrivateExperience,
): string {
  const speech = experience.observation.heardEvents
    .filter((event) => event.kind === "speech")
    .map((event) =>
      typeof event.payload.text === "string"
        ? event.payload.text.trim()
        : "",
    )
    .filter((text) => text.length > 0);

  const visibleKinds = experience.observation.visibleObjects
    .map((object) => materialKindText(object.kind))
    .sort();

  const heldKind = experience.observation.heldObject
    ? materialKindText(experience.observation.heldObject.kind)
    : "none";

  return [
    "private lived context",
    "held material kind: " + heldKind,
    "visible material kinds: " +
      (visibleKinds.length > 0
        ? visibleKinds.join(", ")
        : "none"),
    "heard speech: " +
      (speech.length > 0
        ? speech.map((text) => JSON.stringify(text)).join(" | ")
        : "none"),
  ].join("\n");
}

function relationExamples(
  ecology: R3EcologyId,
  wording: R3MatterWording,
  experiences: readonly ResidentPrivateExperience[],
  historyLength: number,
): R3MatterRelationExample[] {
  const matters = uniqueMatters(experiences);
  if (matters.length < 2) {
    throw new Error(
      "matter relation probe requires at least two candidate matters in " +
        ecology,
    );
  }

  const windows = buildR3PrivateTrajectoryWindows(experiences, {
    historyLength,
    horizonTicks: 1,
  });

  return windows.flatMap((window) => {
    const anchor = window.history[window.history.length - 1]!;
    const positive = anchor.matters[0];
    if (!positive) return [];

    const context = window.history.map((row) => ({
      semanticText: serializeR3MatterFreeSemanticFrame(row),
      structured: structuredR3PrivateLearningFrame(row),
    }));

    return [{
      id:
        "r3:matter-relation:" +
        ecology +
        ":" +
        wording +
        ":" +
        window.residentId +
        ":" +
        anchor.tick,
      ecology,
      wording,
      anchorTick: anchor.tick,
      residentId: window.residentId,
      context,
      positiveMatter: structuredClone(positive),
      candidateMatters: matters.map((matter) => structuredClone(matter)),
      eventful: isEventful(context),
    }];
  });
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
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function isEventful(
  context: readonly R3MatterRelationFrame[],
): boolean {
  // "Eventful" in the semantic-only probe must be visible to the semantic
  // representation itself. Exact structured private channels are audited
  // separately and cannot manufacture eventful semantic evidence.
  for (let index = 0; index < context.length; index += 1) {
    const frame = context[index]!;
    if (!frame.semanticText.includes("heard speech: none")) {
      return true;
    }
    if (
      index > 0 &&
      context[index - 1]!.semanticText !== frame.semanticText
    ) {
      return true;
    }
  }
  return false;
}

export function uniqueR3MatterRelationExamples(
  corpus: R3MatterRelationCorpus,
  ecology: R3EcologyId,
  wording: R3MatterWording,
): readonly R3MatterRelationExample[] {
  return deduplicateRelationQueries(
    corpus.examples.filter(
      (example) =>
        example.ecology === ecology &&
        example.wording === wording,
    ),
  );
}

function deduplicateRelationQueries(
  examples: readonly R3MatterRelationExample[],
): R3MatterRelationExample[] {
  const bySignature = new Map<string, R3MatterRelationExample>();
  for (const example of examples) {
    // Deduplicate on what the current semantic probe can actually see.
    // Structured exact-private channels are deliberately not part of the
    // frozen MiniLM input, so they must not manufacture extra "independent"
    // semantic queries.
    const signature = JSON.stringify({
      semanticHistory: semanticHistorySignature(example),
      positiveMatterId: example.positiveMatter.id,
    });
    if (!bySignature.has(signature)) {
      bySignature.set(signature, example);
    }
  }
  return [...bySignature.values()];
}

function semanticHistorySignature(
  example: R3MatterRelationExample,
): string {
  return JSON.stringify(
    example.context.map((frame) => frame.semanticText),
  );
}

function relationContextTokens(
  context: readonly R3MatterRelationFrame[],
): ReadonlySet<string> {
  return tokenSet(
    context.map((frame) => frame.semanticText).join("\n"),
  );
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

function materialKindText(kind: MaterialKind): string {
  switch (kind) {
    case "raw_blank":
      return "raw blank";
    case "finished_part":
      return "finished part";
  }
}

export function r3MaterialParaphraseMatters(): Partial<
  Record<
    ResidentPrivateExperience["residentId"],
    readonly ResidentMatter[]
  >
> {
  return {
    "resident:mira": [{
      id: MATERIAL_FIXTURE_MATTER_IDS.steward,
      statement:
        "ensure unfinished stock stays available where the worker collects incoming material",
      establishedTick: 0,
      source: "authored",
    }],
    "resident:janek": [{
      id: MATERIAL_FIXTURE_MATTER_IDS.worker,
      statement:
        "convert incoming unfinished stock into completed pieces at the bench",
      establishedTick: 0,
      source: "authored",
    }],
    "resident:ida": [{
      id: MATERIAL_FIXTURE_MATTER_IDS.courier,
      statement:
        "transport completed pieces from the collection point to storage",
      establishedTick: 0,
      source: "authored",
    }],
  };
}

export function r3ContactParaphraseMatters(): Partial<
  Record<
    ResidentPrivateExperience["residentId"],
    readonly ResidentMatter[]
  >
> {
  return {
    "resident:janek": [{
      id: CONTACT_FIXTURE_MATTER_IDS.patrol,
      statement:
        "walk the assigned route repeatedly and stay reachable for face-to-face coordination",
      establishedTick: 0,
      source: "authored",
    }],
    "resident:ida": [{
      id: CONTACT_FIXTURE_MATTER_IDS.report,
      statement:
        "periodically locate the patrolling coworker and deliver the storage-check update face to face",
      establishedTick: 0,
      source: "authored",
    }],
  };
}
