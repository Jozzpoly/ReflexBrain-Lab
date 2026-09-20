import { pipeline } from "@huggingface/transformers";
import {
  cosineSimilarity,
  R1_ENCODER_DTYPE,
  R1_ENCODER_MODEL_ID,
  R1_ENCODER_MODEL_REVISION,
  R1_LEARNED_HEAD_EMBEDDING_BATCH_SIZE,
  serializeR1PrivateState,
  type R1EncoderBenchmarkResult,
  type R1LearnedHeadResult,
  type R1EncoderWorkerRequest,
  type R1EncoderWorkerResponse,
} from "./encoder-contract";
import {
  evaluatePrototypeHeads,
  learnPrototypeHeads,
} from "./prototype-head";
import { learnRegularizedLinearHeads } from "./linear-ranking-head";
import {
  evaluatePrototypeBankHeads,
  learnPrototypeBankHeads,
} from "./prototype-bank-head";
import {
  analyzeRelationGeometry,
  analyzeTrainDirectionCoherence,
} from "./relation-geometry";
import { hybridPrivateRepresentation } from "./structured-features";

const scope = globalThis as unknown as {
  postMessage(message: R1EncoderWorkerResponse): void;
  onmessage: ((event: MessageEvent<R1EncoderWorkerRequest>) => void) | null;
};

let extractor: any = null;
let loadPromise: Promise<number> | null = null;

scope.onmessage = (event) => {
  void handle(event.data);
};

