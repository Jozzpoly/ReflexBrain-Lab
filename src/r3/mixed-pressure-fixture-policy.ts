import {
  MATERIAL_FIXTURE_MATTER_IDS,
  WorkerFixturePolicy,
} from "./life-fixture-policies";
import type {
  ResidentActivity,
  ResidentDecision,
  ResidentMatter,
  ResidentPolicy,
  ResidentPolicyInput,
} from "./life-contracts";

export const MIXED_PRESSURE_MATTER_IDS = {
  reportResponse:
    "resident:janek:matter:local-report-response",
} as const;

export type R3MixedPressureMatterWording =
  | "baseline"
  | "paraphrase";

/**
 * Disposable mixed-pressure fixture.
 *
 * It exists only to make two concurrently-owned matters become causally
 * responsible at different moments inside one ecology. It is not a target
 * scheduler or production intelligence architecture.
 */
export class MixedPressureJanekFixturePolicy
  implements ResidentPolicy
{
  readonly residentId = "resident:janek" as const;
  private readonly worker = new WorkerFixturePolicy();

  constructor(
    private readonly reportGateMatterId: string =
      MIXED_PRESSURE_MATTER_IDS.reportResponse,
  ) {}

  decide(input: ResidentPolicyInput): ResidentDecision {
    const report = input.observation.heardEvents.find(
      (event) =>
        event.kind === "speech" &&
        event.actorId === "resident:ida" &&
        typeof event.payload.text === "string" &&
        event.payload.text.trim().length > 0,
    );

    if (
      report &&
      hasMatter(
        input,
        this.reportGateMatterId,
      )
    ) {
      return {
        intent: {
          kind: "speak",
          text: "Ida, received.",
          radius: 5,
        },
        activity: responseActivity(
          input.previousActivity,
          input.observation.tick,
        ),
      };
    }

    // Outside the local report event, ordinary workshop pressure remains
    // delegated to the already-qualified disposable worker fixture.
    return this.worker.decide(input);
  }
}

export function r3MixedPressureJanekMatters(
  wording: R3MixedPressureMatterWording = "baseline",
): readonly ResidentMatter[] {
  const worker: ResidentMatter =
    wording === "baseline"
      ? {
          id: MATERIAL_FIXTURE_MATTER_IDS.worker,
          statement:
            "turn available raw blanks into finished workshop parts",
          establishedTick: 0,
          source: "authored",
        }
      : {
          id: MATERIAL_FIXTURE_MATTER_IDS.worker,
          statement:
            "convert incoming unfinished stock into completed pieces at the bench",
          establishedTick: 0,
          source: "authored",
        };

  const response: ResidentMatter =
    wording === "baseline"
      ? {
          id: MIXED_PRESSURE_MATTER_IDS.reportResponse,
          statement:
            "acknowledge direct local status reports from coworkers when they arrive",
          establishedTick: 0,
          source: "authored",
        }
      : {
          id: MIXED_PRESSURE_MATTER_IDS.reportResponse,
          statement:
            "respond when a nearby coworker gives you an immediate update",
          establishedTick: 0,
          source: "authored",
        };

  return [worker, response].map((matter) =>
    structuredClone(matter),
  );
}

function hasMatter(
  input: ResidentPolicyInput,
  matterId: string,
): boolean {
  return input.matters.some(
    (matter) => matter.id === matterId,
  );
}

function responseActivity(
  previous: ResidentActivity | null,
  tick: number,
): ResidentActivity {
  if (previous?.kind === "respond_to_local_report") {
    return {
      ...previous,
      phase: "acknowledge_report",
    };
  }

  return {
    id:
      "resident:janek:respond_to_local_report:" +
      tick,
    kind: "respond_to_local_report",
    phase: "acknowledge_report",
    startedTick: tick,
    subjectId: null,
  };
}
