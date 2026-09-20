import "./style.css";
import type {
  ActionDistribution,
  ReflexScores,
  ShadowTraceFrame,
} from "./contracts";
import {
  createR0CounterfactualEpisode,
  type Episode,
  type SpeechExposure,
} from "./episode";
import {
  APPRAISAL_SPECS,
  BIPOLAR_APPRAISAL_SPECS,
  DEFAULT_LOCAL_MODEL_BACKEND,
  getLocalModelBackend,
  IMMEDIATE_RESPONSE_OPTIONS,
  isLocalModelBackendId,
  PERMUTATION_SWEEP_ORDERS,
  type AppraisalId,
  type AppraisalPolarity,
  type BipolarAppraisalOrder,
  type ChoiceOrder,
  type LocalAppraisalResult,
  type LocalBipolarAppraisalResult,
  type LocalChoiceOnlyResult,
  type LocalChoiceProbeResult,
  type LocalModelBackendId,
  type LocalSemanticChoiceResult,
} from "./local-choice-probe";
import {
  LocalModelClient,
  type LocalModelProgress,
} from "./local-model-client";
import { compilePrivateState } from "./private-state";
import { createR1CounterfactualSuite } from "./r1/counterfactual-supervision";
import { createR1OodRedTeamSuite } from "./r1/ood-red-team";
import { createR1SemanticTrainingAugmentation } from "./r1/semantic-training-augmentation";
import {
  R1EncoderBenchmarkClient,
  type R1EncoderProgress,
} from "./r1/encoder-client";
import type {
  R1EncoderBenchmarkResult,
  R1HeadMode,
  R1LearnedHeadResult,
  R1RepresentationMode,
} from "./r1/encoder-contract";
import { createSemanticChallenges } from "./challenges";
import { RuleBaselineProvider } from "./rule-provider";
import { runShadowEpisode } from "./shadow-runner";

interface Specimen {
  exposure: SpeechExposure;
  episode: Episode;
  trace: readonly ShadowTraceFrame[];
}

interface MatrixProbe {
  exposure: SpeechExposure;
  order: ChoiceOrder;
  repetition: number;
  result: LocalChoiceProbeResult;
}

interface ChoiceMatrixProbe {
  exposure: SpeechExposure;
  order: ChoiceOrder;
  repetition: number;
  result: LocalChoiceOnlyResult;
}

interface ChallengeMatrixProbe {
  challengeId: string;
  challengeTitle: string;
  order: ChoiceOrder;
  result: LocalChoiceOnlyResult;
}

interface PermutationSweepProbe {
  challengeId: string;
  challengeTitle: string;
  order: ChoiceOrder;
  optionMap: string;
  result: LocalChoiceOnlyResult;
}

interface SemanticTokenSweepProbe {
  challengeId: string;
  challengeTitle: string;
  order: ChoiceOrder;
  result: LocalSemanticChoiceResult;
}

interface AppraisalMatrixProbe {
  challengeId: string;
  challengeTitle: string;
  appraisalId: AppraisalId;
  polarity: AppraisalPolarity;
  result: LocalAppraisalResult;
}

interface BipolarMatrixProbe {
  challengeId: string;
  challengeTitle: string;
  appraisalId: AppraisalId;
  order: BipolarAppraisalOrder;
  result: LocalBipolarAppraisalResult;
}

const provider = new RuleBaselineProvider();
const exposures: readonly SpeechExposure[] = ["addressed", "overheard", "none"];
const specimens: Specimen[] = [];

