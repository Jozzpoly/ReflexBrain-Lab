import { describe, expect, it } from "vitest";
import {
  createAutonomousContactRun,
  r3ContactAuthoredMatters,
} from "../src/r3/autonomous-contact-run";
import {
  createAutonomousLifeRun,
  r3MaterialAuthoredMatters,
} from "../src/r3/autonomous-life-run";
import type {
  ResidentId,
  ResidentMatter,
  ResidentPrivateExperience,
} from "../src/r3/life-contracts";

function withStatement(
  matter: ResidentMatter,
  statement: string,
): ResidentMatter {
  return {
    ...structuredClone(matter),
    statement,
  };
}

function causalPrivateProjection(
  experiences: readonly ResidentPrivateExperience[],
) {
  return experiences.map((experience) => ({
    tick: experience.tick,
    residentId: experience.residentId,
    matters: experience.matters.map((matter) => ({
      id: matter.id,
      establishedTick: matter.establishedTick,
      source: matter.source,
    })),
    activityBefore: experience.activityBefore,
    observation: experience.observation,
    memory: experience.memory,
    decision: experience.decision,
    factualOutcomeEvents:
      experience.factualOutcomeEvents,
  }));
}

describe("R3 statement causal inertness", () => {
  it("keeps the full material ecology causally identical when task meanings are permuted across fixed matter ids", () => {
    const residentIds: readonly ResidentId[] = [
      "resident:mira",
      "resident:janek",
      "resident:ida",
    ];

    const baseline = Object.fromEntries(
      residentIds.map((residentId) => [
        residentId,
        r3MaterialAuthoredMatters(residentId),
      ]),
    ) as Record<ResidentId, readonly ResidentMatter[]>;

    const miraStatement =
      baseline["resident:mira"][0]!.statement;
    const janekStatement =
      baseline["resident:janek"][0]!.statement;
    const idaStatement =
      baseline["resident:ida"][0]!.statement;

    const permuted: Partial<
      Record<ResidentId, readonly ResidentMatter[]>
    > = {
      "resident:mira": [
        withStatement(
          baseline["resident:mira"][0]!,
          janekStatement,
        ),
      ],
      "resident:janek": [
        withStatement(
          baseline["resident:janek"][0]!,
          idaStatement,
        ),
      ],
      "resident:ida": [
        withStatement(
          baseline["resident:ida"][0]!,
          miraStatement,
        ),
      ],
    };

    // Material fixture activity ids use a research-global serial counter.
    // Execute paired worlds sequentially so each run starts from its own reset
    // instead of allowing one live run to consume the other's serials.
    const ordinary = createAutonomousLifeRun();
    const ordinarySteps = ordinary.runTicks(420);

    const altered = createAutonomousLifeRun({
      matterOverrides: permuted,
    });
    const alteredSteps = altered.runTicks(420);

    expect(alteredSteps).toEqual(ordinarySteps);
    expect(
      causalPrivateProjection(
        altered.privateExperiences(),
      ),
    ).toEqual(
      causalPrivateProjection(
        ordinary.privateExperiences(),
      ),
    );

    expect(
      altered.residentDebug("resident:mira")!
        .matters[0]!.statement,
    ).toBe(janekStatement);
    expect(
      altered.residentDebug("resident:janek")!
        .matters[0]!.statement,
    ).toBe(idaStatement);
    expect(
      altered.residentDebug("resident:ida")!
        .matters[0]!.statement,
    ).toBe(miraStatement);
  }, 30_000);

  it("keeps the full contact ecology causally identical when resident task meanings are exchanged across fixed matter ids", () => {
    const janekMatter =
      r3ContactAuthoredMatters("resident:janek")[0]!;
    const idaMatter =
      r3ContactAuthoredMatters("resident:ida")[0]!;

    const ordinary = createAutonomousContactRun();
    const altered = createAutonomousContactRun({
      matterOverrides: {
        "resident:janek": [
          withStatement(
            janekMatter,
            idaMatter.statement,
          ),
        ],
        "resident:ida": [
          withStatement(
            idaMatter,
            janekMatter.statement,
          ),
        ],
      },
    });

    const ordinarySteps = ordinary.runTicks(420);
    const alteredSteps = altered.runTicks(420);

    expect(alteredSteps).toEqual(ordinarySteps);
    expect(
      causalPrivateProjection(
        altered.privateExperiences(),
      ),
    ).toEqual(
      causalPrivateProjection(
        ordinary.privateExperiences(),
      ),
    );

    expect(
      altered.residentDebug("resident:janek")!
        .matters[0]!.statement,
    ).toBe(idaMatter.statement);
    expect(
      altered.residentDebug("resident:ida")!
        .matters[0]!.statement,
    ).toBe(janekMatter.statement);

    console.info(
      "R3_STATEMENT_CAUSAL_INERTNESS",
      JSON.stringify({
        materialEcologyTicks: 420,
        contactEcologyTicks: 420,
        materialWorldAndDecisionTrajectoryEqual: true,
        contactWorldAndDecisionTrajectoryEqual: true,
        semanticStatementsPermutedAcrossFixedMatterIds: true,
      }),
    );
  }, 30_000);
});
