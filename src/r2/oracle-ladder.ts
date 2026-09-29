import type {
  ActorPrivateFrame,
  CausalAtom,
  CausalPayload,
} from "./causal-contracts";

export type OracleLayer =
  | "perception"
  | "semantic_interpretation"
  | "actor_relative_significance"
  | "executive_arbitration";

export type OracleInputAuthority = "world_truth" | "actor_private";

export interface OracleEvidenceRef {
  kind: "observation" | "history" | "activity";
  id: string;
}

export interface OracleClaim {
  id: string;
  actorId: string;
  tick: number;
  layer: OracleLayer;
  inputAuthority: OracleInputAuthority;
  evidenceRefs: readonly OracleEvidenceRef[];
  payload: CausalPayload;
}

/**
 * Oracle substitution is research equipment, not runtime authority.
 *
 * Perception-oracle claims may consult World truth because they explicitly
 * replace the perception boundary. Every later oracle layer must be grounded
 * in actor-private evidence.
 */
export function validateOracleBoundary(
  claim: OracleClaim,
  privateFrame: ActorPrivateFrame,
): void {
  if (claim.actorId !== privateFrame.actorId) {
    throw new Error("oracle actor does not match private frame");
  }
  if (claim.tick !== privateFrame.tick) {
    throw new Error("oracle tick does not match private frame");
  }

  if (claim.layer !== "perception" && claim.inputAuthority !== "actor_private") {
    throw new Error(
      "post-perception oracle layers must not use hidden World authority",
    );
  }

  if (claim.inputAuthority === "actor_private") {
    const available = privateEvidenceIds(privateFrame);
    for (const ref of claim.evidenceRefs) {
      if (!available.has(ref.kind + ":" + ref.id)) {
        throw new Error(
          "oracle claim references unavailable actor-private evidence: " +
            ref.kind +
            ":" +
            ref.id,
        );
      }
    }
  }
}

export function oraclePayload(
  values: Readonly<Record<string, CausalAtom>>,
): CausalPayload {
  return { ...values };
}

function privateEvidenceIds(frame: ActorPrivateFrame): Set<string> {
  const ids = new Set<string>();
  for (const observation of frame.observations) {
    ids.add("observation:" + observation.id);
  }
  for (const history of frame.history) {
    ids.add("history:" + history.id);
  }
  if (frame.activity) ids.add("activity:" + frame.activity.id);
  return ids;
}
