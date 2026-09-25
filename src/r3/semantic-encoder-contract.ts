export const R3_SEMANTIC_ENCODER_MODEL_ID =
  "Xenova/paraphrase-MiniLM-L3-v2";
export const R3_SEMANTIC_ENCODER_MODEL_REVISION =
  "4b544e74dfc3256b2b56849ea5d7064fee1ac846";
export const R3_SEMANTIC_ENCODER_DTYPE = "q8" as const;
export const R3_SEMANTIC_ENCODER_BATCH_SIZE = 1 as const;

export interface R3SemanticTextInput {
  id: string;
  text: string;
}

export interface R3SemanticEmbedding {
  id: string;
  vector: readonly number[];
}

export interface R3SemanticEmbeddingResult {
  modelId: string;
  modelRevision: string;
  dtype: typeof R3_SEMANTIC_ENCODER_DTYPE;
  device: "webgpu";
  batchSize: typeof R3_SEMANTIC_ENCODER_BATCH_SIZE;
  loadMs: number;
  embeddingMs: number;
  dimensions: number;
  itemCount: number;
  embeddings: readonly R3SemanticEmbedding[];
}

export type R3SemanticEncoderWorkerRequest = {
  id: number;
  type: "embed";
  items: readonly R3SemanticTextInput[];
};

export type R3SemanticEncoderWorkerResponse =
  | {
      id: number;
      type: "progress";
      status: string;
      file: string | null;
      progress: number | null;
    }
  | {
      id: number;
      type: "embed_result";
      result: R3SemanticEmbeddingResult;
    }
  | {
      id: number;
      type: "error";
      message: string;
    };
