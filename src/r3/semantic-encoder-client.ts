import type {
  R3SemanticEmbeddingResult,
  R3SemanticEncoderWorkerRequest,
  R3SemanticEncoderWorkerResponse,
  R3SemanticTextInput,
} from "./semantic-encoder-contract";

export interface R3SemanticEncoderProgress {
  status: string;
  file: string | null;
  progress: number | null;
}

export class R3SemanticEncoderClient {
  private readonly worker = new Worker(
    new URL("./semantic-encoder-worker.ts", import.meta.url),
    { type: "module" },
  );
  private sequence = 0;

  embed(
    items: readonly R3SemanticTextInput[],
    progress?: (value: R3SemanticEncoderProgress) => void,
  ): Promise<R3SemanticEmbeddingResult> {
    const request: R3SemanticEncoderWorkerRequest = {
      id: ++this.sequence,
      type: "embed",
      items: structuredClone(items),
    };

    return new Promise<R3SemanticEmbeddingResult>(
      (resolve, reject) => {
        const cleanup = () => {
          this.worker.removeEventListener(
            "message",
            onMessage,
          );
          this.worker.removeEventListener(
            "error",
            onError,
          );
        };

        const onMessage = (
          event: MessageEvent<R3SemanticEncoderWorkerResponse>,
        ) => {
          const message = event.data;
          if (message.id !== request.id) return;

          if (message.type === "progress") {
            progress?.(message);
            return;
          }

          cleanup();

          if (message.type === "error") {
            reject(new Error(message.message));
            return;
          }

          if (message.type !== "embed_result") {
            reject(
              new Error(
                "R3 semantic encoder returned unexpected response",
              ),
            );
            return;
          }

          resolve(message.result);
        };

        const onError = (event: ErrorEvent) => {
          cleanup();
          reject(
            new Error(
              event.message ||
                "R3 semantic encoder worker failed",
            ),
          );
        };

        this.worker.addEventListener(
          "message",
          onMessage,
        );
        this.worker.addEventListener("error", onError);
        this.worker.postMessage(request);
      },
    );
  }
}
