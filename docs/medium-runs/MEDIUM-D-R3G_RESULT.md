# MEDIUM-D/R3G — Runtime-Clean Spatial Pointer Path — RESULT — 2026-10-08

Status: **PASS · REAL BROWSER POINTER PATH CLOSED · NO OWNER QUALIFICATION**

PR: #44

Parent:
- R3F: complete pointer interaction path functionally reached, but runtime cleanliness failed on zero-size projection pageerrors plus one generic resource 404.

## Frozen repair

R3G changed only presentation/runtime robustness:

1. the derived spatial proxy now fails closed when its canvas has non-positive / non-finite layout size;
2. an inert data favicon prevents the generic browser favicon request;
3. no causal mechanism, MARK/FORK rule, HostBindingId mapping, impulse threshold/clamp, Compare behavior or experiment criterion changed.

## Execution history

### Attempt 1
Workflow: `37775068693`

Result: **HARNESS INVALID**

The test read live A/B tick labels in separate Playwright round-trips while the simulation continued. It observed A=311 and B=313 even though the page-level atomic sync indicator reported sync.

Only the browser observation method changed.

### Attempt 2
Workflow: `37775229520`

Result: **HARNESS INVALID**

The new atomic read accidentally contained an over-escaped regex and searched for a literal `\d` instead of digits.

Only that test regex changed.

### Attempt 3
Workflow: `37775391324`

Normal Check: **PASS**

Real Chrome browser probe: **PASS**

## Final measured browser result

```text
outcome: PASS
pre-MARK observed tick: 47
visible shadow age before FORK: 242 ticks
FORK exposure tick: 301
A/B synchronized at exposure: yes
semantic proxy found: yes
real pointer drag: +140 px x / -35 px y
material intervention tick: 350
first material divergence: 350
Compare opened: yes
Return to Habitat: yes
proxy visible after Habitat return: yes
proxy disabled after the one frozen intervention: yes
runtime errors: []
```

The visible shadow age was deliberately required to exceed the rejected R3A 240-tick horizon before FORK.

## What this establishes

The built R3E/R3G page can execute the complete intended interaction path in real Chrome using only the same user-facing interaction surface:

1. WATCH;
2. MARK;
3. World continues;
4. delayed semantic FORK;
5. A/B exact synchronized exposure;
6. derived semantic proxy for the actual loose material body;
7. real mouse down/move/up on that spatial target;
8. one branch-B material impulse through the existing HostBindingId causal seam;
9. first material divergence at the intervention boundary;
10. compact divergence ribbon;
11. Compare A/B;
12. read-only split microscope;
13. Return to Habitat;
14. single B World and spatial proxy restored.

No direct test call into simulation state was used.

No hidden "apply impulse" API or scenario button was introduced.

## Architecture consequence

The R3D architecture candidate is now backed by an end-to-end browser execution:

> **a world-first canvas may expose selected material entities through one-way derived spatial interaction proxies without making the proxy a second World authority.**

The causal path remains:

`physics -> snapshot/projection -> spatial proxy -> Owner pointer gesture -> HostBindingId intervention seam`

The proxy never becomes actor-private identity or World truth.

## R3F repair confirmed

The two R3F runtime defects are absent in the final R3G browser run:

- zero-size projection pageerrors: **gone**
- generic resource 404: **gone**
- final runtimeErrors array: **empty**

## Limits

PASS does NOT establish:
- Owner experiential value;
- final accessibility design;
- keyboard intervention;
- touch/mobile quality;
- arbitrary shapes;
- many material entities;
- Field v0 integration;
- actor-private interaction;
- organism life/value;
- production rendering architecture.

The donor remains deterministic E01.

No homepage promotion.

## Strategic consequence

MEDIUM-D has now defended a surprisingly complete **small causal interaction grammar slice** without building a dashboard:

- world-first WATCH;
- human-scale MARK via hidden exact shadow;
- delayed FORK;
- direct material intervention;
- automatic release at pointer-up;
- branch-local provenance;
- first-divergence surfacing;
- microscope-on-demand Compare;
- Return to Habitat.

This is enough to stop deepening this exact interaction slice by inertia.

The next project move should be campaign-level re-evaluation against:
- organism/world substrate needs;
- Field v0 known integrity failures;
- Owner-value gap;
- whether a richer medium experiment can now expose a genuinely stronger organism rather than decorating E01 further.
