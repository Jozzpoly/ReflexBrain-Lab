import {
  AutoModelForCausalLM,
  AutoTokenizer,
} from "@huggingface/transformers";
import {
  analyzeChoiceScores,
  buildImmediateResponsePrompt,
  IMMEDIATE_RESPONSE_OPTIONS,
  LOCAL_QWEN_DTYPE,
  LOCAL_QWEN_MODEL_ID,
  LOCAL_QWEN_REVISION,
  type LocalChoiceProbeResult,
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

scope.onmessage = (event) => {
  void handle(event.data);
};

async function handle(request: LocalModelRequest): Promise<void> {
  try {
    if (request.type === "load") {
      await ensureLoaded(request.id);
      scope.postMessage({ id: request.id, type: "ready" });
      return;
    }

    await ensureLoaded(request.id);
    const result = await runProbe(request.state);
    scope.postMessage({ id: request.id, type: "probe_result", result });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function ensureLoaded(requestId: number): Promise<void> {
  if (tokenizer && model) return;

  if (!loadPromise) {
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

      [tokenizer, model] = await Promise.all([
        AutoTokenizer.from_pretrained(LOCAL_QWEN_MODEL_ID, {
          revision: LOCAL_QWEN_REVISION,
          progress_callback: progressCallback,
        }),
        AutoModelForCausalLM.from_pretrained(LOCAL_QWEN_MODEL_ID, {
          revision: LOCAL_QWEN_REVISION,
          dtype: LOCAL_QWEN_DTYPE,
          device: "webgpu",
          progress_callback: progressCallback,
        }),
      ]);
    })().catch((error) => {
      loadPromise = null;
      tokenizer = null;
      model = null;
      throw error;
    });
  }

  await loadPromise;
}

async function runProbe(
  state: import("./contracts").ActorPrivateState,
): Promise<LocalChoiceProbeResult> {
  const prompt = buildImmediateResponsePrompt(state);
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
  const generated = await model.generate({
    ...inputs,
    max_new_tokens: 1,
    do_sample: false,
    output_scores: true,
    return_dict_in_generate: true,
  });
  const elapsed = performance.now() - started;

  const scoreTensor = generated.scores?.[0];
  if (!scoreTensor) {
    throw new Error("local model did not return first-step generation scores");
  }

  const scoreData =
    typeof scoreTensor.getData === "function"
      ? await scoreTensor.getData()
      : scoreTensor.data;

  const analysis = analyzeChoiceScores(scoreData, tokenIds);
  const topTokenText = tokenizer.decode([analysis.topTokenId], {
    skip_special_tokens: false,
    clean_up_tokenization_spaces: false,
  });

  return {
    modelId: LOCAL_QWEN_MODEL_ID,
    modelRevision: LOCAL_QWEN_REVISION,
    distribution: analysis.distribution,
    choiceMass: analysis.choiceMass,
    bestAllowedRank: analysis.bestAllowedRank,
    topTokenId: analysis.topTokenId,
    topTokenText,
    latencyMs: elapsed,
    inputTokenCount: Number(inputs.input_ids?.dims?.at(-1) ?? 0),
    optionTokenSurfaces: tokenSurfaces,
  };
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
      return surfaces;
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
