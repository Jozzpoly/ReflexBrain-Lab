import type {
  AutonomousLifeStep,
  LifeEvent,
  LifePlace,
  ResidentActivity,
  ResidentDecision,
  ResidentId,
  ResidentMatter,
  ResidentPolicy,
  ResidentPolicyInput,
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  AutonomousLifeWorld,
  distance,
} from "./life-world";
import {
  AutonomousResidentAgent,
} from "./resident-agent";

export type R3GroundedPurposeTargetPlace =
  | "input_rack"
  | "output";

export type R3GroundedPurposeWording =
  | "baseline"
  | "paraphrase";

export interface R3GroundedPurposeStructure {
  objectKind: "raw_blank";
  targetPlaceId:
    R3GroundedPurposeTargetPlace;
  desiredPresence: true;
}

export type R3GroundedPurposeStructureClassification =
  | "GROUNDED_PURPOSE_STRUCTURE_QUALIFIED"
  | "GROUNDED_PURPOSE_STRUCTURE_PRESSURE_FAIL"
  | "GROUNDED_PURPOSE_STRUCTURE_CAUSAL_FAIL"
  | "GROUNDED_PURPOSE_STRUCTURE_PROVENANCE_FAIL";

export interface R3GroundedPurposeRunMetrics {
  purpose:
    R3GroundedPurposeTargetPlace;
  wording:
    R3GroundedPurposeWording;
  ticks: number;
  matterId: string;
  matterStatement: string;
  idaPlacementsAtRack: number;
  idaPlacementsAtOutput: number;
  idaTargetPlacements: number;
  depleterPickups: number;
  satisfaction: {
    observedTicks: number;
    satisfiedTicks: number;
    unsatisfiedTicks: number;
    satisfiedEpisodes: number;
    unsatisfiedEpisodes: number;
    transitions: number;
  };
}

export interface R3GroundedPurposeStructureAudit {
  horizonTicks: number;
  stageA: {
    sameMatterId: boolean;
    differentPurposeStatements: boolean;
    differentStructuredTargets: boolean;
    firstPurposeDecisionDivergenceTick:
      number | null;
    rackPurpose: R3GroundedPurposeRunMetrics;
    outputPurpose: R3GroundedPurposeRunMetrics;
    rackPurposePrefersRackPlacement: boolean;
    outputPurposePrefersOutputPlacement: boolean;
    causalStructurePass: boolean;
  };
  stageB: {
    rackWorldTrajectoryInvariant: boolean;
    rackPrivateTrajectoryInvariant: boolean;
    outputWorldTrajectoryInvariant: boolean;
    outputPrivateTrajectoryInvariant: boolean;
    statementsChanged: boolean;
    structuresPreserved: boolean;
    wordingInvariancePass: boolean;
  };
  stageC: {
    rackRecurrentGroundingPass: boolean;
    outputRecurrentGroundingPass: boolean;
    recurrentGroundingPass: boolean;
  };
  stageD: {
    fixedMatterIdAcrossPurposes: boolean;
    structureUsesExistingWorldVocabulary: boolean;
    maintainerReadsMatterIdentity: false;
    maintainerReadsStatementText: false;
    backgroundReceivesPurpose: false;
    hiddenWorldUsedForSatisfaction: false;
    semanticOraclePresent: false;
    provenancePass: boolean;
  };
  classification:
    R3GroundedPurposeStructureClassification;
  reasons: readonly string[];
}

export interface R3GroundedPurposeStructureRun {
  readonly world: AutonomousLifeWorld;
  purposeStructure():
    R3GroundedPurposeStructure;
  advanceOneTick():
    AutonomousLifeStep;
  runTicks(
    count: number,
  ): readonly AutonomousLifeStep[];
  allEvents():
    readonly LifeEvent[];
  privateExperiences():
    readonly ResidentPrivateExperience[];
  metrics():
    R3GroundedPurposeRunMetrics;
}

export const R3_GROUNDED_PURPOSE_MATTER_ID =
  "resident:ida:matter:grounded-maintenance-purpose";

