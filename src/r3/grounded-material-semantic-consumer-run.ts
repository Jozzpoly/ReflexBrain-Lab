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
  StewardFixturePolicy,
  WorkerFixturePolicy,
} from "./life-fixture-policies";
import {
  AutonomousLifeWorld,
  distance,
} from "./life-world";
import {
  AutonomousResidentAgent,
} from "./resident-agent";

export type R3GroundedMaterialPurpose =
  | "rack"
  | "source";

export type R3GroundedMaterialConsumerMode =
  | "ignore-all"
  | "respond-all"
  | "rack-surface-only"
  | "source-surface-only"
  | "rack-speaker-only"
  | "source-speaker-only"
  | "ideal-semantic-oracle";

export type R3GroundedMaterialRegime =
  | "relation"
  | "persistent";

export type R3GroundedMaterialDomain =
  | "rack"
  | "source";

export const R3_GROUNDED_MATERIAL_REPORTS = {
  rack:
    "The input rack is empty.",
  source:
    "The raw source is empty.",
} as const;

export const R3_GROUNDED_MATERIAL_ACKS = {
  rack:
    "Janek, rack report received.",
  source:
    "Mira, source report received.",
} as const;

export const R3_GROUNDED_MATERIAL_PLACES:
  Readonly<
    Record<
      LifePlace["id"],
      LifePlace
    >
  > = {
    source: {
      id: "source",
      position: { x: 4, y: 0 },
    },
    input_rack: {
      id: "input_rack",
      position: { x: 8, y: 0 },
    },
    workbench: {
      id: "workbench",
      position: { x: 10, y: 0 },
    },
    output: {
      id: "output",
      position: { x: 12, y: 0 },
    },
    depot: {
      id: "depot",
      position: { x: 18, y: 0 },
    },
  };

export const R3_GROUNDED_MATERIAL_MATTER_ID =
  "resident:ida:matter:grounded-material-status";

export interface R3GroundedMaterialRelationDecision {
  tick: number;
  eventId: string;
  domain: R3GroundedMaterialDomain;
  purpose: R3GroundedMaterialPurpose;
  shouldAcknowledge: boolean;
}

export interface R3GroundedMaterialListenerDebug {
  decisions:
    readonly R3GroundedMaterialRelationDecision[];
  ackCount: number;
  rackAckCount: number;
  sourceAckCount: number;
}

export interface R3GroundedMaterialRunMetrics {
  purpose: R3GroundedMaterialPurpose;
  mode: R3GroundedMaterialConsumerMode;
  regime: R3GroundedMaterialRegime;
  ticks: number;
  rackReportCount: number;
  sourceReportCount: number;
  rackAckCount: number;
  sourceAckCount: number;
  totalAckCount: number;
  processingCompletedCount: number;
}

export interface R3GroundedMaterialSemanticRun {
  readonly world: AutonomousLifeWorld;
  advanceOneTick(): AutonomousLifeStep;
  runTicks(
    count: number,
  ): readonly AutonomousLifeStep[];
  allEvents(): readonly LifeEvent[];
  privateExperiences():
    readonly ResidentPrivateExperience[];
  listenerDebug():
    R3GroundedMaterialListenerDebug;
  metrics():
    R3GroundedMaterialRunMetrics;
}

const WORKER_MATTER: ResidentMatter = {
  id:
    MATERIAL_FIXTURE_MATTER_IDS.worker,
  statement:
    "turn available raw blanks into finished workshop parts",
  establishedTick: 0,
  source: "authored",
};

const STEWARD_MATTER: ResidentMatter = {
  id:
    MATERIAL_FIXTURE_MATTER_IDS.steward,
  statement:
    "keep the workshop input rack supplied with raw blanks",
  establishedTick: 0,
  source: "authored",
};

function listenerMatter(
  purpose: R3GroundedMaterialPurpose,
): ResidentMatter {
  return {
    id:
      R3_GROUNDED_MATERIAL_MATTER_ID,
    statement:
      purpose === "rack"
        ? "acknowledge grounded reports about whether the workshop input rack is empty; source-empty reports are not part of this monitoring responsibility"
        : "acknowledge grounded reports about whether the raw source is empty; rack-empty reports are not part of this monitoring responsibility",
    establishedTick: 0,
    source: "authored",
  };
}

