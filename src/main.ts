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
  IMMEDIATE_RESPONSE_OPTIONS,
  LOCAL_QWEN_MODEL_ID,
  type LocalChoiceProbeResult,
} from "./local-choice-probe";
import {
  LocalModelClient,
  type LocalModelProgress,
} from "./local-model-client";
import { compilePrivateState } from "./private-state";
import { RuleBaselineProvider } from "./rule-provider";
import { runShadowEpisode } from "./shadow-runner";

interface Specimen {
  exposure: SpeechExposure;
  episode: Episode;
  trace: readonly ShadowTraceFrame[];
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

function selectedSpecimen(): Specimen {
  return specimens.find(
    (candidate) => candidate.exposure === selectedExposure,
  )!;
}

function selectedFrame(): ShadowTraceFrame {
  return selectedSpecimen().trace[selectedTick]!;
}

function selectionKey(): string {
  return selectedExposure + ":" + selectedTick;
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

  app.innerHTML = [
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
}

function localControls(): string {
  if (!webGpuAvailable) {
    return "<button disabled>WebGPU unavailable</button>";
  }

  if (!localModelReady) {
    return (
      '<button class="primary" data-load-model ' +
      (localBusy ? "disabled" : "") +
      ">Load local Qwen 0.6B (~570 MB)</button>"
    );
  }

  return (
    '<div class="probe-controls">' +
    '<span class="ready">Model ready · ' +
    escapeHtml(LOCAL_QWEN_MODEL_ID) +
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
    "Preparing local model worker. The pinned model revision is downloaded on demand and cached by the browser.";
  render();

  try {
    localClient ??= new LocalModelClient();
    await localClient.load(updateLoadProgress);
    localModelReady = true;
    localStatus = "Local Qwen is ready. It has no World or reflex authority.";
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
  localStatus = "Running one-step semantic choice probe locally...";
  render();

  try {
    const result = await localClient.probe(stateAtStart);
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