export const R3_GROUNDED_PURPOSE_PLACES:
  Readonly<
    Record<
      LifePlace["id"],
      LifePlace
    >
  > = {
    source: {
      id: "source",
      position: { x: 0, y: 0 },
    },
    input_rack: {
      id: "input_rack",
      position: { x: -4, y: 0 },
    },
    output: {
      id: "output",
      position: { x: 4, y: 0 },
    },
    workbench: {
      id: "workbench",
      position: { x: 0, y: 4 },
    },
    depot: {
      id: "depot",
      position: { x: 0, y: -4 },
    },
  };

const PURPOSE_STATEMENTS = {
  input_rack: {
    baseline:
      "keep a raw blank available at the left workshop intake point",
    paraphrase:
      "maintain unfinished stock at the workshop location on the left",
  },
  output: {
    baseline:
      "keep a raw blank available at the right workshop output point",
    paraphrase:
      "maintain unfinished stock at the workshop location on the right",
  },
} as const;

const DEFAULT_HORIZON_TICKS =
  1800;

export function createR3GroundedPurposeStructureRun(
  purpose:
    R3GroundedPurposeTargetPlace,
  wording:
    R3GroundedPurposeWording =
      "baseline",
): R3GroundedPurposeStructureRun {
  const structure:
    R3GroundedPurposeStructure = {
      objectKind:
        "raw_blank",
      targetPlaceId:
        purpose,
      desiredPresence:
        true,
    };

  const matter =
    purposeMatter(
      purpose,
      wording,
    );

  const world =
    new AutonomousLifeWorld({
      sourcePosition:
        R3_GROUNDED_PURPOSE_PLACES
          .source.position,
      sourceCapacity: 4,
      sourceReplenishTicks: 30,
      workbenchPosition:
        R3_GROUNDED_PURPOSE_PLACES
          .workbench.position,
      processingTicks: 24,
      actionRange: 0.45,
    });

  world.addResident(
    "resident:ida",
    R3_GROUNDED_PURPOSE_PLACES
      .source.position,
    {
      speedPerTick: 0.18,
      sightRadius: 2.5,
      hearingRadius: 5,
    },
  );

  world.addResident(
    "resident:janek",
    R3_GROUNDED_PURPOSE_PLACES
      .depot.position,
    {
      speedPerTick: 0.17,
      sightRadius: 2.5,
      hearingRadius: 5,
    },
  );

  for (
    let index = 0;
    index < 4;
    index += 1
  ) {
    world.addMaterial(
      "raw_blank",
      {
        x:
          R3_GROUNDED_PURPOSE_PLACES
            .source.position.x +
          index * 0.1,
        y:
          R3_GROUNDED_PURPOSE_PLACES
            .source.position.y,
      },
    );
  }

  const maintainer =
    new AutonomousResidentAgent(
      new GroundedPurposeMaintainerPolicy(
        structure,
        world.options.actionRange,
      ),
      [matter],
    );

  const depleter =
    new AutonomousResidentAgent(
      new GroundedPurposeDepleterPolicy(),
      [],
    );

  const agents =
    new Map<
      ResidentId,
      AutonomousResidentAgent
    >([
      [
        "resident:ida",
        maintainer,
      ],
      [
        "resident:janek",
        depleter,
      ],
    ]);

  const history:
    LifeEvent[] = [];
  const experiences:
    ResidentPrivateExperience[] =
      [];

  return {
    world,

    purposeStructure() {
      return structuredClone(
        structure,
      );
    },

    advanceOneTick():
    AutonomousLifeStep {
      const decisions =
        new Map<
          ResidentId,
          ResidentDecision
        >();

      const inputs =
        new Map<
          ResidentId,
          {
            activityBefore:
              ResidentActivity | null;
            matters:
              readonly ResidentMatter[];
            observation:
              import("./life-contracts")
                .ResidentObservation;
            memory:
              import("./life-contracts")
                .ResidentPrivateMemory;
          }
        >();

      for (
        const residentId of
        [...agents.keys()].sort()
      ) {
        const agent =
          agents.get(
            residentId,
          )!;
        const before =
          agent.debugState();
        const observation =
          world.perceive(
            residentId,
          );
        const decision =
          agent.decide(
            observation,
            R3_GROUNDED_PURPOSE_PLACES,
          );

        decisions.set(
          residentId,
          decision,
        );

        inputs.set(
          residentId,
          {
            activityBefore:
              before.activity,
            matters:
              structuredClone(
                before.matters,
              ),
            observation:
              structuredClone(
                observation,
              ),
            memory:
              structuredClone(
                agent.debugState()
                  .memory,
              ),
          },
        );
      }

      const events =
        world.step(
          new Map(
            [...decisions.entries()]
              .map(
                ([
                  residentId,
                  decision,
                ]) => [
                  residentId,
                  decision.intent,
                ],
              ),
          ),
        );

      history.push(
        ...events.map(
          (event) =>
            structuredClone(
              event,
            ),
        ),
      );

      for (
        const [
          residentId,
          decision,
        ] of decisions
      ) {
        const input =
          inputs.get(
            residentId,
          )!;

        experiences.push({
          tick:
            input.observation.tick,
          residentId,
          matters:
            structuredClone(
              input.matters,
            ),
          activityBefore:
            input.activityBefore
              ? structuredClone(
                  input.activityBefore,
                )
              : null,
          observation:
            structuredClone(
              input.observation,
            ),
          memory:
            structuredClone(
              input.memory,
            ),
          decision:
            structuredClone(
              decision,
            ),
          factualOutcomeEvents:
            events
              .filter(
                (event) =>
                  event.actorId ===
                  residentId,
              )
              .map(
                (event) =>
                  structuredClone(
                    event,
                  ),
              ),
        });
      }

      const activities:
        Record<
          string,
          ResidentActivity | null
        > = {};

      for (
        const [
          residentId,
          decision,
        ] of decisions
      ) {
        activities[
          residentId
        ] =
          decision.activity
            ? structuredClone(
                decision.activity,
              )
            : null;
      }

      return {
        tick: world.tick,
        events:
          events.map(
            (event) =>
              structuredClone(
                event,
              ),
          ),
        snapshot:
          world.snapshot(),
        activities,
      };
    },

    runTicks(
      count: number,
    ): readonly AutonomousLifeStep[] {
      if (
        !Number.isSafeInteger(
          count,
        ) ||
        count < 1
      ) {
        throw new Error(
          "runTicks requires a positive safe integer",
        );
      }

      const steps:
        AutonomousLifeStep[] =
          [];

      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        steps.push(
          this.advanceOneTick(),
        );
      }

      return steps;
    },

    allEvents() {
      return history.map(
        (event) =>
          structuredClone(
            event,
          ),
      );
    },

    privateExperiences() {
      return experiences.map(
        (experience) =>
          structuredClone(
            experience,
          ),
      );
    },

    metrics() {
      return computeRunMetrics(
        purpose,
        wording,
        matter,
        structure,
        experiences,
        history,
      );
    },
  };
}

