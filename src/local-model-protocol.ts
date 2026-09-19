import type { ActorPrivateState } from "./contracts";
import type {
  ChoiceOrder,
  LocalChoiceProbeResult,
} from "./local-choice-probe";

export type LocalModelRequestBody =
  | { type: "load" }
  | { type: "probe"; state: ActorPrivateState; choiceOrder: ChoiceOrder };

export type LocalModelRequest =
  | { id: number; type: "load" }
  | {
      id: number;
      type: "probe";
      state: ActorPrivateState;
      choiceOrder: ChoiceOrder;
    };

export type LocalModelResponse =
  | {
      id: number;
      type: "progress";
      status: string;
      file: string | null;
      progress: number | null;
    }
  | { id: number; type: "ready" }
  | { id: number; type: "probe_result"; result: LocalChoiceProbeResult }
  | { id: number; type: "error"; message: string };
