import type {
  R1EncoderBenchmarkResult,
  R1EncoderPairInput,
  R1EncoderStateInput,
  R1EncoderWorkerRequest,
  R1EncoderWorkerResponse,
  R1HeadMode,
  R1LearnConstraintInput,
  R1LearnedHeadResult,
  R1RepresentationMode,
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
    return this.request<R1EncoderBenchmarkResult>(
      {
        id: ++this.sequence,
        type: "benchmark",
        states: structuredClone(states),
        pairs: structuredClone(pairs),
      },
      "benchmark_result",
      progress,
    );
  }

  learnedHead(
    states: readonly R1EncoderStateInput[],
    constraints: readonly R1LearnConstraintInput[],
    representation: R1RepresentationMode,
    headMode: R1HeadMode = "prototype",
    progress?: (value: R1EncoderProgress) => void,
  ): Promise<R1LearnedHeadResult> {
    return this.request<R1LearnedHeadResult>(
      {
        id: ++this.sequence,
        type: "learned_head",
        states: structuredClone(states),
        constraints: structuredClone(constraints),
        representation,
        headMode,
      },
      "learned_head_result",
      progress,
    );
  }

  private request<T>(
    request: R1EncoderWorkerRequest,
    expectedType: "benchmark_result" | "learned_head_result",
    progress?: (value: R1EncoderProgress) => void,
  ): Promise<T> {
    const id = request.id;

    return new Promise<T>((resolve, reject) => {
      const cleanup = () => {
        this.worker.removeEventListener("message", onMessage);
        this.worker.removeEventListener("error", onError);
      };

      const onMessage = (event: MessageEvent<R1EncoderWorkerResponse>) => {
        const message = event.data;
        if (message.id !== id) return;

        if (message.type === "progress") {
          progress?.(message);
          return;
        }

        cleanup();

        if (message.type === "error") {
          reject(new Error(message.message));
          return;
        }

        if (message.type !== expectedType) {
          reject(
            new Error(
              "R1 encoder worker returned " +
                message.type +
                ", expected " +
                expectedType,
            ),
          );
          return;
        }

        resolve(message.result as T);
      };

      const onError = (event: ErrorEvent) => {
        cleanup();
        reject(new Error(event.message || "R1 encoder worker failed"));
      };

      this.worker.addEventListener("message", onMessage);
      this.worker.addEventListener("error", onError);
      this.worker.postMessage(request);
    });
  }
}