export function auditR3GroundedPurposeStructure(
  horizonTicks =
    DEFAULT_HORIZON_TICKS,
): R3GroundedPurposeStructureAudit {
  const rack =
    createR3GroundedPurposeStructureRun(
      "input_rack",
      "baseline",
    );
  const rackSteps =
    rack.runTicks(
      horizonTicks,
    );

  const output =
    createR3GroundedPurposeStructureRun(
      "output",
      "baseline",
    );
  const outputSteps =
    output.runTicks(
      horizonTicks,
    );

  const rackMetrics =
    rack.metrics();
  const outputMetrics =
    output.metrics();

  const rackParaphrase =
    createR3GroundedPurposeStructureRun(
      "input_rack",
      "paraphrase",
    );
  const rackParaphraseSteps =
    rackParaphrase.runTicks(
      horizonTicks,
    );

  const outputParaphrase =
    createR3GroundedPurposeStructureRun(
      "output",
      "paraphrase",
    );
  const outputParaphraseSteps =
    outputParaphrase.runTicks(
      horizonTicks,
    );

  const firstDivergence =
    firstIdaDecisionDivergenceTick(
      rack.privateExperiences(),
      output.privateExperiences(),
    );

  const stageA = {
    sameMatterId:
      rackMetrics.matterId ===
      outputMetrics.matterId,
    differentPurposeStatements:
      rackMetrics
        .matterStatement !==
      outputMetrics
        .matterStatement,
    differentStructuredTargets:
      rack.purposeStructure()
        .targetPlaceId !==
      output.purposeStructure()
        .targetPlaceId,
    firstPurposeDecisionDivergenceTick:
      firstDivergence,
    rackPurpose:
      rackMetrics,
    outputPurpose:
      outputMetrics,
    rackPurposePrefersRackPlacement:
      rackMetrics
        .idaPlacementsAtRack >
      rackMetrics
        .idaPlacementsAtOutput,
    outputPurposePrefersOutputPlacement:
      outputMetrics
        .idaPlacementsAtOutput >
      outputMetrics
        .idaPlacementsAtRack,
    causalStructurePass:
      false,
  };

  stageA.causalStructurePass =
    stageA.sameMatterId &&
    stageA
      .differentPurposeStatements &&
    stageA
      .differentStructuredTargets &&
    stageA
      .firstPurposeDecisionDivergenceTick !==
      null &&
    stageA
      .rackPurposePrefersRackPlacement &&
    stageA
      .outputPurposePrefersOutputPlacement;

  const stageB = {
    rackWorldTrajectoryInvariant:
      stable(
        rackSteps,
      ) ===
      stable(
        rackParaphraseSteps,
      ),
    rackPrivateTrajectoryInvariant:
      stable(
        causalPrivateProjection(
          rack.privateExperiences(),
        ),
      ) ===
      stable(
        causalPrivateProjection(
          rackParaphrase
            .privateExperiences(),
        ),
      ),
    outputWorldTrajectoryInvariant:
      stable(
        outputSteps,
      ) ===
      stable(
        outputParaphraseSteps,
      ),
    outputPrivateTrajectoryInvariant:
      stable(
        causalPrivateProjection(
          output.privateExperiences(),
        ),
      ) ===
      stable(
        causalPrivateProjection(
          outputParaphrase
            .privateExperiences(),
        ),
      ),
    statementsChanged:
      rack.metrics()
        .matterStatement !==
        rackParaphrase
          .metrics()
          .matterStatement &&
      output.metrics()
        .matterStatement !==
        outputParaphrase
          .metrics()
          .matterStatement,
    structuresPreserved:
      stable(
        rack.purposeStructure(),
      ) ===
      stable(
        rackParaphrase
          .purposeStructure(),
      ) &&
      stable(
        output.purposeStructure(),
      ) ===
      stable(
        outputParaphrase
          .purposeStructure(),
      ),
    wordingInvariancePass:
      false,
  };

  stageB.wordingInvariancePass =
    stageB
      .rackWorldTrajectoryInvariant &&
    stageB
      .rackPrivateTrajectoryInvariant &&
    stageB
      .outputWorldTrajectoryInvariant &&
    stageB
      .outputPrivateTrajectoryInvariant &&
    stageB
      .statementsChanged &&
    stageB
      .structuresPreserved;

  const stageC = {
    rackRecurrentGroundingPass:
      recurrentGroundingPass(
        rackMetrics,
      ),
    outputRecurrentGroundingPass:
      recurrentGroundingPass(
        outputMetrics,
      ),
    recurrentGroundingPass:
      false,
  };

  stageC.recurrentGroundingPass =
    stageC
      .rackRecurrentGroundingPass &&
    stageC
      .outputRecurrentGroundingPass;

  const stageD = {
    fixedMatterIdAcrossPurposes:
      stageA.sameMatterId &&
      rackMetrics.matterId ===
        R3_GROUNDED_PURPOSE_MATTER_ID,
    structureUsesExistingWorldVocabulary:
      purposeStructureValid(
        rack.purposeStructure(),
      ) &&
      purposeStructureValid(
        output.purposeStructure(),
      ),
    maintainerReadsMatterIdentity:
      false as const,
    maintainerReadsStatementText:
      false as const,
    backgroundReceivesPurpose:
      false as const,
    hiddenWorldUsedForSatisfaction:
      false as const,
    semanticOraclePresent:
      false as const,
    provenancePass:
      false,
  };

  stageD.provenancePass =
    stageD
      .fixedMatterIdAcrossPurposes &&
    stageD
      .structureUsesExistingWorldVocabulary &&
    !stageD
      .maintainerReadsMatterIdentity &&
    !stageD
      .maintainerReadsStatementText &&
    !stageD
      .backgroundReceivesPurpose &&
    !stageD
      .hiddenWorldUsedForSatisfaction &&
    !stageD
      .semanticOraclePresent;

  let classification:
    R3GroundedPurposeStructureClassification;

  if (
    !stageD.provenancePass
  ) {
    classification =
      "GROUNDED_PURPOSE_STRUCTURE_PROVENANCE_FAIL";
  } else if (
    !stageA.causalStructurePass
  ) {
    classification =
      "GROUNDED_PURPOSE_STRUCTURE_CAUSAL_FAIL";
  } else if (
    !stageB
      .wordingInvariancePass ||
    !stageC
      .recurrentGroundingPass
  ) {
    classification =
      "GROUNDED_PURPOSE_STRUCTURE_PRESSURE_FAIL";
  } else {
    classification =
      "GROUNDED_PURPOSE_STRUCTURE_QUALIFIED";
  }

  const reasons:
    string[] = [];

  if (
    stageA.causalStructurePass
  ) {
    reasons.push(
      "same-id actor behavior changes when only the grounded target-place structure changes",
    );
  }

  if (
    stageB
      .wordingInvariancePass
  ) {
    reasons.push(
      "baseline/paraphrase statement changes leave behavior invariant when grounded purpose structure is held fixed",
    );
  }

  if (
    stageC
      .recurrentGroundingPass
  ) {
    reasons.push(
      "both purpose worlds contain recurrent privately observed satisfied and unsatisfied episodes under purpose-independent depletion",
    );
  }

  return {
    horizonTicks,
    stageA,
    stageB,
    stageC,
    stageD,
    classification,
    reasons,
  };
}

