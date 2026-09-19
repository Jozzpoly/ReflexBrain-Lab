import type { ActorPrivateState } from "./contracts";
import type {
  ChoiceOrder,
  LocalChoiceOnlyResult,
  LocalChoiceProbeResult,
} from "./local-choice-probe";
import type {
  LocalModelRequest,
  LocalModelRequestBody,
  LocalModelResponse,
} from "./local-model-protocol";

export interface LocalModelProgress {
  status: string;
  file: string | null;
  progress: number | null;
}

export class LocalModelClient {
  private readonly worker = new Worker(
    new URL("./local-model-worker.ts", import.meta.url),
    { type: "module" },
  );
  private sequence = 0;
  private readonly pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (reason: unknown) => void;
      progress?: (value: LocalModelProgress) => void;
    }
  >();

  constructor() {
    this.worker.onmessage = (event: MessageEvent<LocalModelResponse>) => {
      const message = event.data;
      const pending = this.pending.get(message.id);
      if (!pending) return;

      if (message.type === "progress") {
        pending.progress?.(message);
        return;
      }

      this.pending.delete(message.id);
      if (message.type === "error") {
        pending.reject(new Error(message.message));
      } else if (message.type === "ready") {
        pending.resolve(undefined);
      } else {
        pending.resolve(message.result);
      }
    };

    this.worker.onerror = (event) => {
      const error = new Error(event.message || "local model worker failed");
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    };
  }

  load(progress?: (value: LocalModelProgress) => void): Promise<void> {
    return this.request<void>({ type: "load" }, progress);
  }

  probe(
    state: ActorPrivateState,
    choiceOrder: ChoiceOrder = "canonical",
    progress?: (value: LocalModelProgress) => void,
  ): Promise<LocalChoiceProbeResult> {
    return this.request<LocalChoiceProbeResult>(
      {
        type: "probe",
        state: structuredClone(state),
        choiceOrder,
      },
      progress,
    );
  }

  choose(
    state: ActorPrivateState,
    choiceOrder: ChoiceOrder = "canonical",
    progress?: (value: LocalModelProgress) => void,
  ): Promise<LocalChoiceOnlyResult> {
    return this.request<LocalChoiceOnlyResult>(
      {
        type: "choice",
        state: structuredClone(state),
        choiceOrder,
      },
      progress,
    );
  }

  private request<T>(
    request: LocalModelRequestBody,
    progress?: (value: LocalModelProgress) => void,
  ): Promise<T> {
    const id = ++this.sequence;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
        progress,
      });
      this.worker.postMessage({ id, ...request } as LocalModelRequest);
    });
  }
}
