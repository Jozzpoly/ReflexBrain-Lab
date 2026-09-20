import type {
  R1EncoderBenchmarkResult,
  R1EncoderPairInput,
  R1EncoderStateInput,
  R1EncoderWorkerRequest,
  R1EncoderWorkerResponse,
} from "./encoder-contract";

export interface R1EncoderProgress {
  status: string;
  file: string | null;
  progress: number | null;
}

export class R1EncoderBenchmarkClient {
  private readonly worker = new Worker(
    new URL("./encoder-worker.ts", import.meta.url),
    { type: "module" },
  );
  private sequence = 0;

  benchmark(
    states: readonly R1EncoderStateInput[],
    pairs: readonly R1EncoderPairInput[],
    progress?: (value: R1EncoderProgress) => void,
  ): Promise<R1EncoderBenchmarkResult> {
    const id = ++this.sequence;

    return new Promise<R1EncoderBenchmarkResult>((resolve, reject) => {
      const onMessage = (event: MessageEvent<R1EncoderWorkerResponse>) => {
        const message = event.data;
        if (message.id !== id) return;

        if (message.type === "progress") {
          progress?.(message);
          return;
        }

        this.worker.removeEventListener("message", onMessage);
        this.worker.removeEventListener("error", onError);

        if (message.type === "error") {
          reject(new Error(message.message));
        } else {
          resolve(message.result);
        }
      };

      const onError = (event: ErrorEvent) => {
        this.worker.removeEventListener("message", onMessage);
        this.worker.removeEventListener("error", onError);
        reject(new Error(event.message || "R1 encoder worker failed"));
      };

      this.worker.addEventListener("message", onMessage);
      this.worker.addEventListener("error", onError);

      const request: R1EncoderWorkerRequest = {
        id,
        type: "benchmark",
        states: structuredClone(states),
        pairs: structuredClone(pairs),
      };
      this.worker.postMessage(request);
    });
  }
}
