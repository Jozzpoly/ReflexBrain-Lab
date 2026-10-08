# MEDIUM-D/R3F — Real Browser Pointer-Path Validation — ARMED — 2026-10-08

Status: **ARMED · BROWSER ACTUATION PROBE · NO PRODUCT FEATURE**

Parents:
- R3E engineering mechanics PASS;
- R3E live browser partial:
  - delayed MARK/FORK PASS;
  - semantic material proxy found;
  - TinyFish produced only a sub-threshold click/gesture;
  - full material-drag → divergence → Compare → Habitat remained unresolved;
- R3D one-way spatial interaction projection architecture.

## Primary question

Can a real browser execute the actual R3E pointer path end to end:

> MARK → delayed FORK → pointer drag on derived material proxy → B-only material divergence → Compare A/B → Return to Habitat

without any hidden intervention API or scenario-specific control?

## Browser environment

Use Chromium/Chrome in CI against a real Vite preview of the built R3E page.

The browser test must:
- interact with DOM/buttons exactly as a user-facing page exposes them;
- perform actual pointer/mouse down/move/up on the spatial proxy;
- not call simulation objects/functions from test code;
- not inject JavaScript that applies an impulse;
- not mutate page state except through visible/semantic UI interaction.

## Frozen protocol

1. load R3E page;
2. require WATCH state and running tick;
3. click MARK;
4. wait until visible shadow age > 240 ticks;
5. click contextual FORK;
6. require A/B synchronized at exposure;
7. require semantic loose-body proxy is visible and enabled;
8. compute proxy bounding box from rendered DOM only;
9. pointerdown near proxy center;
10. drag at least 120 CSS px horizontally over several move steps;
11. pointerup;
12. require:
    - RELEASE / IMPULSE status;
    - causal ribbon visible;
    - impulse tick present;
    - material divergence tick present;
13. click Compare A/B;
14. require split A/B view and Return to Habitat action;
15. click Return to Habitat;
16. require:
    - single B Habitat visible again;
    - split compare hidden;
    - spatial proxy visible again (it may be disabled because R3E freezes one intervention per session);
17. require no page/console/runtime errors.

## PASS

All frozen steps succeed in real browser execution.

## FAIL

- proxy cannot receive real pointer drag;
- page only works through hidden JS/test hook;
- drag produces no causal intervention;
- Compare cannot open after divergence;
- Return to Habitat does not restore single-world state;
- runtime error occurs.

## Maximum claim

PASS would establish only:

> the R3E derived spatial proxy supports the complete intended interaction path in a real browser using the same pointer-event seam exposed to a human user.

Does not establish:
- Owner experiential value;
- accessibility completeness;
- keyboard/touch quality;
- many-object scaling;
- Field integration;
- organism semantics.

No homepage promotion.
