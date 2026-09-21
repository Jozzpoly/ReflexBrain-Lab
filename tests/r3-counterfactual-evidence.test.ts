import { describe, expect, it } from "vitest";
import {
  compareContactCounterfactual,
  compareMaterialCounterfactual,
} from "../src/r3/counterfactual-evidence";
import { R3_LIFE_PLACES } from "../src/r3/autonomous-life-run";

describe("R3 paired counterfactual first-divergence evidence", () => {
  it("keeps a hidden material perturbation private until Mira can actually encounter it", () => {
    const evidence = compareMaterialCounterfactual({
      perturbationId: "source-stock:3-vs-0",
      ticks: 700,
      baseline: { initialSourceRaw: 3 },
      variant: { initialSourceRaw: 0 },
    });

    const mira = evidence.residents.find(
      (row) => row.residentId === "resident:mira",
    )!;
    const janek = evidence.residents.find(
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
    const evidence = compareContactCounterfactual({
      perturbationId: "janek-start:workbench-vs-depot",
      ticks: 900,
      baseline: {
        janekStart: R3_LIFE_PLACES.workbench.position,
      },
      variant: {
        janekStart: R3_LIFE_PLACES.depot.position,
      },
    });

    const ida = evidence.residents.find(
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

  it("never lets a deterministic resident decision diverge before its private state diverges", () => {
    const evidences = [
      compareMaterialCounterfactual({
        perturbationId: "source-stock:3-vs-0",
        ticks: 700,
        baseline: { initialSourceRaw: 3 },
        variant: { initialSourceRaw: 0 },
      }),
      compareContactCounterfactual({
        perturbationId: "janek-start:workbench-vs-depot",
        ticks: 900,
        baseline: {
          janekStart: R3_LIFE_PLACES.workbench.position,
        },
        variant: {
          janekStart: R3_LIFE_PLACES.depot.position,
        },
      }),
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

  it("never lets an actor-owned factual outcome diverge before that actor's decision diverges", () => {
    const evidences = [
      compareMaterialCounterfactual({
        perturbationId: "source-stock:3-vs-0",
        ticks: 700,
        baseline: { initialSourceRaw: 3 },
        variant: { initialSourceRaw: 0 },
      }),
      compareContactCounterfactual({
        perturbationId: "janek-start:workbench-vs-depot",
        ticks: 900,
        baseline: {
          janekStart: R3_LIFE_PLACES.workbench.position,
        },
        variant: {
          janekStart: R3_LIFE_PLACES.depot.position,
        },
      }),
    ];

    for (const evidence of evidences) {
      for (const resident of evidence.residents) {
        if (resident.firstOutcomeTick === null) continue;
        expect(resident.firstDecisionTick).not.toBeNull();
        expect(resident.firstOutcomeTick).toBeGreaterThanOrEqual(
          resident.firstDecisionTick!,
        );
      }
    }
  });
});
