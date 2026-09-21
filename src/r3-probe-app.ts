import {
  auditR3MatterLexicalRetrieval,
  auditR3MatterSemanticDiversity,
  buildR3MatterRelationCorpus,
} from "./r3/matter-relation-corpus";
import {
  collectR3MatterProbeTexts,
  compareR3MatterWordingStability,
  evaluateR3MatterEmbeddingRetrieval,
} from "./r3/matter-relation-geometry";
import { R3SemanticEncoderClient } from "./r3/semantic-encoder-client";

const statusElement =
  document.querySelector<HTMLElement>("#status");
const resultElement =
  document.querySelector<HTMLElement>("#result");

if (!statusElement || !resultElement) {
  throw new Error("R3 probe page is missing output elements");
}

const statusOutput: HTMLElement = statusElement;
const resultOutput: HTMLElement = resultElement;

void runProbe();

async function runProbe(): Promise<void> {
  try {
    if (!("gpu" in navigator)) {
      throw new Error("WebGPU is unavailable");
    }

    setStatus("Building autonomous baseline/paraphrase relation corpus…");

    const corpus = buildR3MatterRelationCorpus({
      materialTicks: 1200,
      contactTicks: 1200,
      historyLength: 8,
    });

    const semanticDiversity = [
      auditR3MatterSemanticDiversity(
        corpus,
        "material-work",
        "baseline",
      ),
      auditR3MatterSemanticDiversity(
        corpus,
        "material-work",
        "paraphrase",
      ),
      auditR3MatterSemanticDiversity(
        corpus,
        "moving-contact",
        "baseline",
      ),
      auditR3MatterSemanticDiversity(
        corpus,
        "moving-contact",
        "paraphrase",
      ),
    ];

    const lexical = [
      auditR3MatterLexicalRetrieval(
        corpus,
        "material-work",
        "baseline",
      ),
      auditR3MatterLexicalRetrieval(
        corpus,
        "material-work",
        "paraphrase",
      ),
      auditR3MatterLexicalRetrieval(
        corpus,
        "moving-contact",
        "baseline",
      ),
      auditR3MatterLexicalRetrieval(
        corpus,
        "moving-contact",
        "paraphrase",
      ),
    ];

    const texts = collectR3MatterProbeTexts(corpus);
    const items = texts.map((text, index) => ({
      id: "text:" + index,
      text,
    }));
    const textById = new Map(
      items.map((item) => [item.id, item.text]),
    );

    setStatus(
      "Loading frozen MiniLM-L3 q8 and embedding " +
        items.length +
        " unique texts one-by-one…",
    );

    const client = new R3SemanticEncoderClient();
    const embedded = await client.embed(
      items,
      (progress) => {
        const percent =
          progress.progress === null
            ? ""
            : " · " + progress.progress.toFixed(1) + "%";
        const file = progress.file
          ? " · " + progress.file
          : "";
        setStatus(
          progress.status + percent + file,
        );
      },
    );

    const embeddingByText = new Map<
      string,
      readonly number[]
    >();

    for (const item of embedded.embeddings) {
      const text = textById.get(item.id);
      if (!text) {
        throw new Error(
          "R3 encoder returned unknown text id " + item.id,
        );
      }
      embeddingByText.set(text, item.vector);
    }

    const reports = [];
    for (const ecology of [
      "material-work",
      "moving-contact",
    ] as const) {
      for (const wording of [
        "baseline",
        "paraphrase",
      ] as const) {
        for (const mode of [
          "last-frame",
          "mean-history",
        ] as const) {
          reports.push(
            evaluateR3MatterEmbeddingRetrieval(
              corpus,
              embeddingByText,
              ecology,
              wording,
              mode,
            ),
          );
        }
      }
    }

    const compactReports = reports.map((report) => ({
      ecology: report.ecology,
      wording: report.wording,
      mode: report.mode,
      queryCount: report.queryCount,
      candidateCount: report.candidateCount,
      chanceTop1: report.chanceTop1,
      top1Accuracy: report.top1Accuracy,
      eventfulQueryCount: report.eventfulQueryCount,
      eventfulTop1Accuracy: report.eventfulTop1Accuracy,
      meanPositiveMargin: report.meanPositiveMargin,
      eventfulMeanPositiveMargin:
        report.eventfulMeanPositiveMargin,
    }));

    const stability = [];
    for (const ecology of [
      "material-work",
      "moving-contact",
    ] as const) {
      for (const mode of [
        "last-frame",
        "mean-history",
      ] as const) {
        const baseline = reports.find(
          (report) =>
            report.ecology === ecology &&
            report.wording === "baseline" &&
            report.mode === mode,
        )!;
        const paraphrase = reports.find(
          (report) =>
            report.ecology === ecology &&
            report.wording === "paraphrase" &&
            report.mode === mode,
        )!;
        stability.push(
          compareR3MatterWordingStability(
            baseline,
            paraphrase,
          ),
        );
      }
    }

    const result = {
      status: "PASS_EXECUTION",
      interpretationBoundary:
        "Zero-shot frozen representation probe only. No learned head, no ReflexBrain output contract, no actor authority.",
      encoder: {
        modelId: embedded.modelId,
        modelRevision: embedded.modelRevision,
        dtype: embedded.dtype,
        device: embedded.device,
        batchSize: embedded.batchSize,
        dimensions: embedded.dimensions,
        uniqueTextCount: embedded.itemCount,
        loadMs: embedded.loadMs,
        embeddingMs: embedded.embeddingMs,
      },
      semanticDiversity,
      lexical,
      semanticRetrieval: compactReports,
      wordingStability: stability,
    };

    resultOutput.textContent = JSON.stringify(
      result,
      null,
      2,
    );
    document.documentElement.dataset.r3Probe = "complete";
    setStatus("R3 frozen representation probe complete.");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);
    resultOutput.textContent = JSON.stringify(
      {
        status: "FAIL_EXECUTION",
        error: message,
      },
      null,
      2,
    );
    document.documentElement.dataset.r3Probe = "failed";
    setStatus("R3 probe failed: " + message);
  }
}

function setStatus(value: string): void {
  statusOutput.textContent = value;
}