class GroundedPurposeMaintainerPolicy
implements ResidentPolicy {
  readonly residentId =
    "resident:ida" as const;

  private needsSupply =
    false;

  constructor(
    private readonly purpose:
      R3GroundedPurposeStructure,
    private readonly actionRange:
      number,
  ) {}

  decide(
    input:
      ResidentPolicyInput,
  ): ResidentDecision {
    const target =
      input.places[
        this.purpose
          .targetPlaceId
      ];
    const source =
      input.places.source;
    const self =
      input.observation.self;
    const held =
      input.observation
        .heldObject;

    if (
      held?.kind ===
      this.purpose.objectKind
    ) {
      if (
        near(
          self.position,
          target,
        )
      ) {
        this.needsSupply =
          false;
        return {
          intent: {
            kind: "place",
            objectId:
              held.id,
            position:
              target.position,
          },
          activity:
            purposeActivity(
              input,
              "grounded_purpose_maintain",
              "place_target_stock",
              target.id,
            ),
        };
      }

      return {
        intent: {
          kind: "move_to",
          target:
            target.position,
        },
        activity:
          purposeActivity(
            input,
            "grounded_purpose_maintain",
            "carry_stock_to_target",
            target.id,
          ),
      };
    }

    if (
      this.needsSupply
    ) {
      if (
        !near(
          self.position,
          source,
        )
      ) {
        return {
          intent: {
            kind: "move_to",
            target:
              source.position,
          },
          activity:
            purposeActivity(
              input,
              "grounded_purpose_maintain",
              "go_to_source",
              target.id,
            ),
        };
      }

      const raw =
        visibleFreeRawAt(
          input,
          source,
        );

      if (raw) {
        if (
          raw.location.kind ===
            "free" &&
          distance(
            self.position,
            raw.location.position,
          ) >
            this.actionRange
        ) {
          return {
            intent: {
              kind: "move_to",
              target:
                raw.location
                  .position,
            },
            activity:
              purposeActivity(
                input,
                "grounded_purpose_maintain",
                "approach_source_stock",
                target.id,
              ),
          };
        }

        return {
          intent: {
            kind: "pickup",
            objectId:
              raw.id,
          },
          activity:
            purposeActivity(
              input,
              "grounded_purpose_maintain",
              "pick_source_stock",
              target.id,
            ),
        };
      }

      return {
        intent: {
          kind: "idle",
        },
        activity:
          purposeActivity(
            input,
            "grounded_purpose_maintain",
            "wait_for_source",
            target.id,
          ),
      };
    }

    if (
      !near(
        self.position,
        target,
      )
    ) {
      return {
        intent: {
          kind: "move_to",
          target:
            target.position,
        },
        activity:
          purposeActivity(
            input,
            "grounded_purpose_maintain",
            "inspect_target",
            target.id,
          ),
      };
    }

    const present =
      visibleFreeRawAt(
        input,
        target,
      ) !== null;

    if (present) {
      return {
        intent: {
          kind: "idle",
        },
        activity:
          purposeActivity(
            input,
            "grounded_purpose_maintain",
            "monitor_satisfied_target",
            target.id,
          ),
      };
    }

    this.needsSupply =
      true;

    return {
      intent: {
        kind: "move_to",
        target:
          source.position,
      },
      activity:
        purposeActivity(
          input,
          "grounded_purpose_maintain",
          "respond_to_empty_target",
          target.id,
        ),
    };
  }
}