async function handle(request: R1EncoderWorkerRequest): Promise<void> {
  try {
    const loadMs = await ensureLoaded(request.id);

    if (request.type === "learned_head") {
      const result = await runLearnedHead(request, loadMs);
      scope.postMessage({
        id: request.id,
        type: "learned_head_result",
        result,
      });
      return;
    }

    const result = await runBenchmark(request, loadMs);
    scope.postMessage({
      id: request.id,
      type: "benchmark_result",
      result,
    });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      type: "error",
      message: error instanceof Error ? error.message : String(error),
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
        R1_ENCODER_MODEL_ID,
        {
          revision: R1_ENCODER_MODEL_REVISION,
          dtype: R1_ENCODER_DTYPE,
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

async function runBenchmark(
  request: Extract<R1EncoderWorkerRequest, { type: "benchmark" }>,
  loadMs: number,
): Promise<R1EncoderBenchmarkResult> {
  if (!extractor) throw new Error("R1 encoder is not loaded");
  if (request.states.length === 0) throw new Error("R1 encoder benchmark has no states");

  const texts = request.states.map((state) =>
    serializeR1PrivateState(state.state),
  );

  const warmupStarted = performance.now();
  const warmup = await extractor(texts[0], {
    pooling: "mean",
    normalize: true,
  });
  const warmupMs = performance.now() - warmupStarted;
  dispose(warmup);

  const sequential = [];
  for (let i = 0; i < texts.length; i += 1) {
    const started = performance.now();
    const output = await extractor(texts[i], {
      pooling: "mean",
      normalize: true,
    });
    const latencyMs = performance.now() - started;
    sequential.push({
      id: request.states[i]!.id,
      latencyMs,
    });
    dispose(output);
  }

  const batchStarted = performance.now();
  const batch = await extractor(texts, {
    pooling: "mean",
    normalize: true,
  });
  const batchMs = performance.now() - batchStarted;
  const rows = batch.tolist() as number[][];
  const dimensions = rows[0]?.length ?? 0;

  if (rows.length !== request.states.length || dimensions <= 0) {
    dispose(batch);
    throw new Error("R1 encoder returned unexpected batch shape");
  }

  const rowById = new Map(
    request.states.map((state, index) => [state.id, rows[index]!] as const),
  );

  const pairs = request.pairs.map((pair) => {
    const left = rowById.get(pair.leftStateId);
    const right = rowById.get(pair.rightStateId);
    if (!left || !right) {
      throw new Error("R1 encoder pair references missing benchmark state: " + pair.id);
    }
    const similarity = cosineSimilarity(left, right);
    return {
      ...pair,
      cosineSimilarity: similarity,
      cosineDistance: 1 - similarity,
    };
  });

  dispose(batch);

  return {
    modelId: R1_ENCODER_MODEL_ID,
    modelRevision: R1_ENCODER_MODEL_REVISION,
    dtype: R1_ENCODER_DTYPE,
    device: "webgpu",
    loadMs,
    warmupMs,
    sequential,
    batchMs,
    batchSize: texts.length,
    embeddingDimensions: dimensions,
    pairs,
  };
}

async function runLearnedHead(
  request: Extract<R1EncoderWorkerRequest, { type: "learned_head" }>,
  loadMs: number,
): Promise<R1LearnedHeadResult> {
  if (!extractor) throw new Error("R1 encoder is not loaded");
  if (request.states.length === 0) {
    throw new Error("R1 learned head has no states");
  }

  const texts = request.states.map((state) =>
    serializeR1PrivateState(state.state),
  );

  const warmupStarted = performance.now();
  const warmup = await extractor(texts[0], {
    pooling: "mean",
    normalize: true,
  });
  const warmupMs = performance.now() - warmupStarted;
  dispose(warmup);

  const embeddingById = new Map<string, number[]>();
  // Correctness qualification uses isolated per-state inference.
  // Do not increase this without a dedicated batch-invariance proof.
  const chunkSize = R1_LEARNED_HEAD_EMBEDDING_BATCH_SIZE;
  const embeddingStarted = performance.now();
  let encoderDimensions = 0;
  let representationDimensions = 0;

  for (let offset = 0; offset < texts.length; offset += chunkSize) {
    const chunkTexts = texts.slice(offset, offset + chunkSize);
    const chunkStates = request.states.slice(offset, offset + chunkSize);
    const output = await extractor(chunkTexts, {
      pooling: "mean",
      normalize: true,
    });

    try {
      const rows = output.tolist() as number[][];
      if (rows.length !== chunkStates.length) {
        throw new Error("R1 learned head encoder returned unexpected batch size");
      }

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index]!;
        if (encoderDimensions === 0) encoderDimensions = row.length;
        if (row.length !== encoderDimensions) {
          throw new Error("R1 learned head encoder dimension changed");
        }

        const representation =
          request.representation === "hybrid"
            ? hybridPrivateRepresentation(
                row,
                chunkStates[index]!.state,
              )
            : row;

        if (representationDimensions === 0) {
          representationDimensions = representation.length;
        }
        if (representation.length !== representationDimensions) {
          throw new Error("R1 learned head representation dimension changed");
        }
        embeddingById.set(chunkStates[index]!.id, representation);
      }
    } finally {
      dispose(output);
    }
  }

  const embeddingMs = performance.now() - embeddingStarted;
  if (
    embeddingById.size !== request.states.length ||
    encoderDimensions <= 0 ||
    representationDimensions <= 0
  ) {
    throw new Error("R1 learned head did not embed every state");
  }

  const headStarted = performance.now();
  const evaluation =
    request.headMode === "prototype-bank"
      ? evaluatePrototypeBankHeads(
          learnPrototypeBankHeads(embeddingById, request.constraints),
          embeddingById,
          request.constraints,
        )
      : evaluatePrototypeHeads(
          request.headMode === "linear-ranking"
            ? learnRegularizedLinearHeads(embeddingById, request.constraints)
            : learnPrototypeHeads(embeddingById, request.constraints),
          embeddingById,
          request.constraints,
        );
  const geometry = analyzeRelationGeometry(
    embeddingById,
    request.constraints,
  );
  const trainCoherence = analyzeTrainDirectionCoherence(
    embeddingById,
    request.constraints,
  );
  const headMs = performance.now() - headStarted;

  return {
    modelId: R1_ENCODER_MODEL_ID,
    modelRevision: R1_ENCODER_MODEL_REVISION,
    dtype: R1_ENCODER_DTYPE,
    device: "webgpu",
    representation: request.representation,
    headMode: request.headMode,
    stateCount: request.states.length,
    loadMs,
    warmupMs,
    embeddingMs,
    embeddingBatchSize: chunkSize,
    encoderDimensions,
    representationDimensions,
    headMs,
    constraints: evaluation.constraints,
    dimensions: evaluation.dimensions,
    geometry,
    trainCoherence,
  };
}

function dispose(value: any): void {
  try {
    value?.dispose?.();
  } catch {
    // Benchmark result must not be replaced by cleanup noise.
  }
}

function asProgress(value: unknown): {
  status: string;
  file: string | null;
  progress: number | null;
} {
  if (!value || typeof value !== "object") {
    return { status: "loading", file: null, progress: null };
  }

  const record = value as Record<string, unknown>;
  return {
    status: typeof record.status === "string" ? record.status : "loading",
    file: typeof record.file === "string" ? record.file : null,
    progress: typeof record.progress === "number" ? record.progress : null,
  };
}