export function createR3GroundedMaterialSemanticRun(
  purpose:
    R3GroundedMaterialPurpose,
  mode:
    R3GroundedMaterialConsumerMode,
  regime:
    R3GroundedMaterialRegime,
): R3GroundedMaterialSemanticRun {
  resetFixtureActivitySerials();

  const world =
    new AutonomousLifeWorld({
      sourcePosition:
        R3_GROUNDED_MATERIAL_PLACES
          .source.position,
      sourceCapacity: 3,
      sourceReplenishTicks: 120,
      workbenchPosition:
        R3_GROUNDED_MATERIAL_PLACES
          .workbench.position,
      processingTicks: 24,
    });

  world.addResident(
    "resident:mira",
    { x: 8, y: 0.6 },
  );
  world.addResident(
    "resident:janek",
    { x: 9.6, y: 0.6 },
  );
  world.addResident(
    "resident:ida",
    { x: 6, y: 1 },
    {
      sightRadius: 0.75,
      hearingRadius: 5,
      speedPerTick: 0.16,
    },
  );

  const listener =
    new GroundedMaterialListenerPolicy(
      purpose,
      mode,
    );

  const agents =
    new Map<
      ResidentId,
      AutonomousResidentAgent
    >([
      [
        "resident:mira",
        new AutonomousResidentAgent(
          new GroundedSourceReporterPolicy(
            regime,
            purpose,
          ),
          [STEWARD_MATTER],
        ),
      ],
      [
        "resident:janek",
        new AutonomousResidentAgent(
          new GroundedRackReporterPolicy(
            regime,
            purpose,
          ),
          [WORKER_MATTER],
        ),
      ],
      [
        "resident:ida",
        new AutonomousResidentAgent(
          listener,
          [
            listenerMatter(
              purpose,
            ),
          ],
        ),
      ],
    ]);

  for (
    let index = 0;
    index < 3;
    index += 1
  ) {
    world.addMaterial(
      "raw_blank",
      {
        x:
          R3_GROUNDED_MATERIAL_PLACES
            .source.position.x +
          index * 0.12,
        y:
          R3_GROUNDED_MATERIAL_PLACES
            .source.position.y,
      },
    );
  }

  const history: LifeEvent[] = [];
  const experiences:
    ResidentPrivateExperience[] = [];

  const run:
    R3GroundedMaterialSemanticRun =
    {
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
              (a, b) =>
                a.localeCompare(b),
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
              R3_GROUNDED_MATERIAL_PLACES,
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
            [...decisions.entries()].map(
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
          ] = decision.activity
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
          AutonomousLifeStep[] = [];
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

      listenerDebug() {
        return listener.debug();
      },

      metrics() {
        const rackReportCount =
          history.filter(
            (event) =>
              event.kind ===
                "speech" &&
              event.actorId ===
                "resident:janek" &&
              event.payload.text ===
                R3_GROUNDED_MATERIAL_REPORTS
                  .rack,
          ).length;

        const sourceReportCount =
          history.filter(
            (event) =>
              event.kind ===
                "speech" &&
              event.actorId ===
                "resident:mira" &&
              event.payload.text ===
                R3_GROUNDED_MATERIAL_REPORTS
                  .source,
          ).length;

        const rackAckCount =
          history.filter(
            (event) =>
              event.kind ===
                "speech" &&
              event.actorId ===
                "resident:ida" &&
              event.payload.text ===
                R3_GROUNDED_MATERIAL_ACKS
                  .rack,
          ).length;

        const sourceAckCount =
          history.filter(
            (event) =>
              event.kind ===
                "speech" &&
              event.actorId ===
                "resident:ida" &&
              event.payload.text ===
                R3_GROUNDED_MATERIAL_ACKS
                  .source,
          ).length;

        return {
          purpose,
          mode,
          regime,
          ticks: world.tick,
          rackReportCount,
          sourceReportCount,
          rackAckCount,
          sourceAckCount,
          totalAckCount:
            rackAckCount +
            sourceAckCount,
          processingCompletedCount:
            history.filter(
              (event) =>
                event.kind ===
                  "processing_completed" &&
                event.actorId ===
                  "resident:janek",
            ).length,
        };
      },
    };

  return run;
}