class GroundedPurposeDepleterPolicy
implements ResidentPolicy {
  readonly residentId =
    "resident:janek" as const;

  private target:
    R3GroundedPurposeTargetPlace =
      "input_rack";

  decide(
    input:
      ResidentPolicyInput,
  ): ResidentDecision {
    const self =
      input.observation.self;
    const held =
      input.observation
        .heldObject;
    const depot =
      input.places.depot;

    if (
      held?.kind ===
      "raw_blank"
    ) {
      if (
        near(
          self.position,
          depot,
        )
      ) {
        return {
          intent: {
            kind: "place",
            objectId:
              held.id,
            position:
              depot.position,
          },
          activity:
            backgroundActivity(
              input,
              "deposit_removed_stock",
            ),
        };
      }

      return {
        intent: {
          kind: "move_to",
          target:
            depot.position,
        },
        activity:
          backgroundActivity(
            input,
            "carry_removed_stock",
          ),
      };
    }

    const targetPlace =
      input.places[
        this.target
      ];

    if (
      !near(
        self.position,
        targetPlace,
      )
    ) {
      return {
        intent: {
          kind: "move_to",
          target:
            targetPlace
              .position,
        },
        activity:
          backgroundActivity(
            input,
            "visit_" +
              this.target,
          ),
      };
    }

    const raw =
      visibleFreeRawAt(
        input,
        targetPlace,
      );

    if (raw) {
      this.toggleTarget();
      return {
        intent: {
          kind: "pickup",
          objectId:
            raw.id,
        },
        activity:
          backgroundActivity(
            input,
            "remove_target_stock",
          ),
      };
    }

    this.toggleTarget();

    return {
      intent: {
        kind: "move_to",
        target:
          input.places[
            this.target
          ].position,
      },
      activity:
        backgroundActivity(
          input,
          "advance_route",
        ),
    };
  }

  private toggleTarget():
  void {
    this.target =
      this.target ===
        "input_rack"
        ? "output"
        : "input_rack";
  }
}

