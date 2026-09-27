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
  MATERIAL_FIXTURE_MATTER_IDS,
  resetFixtureActivitySerials,
  WorkerFixturePolicy,
} from "./life-fixture-policies";
import {
  AutonomousLifeWorld,
  distance,
} from "./life-world";
import {
  AutonomousResidentAgent,
} from "./resident-agent";

export type R3GroundedRecurrentReportMode =
  | "ignore-all"
  | "respond-all"
  | "exact-text-once"
  | "ideal-grounded-episode";

export const R3_GROUNDED_REQUEST_TEXT =
  "The input rack is empty.";
export const R3_GROUNDED_ACK_TEXT =
  "I'll restock the input rack.";

export const R3_GROUNDED_REPORT_PLACES:
  Readonly<
    Record<
      LifePlace["id"],
      LifePlace
    >
  > = {
    source: {
      id: "source",
      position: {
        x: 4,
        y: 0,
      },
    },
    input_rack: {
      id: "input_rack",
      position: {
        x: 8,
        y: 0,
      },
    },
    workbench: {
      id: "workbench",
      position: {
        x: 10,
        y: 0,
      },
    },
    output: {
      id: "output",
      position: {
        x: 12,
        y: 0,
      },
    },
    depot: {
      id: "depot",
      position: {
        x: 18,
        y: 0,
      },
    },
  };

export interface R3GroundedRecurrentReportMetrics {
  mode:
    R3GroundedRecurrentReportMode;
  ticks: number;
  requestCount: number;
  acceptedReportCount: number;
  rackPlacementCount: number;
  processingCompletedCount: number;
  workerBlockedTicks: number;
  shortageEpisodeCount: number;
  requestCountsPerEpisode:
    readonly number[];
  responseCountsPerEpisode:
    readonly number[];
  firstAcceptedRequestOutOfSight:
    boolean | null;
  repeatInsideUnresolvedEpisode:
    boolean;
  sameSurfaceAfterSettledEpisode:
    boolean;
  ignoredRepeatInsideUnresolvedEpisode:
    boolean;
}

export interface R3GroundedRecurrentReportRun {
  readonly world:
    AutonomousLifeWorld;
  advanceOneTick():
    AutonomousLifeStep;
  runTicks(
    count: number,
  ):
    readonly AutonomousLifeStep[];
  allEvents():
    readonly LifeEvent[];
  privateExperiences():
    readonly ResidentPrivateExperience[];
  metrics():
    R3GroundedRecurrentReportMetrics;
}

const MIRA_MATTER:
  ResidentMatter = {
    id:
      "resident:mira:matter:grounded-report-supply",
    statement:
      "keep the workshop input rack supplied with raw blanks when credible local evidence indicates supply is needed",
    establishedTick: 0,
    source: "authored",
  };

const JANEK_MATTER:
  ResidentMatter = {
    id:
      MATERIAL_FIXTURE_MATTER_IDS.worker,
    statement:
      "turn available raw blanks into finished workshop parts",
    establishedTick: 0,
    source: "authored",
  };