class GroundedRackReporterPolicy
  implements ResidentPolicy
{
  readonly residentId =
    "resident:janek" as const;

  private readonly worker =
    new WorkerFixturePolicy({
      blockedRequestAfterTicks:
        Number.MAX_SAFE_INTEGER,
      requestCooldownTicks:
        Number.MAX_SAFE_INTEGER,
    });

  private lastKnownEmpty:
    boolean | null = null;
  private episodeReported = false;
  private episodeHandled = false;
  private lastReportTick =
    -10_000;

  constructor(
    private readonly regime:
      R3GroundedMaterialRegime,
    private readonly requiredPurpose:
      R3GroundedMaterialPurpose,
  ) {}

  decide(
    input: ResidentPolicyInput,
  ): ResidentDecision {
    this.consumeAck(input);

    const inspected =
      distance(
        input.observation.self
          .position,
        input.places.input_rack
          .position,
      ) <= 2.5;

    if (inspected) {
      const empty =
        !hasFreeRawAt(
          input,
          input.places.input_rack,
        );

      this.updateFactEpisode(
        empty,
      );

      if (
        empty &&
        this.shouldReport(
          input.observation.tick,
        )
      ) {
        this.episodeReported =
          true;
        this.lastReportTick =
          input.observation.tick;
        return {
          intent: {
            kind: "speak",
            text:
              R3_GROUNDED_MATERIAL_REPORTS
                .rack,
            radius: 5,
          },
          activity:
            reporterActivity(
              input.previousActivity,
              "resident:janek",
              input.observation.tick,
              "rack",
            ),
        };
      }
    }

    return this.worker.decide(
      input,
    );
  }

  private updateFactEpisode(
    empty: boolean,
  ): void {
    if (
      empty &&
      this.lastKnownEmpty !== true
    ) {
      this.episodeReported =
        false;
      this.episodeHandled =
        false;
    }

    if (!empty) {
      this.episodeReported =
        false;
      this.episodeHandled =
        false;
    }

    this.lastKnownEmpty =
      empty;
  }

  private shouldReport(
    tick: number,
  ): boolean {
    if (
      !this.episodeReported
    ) {
      return true;
    }

    if (
      this.regime ===
        "relation" ||
      this.requiredPurpose !==
        "rack" ||
      this.episodeHandled
    ) {
      return false;
    }

    return (
      tick -
        this.lastReportTick >=
      45
    );
  }

  private consumeAck(
    input: ResidentPolicyInput,
  ): void {
    if (
      input.observation.heardEvents.some(
        (event) =>
          event.kind ===
            "speech" &&
          event.actorId ===
            "resident:ida" &&
          event.payload.text ===
            R3_GROUNDED_MATERIAL_ACKS
              .rack,
      )
    ) {
      this.episodeHandled =
        true;
    }
  }
}

class GroundedSourceReporterPolicy
  implements ResidentPolicy
{
  readonly residentId =
    "resident:mira" as const;

  private readonly steward =
    new StewardFixturePolicy();

  private lastKnownEmpty:
    boolean | null = null;
  private episodeReported = false;
  private episodeHandled = false;
  private lastReportTick =
    -10_000;

  constructor(
    private readonly regime:
      R3GroundedMaterialRegime,
    private readonly requiredPurpose:
      R3GroundedMaterialPurpose,
  ) {}

  decide(
    input: ResidentPolicyInput,
  ): ResidentDecision {
    this.consumeAck(input);

    const inspected =
      distance(
        input.observation.self
          .position,
        input.places.source
          .position,
      ) <= 2.5;

    if (inspected) {
      const empty =
        !hasFreeRawAt(
          input,
          input.places.source,
        );

      this.updateFactEpisode(
        empty,
      );

      if (
        empty &&
        this.shouldReport(
          input.observation.tick,
        )
      ) {
        this.episodeReported =
          true;
        this.lastReportTick =
          input.observation.tick;

        return {
          intent: {
            kind: "speak",
            text:
              R3_GROUNDED_MATERIAL_REPORTS
                .source,
            radius: 5,
          },
          activity:
            reporterActivity(
              input.previousActivity,
              "resident:mira",
              input.observation.tick,
              "source",
            ),
        };
      }
    }

    return this.steward.decide(
      input,
    );
  }

  private updateFactEpisode(
    empty: boolean,
  ): void {
    if (
      empty &&
      this.lastKnownEmpty !== true
    ) {
      this.episodeReported =
        false;
      this.episodeHandled =
        false;
    }

    if (!empty) {
      this.episodeReported =
        false;
      this.episodeHandled =
        false;
    }

    this.lastKnownEmpty =
      empty;
  }

  private shouldReport(
    tick: number,
  ): boolean {
    if (
      !this.episodeReported
    ) {
      return true;
    }

    if (
      this.regime ===
        "relation" ||
      this.requiredPurpose !==
        "source" ||
      this.episodeHandled
    ) {
      return false;
    }

    return (
      tick -
        this.lastReportTick >=
      45
    );
  }

  private consumeAck(
    input: ResidentPolicyInput,
  ): void {
    if (
      input.observation.heardEvents.some(
        (event) =>
          event.kind ===
            "speech" &&
          event.actorId ===
            "resident:ida" &&
          event.payload.text ===
            R3_GROUNDED_MATERIAL_ACKS
              .source,
      )
    ) {
      this.episodeHandled =
        true;
    }
  }
}