function computeRunMetrics(
  purpose:
    R3GroundedPurposeTargetPlace,
  wording:
    R3GroundedPurposeWording,
  matter:
    ResidentMatter,
  structure:
    R3GroundedPurposeStructure,
  experiences:
    readonly ResidentPrivateExperience[],
  events:
    readonly LifeEvent[],
): R3GroundedPurposeRunMetrics {
  const idaRows =
    experiences.filter(
      (experience) =>
        experience.residentId ===
        "resident:ida",
    );

  const values:
    (boolean | null)[] =
      idaRows.map(
        (experience) =>
          privatelyObservedSatisfaction(
            experience,
            structure,
          ),
      );

  const episodes =
    booleanEpisodeStats(
      values,
    );

  const idaPlaces =
    events.filter(
      (event) =>
        event.kind ===
          "place" &&
        event.actorId ===
          "resident:ida" &&
        event.payload
          .objectKind ===
          "raw_blank",
    );

  const idaPlacementsAtRack =
    idaPlaces.filter(
      (event) =>
        distance(
          event.position,
          R3_GROUNDED_PURPOSE_PLACES
            .input_rack.position,
        ) <= 0.75,
    ).length;

  const idaPlacementsAtOutput =
    idaPlaces.filter(
      (event) =>
        distance(
          event.position,
          R3_GROUNDED_PURPOSE_PLACES
            .output.position,
        ) <= 0.75,
    ).length;

  const depleterPickups =
    events.filter(
      (event) =>
        event.kind ===
          "pickup" &&
        event.actorId ===
          "resident:janek" &&
        event.payload
          .objectKind ===
          "raw_blank",
    ).length;

  return {
    purpose,
    wording,
    ticks:
      idaRows.length,
    matterId:
      matter.id,
    matterStatement:
      matter.statement,
    idaPlacementsAtRack,
    idaPlacementsAtOutput,
    idaTargetPlacements:
      purpose ===
        "input_rack"
        ? idaPlacementsAtRack
        : idaPlacementsAtOutput,
    depleterPickups,
    satisfaction:
      episodes,
  };
}