export function createR3GroundedRecurrentReportRun(
  mode:
    R3GroundedRecurrentReportMode,
):
R3GroundedRecurrentReportRun {
  resetFixtureActivitySerials();

  const world =
    new AutonomousLifeWorld({
      sourcePosition:
        R3_GROUNDED_REPORT_PLACES
          .source.position,
      workbenchPosition:
        R3_GROUNDED_REPORT_PLACES
          .workbench.position,
    });

  world.addResident(
    "resident:mira",
    {
      x: 4,
      y: 0,
    },
    {
      sightRadius: 2.5,
      hearingRadius: 5,
      speedPerTick: 0.03,
    },
  );
  world.addResident(
    "resident:janek",
    {
      x: 9.6,
      y: 0.6,
    },
  );

  const agents =
    new Map<
      ResidentId,
      AutonomousResidentAgent
    >();

  agents.set(
    "resident:mira",
    new AutonomousResidentAgent(
      new GroundedReportMiraPolicy(
        mode,
      ),
      [MIRA_MATTER],
    ),
  );
  agents.set(
    "resident:janek",
    new AutonomousResidentAgent(
      new WorkerFixturePolicy(),
      [JANEK_MATTER],
    ),
  );

  for (
    let index = 0;
    index < 3;
    index += 1
  ) {
    world.addMaterial(
      "raw_blank",
      {
        x:
          R3_GROUNDED_REPORT_PLACES
            .source.position.x +
          index * 0.12,
        y:
          R3_GROUNDED_REPORT_PLACES
            .source.position.y,
      },
    );
  }

  const history:
    LifeEvent[] = [];
  const experiences:
    ResidentPrivateExperience[] =
      [];

  const run:
    R3GroundedRecurrentReportRun = {
      world,

      advanceOneTick() {
        const decisions =
          new Map<
            ResidentId,
            ResidentDecision
          >();
        const privateInputs =
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
            [...agents.keys()].sort(
              (left, right) =>
                left.localeCompare(
                  right,
                ),
            )
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
              R3_GROUNDED_REPORT_PLACES,
            );

          decisions.set(
            residentId,
            decision,
          );
          privateInputs.set(
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

        const intents =
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
          );

        const events =
          world.step(intents);
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
            privateInputs.get(
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
          tick:
            world.tick,
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

      runTicks(count) {
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
        return buildMetrics(
          mode,
          world.tick,
          history,
          experiences,
        );
      },
    };

  return run;
}

class GroundedReportMiraPolicy
  implements ResidentPolicy
{
  readonly residentId =
    "resident:mira" as const;

  private pendingSupply = false;
  private lastExactText:
    string | null = null;

  constructor(
    private readonly mode:
      R3GroundedRecurrentReportMode,
  ) {}

  decide(
    input:
      ResidentPolicyInput,
  ):
  ResidentDecision {
    const tick =
      input.observation.tick;
    const rack =
      input.places.input_rack;
    const source =
      input.places.source;

    if (
      this.pendingSupply &&
      !input.observation
        .heldObject &&
      near(
        input.observation.self
          .position,
        rack.position,
      ) &&
      visibleFreeRawAt(
        input,
        rack,
      )
    ) {
      this.pendingSupply =
        false;
    }

    const request =
      input.observation
        .heardEvents.find(
          (event) =>
            event.kind ===
              "speech" &&
            event.actorId ===
              "resident:janek" &&
            event.payload.text ===
              R3_GROUNDED_REQUEST_TEXT,
        );

    if (
      request &&
      this.acceptsRequest(
        R3_GROUNDED_REQUEST_TEXT,
      )
    ) {
      this.pendingSupply =
        true;
      return {
        intent: {
          kind: "speak",
          text:
            R3_GROUNDED_ACK_TEXT,
          radius: 5,
        },
        activity:
          miraActivity(
            input.previousActivity,
            tick,
            "acknowledge_request",
          ),
      };
    }

    if (
      this.pendingSupply
    ) {
      const held =
        input.observation
          .heldObject;

      if (
        held?.kind ===
        "raw_blank"
      ) {
        if (
          near(
            input.observation.self
              .position,
            rack.position,
          )
        ) {
          return {
            intent: {
              kind: "place",
              objectId:
                held.id,
              position:
                rack.position,
            },
            activity:
              miraActivity(
                input.previousActivity,
                tick,
                "place_requested_raw",
                held.id,
              ),
          };
        }

        return {
          intent: {
            kind: "move_to",
            target:
              rack.position,
          },
          activity:
            miraActivity(
              input.previousActivity,
              tick,
              "carry_requested_raw",
              held.id,
            ),
        };
      }

      if (
        !near(
          input.observation.self
            .position,
          source.position,
        )
      ) {
        return {
          intent: {
            kind: "move_to",
            target:
              source.position,
          },
          activity:
            miraActivity(
              input.previousActivity,
              tick,
              "go_to_source",
            ),
        };
      }

      const raw =
        visibleFreeRawAt(
          input,
          source,
        );

      if (raw) {
        return {
          intent: {
            kind: "pickup",
            objectId:
              raw.id,
          },
          activity:
            miraActivity(
              input.previousActivity,
              tick,
              "pick_requested_raw",
              raw.id,
            ),
        };
      }

      return {
        intent: {
          kind: "idle",
        },
        activity:
          miraActivity(
            input.previousActivity,
            tick,
            "wait_for_source",
          ),
      };
    }

    if (
      !near(
        input.observation.self
          .position,
        source.position,
      )
    ) {
      return {
        intent: {
          kind: "move_to",
          target:
            source.position,
        },
        activity:
          miraActivity(
            input.previousActivity,
            tick,
            "return_to_source",
          ),
      };
    }

    return {
      intent: {
        kind: "idle",
      },
      activity:
        miraActivity(
          input.previousActivity,
          tick,
          "wait_for_report",
        ),
    };
  }

  private acceptsRequest(
    text: string,
  ): boolean {
    switch (this.mode) {
      case "ignore-all":
        return false;

      case "respond-all":
        return true;

      case "exact-text-once":
        if (
          this.lastExactText ===
          text
        ) {
          return false;
        }
        this.lastExactText =
          text;
        return true;

      case "ideal-grounded-episode":
        return (
          !this.pendingSupply
        );
    }
  }
}

function buildMetrics(
  mode:
    R3GroundedRecurrentReportMode,
  ticks: number,
  events:
    readonly LifeEvent[],
  experiences:
    readonly ResidentPrivateExperience[],
):
R3GroundedRecurrentReportMetrics {
  const requestEvents =
    events.filter(
      (event) =>
        event.kind ===
          "speech" &&
        event.actorId ===
          "resident:janek" &&
        event.payload.text ===
          R3_GROUNDED_REQUEST_TEXT,
    );

  const responseEvents =
    events.filter(
      (event) =>
        event.kind ===
          "speech" &&
        event.actorId ===
          "resident:mira" &&
        event.payload.text ===
          R3_GROUNDED_ACK_TEXT,
    );

  const placements =
    events.filter(
      (event) =>
        event.kind ===
          "place" &&
        event.actorId ===
          "resident:mira" &&
        event.payload.objectKind ===
          "raw_blank" &&
        distance(
          event.position,
          R3_GROUNDED_REPORT_PLACES
            .input_rack
            .position,
        ) <= 0.75,
    );

  const processingCompleted =
    events.filter(
      (event) =>
        event.kind ===
          "processing_completed" &&
        event.actorId ===
          "resident:janek",
    );

  const janekExperiences =
    experiences.filter(
      (experience) =>
        experience.residentId ===
        "resident:janek",
    );

  const workerBlockedTicks =
    janekExperiences.filter(
      (experience) =>
        experience.decision
          .activity?.kind ===
          "seek_input" &&
        (
          experience.decision
            .activity?.phase ===
            "blocked_waiting_for_input" ||
          experience.decision
            .activity?.phase ===
            "wait_at_empty_rack"
        ),
    ).length;

  const episodeForTick = (
    tick: number,
  ): number =>
    placements.filter(
      (event) =>
        event.tick < tick,
    ).length;

  const requestCounts =
    new Map<number, number>();
  const responseCounts =
    new Map<number, number>();

  for (
    const event of
      requestEvents
  ) {
    const episode =
      episodeForTick(
        event.tick,
      );
    requestCounts.set(
      episode,
      (
        requestCounts.get(
          episode,
        ) ?? 0
      ) + 1,
    );
  }

  for (
    const event of
      responseEvents
  ) {
    const episode =
      episodeForTick(
        event.tick,
      );
    responseCounts.set(
      episode,
      (
        responseCounts.get(
          episode,
        ) ?? 0
      ) + 1,
    );
  }

  const maxEpisode =
    Math.max(
      -1,
      ...requestCounts.keys(),
      ...responseCounts.keys(),
    );

  const requestCountsPerEpisode =
    Array.from(
      {
        length:
          maxEpisode + 1,
      },
      (_, index) =>
        requestCounts.get(
          index,
        ) ?? 0,
    );

  const responseCountsPerEpisode =
    Array.from(
      {
        length:
          maxEpisode + 1,
      },
      (_, index) =>
        responseCounts.get(
          index,
        ) ?? 0,
    );

  const firstAckExperience =
    experiences.find(
      (experience) =>
        experience.residentId ===
          "resident:mira" &&
        experience.decision.intent
          .kind ===
          "speak" &&
        experience.decision.intent
          .text ===
          R3_GROUNDED_ACK_TEXT,
    );

  const firstAcceptedRequestOutOfSight =
    firstAckExperience
      ? distance(
          firstAckExperience
            .observation.self
            .position,
          R3_GROUNDED_REPORT_PLACES
            .input_rack
            .position,
        ) > 2.5
      : null;

  const repeatInsideUnresolvedEpisode =
    requestCountsPerEpisode.some(
      (count) => count >= 2,
    );

  const sameSurfaceAfterSettledEpisode =
    requestCountsPerEpisode
      .slice(1)
      .some(
        (count) => count > 0,
      );

  const ignoredRepeatInsideUnresolvedEpisode =
    requestCountsPerEpisode.some(
      (requestCount, index) =>
        requestCount >= 2 &&
        (
          responseCountsPerEpisode[
            index
          ] ?? 0
        ) <
          requestCount,
    );

  return {
    mode,
    ticks,
    requestCount:
      requestEvents.length,
    acceptedReportCount:
      responseEvents.length,
    rackPlacementCount:
      placements.length,
    processingCompletedCount:
      processingCompleted.length,
    workerBlockedTicks,
    shortageEpisodeCount:
      requestCountsPerEpisode
        .filter(
          (count) =>
            count > 0,
        ).length,
    requestCountsPerEpisode,
    responseCountsPerEpisode,
    firstAcceptedRequestOutOfSight,
    repeatInsideUnresolvedEpisode,
    sameSurfaceAfterSettledEpisode,
    ignoredRepeatInsideUnresolvedEpisode,
  };
}

function visibleFreeRawAt(
  input:
    ResidentPolicyInput,
  place:
    LifePlace,
):
import("./life-contracts")
  .MaterialSnapshot | null {
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
      ) ?? null
  );
}

function near(
  left:
    { x: number; y: number },
  right:
    { x: number; y: number },
  radius = 0.38,
): boolean {
  return (
    distance(
      left,
      right,
    ) <= radius
  );
}

function miraActivity(
  previous:
    ResidentActivity | null,
  tick: number,
  phase: string,
  subjectId:
    string | null = null,
):
ResidentActivity {
  if (
    previous &&
    previous.kind ===
      "grounded_supply" &&
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
      "resident:mira:grounded_supply:" +
      tick,
    kind:
      "grounded_supply",
    phase,
    startedTick:
      tick,
    subjectId,
  };
}
