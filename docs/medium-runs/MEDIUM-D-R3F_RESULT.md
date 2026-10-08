# MEDIUM-D/R3F — Real Browser Pointer-Path Validation — RESULT — 2026-10-08

Status: **FAIL · POINTER PATH WORKS · RUNTIME CLEANLINESS FAILED · CLOSED**

Evidence:
- isolated PR #43
- workflow run `37774609189`
- normal `check` job: PASS
- real Chrome `browser-r3f` job: FAIL

## What was tested

A real headless Chrome loaded the built R3E page through Vite preview.

The test was forbidden from:
- calling simulation objects;
- injecting a direct impulse;
- using a hidden intervention API;
- using scenario buttons.

It interacted only through the exposed page:
- MARK;
- delayed FORK;
- semantic loose-body spatial proxy;
- real mouse down/move/up;
- Compare;
- Return to Habitat.

## Surviving positive evidence

The browser test reached its final runtime-error gate.

Therefore every earlier frozen assertion passed:

1. page began in WATCH;
2. simulation tick advanced;
3. MARK succeeded;
4. visible shadow age exceeded 240 ticks;
5. contextual FORK succeeded;
6. A/B ticks were exactly synchronized at exposure;
7. semantic proxy was found by accessible label;
8. proxy was visible and enabled before intervention;
9. proxy had a usable rendered bounding box;
10. real Chrome mouse down/move/up executed through the proxy;
11. page reached `RELEASE / IMPULSE`;
12. causal divergence ribbon became visible;
13. material divergence did not precede intervention;
14. Compare A/B opened;
15. single Habitat view hid in Compare;
16. action changed to Return to Habitat;
17. spatial proxy was hidden in read-only Compare;
18. Return to Habitat restored the single B view;
19. spatial proxy became visible again after return.

Thus the specific interaction gap left unresolved by R3E/TinyFish is materially resolved:

> the derived semantic spatial proxy accepts a real browser pointer drag through the same user-facing event path and drives the intended B-only causal intervention / comparison flow.

## Why R3F is still FAIL

The final frozen criterion required zero runtime/page errors.

Chrome captured:

- one generic resource 404;
- two `pageerror` exceptions:
  - `Error: projection requires positive finite viewport dimensions`.

The projection exceptions occurred after the interaction path had already progressed far enough that all frozen functional assertions above passed.

The page therefore has a real presentation/runtime robustness defect.

The most likely mechanism is a transient layout state in which the derived proxy asks for a projection while the relevant canvas has zero CSS width/height (for example during view visibility/layout transitions).

Do not classify this as harness-only until fixed and re-run.

## Important distinction

R3F did **not** falsify:
- real pointer drag on the proxy;
- B-only material intervention path;
- divergence ribbon;
- Compare;
- Return to Habitat.

It falsified the stronger claim:

> the complete R3E browser interaction path is runtime-clean under the frozen real-browser protocol.

## R3G repair boundary

R3G may change only presentation/runtime robustness:

1. derived proxy update must fail closed when the canvas has no positive finite layout size;
2. no projection should be constructed from zero-size layout;
3. add an explicit inert favicon/data favicon if the generic 404 is the browser favicon request;
4. preserve the exact R3F pointer-path protocol and causal mechanisms;
5. no simulation, HostBindingId, impulse, MARK/FORK, compare or threshold change.

Then repeat the same real Chrome flow.

## Maximum surviving claim

> R3E's spatial proxy can carry the intended real pointer gesture end-to-end through material divergence and Compare/Return, but the page is not yet qualified as runtime-clean.

No Owner usability PASS.
No homepage promotion.
