import {
  AutoModelForCausalLM,
  AutoTokenizer,
  LogitsProcessor,
  LogitsProcessorList,
  Tensor,
} from "@huggingface/transformers";
import {
  actionFromChoiceToken,
  analyzeChoiceScores,
  buildImmediateResponsePrompt,
  chooseLocalQwenDtype,
  getImmediateResponseOptions,
  getLocalModelBackend,
  IMMEDIATE_RESPONSE_OPTIONS,
  type ChoiceOrder,
  type LocalChoiceOnlyResult,
  type LocalChoiceProbeResult,
  type LocalModelBackendConfig,
  type LocalModelBackendId,
  type LocalQwenDtype,
} from "./local-choice-probe";
import type {
  LocalModelRequest,
  LocalModelResponse,
} from "./local-model-protocol";

const scope = globalThis as unknown as {
  postMessage(message: LocalModelResponse): void;
  onmessage: ((event: MessageEvent<LocalModelRequest>) => void) | null;
};

let tokenizer: any = null;
let model: any = null;
let loadPromise: Promise<void> | null = null;
let runtimeDtype: LocalQwenDtype | null = null;
let runtimeShaderF16: boolean | null = null;
let activeBackend: LocalModelBackendConfig | null = null;

scope.onmessage = (event) => {
  void handle(event.data);
};