for (const exposure of exposures) {
  const episode = createR0CounterfactualEpisode({ speechExposure: exposure });
  specimens.push({
    exposure,
    episode,
    trace: await runShadowEpisode(episode.frames, provider),
  });
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("missing #app");

const pageParams = new URLSearchParams(window.location.search);
const requestedBackendId = pageParams.get("backend");
const selectedBackendId: LocalModelBackendId = isLocalModelBackendId(
  requestedBackendId,
)
  ? requestedBackendId
  : DEFAULT_LOCAL_MODEL_BACKEND;
const selectedBackend = getLocalModelBackend(selectedBackendId);

const webGpuAvailable = "gpu" in navigator;
let selectedExposure: SpeechExposure = "addressed";
let selectedTick = 10;
let localClient: LocalModelClient | null = null;
let localModelReady = false;
let localBusy = false;
let localStatus = webGpuAvailable
  ? "Local model is not loaded. No model bytes have been downloaded."
  : "WebGPU is not available in this browser.";
let localResult: LocalChoiceProbeResult | null = null;
let localResultKey: string | null = null;
let localChoiceOrder: ChoiceOrder = "canonical";
let matrixProbes: MatrixProbe[] = [];
let choiceMatrixProbes: ChoiceMatrixProbe[] = [];
let challengeMatrixProbes: ChallengeMatrixProbe[] = [];
let permutationSweepProbes: PermutationSweepProbe[] = [];
let semanticTokenSweepProbes: SemanticTokenSweepProbe[] = [];
let appraisalMatrixProbes: AppraisalMatrixProbe[] = [];
let bipolarMatrixProbes: BipolarMatrixProbe[] = [];
let r1EncoderClient: R1EncoderBenchmarkClient | null = null;
let r1EncoderBusy = false;
let r1EncoderStatus = webGpuAvailable
  ? "R1 encoder benchmark has not run."
  : "R1 encoder benchmark unavailable: WebGPU is not available.";
let r1EncoderResult: R1EncoderBenchmarkResult | null = null;
let r1LearnedHeadBusy = false;
let r1LearnedHeadStatus = webGpuAvailable
  ? "R1 learned head has not run."
  : "R1 learned head unavailable: WebGPU is not available.";
let r1LearnedHeadResult: R1LearnedHeadResult | null = null;
type R1SupervisionMode = "base" | "expanded";
let r1LearnedHeadSupervision: R1SupervisionMode = "base";
let r1LearnedHeadMode: R1HeadMode = "prototype";

function selectedSpecimen(): Specimen {
  return specimens.find(
    (candidate) => candidate.exposure === selectedExposure,
  )!;
}

function selectedFrame(): ShadowTraceFrame {
  return selectedSpecimen().trace[selectedTick]!;
}

function selectionKey(): string {
  return selectedExposure + ":" + selectedTick + ":" + localChoiceOrder;
}

function selectedCanonicalPrivateState() {
  return compilePrivateState(selectedFrame().world, "task");
}

function render(): void {
  const specimen = selectedSpecimen();
  const frame = selectedFrame();
  const canonicalState = selectedCanonicalPrivateState();
  const speech = canonicalState.percepts.find(
    (percept) => percept.kind === "speech",
  );
  const activeLocalResult =
    localResultKey === selectionKey() ? localResult : null;

  app!.innerHTML = [
    '<main class="shell">',
    "<h1>ReflexBrain Lab · R0</h1>",
    "<p>Same deterministic world trajectory, different semantic exposure. All learned inference remains zero-authority.</p>",
    '<section class="panel"><h2>Counterfactual family</h2><div class="variants">',
    specimens
      .map(
        (candidate) =>
          '<button class="' +
          (candidate.exposure === selectedExposure ? "active" : "") +
          '" data-exposure="' +
          candidate.exposure +
          '">' +
          candidate.exposure +
          "</button>",
      )
      .join(""),
    "</div></section>",
    '<section class="panel">',
    "<h2>" + specimen.episode.title + "</h2>",
    "<p>Tick <strong>" +
      frame.tick +
      "</strong> · authoritative baseline action: <strong>" +
      frame.baselineAction +
      "</strong></p>",
    "<p>Rule temporal focus: <strong>" +
      frame.stabilized.focus +
      "</strong> · local-model canonical focus: <strong>" +
      canonicalState.recentFocus +
      "</strong></p>",
    "<p>Task progress: " + frame.world.taskProgress.toFixed(2) + "</p>",
    speech && speech.kind === "speech"
      ? "<p>Canonical private speech percept: “" +
        escapeHtml(speech.text) +
        "” · addressed=<strong>" +
        String(speech.addressed) +
        "</strong></p>"
      : "<p>No canonical speech percept this tick.</p>",
    "</section>",
    '<section class="panel"><h2>Rule baseline · raw → stabilized signals</h2>',
    signalTable(frame.provider.scores, frame.stabilized.scores),
    "</section>",
    '<section class="panel"><h2>Local semantic choice probe</h2>',
    '<p class="boundary">One local Qwen forward evaluates five declared responses from a <strong>provider-independent canonical private state</strong>. We report the conditional A–E distribution plus how much full-vocabulary prediction mass those labels actually received. These values are not calibrated confidence and do not control the actor.</p>',
    '<p class="status">' + escapeHtml(localStatus) + "</p>",
    localControls(),
    activeLocalResult
      ? modelComparison(frame.provider.actions, activeLocalResult)
      : '<p class="muted">No local-model result for the currently selected canonical state.</p>',
    matrixProbes.length > 0 ? matrixTable() : "",
    choiceMatrixProbes.length > 0 ? choiceMatrixTable() : "",
    challengeMatrixProbes.length > 0 ? challengeMatrixTable() : "",
    permutationSweepProbes.length > 0 ? permutationSweepTable() : "",
    semanticTokenSweepProbes.length > 0 ? semanticTokenSweepTable() : "",
    appraisalMatrixProbes.length > 0 ? appraisalMatrixTable() : "",
    bipolarMatrixProbes.length > 0 ? bipolarMatrixTable() : "",
    "</section>",
    '<section class="panel"><h2>R1 tiny encoder benchmark</h2>',
    '<p class="boundary">This path uses a small sentence encoder as a <strong>feature extractor only</strong>: no generation, no action selection and no World authority. The first gate is runtime cost plus representation sensitivity, not semantic correctness.</p>',
    '<p class="status">' + escapeHtml(r1EncoderStatus) + "</p>",
    r1EncoderControls(),
    r1EncoderResult ? r1EncoderReportTable(r1EncoderResult) : "",
    '<h3>Frozen-encoder learned appraisal head</h3>',
    '<p class="status">' + escapeHtml(r1LearnedHeadStatus) + "</p>",
    r1LearnedHeadControls(),
    r1LearnedHeadResult ? r1LearnedHeadReportTable(r1LearnedHeadResult) : "",
    "</section>",
    '<section class="panel"><h2>Rule baseline · cross-variant snapshot at tick 10</h2>',
    comparisonTable(),
    "</section>",
    '<section class="panel"><h2>Timeline</h2><div class="timeline">',
    specimen.trace
      .map(
        (entry) =>
          '<button class="' +
          (entry.tick === frame.tick ? "active" : "") +
          '" data-tick="' +
          entry.tick +
          '">t' +
          entry.tick +
          " · A " +
          entry.stabilized.scores.attentionPlayer.toFixed(2) +
          " · I " +
          entry.stabilized.scores.interruptCurrent.toFixed(2) +
          "</button>",
      )
      .join(""),
    "</div></section>",
    "</main>",
  ].join("");

  document.querySelectorAll<HTMLButtonElement>("[data-tick]").forEach((button) => {
    button.onclick = () => {
      selectedTick = Number(button.dataset.tick ?? 0);
      render();
    };
  });

  document
    .querySelectorAll<HTMLButtonElement>("[data-exposure]")
    .forEach((button) => {
      button.onclick = () => {
        selectedExposure = button.dataset.exposure as SpeechExposure;
        render();
      };
    });

  document
    .querySelector<HTMLButtonElement>("[data-load-model]")
    ?.addEventListener("click", () => {
      void loadLocalModel();
    });

  document
    .querySelector<HTMLButtonElement>("[data-run-probe]")
    ?.addEventListener("click", () => {
      void runLocalProbe();
    });

  document
    .querySelector<HTMLButtonElement>("[data-run-r1-encoder]")
    ?.addEventListener("click", () => {
      void runR1EncoderBenchmark();
    });

  document
    .querySelector<HTMLButtonElement>("[data-run-r1-learned]")
    ?.addEventListener("click", () => {
      void runR1LearnedHead("encoder-only");
    });

  document
    .querySelector<HTMLButtonElement>("[data-run-r1-hybrid]")
    ?.addEventListener("click", () => {
      void runR1LearnedHead("hybrid");
    });

  document
    .querySelector<HTMLButtonElement>("[data-run-r1-hybrid-expanded]")
    ?.addEventListener("click", () => {
      void runR1LearnedHead("hybrid", "expanded");
    });

  document
    .querySelector<HTMLButtonElement>("[data-run-r1-hybrid-expanded-linear]")
    ?.addEventListener("click", () => {
      void runR1LearnedHead("hybrid", "expanded", "linear-ranking");
    });
}

function localControls(): string {
  if (!webGpuAvailable) {
    return "<button disabled>WebGPU unavailable</button>";
  }

  if (!localModelReady) {
    return (
      '<button class="primary" data-load-model ' +
      (localBusy ? "disabled" : "") +
      ">Load " +
      escapeHtml(selectedBackendId) +
      " (adaptive q4f16/q8)</button>"
    );
  }

  return (
    '<div class="probe-controls">' +
    '<span class="ready">Model ready · ' +
    escapeHtml(selectedBackend.modelId) +
    "</span>" +
    '<button class="primary" data-run-probe ' +
    (localBusy ? "disabled" : "") +
    ">Probe this exact canonical state</button>" +
    "</div>"
  );
}

async function loadLocalModel(): Promise<void> {
  if (!webGpuAvailable || localBusy || localModelReady) return;

  localBusy = true;
  localStatus =
    "Preparing local model worker · " +
    selectedBackendId +
    ". The pinned model revision is downloaded on demand and cached by the browser.";
  render();

  try {
    localClient ??= new LocalModelClient(selectedBackendId);
    await localClient.load(updateLoadProgress);
    localModelReady = true;
    localStatus =
      "Local backend ready · " +
      selectedBackendId +
      ". It has no World or reflex authority.";
  } catch (error) {
    localStatus = "Local model load failed: " + errorMessage(error);
  } finally {
    localBusy = false;
    render();
  }
}

async function runLocalProbe(): Promise<void> {
  if (!localModelReady || !localClient || localBusy) return;

  const keyAtStart = selectionKey();
  const stateAtStart = structuredClone(selectedCanonicalPrivateState());
  localBusy = true;
  localStatus = "Running one direct next-token forward locally...";
  render();

  try {
    const result = await localClient.probe(
      stateAtStart,
      localChoiceOrder,
    );
    localResult = result;
    localResultKey = keyAtStart;
    localStatus =
      "Probe complete in " +
      result.latencyMs.toFixed(1) +
      " ms over " +
      result.inputTokenCount +
      " input tokens.";
  } catch (error) {
    localStatus = "Local probe failed: " + errorMessage(error);
  } finally {
    localBusy = false;
    render();
  }
}

function updateLoadProgress(progress: LocalModelProgress): void {
  const progressText =
    progress.progress === null
      ? ""
      : " · " + progress.progress.toFixed(1) + "%";
  const fileText = progress.file ? " · " + progress.file : "";
  localStatus = progress.status + progressText + fileText;
  render();
}

function modelComparison(
  baseline: ActionDistribution,
  local: LocalChoiceProbeResult,
): string {
  const rows = IMMEDIATE_RESPONSE_OPTIONS.map((option) => {
    const baselineValue = baseline[option.id];
    const modelValue = local.distribution[option.id];
    return (
      "<tr><td>" +
      escapeHtml(option.label) +
      "</td><td>" +
      baselineValue.toFixed(3) +
      "</td><td>" +
      modelValue.toFixed(3) +
      "</td><td>" +
      signed(modelValue - baselineValue) +
      "</td></tr>"
    );
  });

  return [
    '<div class="result-meta">',
    "<span>Latency: <strong>" + local.latencyMs.toFixed(1) + " ms</strong></span>",
    "<span>Input: <strong>" + local.inputTokenCount + " tokens</strong></span>",
    "<span>A–E full-vocab mass: <strong>" +
      formatPercent(local.choiceMass) +
      "</strong></span>",
    "<span>Best allowed rank: <strong>#" +
      local.bestAllowedRank +
      "</strong></span>",
    "<span>Top token: <code>" +
      escapeHtml(JSON.stringify(local.topTokenText)) +
      "</code></span>",
    "<span>Runtime: <strong>WebGPU / " +
      escapeHtml(local.dtype) +
      "</strong> · shader-f16=" +
      String(local.shaderF16) +
      "</span>",
    "<span>Logits shape: <code>[" +
      local.logitsShape.join(", ") +
      "]</code></span>",
    "<span>Choice order: <strong>" +
      escapeHtml(local.choiceOrder) +
      "</strong> · <code>" +
      local.optionOrder
        .map((action, index) => String.fromCharCode(65 + index) + "=" + action)
        .join(" · ") +
      "</code></span>",
    "<span>Revision: <code>" +
      escapeHtml(local.modelRevision.slice(0, 12)) +
      "</code></span>",
    "<span>Labels: <code>" +
      local.optionTokenSurfaces.map(escapeHtml).join(" · ") +
      "</code></span>",
    "</div>",
    '<div class="table-wrap"><table><thead><tr>',
    "<th>Allowed response</th><th>Rule baseline</th><th>Local Qwen</th><th>Δ</th>",
    "</tr></thead><tbody>",
    rows.join(""),
    "</tbody></table></div>",
  ].join("");
}

function matrixTable(): string {
  const rows = matrixProbes.map((probe) => {
    const entries = Object.entries(probe.result.distribution)
      .sort((a, b) => b[1] - a[1]);
    const [topAction, topProbability] = entries[0]!;

    return (
      "<tr><td>" +
      probe.exposure +
      "</td><td>" +
      probe.order +
      "</td><td>" +
      probe.repetition +
      "</td><td>" +
      probe.result.latencyMs.toFixed(1) +
      " ms</td><td>" +
      formatPercent(probe.result.choiceMass) +
      "</td><td>" +
      escapeHtml(topAction) +
      "</td><td>" +
      topProbability.toFixed(4) +
      "</td></tr>"
    );
  });

  return (
    '<div class="table-wrap"><table><thead><tr>' +
    "<th>Exposure</th><th>Order</th><th>Rep</th><th>Latency</th><th>A–E mass</th><th>Top semantic action</th><th>P</th>" +
    "</tr></thead><tbody>" +
    rows.join("") +
    "</tbody></table></div>"
  );
}

async function runSemanticMatrix(): Promise<void> {
  if (!localModelReady || !localClient || localBusy) return;

  matrixProbes = [];
  const orders: readonly ChoiceOrder[] = ["canonical", "reverse"];
  const repetitions = 2;
  let completed = 0;
  const total = exposures.length * orders.length * repetitions;

  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    for (const exposure of exposures) {
      const specimen = specimens.find(
        (candidate) => candidate.exposure === exposure,
      )!;
      const state = compilePrivateState(specimen.trace[10]!.world, "task");

      for (const order of orders) {
        localBusy = true;
        localStatus =
          "Semantic matrix " +
          completed +
          "/" +
          total +
          " complete · running " +
          exposure +
          " / " +
          order +
          " / rep " +
          repetition +
          ".";
        render();

        const result = await localClient.probe(structuredClone(state), order);
        matrixProbes.push({ exposure, order, repetition, result });
        completed += 1;
      }
    }
  }

  localBusy = false;
  localStatus =
    "Semantic matrix complete: " +
    completed +
    " direct forwards in one loaded-model session.";
  render();
}

