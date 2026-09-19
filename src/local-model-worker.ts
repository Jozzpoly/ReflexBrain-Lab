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
  buildAppraisalPrompt,
  buildImmediateResponsePrompt,
  buildSemanticResponsePrompt,
  chooseLocalQwenDtype,
  getAppraisalSpec,
  getImmediateResponseOptions,
  getLocalModelBackend,
  IMMEDIATE_RESPONSE_OPTIONS,
  probabilityYesFromScores,
  semanticActionFromToken,
  SEMANTIC_TOKEN_SPECS,
  type AppraisalId,
  type AppraisalPolarity,
  type ChoiceOrder,
  type LocalAppraisalResult,
  type LocalChoiceOnlyResult,
  type LocalChoiceProbeResult,
  type LocalSemanticChoiceResult,
  type LocalModelBackendConfig,
  type LocalModelBackendId,
  type LocalQwenDtype,
  type ResolvedBinaryToken,
  type ResolvedSemanticToken,
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

    if (request.type === "semantic_choice") {
      const result = await runSemanticChoice(
        request.state,
        request.choiceOrder,
      );
      scope.postMessage({
        id: request.id,
        type: "semantic_choice_result",
        result,
      });
      return;
    }

    if (request.type === "appraisal") {
      const result = await runAppraisal(
        request.state,
        request.appraisalId,
        request.polarity,
      );
      scope.postMessage({
        id: request.id,
        type: "appraisal_result",
        result,
      });
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

async function runAppraisal(
  state: import("./contracts").ActorPrivateState,
  appraisalId: AppraisalId,
  polarity: AppraisalPolarity,
): Promise<LocalAppraisalResult> {
  if (
    runtimeDtype === null ||
    runtimeShaderF16 === null ||
    activeBackend === null
  ) {
    throw new Error("local model runtime metadata is unavailable");
  }

  const backend = activeBackend;
  const spec = getAppraisalSpec(appraisalId);
  const proposition =
    polarity === "positive" ? spec.positive : spec.negative;
  const binaryTokens = resolveBinaryAnswerTokens(tokenizer);
  const prompt = buildAppraisalPrompt(state, spec, polarity);
  const messages = [{ role: "user", content: prompt }];
  const inputs = tokenizer.apply_chat_template(messages, {
    tokenize: true,
    return_dict: true,
    add_generation_prompt: true,
    enable_thinking: false,
  });

  const processor = new CapturingBinaryLogitsProcessor(binaryTokens);
  const processors = new LogitsProcessorList();
  processors.push(processor);

  const started = performance.now();
  const generated = await model.generate({
    ...inputs,
    max_new_tokens: 1,
    do_sample: false,
    logits_processor: processors,
  });
  const elapsed = performance.now() - started;

  try {
    const captured = processor.getCaptured();
    const probabilityYes = probabilityYesFromScores(
      captured.yesScore,
      captured.noScore,
    );

    const sequences = generated.tolist();
    const sequence = sequences[0] as Array<number | bigint> | undefined;
    if (!sequence || sequence.length === 0) {
      throw new Error("binary appraisal generation returned no sequence");
    }

    const selectedTokenId = Number(sequence[sequence.length - 1]);
    const selectedToken = binaryTokens.find(
      (token) => token.tokenId === selectedTokenId,
    );
    if (!selectedToken) {
      throw new Error("binary appraisal selected token outside yes/no set");
    }

    return {
      backendId: backend.id,
      modelId: backend.modelId,
      modelRevision: backend.modelRevision,
      dtype: runtimeDtype,
      shaderF16: runtimeShaderF16,
      appraisalId,
      polarity,
      proposition,
      selectedAnswer: selectedToken.answer,
      probabilityYes,
      positiveProbability:
        polarity === "positive" ? probabilityYes : 1 - probabilityYes,
      yesScore: captured.yesScore,
      noScore: captured.noScore,
      latencyMs: elapsed,
      inputTokenCount: Number(inputs.input_ids?.dims?.at(-1) ?? 0),
      binaryTokens,
    };
  } finally {
    try {
      generated.dispose?.();
    } catch {
      // Best-effort cleanup only.
    }
  }
}

async function runSemanticChoice(
  state: import("./contracts").ActorPrivateState,
  choiceOrder: ChoiceOrder,
): Promise<LocalSemanticChoiceResult> {
  if (
    runtimeDtype === null ||
    runtimeShaderF16 === null ||
    activeBackend === null
  ) {
    throw new Error("local model runtime metadata is unavailable");
  }

  const backend = activeBackend;
  const semanticTokens = resolveSemanticActionTokens(tokenizer);
  const orderedOptions = getImmediateResponseOptions(choiceOrder);
  const prompt = buildSemanticResponsePrompt(
    state,
    semanticTokens,
    orderedOptions,
  );
  const messages = [{ role: "user", content: prompt }];
  const inputs = tokenizer.apply_chat_template(messages, {
    tokenize: true,
    return_dict: true,
    add_generation_prompt: true,
    enable_thinking: false,
  });

  const tokenIds = semanticTokens.map((token) => token.tokenId);
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
      throw new Error("semantic-token generation returned no sequence");
    }

    const selectedTokenId = Number(sequence[sequence.length - 1]);
    const selectedAction = semanticActionFromToken(
      selectedTokenId,
      semanticTokens,
    );
    const selectedToken = semanticTokens.find(
      (token) => token.tokenId === selectedTokenId,
    );
    if (!selectedToken) {
      throw new Error("semantic-token result lost its token mapping");
    }

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
      selectedKeyword: selectedToken.keyword,
      selectedTokenId,
      selectedTokenText,
      latencyMs: elapsed,
      inputTokenCount: Number(inputs.input_ids?.dims?.at(-1) ?? 0),
      semanticTokens,
    };
  } finally {
    try {
      generated.dispose?.();
    } catch {
      // Best-effort cleanup only.
    }
  }
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

