import "./style.css";
import { createLowStakesAddressEpisode } from "./episode";
import { RuleBaselineProvider } from "./rule-provider";
import { runShadowEpisode } from "./shadow-runner";
import type { ReflexScores } from "./contracts";

const episode = createLowStakesAddressEpisode();
const trace = await runShadowEpisode(
  episode.frames,
  new RuleBaselineProvider(),
);

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("missing #app");

let selectedTick = 0;

function render(): void {
  const frame = trace[selectedTick]!;
  const speech = frame.privateState.percepts.find(
    (percept) => percept.kind === "speech",
  );

  app!.innerHTML = [
    '<main class="shell">',
    "<h1>ReflexBrain Lab · R0</h1>",
    "<p>" + episode.title + "</p>",
    '<section class="panel">',
    "<h2>Tick " + frame.tick + " · zero-authority shadow</h2>",
    "<p>Authoritative baseline action: <strong>" +
      frame.baselineAction +
      "</strong></p>",
    "<p>Reflex focus: <strong>" + frame.stabilized.focus + "</strong></p>",
    "<p>Task progress: " + frame.world.taskProgress.toFixed(2) + "</p>",
    speech && speech.kind === "speech"
      ? "<p>Private speech percept: “" + speech.text + "”</p>"
      : "<p>No speech percept this tick.</p>",
    "</section>",
    '<section class="panel"><h2>Raw → stabilized signals</h2>',
    signalTable(frame.provider.scores, frame.stabilized.scores),
    "</section>",
    '<section class="panel"><h2>Timeline</h2><div class="timeline">',
    trace
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

render();
