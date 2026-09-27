import type {
  ResidentPrivateExperience,
} from "./life-contracts";
import {
  auditR3GroundedConsumerCorpus,
  type R3GroundedConsumerCorpusAudit,
  type R3GroundedConsumerCorpusRow,
} from "./grounded-consumer-corpus-audit";
import {
  R3_LISTENER_EFFECTOR_PLACES,
  R3_SUPPLIER_STOCKED_TEXT,
} from "./grounded-listener-effector-run";
import {
  R3_GROUNDED_REQUEST_TEXT,
} from "./grounded-recurrent-report-consumer-run";
import {
  distance,
} from "./life-world";

export interface R3SupplierCompletionGroundingAudit {
  reportCount: number;
  groundedCount: number;
  groundedRate: number | null;
}

export function buildR3ListenerTemporalRows(
  experiences: readonly ResidentPrivateExperience[],
): readonly R3GroundedConsumerCorpusRow[] {
  const ida = experiences
    .filter(
      (experience) =>
        experience.residentId === "resident:ida",
    )
    .sort(
      (left, right) =>
        left.tick - right.tick,
    );

  const rows: R3GroundedConsumerCorpusRow[] = [];
  let unresolved = false;
  let requestOrdinal = 0;

  for (const experience of ida) {
    for (const event of experience.observation.heardEvents) {
      if (
        event.kind !== "speech" ||
        typeof event.payload.text !== "string"
      ) {
        continue;
      }

      if (
        event.actorId === "resident:mira" &&
        event.payload.text === R3_SUPPLIER_STOCKED_TEXT
      ) {
        unresolved = false;
        continue;
      }

      if (
        event.actorId !== "resident:janek" ||
        event.payload.text !== R3_GROUNDED_REQUEST_TEXT
      ) {
        continue;
      }

      requestOrdinal += 1;
      const updateWorthy = !unresolved;
      if (updateWorthy) {
        unresolved = true;
      }

      const matter = experience.matters[0] ?? {
        id: "",
        statement: "",
      };

      rows.push({
        tick: experience.tick,
        requestOrdinal,
        reportText: event.payload.text,
        speakerId: String(event.actorId ?? ""),
        matterId: matter.id,
        matterStatement: matter.statement,
        listenerX: experience.observation.self.position.x,
        listenerY: experience.observation.self.position.y,
        activityKind: experience.activityBefore?.kind ?? "<none>",
        activityPhase: experience.activityBefore?.phase ?? "<none>",
        holdingObject: experience.observation.heldObject !== null,
        visibleRackStock: visibleRawAt(
          experience,
          R3_LISTENER_EFFECTOR_PLACES.input_rack.position,
        ),
        visibleSourceStock: visibleRawAt(
          experience,
          R3_LISTENER_EFFECTOR_PLACES.source.position,
        ),
        knownRawBeliefCount: Object.values(
          experience.memory.objectBeliefs,
        ).filter(
          (belief) => belief.kind === "raw_blank",
        ).length,
        priorHeardCount: experience.memory.heardEventIds.length,
        updateWorthy,
      });
    }
  }

  return rows;
}

export function auditR3ListenerTemporalRows(
  rows: readonly R3GroundedConsumerCorpusRow[],
): R3GroundedConsumerCorpusAudit {
  return auditR3GroundedConsumerCorpus(rows);
}

export function auditR3SupplierCompletionGrounding(
  experiences: readonly ResidentPrivateExperience[],
): R3SupplierCompletionGroundingAudit {
  const reports = experiences.filter(
    (experience) =>
      experience.residentId === "resident:mira" &&
      experience.decision.intent.kind === "speak" &&
      experience.decision.intent.text === R3_SUPPLIER_STOCKED_TEXT,
  );

  const groundedCount = reports.filter(
    (experience) =>
      experience.observation.heldObject === null &&
      distance(
        experience.observation.self.position,
        R3_LISTENER_EFFECTOR_PLACES.input_rack.position,
      ) <= 2.5 &&
      visibleRawAt(
        experience,
        R3_LISTENER_EFFECTOR_PLACES.input_rack.position,
      ),
  ).length;

  return {
    reportCount: reports.length,
    groundedCount,
    groundedRate:
      reports.length > 0
        ? groundedCount / reports.length
        : null,
  };
}

export function privateHistoryOracleMatchesRows(
  rows: readonly R3GroundedConsumerCorpusRow[],
  experiences: readonly ResidentPrivateExperience[],
): boolean {
  const rebuilt = buildR3ListenerTemporalRows(experiences);
  if (rebuilt.length !== rows.length) return false;

  return rebuilt.every(
    (row, index) =>
      row.tick === rows[index]!.tick &&
      row.requestOrdinal === rows[index]!.requestOrdinal &&
      row.updateWorthy === rows[index]!.updateWorthy,
  );
}

function visibleRawAt(
  experience: ResidentPrivateExperience,
  position: { x: number; y: number },
): boolean {
  return experience.observation.visibleObjects.some(
    (object) =>
      object.kind === "raw_blank" &&
      object.location.kind === "free" &&
      distance(object.location.position, position) <= 0.75,
  );
}