class CapturingBinaryLogitsProcessor extends LogitsProcessor {
  private captured: { yesScore: number; noScore: number } | null = null;
  private readonly yesTokenId: number;
  private readonly noTokenId: number;

  constructor(tokens: readonly ResolvedBinaryToken[]) {
    super();
    const yes = tokens.find((token) => token.answer === "yes");
    const no = tokens.find((token) => token.answer === "no");
    if (!yes || !no || yes.tokenId === no.tokenId) {
      throw new Error("binary appraisal requires distinct yes/no tokens");
    }
    this.yesTokenId = yes.tokenId;
    this.noTokenId = no.tokenId;
  }

  _call(_inputIds: bigint[][], logits: any) {
    const batchSize = Number(logits.dims?.[0] ?? 0);
    if (batchSize !== 1) {
      throw new Error("binary appraisal currently requires batch size 1");
    }

    const row = logits[0];
    const yesScore = Number(row.data[this.yesTokenId]);
    const noScore = Number(row.data[this.noTokenId]);
    if (!Number.isFinite(yesScore) || !Number.isFinite(noScore)) {
      throw new Error("binary appraisal captured non-finite yes/no scores");
    }
    this.captured = { yesScore, noScore };

    row.data.fill(-Infinity);
    row.data[this.yesTokenId] = yesScore;
    row.data[this.noTokenId] = noScore;
    return logits;
  }

  getCaptured(): { yesScore: number; noScore: number } {
    if (!this.captured) {
      throw new Error("binary appraisal logits were not captured");
    }
    return this.captured;
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

function resolveBinaryAnswerTokens(
  activeTokenizer: any,
): ResolvedBinaryToken[] {
  const resolved: ResolvedBinaryToken[] = [];
  const used = new Set<number>();

  for (const answer of ["yes", "no"] as const) {
    let match: ResolvedBinaryToken | null = null;

    for (const prefix of ["", " "]) {
      const surface = prefix + answer;
      const ids = activeTokenizer.encode(surface, {
        add_special_tokens: false,
      });
      if (ids.length !== 1) continue;

      const tokenId = Number(ids[0]);
      if (!Number.isFinite(tokenId) || used.has(tokenId)) continue;

      match = { answer, surface, tokenId };
      break;
    }

    if (!match) {
      throw new Error(
        "no unique single-token surface for binary answer " + answer,
      );
    }

    used.add(match.tokenId);
    resolved.push(match);
  }

  return resolved;
}

function resolveSemanticActionTokens(
  activeTokenizer: any,
): ResolvedSemanticToken[] {
  const resolved: ResolvedSemanticToken[] = [];
  const usedTokenIds = new Set<number>();

  for (const spec of SEMANTIC_TOKEN_SPECS) {
    let match: ResolvedSemanticToken | null = null;

    candidateLoop:
    for (const keyword of spec.candidates) {
      for (const prefix of ["", " "]) {
        const surface = prefix + keyword;
        const ids = activeTokenizer.encode(surface, {
          add_special_tokens: false,
        });

        if (ids.length !== 1) continue;

        const tokenId = Number(ids[0]);
        if (!Number.isFinite(tokenId) || usedTokenIds.has(tokenId)) {
          continue;
        }

        match = {
          action: spec.id,
          keyword,
          surface,
          tokenId,
        };
        break candidateLoop;
      }
    }

    if (!match) {
      throw new Error(
        "no unique single-token semantic surface for action " + spec.id,
      );
    }

    usedTokenIds.add(match.tokenId);
    resolved.push(match);
  }

  return resolved;
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
