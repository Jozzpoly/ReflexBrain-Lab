import type { ActorPrivateState } from "./contracts";
import type {
  AppraisalId,
  AppraisalPolarity,
  BipolarAppraisalOrder,
  ChoiceOrder,
  LocalAppraisalResult,
  LocalBipolarAppraisalResult,
  LocalChoiceOnlyResult,
  LocalChoiceProbeResult,
  LocalModelBackendId,
  LocalSemanticChoiceResult,
} from "./local-choice-probe";

export type LocalModelRequestBody =
  | { type: "load"; backendId: LocalModelBackendId }
  | {
      type: "probe";
      backendId: LocalModelBackendId;
      state: ActorPrivateState;
      choiceOrder: ChoiceOrder;
    }
  | {
      type: "choice";
      backendId: LocalModelBackendId;
      state: ActorPrivateState;
      choiceOrder: ChoiceOrder;
    }
  | {
      type: "semantic_choice";
      backendId: LocalModelBackendId;
      state: ActorPrivateState;
      choiceOrder: ChoiceOrder;
    }
  | {
      type: "appraisal";
      backendId: LocalModelBackendId;
      state: ActorPrivateState;
      appraisalId: AppraisalId;
      polarity: AppraisalPolarity;
    }
  | {
      type: "bipolar_appraisal";
      backendId: LocalModelBackendId;
      state: ActorPrivateState;
      appraisalId: AppraisalId;
      order: BipolarAppraisalOrder;
    }
  ;

export type LocalModelRequest =
  | { id: number; type: "load"; backendId: LocalModelBackendId }
  | {
      id: number;
      type: "probe";
      backendId: LocalModelBackendId;
      state: ActorPrivateState;
      choiceOrder: ChoiceOrder;
    }
  | {
      id: number;
      type: "choice";
      backendId: LocalModelBackendId;
      state: ActorPrivateState;
      choiceOrder: ChoiceOrder;
    }
  | {
      id: number;
      type: "semantic_choice";
      backendId: LocalModelBackendId;
      state: ActorPrivateState;
      choiceOrder: ChoiceOrder;
    }
  | {
      id: number;
      type: "appraisal";
      backendId: LocalModelBackendId;
      state: ActorPrivateState;
      appraisalId: AppraisalId;
      polarity: AppraisalPolarity;
    }
  | {
      id: number;
      type: "bipolar_appraisal";
      backendId: LocalModelBackendId;
      state: ActorPrivateState;
      appraisalId: AppraisalId;
      order: BipolarAppraisalOrder;
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
  | { id: number; type: "choice_result"; result: LocalChoiceOnlyResult }
  | {
      id: number;
      type: "semantic_choice_result";
      result: LocalSemanticChoiceResult;
    }
  | {
      id: number;
      type: "appraisal_result";
      result: LocalAppraisalResult;
    }
  | {
      id: number;
      type: "bipolar_appraisal_result";
      result: LocalBipolarAppraisalResult;
    }
  | { id: number; type: "error"; message: string };