async function handle(request: LocalModelRequest): Promise<void> {
  try {
    if (request.type === "load") {
      await ensureLoaded(request.id, request.backendId);
      scope.postMessage({ id: request.id, type: "ready" });
      return;
    }

    await ensureLoaded(request.id, request.backendId);

    if (request.type === "choice") {
      const result = await runChoice(request.state, request.choiceOrder);
      scope.postMessage({ id: request.id, type: "choice_result", result });
      return;
    }

    const result = await runProbe(request.state, request.choiceOrder);
    scope.postMessage({ id: request.id, type: "probe_result", result });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function ensureLoaded(
  requestId: number,
  backendId: LocalModelBackendId,
): Promise<void> {
  if (tokenizer && model) {
    if (activeBackend?.id !== backendId) {
      throw new Error(
        "local worker is already bound to backend " +
          activeBackend?.id +
          ", not " +
          backendId,
      );
    }
    return;
  }

  if (!loadPromise) {
    const backend = getLocalModelBackend(backendId);
    activeBackend = backend;

    loadPromise = (async () => {
      const progressCallback = (progress: unknown) => {
        const value = asProgress(progress);
        scope.postMessage({
          id: requestId,
          type: "progress",
          status: value.status,
          file: value.file,
          progress: value.progress,
        });
      };

      const runtime = await detectWebGpuRuntime();
      runtimeDtype = runtime.dtype;
      runtimeShaderF16 = runtime.shaderF16;

      [tokenizer, model] = await Promise.all([
        AutoTokenizer.from_pretrained(backend.modelId, {
          revision: backend.modelRevision,
          progress_callback: progressCallback,
        }),
        AutoModelForCausalLM.from_pretrained(backend.modelId, {
          revision: backend.modelRevision,
          dtype: runtime.dtype,
          device: "webgpu",
          progress_callback: progressCallback,
        }),
      ]);
    })().catch((error) => {
      loadPromise = null;
      tokenizer = null;
      model = null;
      runtimeDtype = null;
      runtimeShaderF16 = null;
      activeBackend = null;
      throw error;
    });
  } else if (activeBackend?.id !== backendId) {
    throw new Error(
      "local worker is loading backend " +
        activeBackend?.id +
        ", not " +
        backendId,
    );
  }

  await loadPromise;
}

async function detectWebGpuRuntime(): Promise<{
  dtype: LocalQwenDtype;
  shaderF16: boolean;
}> {
  const gpu = (globalThis.navigator as any)?.gpu;
  if (!gpu || typeof gpu.requestAdapter !== "function") {
    throw new Error("WebGPU adapter API is unavailable in the model worker");
  }

  const adapter = await gpu.requestAdapter();
  if (!adapter) {
    throw new Error("WebGPU did not provide an adapter");
  }

  const shaderF16 = Boolean(adapter.features?.has?.("shader-f16"));
  return {
    dtype: chooseLocalQwenDtype(shaderF16),
    shaderF16,
  };
}

async function runChoice(
  state: import("./contracts").ActorPrivateState,
  choiceOrder: ChoiceOrder,
): Promise<LocalChoiceOnlyResult> {
  if (
    runtimeDtype === null ||
    runtimeShaderF16 === null ||
    activeBackend === null
  ) {
    throw new Error("local model runtime metadata is unavailable");
  }

  const orderedOptions = getImmediateResponseOptions(choiceOrder);
  const prompt = buildImmediateResponsePrompt(state, orderedOptions);
  const messages = [{ role: "user", content: prompt }];
  const inputs = tokenizer.apply_chat_template(messages, {
    tokenize: true,
    return_dict: true,
    add_generation_prompt: true,
    enable_thinking: false,
  });

  const tokenSurfaces = resolveOptionTokenSurfaces(tokenizer);
  const tokenIds = tokenSurfaces.map((surface) => {
    const ids = tokenizer.encode(surface, { add_special_tokens: false });
    return Number(ids[0]);
  });

  const processors = new LogitsProcessorList();
  processors.push(new AllowedTokenLogitsProcessor(tokenIds));

  const started = performance.now();
  const generated = await model.generate({
    ...inputs,
    max_new_tokens: 1,
    do_sample: false,
    logits_processor: processors,
  });
  const elapsed = performance.now() - started;

  try {
    const sequences = generated.tolist();
    const sequence = sequences[0] as Array<number | bigint> | undefined;
    if (!sequence || sequence.length === 0) {
      throw new Error("choice-only generation returned no sequence");
    }

    const selectedTokenId = Number(sequence[sequence.length - 1]);
    const selectedAction = actionFromChoiceToken(
      selectedTokenId,
      tokenIds,
      orderedOptions,
    );
    const selectedTokenText = tokenizer.decode([selectedTokenId], {
      skip_special_tokens: false,
      clean_up_tokenization_spaces: false,
    });

    return {
      backendId: backend.id,
      modelId: backend.modelId,
      modelRevision: backend.modelRevision,
      dtype: runtimeDtype,
      shaderF16: runtimeShaderF16,
      choiceOrder,
      optionOrder: orderedOptions.map((option) => option.id),
      selectedAction,
      selectedTokenId,
      selectedTokenText,
      latencyMs: elapsed,
      inputTokenCount: Number(inputs.input_ids?.dims?.at(-1) ?? 0),
      optionTokenSurfaces: tokenSurfaces,
    };
  } finally {
    try {
      generated.dispose?.();
    } catch {
      // Best-effort cleanup only.
    }
  }
}

async function runProbe(
  state: import("./contracts").ActorPrivateState,
  choiceOrder: ChoiceOrder,
): Promise<LocalChoiceProbeResult> {
  if (
    runtimeDtype === null ||
    runtimeShaderF16 === null ||
    activeBackend === null
  ) {
    throw new Error("local model runtime metadata is unavailable");
  }

  const backend = activeBackend;
  const orderedOptions = getImmediateResponseOptions(choiceOrder);
  const prompt = buildImmediateResponsePrompt(state, orderedOptions);
  const messages = [{ role: "user", content: prompt }];

  const inputs = tokenizer.apply_chat_template(messages, {
    tokenize: true,
    return_dict: true,
    add_generation_prompt: true,
    enable_thinking: false,
  });

  const tokenSurfaces = resolveOptionTokenSurfaces(tokenizer);
  const tokenIds = tokenSurfaces.map((surface) => {
    const ids = tokenizer.encode(surface, { add_special_tokens: false });
    return Number(ids[0]);
  });

  const started = performance.now();
  const outputs = await model.forward({
    ...inputs,
    // This is honored only when the underlying ONNX export exposes the input.
    num_logits_to_keep: new Tensor("int64", [1n], []),
  });
  const elapsed = performance.now() - started;

  if (!outputs?.logits) {
    await disposeTensorTree(outputs);
    throw new Error("local model forward did not return logits");
  }

  const logitsShape = Array.from(outputs.logits.dims, Number);
  const lastLogits = outputs.logits.slice(null, -1, null).to("float32");

  try {
    const scoreData =
      typeof lastLogits.getData === "function"
        ? await lastLogits.getData()
        : lastLogits.data;

    const analysis = analyzeChoiceScores(
      scoreData,
      tokenIds,
      orderedOptions,
    );
    const topTokenText = tokenizer.decode([analysis.topTokenId], {
      skip_special_tokens: false,
      clean_up_tokenization_spaces: false,
    });

    return {
      backendId: activeBackend.id,
      modelId: activeBackend.modelId,
      modelRevision: activeBackend.modelRevision,
      dtype: runtimeDtype,
      shaderF16: runtimeShaderF16,
      logitsShape,
      choiceOrder,
      optionOrder: orderedOptions.map((option) => option.id),
      distribution: analysis.distribution,
      choiceMass: analysis.choiceMass,
      bestAllowedRank: analysis.bestAllowedRank,
      topTokenId: analysis.topTokenId,
      topTokenText,
      latencyMs: elapsed,
      inputTokenCount: Number(inputs.input_ids?.dims?.at(-1) ?? 0),
      optionTokenSurfaces: tokenSurfaces,
    };
  } finally {
    if (lastLogits !== outputs.logits) {
      try {
        lastLogits.dispose?.();
      } catch {
        // Best-effort cleanup; the output tree is disposed below as well.
      }
    }
    await disposeTensorTree(outputs);
  }
}

class AllowedTokenLogitsProcessor extends LogitsProcessor {
  private readonly allowedTokenIds: readonly number[];

  constructor(allowedTokenIds: readonly number[]) {
    super();
    this.allowedTokenIds = [...allowedTokenIds];
  }

  _call(_inputIds: bigint[][], logits: any) {
    const batchSize = Number(logits.dims?.[0] ?? 0);
    if (!Number.isInteger(batchSize) || batchSize < 1) {
      throw new Error("choice logits have invalid batch shape");
    }

    for (let batchIndex = 0; batchIndex < batchSize; batchIndex += 1) {
      const row = logits[batchIndex];
      const kept = this.allowedTokenIds.map((tokenId) =>
        Number(row.data[tokenId]),
      );

      row.data.fill(-Infinity);
      this.allowedTokenIds.forEach((tokenId, index) => {
        row.data[tokenId] = kept[index]!;
      });
    }

    return logits;
  }
}

function resolveOptionTokenSurfaces(activeTokenizer: any): string[] {
  for (const prefix of ["", " "]) {
    const surfaces = IMMEDIATE_RESPONSE_OPTIONS.map(
      (_, index) => prefix + String.fromCharCode(65 + index),
    );
    const encoded = surfaces.map((surface) =>
      activeTokenizer.encode(surface, { add_special_tokens: false }),
    );

    if (
      encoded.every(
        (ids: readonly unknown[]) =>
          ids.length === 1 && Number.isFinite(Number(ids[0])),
      )
    ) {
      const ids = encoded.map((value: readonly unknown[]) => Number(value[0]));
      if (new Set(ids).size === ids.length) return surfaces;
    }
  }

  throw new Error(
    "A-E labels are not distinct single-token surfaces for this tokenizer",
  );
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

async function disposeTensorTree(
  value: unknown,
  seen = new Set<object>(),
): Promise<void> {
  if (!value || typeof value !== "object") return;

  const objectValue = value as object;
  if (seen.has(objectValue)) return;
  seen.add(objectValue);

  const disposable = value as { dispose?: () => void | Promise<void> };
  if (typeof disposable.dispose === "function") {
    try {
      await disposable.dispose();
    } catch {
      // Runtime cleanup must never overwrite the primary experiment result.
    }
    return;
  }

  for (const child of Object.values(value as Record<string, unknown>)) {
    await disposeTensorTree(child, seen);
  }
}
