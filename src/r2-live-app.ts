import "./r2-style.css";
import "./r2-live-style.css";
import {
  InteractiveLivingSpecimenSession,
  type InteractiveFixtureMode,
  type InteractiveIntervention,
} from "./r2/interactive-living-specimen";
import { buildLivingSpecimenMicroscope } from "./r2/living-specimen-microscope";
import type { LivingSpecimenStep } from "./r2/living-specimen";

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("missing #app");
const app: HTMLDivElement = appElement;

let fixtureMode: InteractiveFixtureMode = "private_hazard_oracle";
let session = new InteractiveLivingSpecimenSession(fixtureMode);
let selectedIndex = session.snapshot().steps.length - 1;
let speechDraft = "Mira, can you come here for a moment?";

function snapshot() {
  return session.snapshot();
}

function selectedStep(): LivingSpecimenStep {
  const state = snapshot();
  return state.steps[Math.min(selectedIndex, state.steps.length - 1)]!;
}

function render(): void {
  const state = snapshot();
  const step = selectedStep();
  const latestIndex = state.steps.length - 1;
  const live = selectedIndex === latestIndex;
  const privateFrame = step.frame.privateByActor[state.actorId]!;
  const activity = privateFrame.activity;
  const exposure = step.frame.world.events.some(
    (event) => event.kind === "physical.hazard_exposure",
  );
  const microscope = buildLivingSpecimenMicroscope({
    id: "r2-interactive-owner-session",
    title: "Interactive Owner intervention session",
    actorId: state.actorId,
    steps: state.steps,
  })
    .filter((row) => row.tick <= step.frame.world.tick)
    .slice(-28);

  app.innerHTML = [
    '<main class="r2-shell live-shell">',
    '<header class="hero">',
    '<div>',
    '<p class="eyebrow">ReflexBrain R2 · live intervention lab</p>',
    '<h1>Provoke the causal organism yourself</h1>',
    '<p class="lede">Every action below advances one real research tick. World truth, Mira\'s private reception and the fixture decision remain separate. Speech is recorded but not semantically interpreted yet.</p>',
    '</div>',
    '<div class="status-card">',
    '<span class="status-dot"></span>',
    '<div><strong>' +
      (fixtureMode === "private_hazard_oracle"
        ? "Private-evidence hazard oracle"
        : "Null / continue control") +
      '</strong><small>Fixture-specific · no learned model · no generic Brain API</small></div>',
    '</div>',
    '</header>',

    '<section class="world-panel">',
    '<div class="world-head">',
    '<div><span class="label">Viewing tick</span><strong>' +
      step.frame.world.tick +
      (live ? ' · LIVE' : ' · HISTORY') +
      '</strong></div>',
    '<div><span class="label">Ongoing activity</span><strong>' +
      escapeHtml(activity ? activity.kind + " / " + activity.phase : "completed") +
      '</strong></div>',
    '<div><span class="label">Fixture decision</span><strong class="decision decision-' +
      step.decision.behavior +
      '">' + escapeHtml(step.decision.behavior) + '</strong></div>',
    '</div>',

    '<div class="world-stage live-world">',
    '<div class="lane-line"></div>',
    '<div class="start-marker">start</div>',
    '<div class="shelf-marker" style="left:' +
      xPercent(step.physical.destinationX) + '%">shelf</div>',
    step.physical.hazardActive
      ? '<div class="beam live-hazard" style="left:' +
        xPercent(5.2) +
        '%"><span>WORLD hazard</span></div>'
      : '',
    '<div class="actor" style="left:' +
      xPercent(step.physical.actorX) +
      '%"><span>Mira</span></div>',
    step.physical.carrying
      ? '<div class="crate carried" style="left:' +
        xPercent(step.physical.crateX) +
        '%">crate</div>'
      : '<div class="crate" style="left:' +
        xPercent(step.physical.crateX) +
        '%">crate</div>',
    exposure
      ? '<div class="exposure-badge">WORLD OUTCOME · HAZARD EXPOSURE</div>'
      : '',
    '</div>',

    '<div class="truth-strip">',
    '<div><span class="label">World truth</span><strong>hazard ' +
      (step.physical.hazardActive ? "ACTIVE" : "clear") +
      '</strong></div>',
    '<div><span class="label">Private observations this tick</span><strong>' +
      privateFrame.observations.length +
      '</strong></div>',
    '<div><span class="label">Private causal history</span><strong>' +
      privateFrame.history.length +
      ' entries</strong></div>',
    '</div>',
    '<div class="reason-strip"><span>Fixture reason:</span><strong>' +
      escapeHtml(step.decision.reason) +
      '</strong></div>',
    '</section>',

    '<section class="live-controls-panel">',
    '<div class="control-group">',
    '<span class="label">Research fixture · resets session</span>',
    '<div class="control-row">',
    '<button class="' +
      (fixtureMode === "private_hazard_oracle" ? "selected" : "") +
      '" data-fixture="private_hazard_oracle">Private-evidence oracle</button>',
    '<button class="' +
      (fixtureMode === "null_continue" ? "selected" : "") +
      '" data-fixture="null_continue">Null / continue</button>',
    '</div></div>',

    '<div class="control-group speech-control">',
    '<label class="label" for="owner-speech">Inject heard speech · semantics deliberately absent</label>',
    '<div class="control-row">',
    '<input id="owner-speech" value="' + escapeAttribute(speechDraft) + '" />',
    '<button class="primary" data-action="speech">Speak + tick</button>',
    '</div></div>',

    '<div class="control-group">',
    '<span class="label">Physical intervention</span>',
    '<div class="control-row">',
    '<button data-action="hazard-visible">Hazard · Mira sees it</button>',
    '<button data-action="hazard-hidden">Hazard · hidden from Mira</button>',
    '<button data-action="resolve-visible">Resolve · Mira sees it</button>',
    '<button data-action="resolve-hidden">Resolve · hidden from Mira</button>',
    '</div></div>',

    '<div class="control-group">',
    '<span class="label">Time / session</span>',
    '<div class="control-row">',
    '<button class="primary" data-action="quiet">Quiet tick</button>',
    '<button data-action="quiet-3">3 quiet ticks</button>',
    '<button data-action="reset">Reset</button>',
    !live ? '<button data-action="live">Back to live</button>' : '',
    '</div></div>',
    '</section>',

    '<section class="timeline-panel">',
    '<div class="section-head"><div><p class="eyebrow">Session history</p><h2>Your interventions become causal history</h2></div>',
    '<p>Select any prior tick to inspect it. This only changes the view; the live session keeps its real latest state.</p></div>',
    '<div class="timeline live-timeline">',
    state.steps.map((candidate, index) =>
      '<button class="tick ' +
      (index === selectedIndex ? "active " : "") +
      'behavior-' + candidate.decision.behavior +
      '" data-step-index="' + index + '">' +
      '<span>t' + candidate.frame.world.tick + '</span>' +
      '<small>' + shortBehavior(candidate.decision.behavior) + '</small>' +
      '</button>'
    ).join(""),
    '</div>',
    '</section>',

    '<section class="private-panel">',
    '<div class="section-head"><div><p class="eyebrow">Actor-private view</p><h2>What Mira actually received on this tick</h2></div>',
    '<p>A hidden hazard still exists in World truth, but it must not appear here unless a causal perception path exists.</p></div>',
    '<div class="private-grid">',
    privateFrame.observations.length === 0
      ? '<p class="muted">No new private observation on this tick.</p>'
      : privateFrame.observations.map((entry) =>
          '<article class="evidence-card"><span>' +
          escapeHtml(entry.channel) +
          '</span><strong>' +
          escapeHtml(entry.kind) +
          '</strong><small>' +
          escapeHtml(JSON.stringify(entry.payload)) +
          '</small></article>'
        ).join(""),
    '</div>',
    '</section>',

    '<section class="microscope-panel">',
    '<div class="section-head"><div><p class="eyebrow">Causal microscope</p><h2>World ≠ private evidence ≠ fixture decision</h2></div>',
    '<p>Bookkeeping only. No hidden chain-of-thought and no invented significance score.</p></div>',
    '<div class="microscope">',
    microscope.map((row) =>
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
    '<h2>Current research boundary</h2>',
    '<p>The only non-null competence here is a hand-authored distinction between perceived hazard onset/resolution. You can already test causal privacy, persistence, stale belief, interruption/resumption and World consequences. You cannot yet test language understanding; arbitrary speech is intentionally evidence-only.</p>',
    '</section>',
    '</main>',
  ].join("");

  bindControls();
}

function bindControls(): void {
  const speechInput = app.querySelector<HTMLInputElement>("#owner-speech");
  if (speechInput) {
    speechInput.oninput = () => {
      speechDraft = speechInput.value;
    };
    speechInput.onkeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        runIntervention({ kind: "speech", text: speechInput.value });
      }
    };
  }

  app.querySelectorAll<HTMLButtonElement>("[data-fixture]").forEach((button) => {
    button.onclick = () => {
      fixtureMode = button.dataset.fixture as InteractiveFixtureMode;
      session = new InteractiveLivingSpecimenSession(fixtureMode);
      selectedIndex = 0;
      render();
    };
  });

  bindAction("speech", () => {
    const text = speechDraft.trim();
    if (text.length === 0) return;
    runIntervention({ kind: "speech", text });
  });
  bindAction("hazard-visible", () =>
    runIntervention({ kind: "hazard_onset", perceived: true }),
  );
  bindAction("hazard-hidden", () =>
    runIntervention({ kind: "hazard_onset", perceived: false }),
  );
  bindAction("resolve-visible", () =>
    runIntervention({ kind: "hazard_resolved", perceived: true }),
  );
  bindAction("resolve-hidden", () =>
    runIntervention({ kind: "hazard_resolved", perceived: false }),
  );
  bindAction("quiet", () => runIntervention({ kind: "quiet" }));
  bindAction("quiet-3", () => {
    for (let i = 0; i < 3; i += 1) {
      session.advance({ kind: "quiet" });
    }
    selectedIndex = snapshot().steps.length - 1;
    render();
  });
  bindAction("reset", () => {
    session = new InteractiveLivingSpecimenSession(fixtureMode);
    selectedIndex = 0;
    render();
  });
  bindAction("live", () => {
    selectedIndex = snapshot().steps.length - 1;
    render();
  });

  app.querySelectorAll<HTMLButtonElement>("[data-step-index]").forEach((button) => {
    button.onclick = () => {
      selectedIndex = Number(button.dataset.stepIndex ?? 0);
      render();
    };
  });
}

function bindAction(name: string, action: () => void): void {
  const button = app.querySelector<HTMLButtonElement>(
    '[data-action="' + name + '"]',
  );
  if (button) button.onclick = action;
}

function runIntervention(intervention: InteractiveIntervention): void {
  session.advance(intervention);
  selectedIndex = snapshot().steps.length - 1;
  render();
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

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

render();