function choiceMatrixTable(): string {
  const rows = choiceMatrixProbes.map((probe) =>
    "<tr><td>" +
    probe.exposure +
    "</td><td>" +
    probe.order +
    "</td><td>" +
    probe.repetition +
    "</td><td>" +
    probe.result.latencyMs.toFixed(1) +
    " ms</td><td>" +
    escapeHtml(probe.result.selectedAction) +
    "</td><td><code>" +
    escapeHtml(JSON.stringify(probe.result.selectedTokenText)) +
    "</code></td><td>" +
    probe.result.inputTokenCount +
    "</td></tr>",
  );

  return (
    '<h3>Choice-only generation matrix</h3>' +
    '<div class="table-wrap"><table><thead><tr>' +
    "<th>Exposure</th><th>Order</th><th>Rep</th><th>Latency</th><th>Selected action</th><th>Token</th><th>Input tokens</th>" +
    "</tr></thead><tbody>" +
    rows.join("") +
    "</tbody></table></div>"
  );
}

async function runChoiceMatrix(): Promise<void> {
  if (!localModelReady || !localClient || localBusy) return;

  choiceMatrixProbes = [];
  const orders: readonly ChoiceOrder[] = ["canonical", "reverse"];
  const repetitions = 2;
  let completed = 0;
  const total = exposures.length * orders.length * repetitions;
  localBusy = true;

  try {
    for (let repetition = 1; repetition <= repetitions; repetition += 1) {
      for (const exposure of exposures) {
        const specimen = specimens.find(
          (candidate) => candidate.exposure === exposure,
        )!;
        const state = compilePrivateState(specimen.trace[10]!.world, "task");

        for (const order of orders) {
          localStatus =
            "Choice matrix " +
            completed +
            "/" +
            total +
            " complete · running " +
            exposure +
            " / " +
            order +
            " / rep " +
            repetition +
            ".";
          render();

          const result = await localClient.choose(structuredClone(state), order);
          choiceMatrixProbes.push({ exposure, order, repetition, result });
          completed += 1;
        }
      }
    }

    localStatus =
      "Choice matrix complete: " +
      completed +
      " constrained one-token generations in one loaded-model session.";
  } catch (error) {
    localStatus =
      "Choice matrix failed after " +
      completed +
      "/" +
      total +
      ": " +
      errorMessage(error);
  } finally {
    localBusy = false;
    render();
  }
}