class GroundedMaterialListenerPolicy
  implements ResidentPolicy
{
  readonly residentId =
    "resident:ida" as const;

  private readonly decisions:
    R3GroundedMaterialRelationDecision[] =
    [];
  private readonly pendingAcks:
    R3GroundedMaterialDomain[] =
    [];
  private rackAckCount = 0;
  private sourceAckCount = 0;

  constructor(
    private readonly purpose:
      R3GroundedMaterialPurpose,
    private readonly mode:
      R3GroundedMaterialConsumerMode,
  ) {}

  debug():
    R3GroundedMaterialListenerDebug {
    return {
      decisions:
        this.decisions.map(
          (decision) =>
            structuredClone(
              decision,
            ),
        ),
      ackCount:
        this.rackAckCount +
        this.sourceAckCount,
      rackAckCount:
        this.rackAckCount,
      sourceAckCount:
        this.sourceAckCount,
    };
  }

  decide(
    input: ResidentPolicyInput,
  ): ResidentDecision {
    for (
      const event of
        input.observation.heardEvents
    ) {
      if (
        event.kind !==
          "speech" ||
        typeof event.payload.text !==
          "string"
      ) {
        continue;
      }

      const domain =
        reportDomain(
          event.actorId,
          event.payload.text,
        );
      if (!domain) continue;

      const shouldAcknowledge =
        this.shouldAcknowledge(
          domain,
          event.payload.text,
          event.actorId,
        );

      this.decisions.push({
        tick:
          input.observation.tick,
        eventId: event.id,
        domain,
        purpose:
          this.purpose,
        shouldAcknowledge,
      });

      if (
        shouldAcknowledge
      ) {
        this.pendingAcks.push(
          domain,
        );
      }
    }

    const next =
      this.pendingAcks.shift();

    if (next) {
      if (next === "rack") {
        this.rackAckCount += 1;
      } else {
        this.sourceAckCount += 1;
      }

      return {
        intent: {
          kind: "speak",
          text:
            R3_GROUNDED_MATERIAL_ACKS[
              next
            ],
          radius: 5,
        },
        activity:
          listenerActivity(
            input.previousActivity,
          ),
      };
    }

    return {
      intent: {
        kind: "idle",
      },
      activity:
        listenerActivity(
          input.previousActivity,
        ),
    };
  }

  private shouldAcknowledge(
    domain:
      R3GroundedMaterialDomain,
    text: string,
    actorId:
      ResidentId | null,
  ): boolean {
    switch (this.mode) {
      case "ignore-all":
        return false;

      case "respond-all":
        return true;

      case "rack-surface-only":
        return (
          text ===
          R3_GROUNDED_MATERIAL_REPORTS
            .rack
        );

      case "source-surface-only":
        return (
          text ===
          R3_GROUNDED_MATERIAL_REPORTS
            .source
        );

      case "rack-speaker-only":
        return (
          actorId ===
          "resident:janek"
        );

      case "source-speaker-only":
        return (
          actorId ===
          "resident:mira"
        );

      case "ideal-semantic-oracle":
        return (
          domain ===
          this.purpose
        );
    }
  }
}

function reportDomain(
  actorId:
    ResidentId | null,
  text: string,
): R3GroundedMaterialDomain | null {
  if (
    actorId ===
      "resident:janek" &&
    text ===
      R3_GROUNDED_MATERIAL_REPORTS
        .rack
  ) {
    return "rack";
  }

  if (
    actorId ===
      "resident:mira" &&
    text ===
      R3_GROUNDED_MATERIAL_REPORTS
        .source
  ) {
    return "source";
  }

  return null;
}

function hasFreeRawAt(
  input:
    ResidentPolicyInput,
  place: LifePlace,
): boolean {
  return input.observation
    .visibleObjects.some(
      (object) =>
        object.kind ===
          "raw_blank" &&
        object.location.kind ===
          "free" &&
        distance(
          object.location.position,
          place.position,
        ) <= 0.75,
    );
}

function reporterActivity(
  previous:
    ResidentActivity | null,
  residentId:
    "resident:mira" |
    "resident:janek",
  tick: number,
  domain:
    R3GroundedMaterialDomain,
): ResidentActivity {
  const kind =
    "grounded_material_report";

  if (
    previous?.kind ===
      kind &&
    previous.subjectId ===
      domain
  ) {
    return {
      ...previous,
      phase:
        "report_" +
        domain +
        "_empty",
    };
  }

  return {
    id:
      residentId +
      ":" +
      kind +
      ":" +
      tick,
    kind,
    phase:
      "report_" +
      domain +
      "_empty",
    startedTick: tick,
    subjectId: domain,
  };
}

function listenerActivity(
  previous:
    ResidentActivity | null,
): ResidentActivity {
  if (
    previous?.kind ===
      "grounded_material_listener"
  ) {
    return {
      ...previous,
      phase: "listen",
      subjectId: null,
    };
  }

  return {
    id:
      "resident:ida:grounded_material_listener",
    kind:
      "grounded_material_listener",
    phase: "listen",
    startedTick: 0,
    subjectId: null,
  };
}
