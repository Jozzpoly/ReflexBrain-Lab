import {
  describe,
  expect,
  it,
} from "vitest";
import {
  diagnoseR3GroundedPurposePressure,
} from "../src/r3/grounded-purpose-pressure-diagnosis";

describe(
  "R3 grounded purpose pressure diagnosis",
  () => {
    it(
      "localizes neutral background pressure asymmetry without changing behavior",
      () => {
        const audit =
          diagnoseR3GroundedPurposePressure();

        console.log(
          "R3_GROUNDED_PURPOSE_PRESSURE_DIAGNOSIS " +
            JSON.stringify(audit),
        );

        expect(
          audit.horizonTicks,
        ).toBe(1800);

        for (
          const world of [
            audit.rackPurpose,
            audit.outputPurpose,
          ]
        ) {
          expect(
            world.janekRouteMotionEvents,
          ).toBeGreaterThan(0);
          expect(
            world.janekDepotNearEpisodes,
          ).toBeGreaterThan(0);

          for (
            const target of [
              world.targets
                .input_rack,
              world.targets
                .output,
            ]
          ) {
            expect(
              target.nearTargetTicks,
            ).toBeGreaterThan(0);
            expect(
              target.nearTargetEpisodes,
            ).toBeGreaterThan(0);
            expect(
              target.firstVisitTick,
            ).not.toBeNull();
            expect(
              target.lastVisitTick,
            ).not.toBeNull();
          }
        }

        expect(
          audit.rackPurpose
            .idaTargetPlacements,
        ).toBe(1);
        expect(
          audit.outputPurpose
            .idaTargetPlacements,
        ).toBe(17);

        expect(
          [
            "BACKGROUND_ROUTE_STARVATION",
            "BACKGROUND_STOCK_PHASE_MISS",
            "BACKGROUND_PICKUP_EXECUTION_FAIL",
            "BACKGROUND_PRESSURE_DIAGNOSIS_MIXED",
          ],
        ).toContain(
          audit.classification,
        );
      },
      60_000,
    );
  },
);