function challengeMatrixTable(): string {
  const rows = challengeMatrixProbes.map((probe) =>
    "<tr><td>" +
    escapeHtml(probe.challengeId) +
    "</td><td>" +
    escapeHtml(probe.challengeTitle) +
    "</td><td>" +
    probe.order +
    "</td><td>" +
    probe.result.latencyMs.toFixed(1) +
    " ms</td><td>" +
    escapeHtml(probe.result.selectedAction) +
    "</td><td><code>" +
    escapeHtml(JSON.stringify(probe.result.selectedTokenText)) +
    "</code></td><td>" +
    probe.result.inputTokenCount +
    "</td></tr>",
  );

  return (
    '<h3>Semantic challenge matrix</h3>' +
    '<div class="table-wrap"><table><thead><tr>' +
    "<th>Challenge</th><th>Situation</th><th>Order</th><th>Latency</th><th>Selected action</th><th>Token</th><th>Input tokens</th>" +
    "</tr></thead><tbody>" +
    rows.join("") +
    "</tbody></table></div>"
  );
}

async function runChallengeMatrix(): Promise<void> {
  if (!localModelReady || !localClient || localBusy) return;

  challengeMatrixProbes = [];
  const challenges = createSemanticChallenges();
  const orders: readonly ChoiceOrder[] = ["canonical", "reverse"];
  let completed = 0;
  const total = challenges.length * orders.length;
  localBusy = true;

  try {
    for (const challenge of challenges) {
      const state = compilePrivateState(
        challenge.episode.frames[10]!,
        "task",
      );

      for (const order of orders) {
        localStatus =
          "Challenge matrix " +
          completed +
          "/" +
          total +
          " complete · running " +
          challenge.id +
          " / " +
          order +
          ".";
        render();

        const result = await localClient.choose(
          structuredClone(state),
          order,
        );
        challengeMatrixProbes.push({
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          order,
          result,
        });
        completed += 1;
      }
    }

    localStatus =
      "Challenge matrix complete: " +
      completed +
      " constrained one-token generations across " +
      challenges.length +
      " embodied situations.";
  } catch (error) {
    localStatus =
      "Challenge matrix failed after " +
      completed +
      "/" +
      total +
      ": " +
      errorMessage(error);
  } finally {
    localBusy = false;
    render();
  }
}

function permutationSweepTable(): string {
  const rows = permutationSweepProbes.map((probe) =>
    "<tr><td>" +
    escapeHtml(probe.challengeId) +
    "</td><td>" +
    escapeHtml(probe.challengeTitle) +
    "</td><td>" +
    probe.order +
    "</td><td><code>" +
    escapeHtml(probe.optionMap) +
    "</code></td><td>" +
    probe.result.latencyMs.toFixed(1) +
    " ms</td><td>" +
    escapeHtml(probe.result.selectedAction) +
    "</td><td><code>" +
    escapeHtml(JSON.stringify(probe.result.selectedTokenText)) +
    "</code></td></tr>",
  );

  return (
    '<h3>Five-position permutation sweep</h3>' +
    '<div class="table-wrap"><table><thead><tr>' +
    "<th>Challenge</th><th>Situation</th><th>Order</th><th>A–E map</th><th>Latency</th><th>Selected action</th><th>Token</th>" +
    "</tr></thead><tbody>" +
    rows.join("") +
    "</tbody></table></div>"
  );
}

async function runPermutationSweep(): Promise<void> {
  if (!localModelReady || !localClient || localBusy) return;

  permutationSweepProbes = [];
  const wanted = new Set(["silent-pass", "urgent-warning"]);
  const challenges = createSemanticChallenges().filter((challenge) =>
    wanted.has(challenge.id),
  );
  let completed = 0;
  const total = challenges.length * PERMUTATION_SWEEP_ORDERS.length;
  localBusy = true;

  try {
    for (const challenge of challenges) {
      const state = compilePrivateState(
        challenge.episode.frames[10]!,
        "task",
      );

      for (const order of PERMUTATION_SWEEP_ORDERS) {
        localStatus =
          "Permutation sweep " +
          completed +
          "/" +
          total +
          " complete · running " +
          challenge.id +
          " / " +
          order +
          ".";
        render();

        const result = await localClient.choose(
          structuredClone(state),
          order,
        );
        const optionMap = result.optionOrder
          .map(
            (action, index) =>
              String.fromCharCode(65 + index) + "=" + action,
          )
          .join(" · ");

        permutationSweepProbes.push({
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          order,
          optionMap,
          result,
        });
        completed += 1;
      }
    }

    localStatus =
      "Permutation sweep complete: " +
      completed +
      " constrained generations across " +
      challenges.length +
      " situations and all five label positions.";
  } catch (error) {
    localStatus =
      "Permutation sweep failed after " +
      completed +
      "/" +
      total +
      ": " +
      errorMessage(error);
  } finally {
    localBusy = false;
    render();
  }
}

function semanticTokenSweepTable(): string {
  const rows = semanticTokenSweepProbes.map((probe) => {
    const tokenMap = probe.result.semanticTokens
      .map(
        (token) =>
          token.keyword +
          "=" +
          token.action +
          " [" +
          JSON.stringify(token.surface) +
          "]",
      )
      .join(" · ");

    return (
      "<tr><td>" +
      escapeHtml(probe.challengeId) +
      "</td><td>" +
      escapeHtml(probe.challengeTitle) +
      "</td><td>" +
      probe.order +
      "</td><td>" +
      probe.result.latencyMs.toFixed(1) +
      " ms</td><td>" +
      escapeHtml(probe.result.selectedAction) +
      "</td><td>" +
      escapeHtml(probe.result.selectedKeyword) +
      "</td><td><code>" +
      escapeHtml(JSON.stringify(probe.result.selectedTokenText)) +
      "</code></td><td><code>" +
      escapeHtml(tokenMap) +
      "</code></td></tr>"
    );
  });

  return (
    '<h3>Semantic-token permutation sweep</h3>' +
    '<div class="table-wrap"><table><thead><tr>' +
    "<th>Challenge</th><th>Situation</th><th>Order</th><th>Latency</th><th>Selected action</th><th>Keyword</th><th>Token</th><th>Resolved semantic tokens</th>" +
    "</tr></thead><tbody>" +
    rows.join("") +
    "</tbody></table></div>"
  );
}