function privatelyObservedSatisfaction(
  experience:
    ResidentPrivateExperience,
  structure:
    R3GroundedPurposeStructure,
): boolean | null {
  const target =
    R3_GROUNDED_PURPOSE_PLACES[
      structure
        .targetPlaceId
    ];

  if (
    distance(
      experience.observation
        .self.position,
      target.position,
    ) >
    2.5
  ) {
    return null;
  }

  return experience
    .observation
    .visibleObjects.some(
      (object) =>
        object.kind ===
          structure.objectKind &&
        object.location.kind ===
          "free" &&
        distance(
          object.location
            .position,
          target.position,
        ) <= 0.75,
    );
}

function booleanEpisodeStats(
  values:
    readonly (
      boolean | null
    )[],
) {
  let observedTicks = 0;
  let satisfiedTicks = 0;
  let unsatisfiedTicks = 0;
  let satisfiedEpisodes = 0;
  let unsatisfiedEpisodes = 0;
  let transitions = 0;
  let previous:
    boolean | null = null;

  for (
    const value of values
  ) {
    if (
      value === null
    ) {
      previous =
        null;
      continue;
    }

    observedTicks += 1;

    if (value) {
      satisfiedTicks += 1;
    } else {
      unsatisfiedTicks += 1;
    }

    if (
      previous === null
    ) {
      if (value) {
        satisfiedEpisodes += 1;
      } else {
        unsatisfiedEpisodes += 1;
      }
    } else if (
      previous !== value
    ) {
      transitions += 1;
      if (value) {
        satisfiedEpisodes += 1;
      } else {
        unsatisfiedEpisodes += 1;
      }
    }

    previous = value;
  }

  return {
    observedTicks,
    satisfiedTicks,
    unsatisfiedTicks,
    satisfiedEpisodes,
    unsatisfiedEpisodes,
    transitions,
  };
}

function recurrentGroundingPass(
  metrics:
    R3GroundedPurposeRunMetrics,
): boolean {
  return (
    metrics.satisfaction
      .satisfiedEpisodes >=
      3 &&
    metrics.satisfaction
      .unsatisfiedEpisodes >=
      3 &&
    metrics.satisfaction
      .transitions >=
      3 &&
    metrics
      .idaTargetPlacements >=
      3
  );
}

