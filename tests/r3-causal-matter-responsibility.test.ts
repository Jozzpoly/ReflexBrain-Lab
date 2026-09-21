import { describe, expect, it } from "vitest";
import {
  auditR3CausalMatterResponsibility,
  buildR3CausalMatterResponsibilityCorpus,
} from "../src/r3/causal-matter-responsibility";
import {
  createAutonomousContactRun,
  r3ContactAuthoredMatters,
} from "../src/r3/autonomous-contact-run";
import {
  r3MaterialAuthoredMatters,
} from "../src/r3/autonomous-life-run";

describe("R3 concurrent-matter causal responsibility", () => {
  it("research intervention changes private matter state without directly mutating World truth", () => {
    const run = createAutonomousContactRun({
      matterOverrides: {
        "resident:janek": [
          ...r3MaterialAuthoredMatters(
            "resident:janek",
          ),
          ...r3ContactAuthoredMatters(
            "resident:janek",
          ),
        ],
      },
    });

    run.runTicks(20);
    const worldBefore = run.world.snapshot();
    const stateBefore =
      run.residentDebug("resident:janek")!;

    expect(stateBefore.matters).toHaveLength(2);

    run.researchReplaceResidentMatters(
      "resident:janek",
      stateBefore.matters.slice(0, 1),
    );

    const worldAfter = run.world.snapshot();
    const stateAfter =
      run.residentDebug("resident:janek")!;

    expect(stateAfter.matters).toHaveLength(1);
    expect(worldAfter).toEqual(worldBefore);
  });

  it("derives responsibility from one-tick matter ablation after an identical prefix", () => {
    const corpus =
      buildR3CausalMatterResponsibilityCorpus({
        sampleTicks: [8, 45, 130],
        wordings: ["baseline"],
      });

    expect(corpus.examples.length).toBeGreaterThan(0);

    for (const example of corpus.examples) {
      expect(example.candidateMatters).toHaveLength(2);
      expect(
        example.candidateMatters.every((matter) =>
          matter.id.startsWith(
            example.residentId + ":matter:",
          ),
        ),
      ).toBe(true);
      expect(
        example.candidateMatters.some(
          (matter) =>
            matter.id ===
            example.causallyResponsibleMatterId,
        ),
      ).toBe(true);

      const changed = example.candidateMatters.filter(
        (matter) =>
          JSON.stringify(
            example.ablationDecisionByMatterId[
              matter.id
            ],
          ) !==
          JSON.stringify(example.baselineDecision),
      );

      expect(changed).toHaveLength(1);
      expect(changed[0]!.id).toBe(
        example.causallyResponsibleMatterId,
      );
    }
  }, 20_000);

  it("keeps the causal query matter-free, actor-id-free and policy-label-free", () => {
    const corpus =
      buildR3CausalMatterResponsibilityCorpus({
        sampleTicks: [20, 80],
        wordings: ["baseline"],
      });

    for (const example of corpus.examples) {
      const query =
        example.transitionHistory.join("\n");

      expect(query).not.toContain(example.residentId);
      expect(query).not.toContain(example.ecology);
      expect(query).not.toContain("process_material");
      expect(query).not.toContain("maintain_contact");
      expect(query).not.toContain("patrol_between_places");
      for (const matter of example.candidateMatters) {
        expect(query).not.toContain(matter.statement);
      }
    }
  }, 20_000);

  it("audits identifiability and lexical shortcuts before any causal-target model run", () => {
    const corpus =
      buildR3CausalMatterResponsibilityCorpus();

    const audits = [
      auditR3CausalMatterResponsibility(
        corpus,
        "resident:janek",
        "baseline",
      ),
      auditR3CausalMatterResponsibility(
        corpus,
        "resident:janek",
        "paraphrase",
      ),
      auditR3CausalMatterResponsibility(
        corpus,
        "resident:ida",
        "baseline",
      ),
      auditR3CausalMatterResponsibility(
        corpus,
        "resident:ida",
        "paraphrase",
      ),
    ];

    console.info(
      "R3_CAUSAL_MATTER_RESPONSIBILITY",
      JSON.stringify(audits),
    );

    for (const audit of audits) {
      expect(audit.exampleCount).toBeGreaterThan(0);
      expect(audit.sourceEcologies).toEqual(
        ["material-work", "moving-contact"],
      );
      expect(
        Object.keys(audit.responsibilityCounts),
      ).toHaveLength(2);
      expect(audit.chanceTop1).toBe(0.5);
    }
  }, 30_000);
});