async function runSemanticTokenSweep(): Promise<void> {
  if (!localModelReady || !localClient || localBusy) return;

  semanticTokenSweepProbes = [];
  const wanted = new Set(["silent-pass", "urgent-warning"]);
  const challenges = createSemanticChallenges().filter((challenge) =>
    wanted.has(challenge.id),
  );
  let completed = 0;
  const total = challenges.length * PERMUTATION_SWEEP_ORDERS.length;
  localBusy = true;

  try {
    for (const challenge of challenges) {
      const state = compilePrivateState(
        challenge.episode.frames[10]!,
        "task",
      );

      for (const order of PERMUTATION_SWEEP_ORDERS) {
        localStatus =
          "Semantic-token sweep " +
          completed +
          "/" +
          total +
          " complete · running " +
          challenge.id +
          " / " +
          order +
          ".";
        render();

        const result = await localClient.chooseSemantic(
          structuredClone(state),
          order,
        );
        semanticTokenSweepProbes.push({
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          order,
          result,
        });
        completed += 1;
      }
    }

    localStatus =
      "Semantic-token sweep complete: " +
      completed +
      " constrained generations without A–E labels.";
  } catch (error) {
    localStatus =
      "Semantic-token sweep failed after " +
      completed +
      "/" +
      total +
      ": " +
      errorMessage(error);
  } finally {
    localBusy = false;
    render();
  }
}

function bipolarMatrixTable(): string {
  const challengeIds = [...new Set(
    bipolarMatrixProbes.map((probe) => probe.challengeId),
  )];
  const rows: string[] = [];

  for (const challengeId of challengeIds) {
    for (const spec of BIPOLAR_APPRAISAL_SPECS) {
      const positiveFirst = bipolarMatrixProbes.find(
        (probe) =>
          probe.challengeId === challengeId &&
          probe.appraisalId === spec.id &&
          probe.order === "positive-first",
      );
      const negativeFirst = bipolarMatrixProbes.find(
        (probe) =>
          probe.challengeId === challengeId &&
          probe.appraisalId === spec.id &&
          probe.order === "negative-first",
      );
      if (!positiveFirst || !negativeFirst) continue;

      const delta = Math.abs(
        positiveFirst.result.probabilityPositive -
          negativeFirst.result.probabilityPositive,
      );
      const mean =
        (positiveFirst.result.probabilityPositive +
          negativeFirst.result.probabilityPositive) /
        2;

      rows.push(
        "<tr><td>" +
          escapeHtml(challengeId) +
          "</td><td>" +
          escapeHtml(spec.id) +
          "</td><td>" +
          escapeHtml(positiveFirst.result.positiveKeyword) +
          " / " +
          escapeHtml(positiveFirst.result.negativeKeyword) +
          "</td><td>" +
          positiveFirst.result.probabilityPositive.toFixed(3) +
          "</td><td>" +
          negativeFirst.result.probabilityPositive.toFixed(3) +
          "</td><td>" +
          delta.toFixed(3) +
          "</td><td>" +
          mean.toFixed(3) +
          "</td><td>" +
          positiveFirst.result.selectedPole +
          " / " +
          negativeFirst.result.selectedPole +
          "</td><td>" +
          positiveFirst.result.latencyMs.toFixed(0) +
          " / " +
          negativeFirst.result.latencyMs.toFixed(0) +
          " ms</td></tr>",
      );
    }
  }

  return (
    '<h3>Bipolar semantic appraisal matrix</h3>' +
    '<p class="muted">Each row uses the same private state and the same two semantic pole tokens. Only presentation order changes. Δ measures order sensitivity.</p>' +
    '<div class="table-wrap"><table><thead><tr>' +
    "<th>Situation</th><th>Dimension</th><th>Semantic poles + / −</th><th>P+ positive-first</th><th>P+ negative-first</th><th>Δ order</th><th>Mean P+</th><th>selected +first / −first</th><th>latency</th>" +
    "</tr></thead><tbody>" +
    rows.join("") +
    "</tbody></table></div>"
  );
}

async function runBipolarMatrix(): Promise<void> {
  if (!localModelReady || !localClient || localBusy) return;

  bipolarMatrixProbes = [];
  const wanted = new Set(["silent-pass", "urgent-warning"]);
  const challenges = createSemanticChallenges().filter((challenge) =>
    wanted.has(challenge.id),
  );
  const orders: readonly BipolarAppraisalOrder[] = [
    "positive-first",
    "negative-first",
  ];
  let completed = 0;
  const total =
    challenges.length * BIPOLAR_APPRAISAL_SPECS.length * orders.length;
  localBusy = true;

  try {
    for (const challenge of challenges) {
      const state = compilePrivateState(
        challenge.episode.frames[10]!,
        "task",
      );

      for (const spec of BIPOLAR_APPRAISAL_SPECS) {
        for (const order of orders) {
          localStatus =
            "Bipolar matrix " +
            completed +
            "/" +
            total +
            " complete · " +
            challenge.id +
            " / " +
            spec.id +
            " / " +
            order +
            ".";
          render();

          const result = await localClient.appraiseBipolar(
            structuredClone(state),
            spec.id,
            order,
          );
          bipolarMatrixProbes.push({
            challengeId: challenge.id,
            challengeTitle: challenge.title,
            appraisalId: spec.id,
            order,
            result,
          });
          completed += 1;
        }
      }
    }

    localStatus =
      "Bipolar matrix complete: " +
      completed +
      " counterbalanced semantic-pole evaluations.";
  } catch (error) {
    localStatus =
      "Bipolar matrix failed after " +
      completed +
      "/" +
      total +
      ": " +
      errorMessage(error);
  } finally {
    localBusy = false;
    render();
  }
}

