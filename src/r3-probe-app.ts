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
import {
  auditR3CausalMatterResponsibility,
  buildR3CausalMatterResponsibilityCorpus,
} from "./r3/causal-matter-responsibility";
import {
  compareR3CausalMatterWordingStability,
  evaluateR3CausalMatterEmbeddingRetrieval,
} from "./r3/causal-matter-geometry";
import {
  auditR3SameActorMatterDiversity,
  auditR3SameActorMatterLexicalRetrieval,
  buildR3SameActorMatterCorpus,
} from "./r3/same-actor-matter-corpus";
import {
  compareR3SameActorWordingStability,
  evaluateR3SameActorEmbeddingRetrieval,
} from "./r3/same-actor-matter-geometry";
import {
  auditR3TransitionLexicalRetrieval,
  auditR3TransitionSemanticDiversity,
  buildR3TransitionMatterCorpus,
} from "./r3/transition-matter-corpus";
import {
  collectR3TransitionProbeTexts,
  compareR3TransitionWordingStability,
  evaluateR3TransitionEmbeddingRetrieval,
} from "./r3/transition-matter-geometry";

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

    const transitionCorpus = buildR3TransitionMatterCorpus({
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

    const sameActorCorpus =
      buildR3SameActorMatterCorpus(
        transitionCorpus,
      );

    const causalCorpus =
      buildR3CausalMatterResponsibilityCorpus();

    const sameActorDiversity = [
      auditR3SameActorMatterDiversity(
        sameActorCorpus,
        "resident:janek",
        "baseline",
      ),
      auditR3SameActorMatterDiversity(
        sameActorCorpus,
        "resident:janek",
        "paraphrase",
      ),
      auditR3SameActorMatterDiversity(
        sameActorCorpus,
        "resident:ida",
        "baseline",
      ),
      auditR3SameActorMatterDiversity(
        sameActorCorpus,
        "resident:ida",
        "paraphrase",
      ),
    ];

    const sameActorLexical = [
      auditR3SameActorMatterLexicalRetrieval(
        sameActorCorpus,
        "resident:janek",
        "baseline",
      ),
      auditR3SameActorMatterLexicalRetrieval(
        sameActorCorpus,
        "resident:janek",
        "paraphrase",
      ),
      auditR3SameActorMatterLexicalRetrieval(
        sameActorCorpus,
        "resident:ida",
        "baseline",
      ),
      auditR3SameActorMatterLexicalRetrieval(
        sameActorCorpus,
        "resident:ida",
        "paraphrase",
      ),
    ];

    const causalAudit = [
      auditR3CausalMatterResponsibility(
        causalCorpus,
        "resident:janek",
        "baseline",
      ),
      auditR3CausalMatterResponsibility(
        causalCorpus,
        "resident:janek",
        "paraphrase",
      ),
      auditR3CausalMatterResponsibility(
        causalCorpus,
        "resident:ida",
        "baseline",
      ),
      auditR3CausalMatterResponsibility(
        causalCorpus,
        "resident:ida",
        "paraphrase",
      ),
    ];

    const transitionSemanticDiversity = [
      auditR3TransitionSemanticDiversity(
        transitionCorpus,
        "material-work",
        "baseline",
      ),
      auditR3TransitionSemanticDiversity(
        transitionCorpus,
        "material-work",
        "paraphrase",
      ),
      auditR3TransitionSemanticDiversity(
        transitionCorpus,
        "moving-contact",
        "baseline",
      ),
      auditR3TransitionSemanticDiversity(
        transitionCorpus,
        "moving-contact",
        "paraphrase",
      ),
    ];

    const transitionLexical = [
      auditR3TransitionLexicalRetrieval(
        transitionCorpus,
        "material-work",
        "baseline",
      ),
      auditR3TransitionLexicalRetrieval(
        transitionCorpus,
        "material-work",
        "paraphrase",
      ),
      auditR3TransitionLexicalRetrieval(
        transitionCorpus,
        "moving-contact",
        "baseline",
      ),
      auditR3TransitionLexicalRetrieval(
        transitionCorpus,
        "moving-contact",
        "paraphrase",
      ),
    ];

    const texts = [
      ...new Set([
        ...collectR3MatterProbeTexts(corpus),
        ...collectR3TransitionProbeTexts(
          transitionCorpus,
        ),
      ]),
    ].sort();
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

    const transitionReports = [];
    for (const ecology of [
      "material-work",
      "moving-contact",
    ] as const) {
      for (const wording of [
        "baseline",
        "paraphrase",
      ] as const) {
        for (const mode of [
          "last-transition",
          "mean-transitions",
        ] as const) {
          transitionReports.push(
            evaluateR3TransitionEmbeddingRetrieval(
              transitionCorpus,
              embeddingByText,
              ecology,
              wording,
              mode,
            ),
          );
        }
      }
    }

    const compactTransitionReports =
      transitionReports.map((report) => ({
        ecology: report.ecology,
        wording: report.wording,
        mode: report.mode,
        queryCount: report.queryCount,
        candidateCount: report.candidateCount,
        chanceTop1: report.chanceTop1,
        top1Accuracy: report.top1Accuracy,
        eventfulQueryCount: report.eventfulQueryCount,
        eventfulTop1Accuracy:
          report.eventfulTop1Accuracy,
        meanPositiveMargin:
          report.meanPositiveMargin,
        eventfulMeanPositiveMargin:
          report.eventfulMeanPositiveMargin,
      }));

    const transitionStability = [];
    for (const ecology of [
      "material-work",
      "moving-contact",
    ] as const) {
      for (const mode of [
        "last-transition",
        "mean-transitions",
      ] as const) {
        const baseline =
          transitionReports.find(
            (report) =>
              report.ecology === ecology &&
              report.wording === "baseline" &&
              report.mode === mode,
          )!;
        const paraphrase =
          transitionReports.find(
            (report) =>
              report.ecology === ecology &&
              report.wording === "paraphrase" &&
              report.mode === mode,
          )!;

        transitionStability.push(
          compareR3TransitionWordingStability(
            baseline,
            paraphrase,
          ),
        );
      }
    }

    const sameActorReports = [];
    for (const residentId of [
      "resident:janek",
      "resident:ida",
    ] as const) {
      for (const wording of [
        "baseline",
        "paraphrase",
      ] as const) {
        for (const mode of [
          "last-transition",
          "mean-transitions",
        ] as const) {
          sameActorReports.push(
            evaluateR3SameActorEmbeddingRetrieval(
              sameActorCorpus,
              embeddingByText,
              residentId,
              wording,
              mode,
            ),
          );
        }
      }
    }

    const compactSameActorReports =
      sameActorReports.map((report) => ({
        residentId: report.residentId,
        wording: report.wording,
        mode: report.mode,
        queryCount: report.queryCount,
        candidateCount: report.candidateCount,
        chanceTop1: report.chanceTop1,
        top1Accuracy: report.top1Accuracy,
        eventfulQueryCount:
          report.eventfulQueryCount,
        eventfulTop1Accuracy:
          report.eventfulTop1Accuracy,
        meanPositiveMargin:
          report.meanPositiveMargin,
        eventfulMeanPositiveMargin:
          report.eventfulMeanPositiveMargin,
      }));

    const sameActorStability = [];
    for (const residentId of [
      "resident:janek",
      "resident:ida",
    ] as const) {
      for (const mode of [
        "last-transition",
        "mean-transitions",
      ] as const) {
        const baseline = sameActorReports.find(
          (report) =>
            report.residentId === residentId &&
            report.wording === "baseline" &&
            report.mode === mode,
        )!;
        const paraphrase = sameActorReports.find(
          (report) =>
            report.residentId === residentId &&
            report.wording === "paraphrase" &&
            report.mode === mode,
        )!;

        sameActorStability.push(
          compareR3SameActorWordingStability(
            baseline,
            paraphrase,
          ),
        );
      }
    }

    const causalReports = [];
    for (const residentId of [
      "resident:janek",
      "resident:ida",
    ] as const) {
      for (const wording of [
        "baseline",
        "paraphrase",
      ] as const) {
        for (const mode of [
          "last-transition",
          "mean-transitions",
        ] as const) {
          causalReports.push(
            evaluateR3CausalMatterEmbeddingRetrieval(
              causalCorpus,
              embeddingByText,
              residentId,
              wording,
              mode,
            ),
          );
        }
      }
    }

    const compactCausalReports =
      causalReports.map((report) => ({
        residentId: report.residentId,
        wording: report.wording,
        mode: report.mode,
        queryCount: report.queryCount,
        chanceTop1: report.chanceTop1,
        top1Accuracy: report.top1Accuracy,
        meanResponsibleMargin:
          report.meanResponsibleMargin,
      }));

    const causalWordingStability = [];
    for (const residentId of [
      "resident:janek",
      "resident:ida",
    ] as const) {
      for (const mode of [
        "last-transition",
        "mean-transitions",
      ] as const) {
        const baseline = causalReports.find(
          (report) =>
            report.residentId === residentId &&
            report.wording === "baseline" &&
            report.mode === mode,
        )!;
        const paraphrase = causalReports.find(
          (report) =>
            report.residentId === residentId &&
            report.wording === "paraphrase" &&
            report.mode === mode,
        )!;

        causalWordingStability.push(
          compareR3CausalMatterWordingStability(
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
      transitionSemanticDiversity,
      transitionLexical,
      transitionSemanticRetrieval:
        compactTransitionReports,
      transitionWordingStability:
        transitionStability,
      sameActorDiversity,
      sameActorLexical,
      sameActorSemanticRetrieval:
        compactSameActorReports,
      sameActorWordingStability:
        sameActorStability,
      causalAudit,
      causalSemanticRetrieval:
        compactCausalReports,
      causalWordingStability,
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
