import "./style.css";
import {
  createR0CounterfactualEpisode,
  type Episode,
  type SpeechExposure,
} from "./episode";
import { RuleBaselineProvider } from "./rule-provider";
import { runShadowEpisode } from "./shadow-runner";
import type { ReflexScores, ShadowTraceFrame } from "./contracts";

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

let selectedExposure: SpeechExposure = "addressed";
let selectedTick = 10;

function render(): void {
  const specimen = specimens.find(
    (candidate) => candidate.exposure === selectedExposure,
  )!;
  const frame = specimen.trace[selectedTick]!;
  const speech = frame.privateState.percepts.find(
    (percept) => percept.kind === "speech",
  );

  app!.innerHTML = [
    '<main class="shell">',
    "<h1>ReflexBrain Lab · R0</h1>",
    "<p>Same deterministic world trajectory, different semantic exposure. Provider remains zero-authority.</p>",
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
    "<p>Tick <strong>" + frame.tick + "</strong> · authoritative baseline action: <strong>" +
      frame.baselineAction +
      "</strong></p>",
    "<p>Reflex focus: <strong>" + frame.stabilized.focus + "</strong></p>",
    "<p>Task progress: " + frame.world.taskProgress.toFixed(2) + "</p>",
    speech && speech.kind === "speech"
      ? "<p>Private speech percept: “" + escapeHtml(speech.text) +
        "” · addressed=<strong>" + String(speech.addressed) + "</strong></p>"
      : "<p>No speech percept this tick.</p>",
    "</section>",
    '<section class="panel"><h2>Raw → stabilized signals</h2>',
    signalTable(frame.provider.scores, frame.stabilized.scores),
    "</section>",
    '<section class="panel"><h2>Cross-variant snapshot at tick 10</h2>',
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