function appraisalMatrixTable(): string {
  const challengeIds = [...new Set(
    appraisalMatrixProbes.map((probe) => probe.challengeId),
  )];
  const rows: string[] = [];

  for (const challengeId of challengeIds) {
    for (const spec of APPRAISAL_SPECS) {
      const positive = appraisalMatrixProbes.find(
        (probe) =>
          probe.challengeId === challengeId &&
          probe.appraisalId === spec.id &&
          probe.polarity === "positive",
      );
      const negative = appraisalMatrixProbes.find(
        (probe) =>
          probe.challengeId === challengeId &&
          probe.appraisalId === spec.id &&
          probe.polarity === "negative",
      );
      if (!positive || !negative) continue;

      const disagreement = Math.abs(
        positive.result.positiveProbability -
          negative.result.positiveProbability,
      );
      const meanPositive =
        (positive.result.positiveProbability +
          negative.result.positiveProbability) /
        2;

      rows.push(
        "<tr><td>" +
          escapeHtml(challengeId) +
          "</td><td>" +
          escapeHtml(spec.id) +
          "</td><td>" +
          positive.result.positiveProbability.toFixed(3) +
          "</td><td>" +
          negative.result.positiveProbability.toFixed(3) +
          "</td><td>" +
          disagreement.toFixed(3) +
          "</td><td>" +
          meanPositive.toFixed(3) +
          "</td><td>" +
          positive.result.selectedAnswer +
          " / " +
          negative.result.selectedAnswer +
          "</td><td>" +
          positive.result.latencyMs.toFixed(0) +
          " / " +
          negative.result.latencyMs.toFixed(0) +
          " ms</td></tr>",
      );
    }
  }

  const first = appraisalMatrixProbes[0]?.result;
  const tokenSummary = first
    ? first.binaryTokens
        .map(
          (token) =>
            token.answer +
            "=" +
            JSON.stringify(token.surface) +
            "#" +
            token.tokenId,
        )
        .join(" · ")
    : "";

  return (
    '<h3>Independent binary appraisal matrix</h3>' +
    '<p class="muted">Each row compares the same semantic proposition under positive and explicitly negated framing. Both columns are normalized onto P(positive); Δ is framing disagreement. Binary tokenizer surfaces: <code>' +
    escapeHtml(tokenSummary) +
    "</code></p>" +
    '<div class="table-wrap"><table><thead><tr>' +
    "<th>Situation</th><th>Appraisal</th><th>P+ positive frame</th><th>P+ negative frame</th><th>Δ framing</th><th>Mean P+</th><th>answers + / −</th><th>latency + / −</th>" +
    "</tr></thead><tbody>" +
    rows.join("") +
    "</tbody></table></div>"
  );
}

async function runAppraisalMatrix(): Promise<void> {
  if (!localModelReady || !localClient || localBusy) return;

  appraisalMatrixProbes = [];
  const wanted = new Set(["silent-pass", "urgent-warning"]);
  const challenges = createSemanticChallenges().filter((challenge) =>
    wanted.has(challenge.id),
  );
  const polarities: readonly AppraisalPolarity[] = [
    "positive",
    "negative",
  ];
  let completed = 0;
  const total =
    challenges.length * APPRAISAL_SPECS.length * polarities.length;
  localBusy = true;

  try {
    for (const challenge of challenges) {
      const state = compilePrivateState(
        challenge.episode.frames[10]!,
        "task",
      );

      for (const spec of APPRAISAL_SPECS) {
        for (const polarity of polarities) {
          localStatus =
            "Appraisal matrix " +
            completed +
            "/" +
            total +
            " complete · " +
            challenge.id +
            " / " +
            spec.id +
            " / " +
            polarity +
            ".";
          render();

          const result = await localClient.appraise(
            structuredClone(state),
            spec.id,
            polarity,
          );
          appraisalMatrixProbes.push({
            challengeId: challenge.id,
            challengeTitle: challenge.title,
            appraisalId: spec.id,
            polarity,
            result,
          });
          completed += 1;
        }
      }
    }

    localStatus =
      "Appraisal matrix complete: " +
      completed +
      " independent yes/no evaluations.";
  } catch (error) {
    localStatus =
      "Appraisal matrix failed after " +
      completed +
      "/" +
      total +
      ": " +
      errorMessage(error);
  } finally {
    localBusy = false;
    render();
  }
}

function r1LearnedHeadControls(): string {
  if (!webGpuAvailable) {
    return "<button disabled>R1 learned head requires WebGPU</button>";
  }

  const disabled =
    r1LearnedHeadBusy || r1EncoderBusy ? "disabled" : "";

  return (
    '<div class="probe-controls">' +
    '<button class="primary" data-run-r1-learned ' +
    disabled +
    ">Run encoder-only head</button>" +
    '<button class="primary" data-run-r1-hybrid ' +
    disabled +
    ">Run hybrid semantic + structured head</button>" +
    '<button class="primary" data-run-r1-hybrid-expanded ' +
    disabled +
    ">Run hybrid + expanded TRAIN semantics</button>" +
    '<button class="primary" data-run-r1-hybrid-expanded-linear ' +
    disabled +
    ">Run hybrid + expanded TRAIN + linear ranker</button>" +
    "</div>"
  );
}

async function runR1LearnedHead(
  representation: R1RepresentationMode,
  supervision: R1SupervisionMode = "base",
  headMode: R1HeadMode = "prototype",
): Promise<void> {
  if (
    !webGpuAvailable ||
    r1LearnedHeadBusy ||
    r1EncoderBusy
  ) {
    return;
  }

  const baseSuite = createR1CounterfactualSuite();
  const oodSuite = createR1OodRedTeamSuite();
  const trainingAugmentation =
    supervision === "expanded"
      ? createR1SemanticTrainingAugmentation()
      : { states: [], constraints: [] };
  const suite = {
    states: [
      ...baseSuite.states,
      ...trainingAugmentation.states,
      ...oodSuite.states,
    ],
    constraints: [
      ...baseSuite.constraints,
      ...trainingAugmentation.constraints,
      ...oodSuite.constraints,
    ],
  };
  const states = suite.states.map((state) => ({
    id: state.id,
    state: structuredClone(state.state),
  }));
  const constraints = suite.constraints.map((constraint) => ({
    id: constraint.id,
    familyId: constraint.familyId,
    split: constraint.split,
    dimension: constraint.dimension,
    relation: constraint.relation,
    leftStateId: constraint.leftStateId,
    rightStateId: constraint.rightStateId,
  }));

  r1LearnedHeadBusy = true;
  r1LearnedHeadSupervision = supervision;
  r1LearnedHeadMode = headMode;
  r1LearnedHeadStatus =
    "Embedding all R1 states with frozen MiniLM, then learning " +
    representation +
    " heads from " +
    supervision +
    " TRAIN relations only with " +
    headMode +
    " head...";
  r1LearnedHeadResult = null;
  render();

  try {
    r1EncoderClient ??= new R1EncoderBenchmarkClient();
    r1LearnedHeadResult = await r1EncoderClient.learnedHead(
      states,
      constraints,
      representation,
      headMode,
      updateR1LearnedHeadProgress,
    );

    const testRows = r1LearnedHeadResult.constraints.filter(
      (constraint) => constraint.split === "test",
    );
    const oodRows = r1LearnedHeadResult.constraints.filter(
      (constraint) => constraint.split === "ood",
    );
    const testPassed = testRows.filter((constraint) => constraint.passed).length;
    const oodPassed = oodRows.filter((constraint) => constraint.passed).length;
    r1LearnedHeadStatus =
      "R1 " +
      representation +
      "/" +
      supervision +
      "/" +
      headMode +
      " head complete · TEST " +
      testPassed +
      "/" +
      testRows.length +
      " · OOD " +
      oodPassed +
      "/" +
      oodRows.length +
      ".";
  } catch (error) {
    r1LearnedHeadStatus =
      "R1 learned head failed: " + errorMessage(error);
  } finally {
    r1LearnedHeadBusy = false;
    render();
  }
}

function updateR1LearnedHeadProgress(progress: R1EncoderProgress): void {
  const p =
    progress.progress === null
      ? ""
      : " · " + progress.progress.toFixed(1) + "%";
  const file = progress.file ? " · " + progress.file : "";
  r1LearnedHeadStatus = progress.status + p + file;
  render();
}

