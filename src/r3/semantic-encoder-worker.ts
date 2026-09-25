import { pipeline } from "@huggingface/transformers";
import {
  R3_SEMANTIC_ENCODER_BATCH_SIZE,
  R3_SEMANTIC_ENCODER_DTYPE,
  R3_SEMANTIC_ENCODER_MODEL_ID,
  R3_SEMANTIC_ENCODER_MODEL_REVISION,
  type R3SemanticEmbedding,
  type R3SemanticEmbeddingResult,
  type R3SemanticEncoderWorkerRequest,
  type R3SemanticEncoderWorkerResponse,
} from "./semantic-encoder-contract";

const scope = globalThis as unknown as {
  postMessage(message: R3SemanticEncoderWorkerResponse): void;
  onmessage:
    | ((event: MessageEvent<R3SemanticEncoderWorkerRequest>) => void)
    | null;
};

let extractor: any = null;
let loadPromise: Promise<number> | null = null;

scope.onmessage = (event) => {
  void handle(event.data);
};

async function handle(
  request: R3SemanticEncoderWorkerRequest,
): Promise<void> {
  try {
    if (
      request.type !== "embed" ||
      request.items.length === 0
    ) {
      throw new Error(
        "R3 semantic encoder requires at least one text",
      );
    }

    const loadMs = await ensureLoaded(request.id);
    const result = await embedTexts(request.items, loadMs);

    scope.postMessage({
      id: request.id,
      type: "embed_result",
      result,
    });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}

async function ensureLoaded(requestId: number): Promise<number> {
  if (extractor) return 0;

  if (!loadPromise) {
    loadPromise = (async () => {
      const started = performance.now();
      extractor = await pipeline(
        "feature-extraction",
        R3_SEMANTIC_ENCODER_MODEL_ID,
        {
          revision: R3_SEMANTIC_ENCODER_MODEL_REVISION,
          dtype: R3_SEMANTIC_ENCODER_DTYPE,
          device: "webgpu",
          progress_callback: (value: unknown) => {
            const progress = asProgress(value);
            scope.postMessage({
              id: requestId,
              type: "progress",
              status: progress.status,
              file: progress.file,
              progress: progress.progress,
            });
          },
        },
      );
      return performance.now() - started;
    })().catch((error) => {
      extractor = null;
      loadPromise = null;
      throw error;
    });
  }

  return await loadPromise;
}

async function embedTexts(
  items: readonly { id: string; text: string }[],
  loadMs: number,
): Promise<R3SemanticEmbeddingResult> {
  if (!extractor) {
    throw new Error("R3 semantic encoder is not loaded");
  }

  const embeddings: R3SemanticEmbedding[] = [];
  let dimensions = 0;
  const started = performance.now();

  // Correctness path intentionally remains one text per forward. R1 already
  // demonstrated batch-layout sensitivity at tiny margins.
  if (R3_SEMANTIC_ENCODER_BATCH_SIZE !== 1) {
    throw new Error("R3 semantic qualification requires batchSize=1");
  }

  for (const item of items) {
    const output = await extractor(item.text, {
      pooling: "mean",
      normalize: true,
    });

    try {
      const raw = output.tolist() as
        | number[]
        | number[][];
      const vector = Array.isArray(raw[0])
        ? (raw[0] as number[])
        : (raw as number[]);

      if (dimensions === 0) dimensions = vector.length;
      if (
        vector.length !== dimensions ||
        dimensions <= 0
      ) {
        throw new Error(
          "R3 semantic encoder returned inconsistent dimensions",
        );
      }

      embeddings.push({
        id: item.id,
        vector: [...vector],
      });
    } finally {
      dispose(output);
    }
  }

  return {
    modelId: R3_SEMANTIC_ENCODER_MODEL_ID,
    modelRevision: R3_SEMANTIC_ENCODER_MODEL_REVISION,
    dtype: R3_SEMANTIC_ENCODER_DTYPE,
    device: "webgpu",
    batchSize: R3_SEMANTIC_ENCODER_BATCH_SIZE,
    loadMs,
    embeddingMs: performance.now() - started,
    dimensions,
    itemCount: embeddings.length,
    embeddings,
  };
}

function dispose(value: any): void {
  try {
    value?.dispose?.();
  } catch {
    // Cleanup must not replace research evidence.
  }
}

function asProgress(value: unknown): {
  status: string;
  file: string | null;
  progress: number | null;
} {
  if (!value || typeof value !== "object") {
    return {
      status: "loading",
      file: null,
      progress: null,
    };
  }

  const record = value as Record<string, unknown>;
  return {
    status:
      typeof record.status === "string"
        ? record.status
        : "loading",
    file:
      typeof record.file === "string"
        ? record.file
        : null,
    progress:
      typeof record.progress === "number"
        ? record.progress
        : null,
  };
}