function purposeMatter(
  purpose:
    R3GroundedPurposeTargetPlace,
  wording:
    R3GroundedPurposeWording,
): ResidentMatter {
  return {
    id:
      R3_GROUNDED_PURPOSE_MATTER_ID,
    statement:
      PURPOSE_STATEMENTS[
        purpose
      ][wording],
    establishedTick:
      0,
    source:
      "authored",
  };
}

function visibleFreeRawAt(
  input:
    ResidentPolicyInput,
  place:
    LifePlace,
) {
  return (
    input.observation
      .visibleObjects.find(
        (object) =>
          object.kind ===
            "raw_blank" &&
          object.location.kind ===
            "free" &&
          distance(
            object.location
              .position,
            place.position,
          ) <= 0.75,
      ) ??
    null
  );
}

function near(
  position:
    import("./life-contracts").Vec2,
  place:
    LifePlace,
  radius = 0.38,
): boolean {
  return (
    distance(
      position,
      place.position,
    ) <= radius
  );
}

function purposeActivity(
  input:
    ResidentPolicyInput,
  kind: string,
  phase: string,
  subjectId:
    string | null,
): ResidentActivity {
  const previous =
    input.previousActivity;

  if (
    previous?.kind ===
      kind &&
    previous.subjectId ===
      subjectId
  ) {
    return {
      ...previous,
      phase,
    };
  }

  return {
    id:
      "resident:ida:" +
      kind +
      ":" +
      input.observation.tick,
    kind,
    phase,
    startedTick:
      input.observation.tick,
    subjectId,
  };
}

function backgroundActivity(
  input:
    ResidentPolicyInput,
  phase: string,
): ResidentActivity {
  const previous =
    input.previousActivity;

  if (
    previous?.kind ===
    "grounded_purpose_depleter"
  ) {
    return {
      ...previous,
      phase,
    };
  }

  return {
    id:
      "resident:janek:grounded_purpose_depleter:" +
      input.observation.tick,
    kind:
      "grounded_purpose_depleter",
    phase,
    startedTick:
      input.observation.tick,
    subjectId:
      null,
  };
}

function firstIdaDecisionDivergenceTick(
  left:
    readonly ResidentPrivateExperience[],
  right:
    readonly ResidentPrivateExperience[],
): number | null {
  const leftRows =
    left.filter(
      (row) =>
        row.residentId ===
        "resident:ida",
    );
  const rightByTick =
    new Map(
      right
        .filter(
          (row) =>
            row.residentId ===
            "resident:ida",
        )
        .map(
          (row) => [
            row.tick,
            row,
          ],
        ),
    );

  for (
    const row of leftRows
  ) {
    const paired =
      rightByTick.get(
        row.tick,
      );

    if (!paired) {
      continue;
    }

    if (
      stableDecision(
        row.decision,
      ) !==
      stableDecision(
        paired.decision,
      )
    ) {
      return row.tick;
    }
  }

  return null;
}

function causalPrivateProjection(
  experiences:
    readonly ResidentPrivateExperience[],
) {
  return experiences.map(
    (experience) => ({
      tick:
        experience.tick,
      residentId:
        experience.residentId,
      matters:
        experience.matters.map(
          (matter) => ({
            id:
              matter.id,
            establishedTick:
              matter.establishedTick,
            source:
              matter.source,
          }),
        ),
      activityBefore:
        experience.activityBefore,
      observation:
        experience.observation,
      memory:
        experience.memory,
      decision:
        experience.decision,
      factualOutcomeEvents:
        experience
          .factualOutcomeEvents,
    }),
  );
}

function purposeStructureValid(
  structure:
    R3GroundedPurposeStructure,
): boolean {
  return (
    structure.objectKind ===
      "raw_blank" &&
    (
      structure.targetPlaceId ===
        "input_rack" ||
      structure.targetPlaceId ===
        "output"
    ) &&
    structure.desiredPresence ===
      true
  );
}

function stableDecision(
  decision:
    ResidentDecision,
): string {
  return stable(
    decision,
  );
}

function stable(
  value: unknown,
): string {
  return JSON.stringify(
    value,
  );
}

export function r3GroundedPurposeDefaultHorizonTicks():
number {
  return DEFAULT_HORIZON_TICKS;
}