function r1LearnedHeadReportTable(result: R1LearnedHeadResult): string {
  const splitRows = (["train", "dev", "test", "ood"] as const)
    .map((split) => {
      const rows = result.constraints.filter(
        (constraint) => constraint.split === split,
      );
      const passed = rows.filter((constraint) => constraint.passed).length;
      return (
        "<tr><td>" +
        split +
        "</td><td>" +
        passed +
        " / " +
        rows.length +
        "</td></tr>"
      );
    })
    .join("");

  const dimensionRows = result.dimensions
    .map((dimension) => {
      const split = (name: "train" | "dev" | "test" | "ood") =>
        dimension.splits.find((entry) => entry.split === name)!;
      const train = split("train");
      const dev = split("dev");
      const test = split("test");
      const ood = split("ood");

      return (
        "<tr><td>" +
        escapeHtml(dimension.dimension) +
        "</td><td>" +
        dimension.trainingRelations +
        "</td><td>" +
        train.passed +
        "/" +
        train.total +
        "</td><td>" +
        dev.passed +
        "/" +
        dev.total +
        "</td><td>" +
        test.passed +
        "/" +
        test.total +
        "</td><td>" +
        ood.passed +
        "/" +
        ood.total +
        "</td></tr>"
      );
    })
    .join("");

  const oodRows = result.constraints
    .filter((constraint) => constraint.split === "ood")
    .map(
      (constraint) =>
        "<tr><td>" +
        escapeHtml(constraint.dimension) +
        "</td><td>" +
        escapeHtml(constraint.familyId) +
        "</td><td><code>" +
        escapeHtml(constraint.id) +
        "</code></td><td>" +
        constraint.margin.toExponential(4) +
        "</td><td>" +
        (constraint.passed ? "PASS" : "FAIL") +
        "</td></tr>",
    )
    .join("");

  const heldOutFailures = result.constraints
    .filter(
      (constraint) =>
        constraint.split !== "train" && !constraint.passed,
    )
    .map(
      (constraint) =>
        "<tr><td>" +
        escapeHtml(constraint.split) +
        "</td><td>" +
        escapeHtml(constraint.dimension) +
        "</td><td>" +
        escapeHtml(constraint.familyId) +
        "</td><td><code>" +
        escapeHtml(constraint.id) +
        "</code></td><td>" +
        constraint.margin.toExponential(3) +
        "</td></tr>",
    )
    .join("");

  return [
    '<p class="boundary">The encoder is frozen. Only five linear semantic directions are constructed from <strong>TRAIN directional embedding differences</strong>. DEV/TEST/OOD labels never update the head.</p>',
    '<div class="result-meta">',
    "<span>Representation: <strong>" +
      escapeHtml(result.representation) +
      "</strong></span>",
    "<span>Supervision: <strong>" +
      escapeHtml(r1LearnedHeadSupervision) +
      "</strong></span>",
    "<span>Head: <strong>" +
      escapeHtml(result.headMode) +
      "</strong></span>",
    "<span>Embedding pass: <strong>" +
      result.embeddingMs.toFixed(1) +
      " ms / " +
      result.stateCount +
      " states</strong></span>",
    "<span>Head learn+eval: <strong>" +
      result.headMs.toFixed(3) +
      " ms</strong></span>",
    "<span>Encoder / representation: <strong>" +
      result.encoderDimensions +
      "d / " +
      result.representationDimensions +
      "d</strong></span>",
    "</div>",
    '<div class="table-wrap"><table><thead><tr><th>Split</th><th>Relations passed</th></tr></thead><tbody>',
    splitRows,
    "</tbody></table></div>",
    '<div class="table-wrap"><table><thead><tr><th>Dimension</th><th>TRAIN relations</th><th>TRAIN</th><th>DEV</th><th>TEST</th><th>OOD red-team</th></tr></thead><tbody>',
    dimensionRows,
    "</tbody></table></div>",
    oodRows.length > 0
      ? '<h4>OOD red-team margins</h4><div class="table-wrap"><table><thead><tr><th>Dimension</th><th>Family</th><th>Constraint</th><th>Margin</th><th>Result</th></tr></thead><tbody>' +
          oodRows +
          "</tbody></table></div>"
      : "",
    heldOutFailures.length > 0
      ? '<h4>Held-out failures</h4><div class="table-wrap"><table><thead><tr><th>Split</th><th>Dimension</th><th>Family</th><th>Constraint</th><th>Margin</th></tr></thead><tbody>' +
          heldOutFailures +
          "</tbody></table></div>"
      : '<p class="ready">No held-out relation failures in this seed suite.</p>',
  ].join("");
}

function r1EncoderControls(): string {
  if (!webGpuAvailable) {
    return "<button disabled>R1 encoder requires WebGPU</button>";
  }

  return (
    '<button class="primary" data-run-r1-encoder ' +
    (r1EncoderBusy || r1LearnedHeadBusy ? "disabled" : "") +
    ">Run R1 MiniLM-L3 encoder benchmark</button>"
  );
}

async function runR1EncoderBenchmark(): Promise<void> {
  if (!webGpuAvailable || r1EncoderBusy || r1LearnedHeadBusy) return;

  const suite = createR1CounterfactualSuite();
  const states = suite.states
    .filter((state) => state.split === "test")
    .map((state) => ({
      id: state.id,
      state: structuredClone(state.state),
    }));

  const pairs = [
    {
      id: "addressed-vs-overheard",
      leftStateId: "test:addressed-request",
      rightStateId: "test:overheard-request",
    },
    {
      id: "warning-vs-request",
      leftStateId: "test:urgent-warning",
      rightStateId: "test:warning-control-request",
    },
    {
      id: "fast-close-vs-pass",
      leftStateId: "test:fast-close",
      rightStateId: "test:ordinary-pass",
    },
    {
      id: "hidden-vs-control",
      leftStateId: "test:epistemic-hidden",
      rightStateId: "test:epistemic-control",
    },
  ] as const;

  r1EncoderBusy = true;
  r1EncoderStatus =
    "Loading pinned MiniLM-L3 q8 encoder in a separate WebGPU worker...";
  r1EncoderResult = null;
  render();

  try {
    r1EncoderClient ??= new R1EncoderBenchmarkClient();
    r1EncoderResult = await r1EncoderClient.benchmark(
      states,
      pairs,
      updateR1EncoderProgress,
    );
    r1EncoderStatus =
      "R1 encoder benchmark complete: " +
      r1EncoderResult.sequential.length +
      " sequential embeddings + one batch.";
  } catch (error) {
    r1EncoderStatus = "R1 encoder benchmark failed: " + errorMessage(error);
  } finally {
    r1EncoderBusy = false;
    render();
  }
}

function updateR1EncoderProgress(progress: R1EncoderProgress): void {
  const p =
    progress.progress === null
      ? ""
      : " · " + progress.progress.toFixed(1) + "%";
  const file = progress.file ? " · " + progress.file : "";
  r1EncoderStatus = progress.status + p + file;
  render();
}

