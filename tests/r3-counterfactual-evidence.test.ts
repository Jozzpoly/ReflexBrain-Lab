import { describe, expect, it } from "vitest";
import {
  compareContactCounterfactual,
  compareMaterialCounterfactual,
} from "../src/r3/counterfactual-evidence";
import { R3_LIFE_PLACES } from "../src/r3/autonomous-life-run";
import { MATERIAL_FIXTURE_MATTER_IDS } from "../src/r3/life-fixture-policies";
import { CONTACT_FIXTURE_MATTER_IDS } from "../src/r3/contact-fixture-policies";

describe("R3 paired counterfactual first-divergence evidence", () => {
  const materialEvidence = compareMaterialCounterfactual({
    perturbationId: "source-stock:3-vs-0",
    ticks: 700,
    baseline: { initialSourceRaw: 3 },
    variant: { initialSourceRaw: 0 },
  });

  const contactEvidence = compareContactCounterfactual({
    perturbationId: "janek-start:workbench-vs-depot",
    ticks: 900,
    baseline: {
      janekStart: R3_LIFE_PLACES.workbench.position,
    },
    variant: {
      janekStart: R3_LIFE_PLACES.depot.position,
    },
  });

  console.info(
    "R3_COUNTERFACTUAL_FIRST_DIVERGENCE",
    JSON.stringify([materialEvidence, contactEvidence]),
  );
  it("keeps a hidden material perturbation private until Mira can actually encounter it", () => {
    const mira = materialEvidence.residents.find(
      (row) => row.residentId === "resident:mira",
    )!;
    const janek = materialEvidence.residents.find(
      (row) => row.residentId === "resident:janek",
    )!;

    expect(mira.firstObservationTick).not.toBeNull();
    expect(mira.firstObservationTick!).toBeGreaterThan(1);
    expect(mira.firstDecisionTick).not.toBeNull();
    expect(mira.firstDecisionTick!).toBeGreaterThanOrEqual(
      mira.firstPrivateStateTick!,
    );

    expect(janek.firstPrivateStateTick).not.toBeNull();
    expect(janek.firstPrivateStateTick!).toBeGreaterThan(
      mira.firstPrivateStateTick!,
    );
  });

  it("keeps a different initial Janek position hidden from Ida until local contact geometry reveals it", () => {
    const ida = contactEvidence.residents.find(
      (row) => row.residentId === "resident:ida",
    )!;

    expect(ida.firstObservationTick).not.toBeNull();
    expect(ida.firstObservationTick!).toBeGreaterThan(1);
    expect(ida.firstPrivateStateTick).toBe(
      ida.firstObservationTick,
    );
    expect(ida.firstDecisionTick).not.toBeNull();
    expect(ida.firstDecisionTick!).toBeGreaterThanOrEqual(
      ida.firstPrivateStateTick!,
    );
  });

  it("treats matter ablation as a real actor-private causal intervention", () => {
    const material = compareMaterialCounterfactual({
      perturbationId: "mira-supply-matter:present-vs-absent",
      ticks: 700,
      variant: {
        matterOverrides: {
          "resident:mira": [],
        },
      },
    });

    const mira = material.residents.find(
      (row) => row.residentId === "resident:mira",
    )!;
    const janek = material.residents.find(
      (row) => row.residentId === "resident:janek",
    )!;

    expect(mira.firstPrivateStateTick).toBe(0);
    expect(mira.firstDecisionTick).toBe(0);
    expect(mira.firstOutcomeTick).toBe(0);

    // Janek is not given Mira's private matter state. He diverges later only
    // after the changed material world reaches his own private experience.
    expect(janek.firstPrivateStateTick).not.toBeNull();
    expect(janek.firstPrivateStateTick!).toBeGreaterThan(0);

    const contact = compareContactCounterfactual({
      perturbationId: "ida-contact-matter:present-vs-absent",
      ticks: 700,
      variant: {
        matterOverrides: {
          "resident:ida": [],
        },
      },
    });

    const ida = contact.residents.find(
      (row) => row.residentId === "resident:ida",
    )!;
    expect(ida.firstPrivateStateTick).toBe(0);
    expect(ida.firstDecisionTick).toBe(0);
    expect(ida.firstOutcomeTick).toBe(0);
  });

  it("keeps fixture behavior invariant when only matter wording changes", () => {
    const paraphrase = compareMaterialCounterfactual({
      perturbationId: "mira-supply-matter:wording-only",
      ticks: 500,
      variant: {
        matterOverrides: {
          "resident:mira": [{
            id: MATERIAL_FIXTURE_MATTER_IDS.steward,
            statement:
              "make sure raw workshop blanks remain available at the input rack",
            establishedTick: 0,
            source: "authored",
          }],
        },
      },
    });

    const mira = paraphrase.residents.find(
      (row) => row.residentId === "resident:mira",
    )!;

    expect(mira.firstPrivateStateTick).toBe(0);
    expect(mira.firstDecisionTick).toBeNull();
    expect(mira.firstOutcomeTick).toBeNull();

    const contactParaphrase = compareContactCounterfactual({
      perturbationId: "ida-contact-matter:wording-only",
      ticks: 500,
      variant: {
        matterOverrides: {
          "resident:ida": [{
            id: CONTACT_FIXTURE_MATTER_IDS.report,
            statement:
              "periodically find Janek in person and tell him the depot check is finished",
            establishedTick: 0,
            source: "authored",
          }],
        },
      },
    });

    const ida = contactParaphrase.residents.find(
      (row) => row.residentId === "resident:ida",
    )!;
    expect(ida.firstPrivateStateTick).toBe(0);
    expect(ida.firstDecisionTick).toBeNull();
    expect(ida.firstOutcomeTick).toBeNull();
  });

  it("never lets a deterministic resident decision diverge before its private state diverges", () => {
    const evidences = [
      materialEvidence,
      contactEvidence,
    ];

    for (const evidence of evidences) {
      for (const resident of evidence.residents) {
        if (resident.firstDecisionTick === null) continue;
        expect(resident.firstPrivateStateTick).not.toBeNull();
        expect(resident.firstDecisionTick).toBeGreaterThanOrEqual(
          resident.firstPrivateStateTick!,
        );
      }
    }
  });

  it("preserves outcome-first divergence as legitimate World-authority evidence", () => {
    const evidences = [
      materialEvidence,
      contactEvidence,
    ];

    const outcomeFirst = evidences.flatMap(
      (evidence) =>
        evidence.residents
          .filter(
            (resident) =>
              resident.firstOutcomeTick !== null &&
              resident.firstDecisionTick !== null &&
              resident.firstOutcomeTick <
                resident.firstDecisionTick,
          )
          .map((resident) => ({
            ecology: evidence.ecology,
            resident,
          })),
    );

    // Same private decision can receive a different authoritative World result.
    // This is not a cognition leak. The no-telepathy invariant is instead that
    // the resident's *decision* cannot diverge before its private state.
    expect(outcomeFirst.length).toBeGreaterThan(0);

    for (const { resident } of outcomeFirst) {
      expect(resident.firstPrivateStateTick).not.toBeNull();
      expect(resident.firstDecisionTick).toBeGreaterThanOrEqual(
        resident.firstPrivateStateTick!,
      );
    }
  });
});
