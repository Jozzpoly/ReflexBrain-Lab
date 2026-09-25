import {
  auditR3MixedPressureCausalResponsibility,
  buildR3MixedPressureCausalCorpus,
} from "./r3/mixed-pressure-causal-responsibility";
import {
  collectR3MixedPressureProbeTexts,
  compareR3MixedPressureWordingStability,
  evaluateR3MixedPressureEmbeddingRetrieval,
  type R3MixedPressureEmbeddingMetrics,
} from "./r3/mixed-pressure-geometry";
import {
  R3SemanticEncoderClient,
} from "./r3/semantic-encoder-client";

const statusElement =
  document.querySelector<HTMLElement>("#status");
const resultElement =
  document.querySelector<HTMLElement>("#result");

if (!statusElement || !resultElement) {
  throw new Error(
    "mixed-pressure probe page is missing output elements",
  );
}

const statusOutput: HTMLElement = statusElement;
const resultOutput: HTMLElement = resultElement;

void run();

async function run(): Promise<void> {
  try {
    if (!("gpu" in navigator)) {
      throw new Error("WebGPU is unavailable");
    }

    setStatus(
      "Building qualified mixed-pressure causal corpus…",
    );

    const corpus =
      buildR3MixedPressureCausalCorpus({
        scanTicks: 700,
        historyLength: 8,
        maxPerMatter: 6,
      });

    const causalAudit = [
      auditR3MixedPressureCausalResponsibility(
        corpus,
        "baseline",
      ),
      auditR3MixedPressureCausalResponsibility(
        corpus,
        "paraphrase",
      ),
    ];

    const texts =
      collectR3MixedPressureProbeTexts(corpus);
    const items = texts.map((text, index) => ({
      id: "mixed:" + index,
      text,
    }));
    const textById = new Map(
      items.map((item) => [item.id, item.text]),
    );

    setStatus(
      "Loading pinned frozen MiniLM-L3 q8 and embedding " +
        items.length +
        " unique mixed-pressure texts one-by-one…",
    );

    const client = new R3SemanticEncoderClient();
    const embedded = await client.embed(
      items,
      (progress) => {
        const percent =
          progress.progress === null
            ? ""
            : " · " +
              progress.progress.toFixed(1) +
              "%";
        const file =
          progress.file ? " · " + progress.file : "";

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
          "mixed-pressure encoder returned unknown text id " +
            item.id,
        );
      }

      embeddingByText.set(text, item.vector);
    }

    const reports: R3MixedPressureEmbeddingMetrics[] = [];

    for (const wording of [
      "baseline",
      "paraphrase",
    ] as const) {
      for (const mode of [
        "last-transition",
        "mean-transitions",
      ] as const) {
        reports.push(
          evaluateR3MixedPressureEmbeddingRetrieval(
            corpus,
            embeddingByText,
            wording,
            mode,
          ),
        );
      }
    }

    const compactReports = reports.map((report) => ({
      wording: report.wording,
      mode: report.mode,
      queryCount: report.queryCount,
      candidateCount: report.candidateCount,
      chanceTop1: report.chanceTop1,
      top1Accuracy: report.top1Accuracy,
      meanResponsibleMargin:
        report.meanResponsibleMargin,
      perMatterAccuracy: report.perMatterAccuracy,
    }));

    const wordingStability = [
      "last-transition",
      "mean-transitions",
    ].map((mode) => {
      const baseline = reports.find(
        (report) =>
          report.wording === "baseline" &&
          report.mode === mode,
      )!;
      const paraphrase = reports.find(
        (report) =>
          report.wording === "paraphrase" &&
          report.mode === mode,
      )!;

      return compareR3MixedPressureWordingStability(
        baseline,
        paraphrase,
      );
    });

    const result = {
      status: "PASS_EXECUTION",
      interpretationBoundary:
        "Frozen direct-cosine falsifier only. No training, no learned head, no ReflexBrain output contract, no actor authority.",
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
      causalAudit,
      semanticRetrieval: compactReports,
      wordingStability,
    };

    resultOutput.textContent =
      JSON.stringify(result, null, 2);
    document.documentElement.dataset
      .r3MixedPressureProbe = "complete";

    setStatus(
      "R3 mixed-pressure frozen representation probe complete.",
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    resultOutput.textContent =
      JSON.stringify(
        {
          status: "FAIL_EXECUTION",
          error: message,
        },
        null,
        2,
      );

    document.documentElement.dataset
      .r3MixedPressureProbe = "failed";

    setStatus(
      "R3 mixed-pressure probe failed: " + message,
    );
  }
}

function setStatus(value: string): void {
  statusOutput.textContent = value;
}