function r1EncoderReportTable(result: R1EncoderBenchmarkResult): string {
  const latencies = result.sequential.map((entry) => entry.latencyMs);
  const sorted = [...latencies].sort((a, b) => a - b);
  const mean =
    latencies.reduce((sum, value) => sum + value, 0) / latencies.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
      : sorted[Math.floor(sorted.length / 2)]!;
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  const perBatchState = result.batchMs / result.batchSize;

  const pairRows = result.pairs
    .map(
      (pair) =>
        "<tr><td>" +
        escapeHtml(pair.id) +
        "</td><td>" +
        pair.cosineSimilarity.toFixed(6) +
        "</td><td>" +
        pair.cosineDistance.toFixed(6) +
        "</td></tr>",
    )
    .join("");

  return [
    '<div class="result-meta">',
    "<span>Model: <strong>" + escapeHtml(result.modelId) + "</strong></span>",
    "<span>Revision: <code>" +
      escapeHtml(result.modelRevision.slice(0, 12)) +
      "</code></span>",
    "<span>Runtime: <strong>" +
      result.device +
      " / " +
      result.dtype +
      "</strong></span>",
    "<span>Embedding: <strong>" +
      result.embeddingDimensions +
      "d</strong></span>",
    "</div>",
    '<div class="table-wrap"><table><tbody>',
    "<tr><th>Load/setup</th><td>" + result.loadMs.toFixed(1) + " ms</td></tr>",
    "<tr><th>Warm-up inference</th><td>" +
      result.warmupMs.toFixed(1) +
      " ms</td></tr>",
    "<tr><th>Sequential mean / median</th><td>" +
      mean.toFixed(1) +
      " / " +
      median.toFixed(1) +
      " ms</td></tr>",
    "<tr><th>Sequential min / max</th><td>" +
      min.toFixed(1) +
      " / " +
      max.toFixed(1) +
      " ms</td></tr>",
    "<tr><th>Batch " +
      result.batchSize +
      "</th><td>" +
      result.batchMs.toFixed(1) +
      " ms total · " +
      perBatchState.toFixed(1) +
      " ms/state</td></tr>",
    "</tbody></table></div>",
    '<div class="table-wrap"><table><thead><tr>',
    "<th>Counterfactual pair</th><th>cosine similarity</th><th>cosine distance</th>",
    "</tr></thead><tbody>",
    pairRows,
    "</tbody></table></div>",
  ].join("");
}

function comparisonTable(): string {
  const rows = specimens.map((specimen) => {
    const frame = specimen.trace[10]!;
    return (
      "<tr><td>" +
      specimen.exposure +
      "</td><td>" +
      frame.provider.scores.attentionPlayer.toFixed(2) +
      "</td><td>" +
      frame.provider.scores.socialRelevance.toFixed(2) +
      "</td><td>" +
      frame.provider.scores.interruptCurrent.toFixed(2) +
      "</td><td>" +
      frame.provider.scores.deeperCognition.toFixed(2) +
      "</td></tr>"
    );
  });

  return (
    '<div class="table-wrap"><table><thead><tr>' +
    "<th>Exposure</th><th>Attention</th><th>Social</th><th>Interrupt</th><th>Deep cognition</th>" +
    "</tr></thead><tbody>" +
    rows.join("") +
    "</tbody></table></div>"
  );
}

function signalTable(raw: ReflexScores, stabilized: ReflexScores): string {
  return (
    '<div class="signals">' +
    (Object.keys(raw) as (keyof ReflexScores)[])
      .map(
        (key) =>
          "<div><span>" +
          key +
          "</span><code>" +
          raw[key].toFixed(2) +
          " → " +
          stabilized[key].toFixed(2) +
          "</code></div>",
      )
      .join("") +
    "</div>"
  );
}

function formatPercent(value: number): string {
  if (value === 0) return "0%";
  if (value < 0.0001) return (value * 100).toExponential(2) + "%";
  return (value * 100).toFixed(3) + "%";
}

function signed(value: number): string {
  return (value >= 0 ? "+" : "") + value.toFixed(3);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character]!;
  });
}

render();


void autoRunSmokeIfRequested();

async function autoRunSmokeIfRequested(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("autorun");
  if (
    mode !== "smoke" &&
    mode !== "matrix" &&
    mode !== "choice-matrix" &&
    mode !== "challenge-matrix" &&
    mode !== "permutation-sweep" &&
    mode !== "semantic-token-sweep" &&
    mode !== "appraisal-matrix" &&
    mode !== "bipolar-matrix" &&
    mode !== "r1-encoder-benchmark" &&
    mode !== "r1-learned-head" &&
    mode !== "r1-hybrid-head" &&
    mode !== "r1-hybrid-expanded-head" &&
    mode !== "r1-hybrid-expanded-linear-head"
  ) {
    return;
  }

  if (mode === "r1-encoder-benchmark") {
    await runR1EncoderBenchmark();
    return;
  }

  if (mode === "r1-learned-head") {
    await runR1LearnedHead("encoder-only");
    return;
  }

  if (mode === "r1-hybrid-head") {
    await runR1LearnedHead("hybrid");
    return;
  }

  if (mode === "r1-hybrid-expanded-head") {
    await runR1LearnedHead("hybrid", "expanded");
    return;
  }

  if (mode === "r1-hybrid-expanded-linear-head") {
    await runR1LearnedHead("hybrid", "expanded", "linear-ranking");
    return;
  }

  const requestedOrder = params.get("order");
  localChoiceOrder =
    requestedOrder === "reverse" ? "reverse" : "canonical";

  localStatus =
    mode === "matrix"
      ? "Autorun semantic matrix requested: loading the pinned local model."
      : mode === "choice-matrix"
        ? "Autorun choice-only matrix requested: loading the pinned local model."
        : mode === "challenge-matrix"
          ? "Autorun semantic challenge matrix requested: loading the pinned local model."
          : mode === "permutation-sweep"
            ? "Autorun five-position permutation sweep requested: loading the pinned local model."
            : mode === "semantic-token-sweep"
              ? "Autorun semantic-token sweep requested: loading the pinned local model."
              : mode === "appraisal-matrix"
                ? "Autorun independent appraisal matrix requested: loading the pinned local model."
                : mode === "bipolar-matrix"
                  ? "Autorun bipolar semantic appraisal matrix requested: loading the pinned local model."
                  : "Autorun smoke requested: loading the pinned local model, then probing the default canonical state once with " +
            localChoiceOrder +
            " label order.";
  render();

  await loadLocalModel();
  if (!localModelReady) return;

  if (mode === "matrix") {
    await runSemanticMatrix();
  } else if (mode === "choice-matrix") {
    await runChoiceMatrix();
  } else if (mode === "challenge-matrix") {
    await runChallengeMatrix();
  } else if (mode === "permutation-sweep") {
    await runPermutationSweep();
  } else if (mode === "semantic-token-sweep") {
    await runSemanticTokenSweep();
  } else if (mode === "appraisal-matrix") {
    await runAppraisalMatrix();
  } else if (mode === "bipolar-matrix") {
    await runBipolarMatrix();
  } else {
    await runLocalProbe();
  }
}
