import "./r2-style.css";
import {
  createDeterministicLivingSpecimen,
  type LivingSpecimenFixtureMode,
  type LivingSpecimenStep,
} from "./r2/living-specimen";
import { buildLivingSpecimenMicroscope } from "./r2/living-specimen-microscope";

let fixtureMode: LivingSpecimenFixtureMode = "private_hazard_oracle";
let run = createDeterministicLivingSpecimen(fixtureMode);
let microscope = buildLivingSpecimenMicroscope(run);
const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("missing #app");
const app: HTMLDivElement = appElement;

let selectedIndex = 0;
let playing = false;
let timer: number | null = null;

function selectedStep(): LivingSpecimenStep {
  return run.steps[selectedIndex]!;
}

function render(): void {
  const step = selectedStep();
  const tick = step.frame.world.tick;
  const privateFrame = step.frame.privateByActor[run.actorId]!;
  const activity = privateFrame.activity;
  const speech = privateFrame.observations.find(
    (entry) => entry.kind === "speech.utterance",
  );
  const visibleRows = microscope
    .filter((row) => row.tick <= tick)
    .slice(-20);

  app.innerHTML = [
    '<main class="r2-shell">',
    '<header class="hero">',
    '<div>',
    '<p class="eyebrow">ReflexBrain R2 · research specimen</p>',
    '<h1>Causal organism, before a learned brain</h1>',
    '<p class="lede">The same causal world is replayed through two explicit research controls: a private-evidence hazard oracle and a null/continue fixture. This is A/B infrastructure, not intelligence evidence.</p>',
    '</div>',
    '<div class="status-card">',
    '<span class="status-dot"></span>',
    '<div><strong>' + (fixtureMode === "private_hazard_oracle" ? "Private hazard oracle" : "Null continue control") + '</strong><small>No learned model · no ReflexScores · no direct World mutation</small></div>',
    '</div>',
    '</header>',

    '<section class="world-panel">',
    '<div class="world-head">',
    '<div><span class="label">Tick</span><strong>' + tick + '</strong></div>',
    '<div><span class="label">Activity</span><strong>' +
      escapeHtml(activity ? activity.kind + " / " + activity.phase : "completed") +
      '</strong></div>',
    '<div><span class="label">Fixture decision</span><strong class="decision decision-' +
      step.decision.behavior +
      '">' + escapeHtml(step.decision.behavior) + '</strong></div>',
    '</div>',
    '<div class="world-stage">',
    '<div class="lane-line"></div>',
    '<div class="start-marker">pickup</div>',
    '<div class="shelf-marker" style="left:' +
      xPercent(step.physical.destinationX) + '%">shelf</div>',
    step.physical.hazardActive
      ? '<div class="beam" style="left:' + xPercent(5.2) + '%"><span>hazard zone</span></div>'
      : '',
    step.frame.world.events.some((event) => event.kind === "physical.hazard_exposure")
      ? '<div class="exposure-badge">WORLD OUTCOME · HAZARD EXPOSURE</div>'
      : '',
    '<div class="actor" style="left:' + xPercent(step.physical.actorX) + '%"><span>Mira</span></div>',
    step.physical.carrying
      ? '<div class="crate carried" style="left:' + xPercent(step.physical.crateX) + '%">crate</div>'
      : '<div class="crate" style="left:' + xPercent(step.physical.crateX) + '%">crate</div>',
    speech
      ? '<div class="speech-bubble">“' + escapeHtml(String(speech.payload.text ?? "")) + '”</div>'
      : '',
    '</div>',
    '<div class="reason-strip"><span>Why this fixture moved/held:</span><strong>' +
      escapeHtml(step.decision.reason) + '</strong></div>',
    '</section>',

    '<section class="ab-panel">',
    '<span class="label">A/B research fixture</span>',
    '<button class="' + (fixtureMode === "private_hazard_oracle" ? "selected" : "") + '" data-fixture="private_hazard_oracle">Private-evidence oracle</button>',
    '<button class="' + (fixtureMode === "null_continue" ? "selected" : "") + '" data-fixture="null_continue">Null / continue</button>',
    '</section>',

    '<section class="controls-panel">',
    '<button data-action="reset">Reset</button>',
    '<button data-action="previous">← Previous</button>',
    '<button class="primary" data-action="play">' + (playing ? "Pause" : "Play") + '</button>',
    '<button data-action="next">Next →</button>',
    '</section>',

    '<section class="timeline-panel">',
    '<div class="section-head"><div><p class="eyebrow">Episode</p><h2>Continuity over time</h2></div>',
    '<p>The exogenous schedule is identical. The oracle fixture holds on private hazard evidence; the null control keeps moving and can create a different World consequence.</p></div>',
    '<div class="timeline">',
    run.steps.map((candidate, index) =>
      '<button class="tick ' +
      (index === selectedIndex ? "active " : "") +
      'behavior-' + candidate.decision.behavior +
      '" data-tick-index="' + index + '">' +
      '<span>t' + candidate.frame.world.tick + '</span>' +
      '<small>' + shortBehavior(candidate.decision.behavior) + '</small>' +
      '</button>'
    ).join(""),
    '</div>',
    '</section>',

    '<section class="microscope-panel">',
    '<div class="section-head"><div><p class="eyebrow">Causal microscope</p><h2>World ≠ private evidence ≠ oracle decision</h2></div>',
    '<p>Rows are bookkeeping, not chain-of-thought. The fixture oracle lane is deliberately separate from actor-private evidence.</p></div>',
    '<div class="microscope">',
    visibleRows.length === 0
      ? '<p class="muted">No causal rows yet.</p>'
      : visibleRows.map((row) =>
          '<div class="micro-row lane-' + row.lane + '">' +
          '<span class="micro-tick">t' + row.tick + '</span>' +
          '<span class="micro-lane">' + escapeHtml(row.lane) + '</span>' +
          '<span class="micro-kind">' + escapeHtml(row.kind) + '</span>' +
          '<span class="micro-detail">' + escapeHtml(row.detail) + '</span>' +
          '</div>'
        ).join(""),
    '</div>',
    '</section>',

    '<section class="boundary-panel">',
    '<h2>What this does <em>not</em> prove</h2>',
    '<p>The hazard oracle understands only one hand-authored distinction. The null control deliberately ignores all incoming evidence. Their difference proves that the harness can attribute a World consequence to a private-evidence decision path; it does not prove semantic intelligence.</p>',
    '</section>',
    '</main>',
  ].join("");

  bindControls();
}

