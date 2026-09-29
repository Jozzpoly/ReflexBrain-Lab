import {
  describe,
  expect,
  it,
} from "vitest";
import {
  auditR3GroundedPurposeStructure,
  R3_GROUNDED_PURPOSE_MATTER_ID,
  r3GroundedPurposeDefaultHorizonTicks,
} from "../src/r3/grounded-purpose-structure-run";

describe(
  "R3 grounded purpose structure ecology",
  () => {
    it(
      "tests same-id causal purpose structure under wording invariance and purpose-independent recurrent pressure",
      () => {
        const audit =
          auditR3GroundedPurposeStructure();

        console.log(
          "R3_GROUNDED_PURPOSE_STRUCTURE " +
            JSON.stringify(audit),
        );

        expect(
          r3GroundedPurposeDefaultHorizonTicks(),
        ).toBe(1800);

        expect(
          audit.stageA
            .sameMatterId,
        ).toBe(true);
        expect(
          audit.stageA
            .rackPurpose.matterId,
        ).toBe(
          R3_GROUNDED_PURPOSE_MATTER_ID,
        );
        expect(
          audit.stageA
            .outputPurpose.matterId,
        ).toBe(
          R3_GROUNDED_PURPOSE_MATTER_ID,
        );
        expect(
          audit.stageA
            .differentPurposeStatements,
        ).toBe(true);
        expect(
          audit.stageA
            .differentStructuredTargets,
        ).toBe(true);
        expect(
          audit.stageA
            .firstPurposeDecisionDivergenceTick,
        ).not.toBeNull();

        expect(
          audit.stageA
            .rackPurpose
            .idaPlacementsAtRack,
        ).toBeGreaterThan(0);
        expect(
          audit.stageA
            .outputPurpose
            .idaPlacementsAtOutput,
        ).toBeGreaterThan(0);
        expect(
          audit.stageA
            .rackPurpose
            .depleterPickups,
        ).toBeGreaterThan(0);
        expect(
          audit.stageA
            .outputPurpose
            .depleterPickups,
        ).toBeGreaterThan(0);

        expect(
          audit.stageB
            .statementsChanged,
        ).toBe(true);
        expect(
          audit.stageB
            .structuresPreserved,
        ).toBe(true);
        expect(
          audit.stageB
            .rackWorldTrajectoryInvariant,
        ).toBe(true);
        expect(
          audit.stageB
            .rackPrivateTrajectoryInvariant,
        ).toBe(true);
        expect(
          audit.stageB
            .outputWorldTrajectoryInvariant,
        ).toBe(true);
        expect(
          audit.stageB
            .outputPrivateTrajectoryInvariant,
        ).toBe(true);
        expect(
          audit.stageB
            .wordingInvariancePass,
        ).toBe(true);

        expect(
          audit.stageA
            .rackPurpose
            .satisfaction
            .observedTicks,
        ).toBeGreaterThan(0);
        expect(
          audit.stageA
            .outputPurpose
            .satisfaction
            .observedTicks,
        ).toBeGreaterThan(0);

        expect(
          audit.stageD
            .fixedMatterIdAcrossPurposes,
        ).toBe(true);
        expect(
          audit.stageD
            .structureUsesExistingWorldVocabulary,
        ).toBe(true);
        expect(
          audit.stageD
            .maintainerReadsMatterIdentity,
        ).toBe(false);
        expect(
          audit.stageD
            .maintainerReadsStatementText,
        ).toBe(false);
        expect(
          audit.stageD
            .backgroundReceivesPurpose,
        ).toBe(false);
        expect(
          audit.stageD
            .hiddenWorldUsedForSatisfaction,
        ).toBe(false);
        expect(
          audit.stageD
            .semanticOraclePresent,
        ).toBe(false);
        expect(
          audit.stageD
            .provenancePass,
        ).toBe(true);

        expect(
          [
            "GROUNDED_PURPOSE_STRUCTURE_QUALIFIED",
            "GROUNDED_PURPOSE_STRUCTURE_PRESSURE_FAIL",
            "GROUNDED_PURPOSE_STRUCTURE_CAUSAL_FAIL",
            "GROUNDED_PURPOSE_STRUCTURE_PROVENANCE_FAIL",
          ],
        ).toContain(
          audit.classification,
        );
      },
      90_000,
    );
  },
);