function bindControls(): void {
  app.querySelectorAll<HTMLButtonElement>("[data-fixture]").forEach((button) => {
    button.onclick = () => {
      pause();
      fixtureMode = button.dataset.fixture as LivingSpecimenFixtureMode;
      run = createDeterministicLivingSpecimen(fixtureMode);
      microscope = buildLivingSpecimenMicroscope(run);
      selectedIndex = 0;
      render();
    };
  });

  app.querySelector<HTMLButtonElement>('[data-action="reset"]')!.onclick = () => {
    pause();
    selectedIndex = 0;
    render();
  };
  app.querySelector<HTMLButtonElement>('[data-action="previous"]')!.onclick = () => {
    pause();
    selectedIndex = Math.max(0, selectedIndex - 1);
    render();
  };
  app.querySelector<HTMLButtonElement>('[data-action="next"]')!.onclick = () => {
    pause();
    selectedIndex = Math.min(run.steps.length - 1, selectedIndex + 1);
    render();
  };
  app.querySelector<HTMLButtonElement>('[data-action="play"]')!.onclick = () => {
    playing ? pause() : play();
    render();
  };
  app.querySelectorAll<HTMLButtonElement>("[data-tick-index]").forEach((button) => {
    button.onclick = () => {
      pause();
      selectedIndex = Number(button.dataset.tickIndex ?? 0);
      render();
    };
  });
}

function play(): void {
  if (selectedIndex >= run.steps.length - 1) selectedIndex = 0;
  playing = true;
  timer = window.setInterval(() => {
    if (selectedIndex >= run.steps.length - 1) {
      pause();
      render();
      return;
    }
    selectedIndex += 1;
    render();
  }, 700);
}

function pause(): void {
  playing = false;
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}

function xPercent(x: number): number {
  return 7 + Math.max(0, Math.min(10, x)) * 8.6;
}

function shortBehavior(value: LivingSpecimenStep["decision"]["behavior"]): string {
  switch (value) {
    case "carry":
      return "carry";
    case "protective_hold":
      return "hold";
    case "resume_carry":
      return "resume";
    case "completed":
      return "done";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
