# Campaign A — continuing authored occupant checkpoint

2026-10-08. Base: 87d94c84288982dd6c150494b24504097ec4474f.
Previous checkpoints: 819cd669d33a5bce57a480def69d2e528e8b805d (world),
daf818635c5aace756aa52673488a22a23f92908 (initial private continuation).

## Implemented
- E0 disk world with finite summed forces/torque and independent physical mover;
- directional gaze and RGB-only 96-sample nonuniform angular retina across 160 degrees;
- fixed 120 Hz physics, 30 Hz private sensory frames, four-step touch accumulation;
- private controller receives cached retina, touch and ideal body-local proprioception;
- authored turquoise-patch concern, bounded direction memory and directional contact escape;
- exploration uses sensed travelled legs and sensed rotations, with checkpointed private
  deterministic angle variation; no host map or position is supplied;
- bounded angular-appearance inspection followed by ten seconds of visual-concern suppression;
- shared nonuniform retinal calibration, angular fragment selection and explicit FOV clipping;
- manual takeover with private perception continuing; release preserves private state;
- checkpoint restores physical state, sensory phase/accumulator, mover and private continuation;
- separate host world and private retina views, pause, save/restore and object dragging.

## Verified
Full `npm run check`: 33 files, 78 tests PASS; typecheck/build PASS.
Regression tests cover sensory timing, transient contacts, partial-interval restore,
private history affecting identical later images, override/release and 600-step
whole-loop exact continuation after a checkpoint at tick 123.
Ten-minute whole-loop regression requires movement in every 60-second window.

The first authored controller permanently stopped: 600 seconds, approach 72000 ticks,
path 0.7015104235. Cause: a large visible patch suppressed drive indefinitely without
an end to the concern. A failing close-patch continuation test reproduced this.
After adding bounded inspection and suppression: path 327.1490805618;
approach 16964, explore 51536, yield 3500 ticks. Every minute adds movement.
The earlier inspection-fix measurement is retained as `whole-loop-600s-inspection-fix.json`.
The pre-retinal-fix controller's ten-minute path was 274.1153179347; current angular
interpretation gives 287.1342975055, with movement every minute. See the separately
saved whole-loop-600s-after-retinal-fix.json; older runs remain historical controls.
Exact raw measurements: `evidence/living-organism/whole-loop-600s*.json`.

Removing all turquoise objects after sixty seconds exposed a second failure: the old
constant-turn exploration travelled 154.535 units in four minutes but visited only ten
1-unit grid cells, with no new cells after thirty seconds. These are host-only metrics.
A whole-loop regression fails on daf8186 (zero new cells after minute one) and passes
on the current code. Current exploration uses body-local speed integrated over time;
turn completion uses sensed angular motion, not a timer. Authored private angle variation
is deterministic and restored with its state.

| Four minutes after intervention | Old visited cells | Travelled-leg exploration | Plus directional escape |
| --- | ---: | ---: | ---: |
| Control | 24 | 52 | 42 |
| Turquoise removed | 10 | 72 | 78 |
| Five seconds manual rotation | 37 | 55 | 43 |

Directional escape fixes rear contacts causing reverse drive and chooses a turn away
from the strongest contacted sector. The two changes were measured sequentially;
directional escape does not improve coverage uniformly. All results use one initial
scene and fixed private seed. New place counts do not establish meaningful activities.
Raw data: `perturbations-before.json`, `perturbations-after.json`, `perturbations-final.json`.
Reproduction harness: `probes/living-organism-perturbations.ts`.
Six physical touch fixtures pass (four angles, fixed wall, rotated body), plus an
actual rear collision driving the controller forward. Thirty seconds of the independent
mover verify repeated reversals from actual displacement, not a controller flag.
Runtime checkpoint schema is now version 2 for the additional private state.
An opposite sensed rotation could accumulate more than one revolution of turn debt.
A failing regression reproduced this; remaining rotation is now wrapped to the shortest
signed angle, preserving a crossing-of-goal check. Recovery and restore tests pass.
Re-running the three perturbations and ten-minute characterization after this fix
produced identical saved metrics; the adverse sampled-rotation fixture exercises the fix.
Independent review was dispatched as required by requesting-code-review, but the
reviewer hit a usage limit before a final verdict. Its one potential turn-debt finding
was reproduced and fixed. No completed independent review is claimed.
Reproduction harness: `probes/living-organism-characterization.ts`, run from repo root
with Node and a tsx loader (not bundled browser UI).

## Open / not qualified
This is authored control, not learned interests, identity, goals, an NN or an LLM.
Continuing movement is a regression gate, not evidence of meaningful activity.
Patch width is an appearance cue, not true distance; suppression affects all matching
patches, with no object identity. Integrated heading drifts; direction memory lacks
positional correction. No route planning, task completion or Owner-test gate yet.
Touch orientation passed current creation-order fixtures; other collider orderings are not qualified.
Independent mover patrol reversals are tested; persistent obstruction recovery is not qualified.
UI takeover/pause state is outside the organism checkpoint.
Browser QA remains blocked: cloud browser localhost connection refused; local
Playwright has no binary and its official headless-shell download was invalid/truncated.
No rendered screenshot or interaction success claimed. Build retains inherited large
Rapier chunk warning. This checkpoint does not complete Campaign A.

## Rulings and next work
Keep E0 disk as comparison control until sensor/body boundary checks are complete.
Direct collider rays avoid uninitialized broad-phase queries without extra physics steps.
Existing Field/C01, public frontdoor and Pages deployment remain unchanged.
Nearest plan is revised by PLAN_REVIEW.md after actual gaze and direction-memory ablations.
The nonuniform sample-count error is fixed; memory usefulness is still not established.
Next test a material, memory-relevant relation activity with information acquired through motion.
Do not extend the current roaming/color-chase controller merely to increase movement.
Resolve a reachable rendered test surface before promoting the UI.
Do not repeat completed sensory-clock or checkpoint implementation after handoff.

## Retinal correction checkpoint
The same object six units ahead now requests drive .65 at 0, 30 and 60 degree gaze,
instead of 0, .65, .65. New tests cover far/close decisions at central/peripheral gaze,
FOV clipping, separate occluded fragments and ranking by angular rather than pixel extent.
The older close-inspection synthetic fixture was widened to express angular closeness,
rather than accidentally enshrine the faulty pixel-count threshold.
The inspection threshold remains explicitly authored at 20 degrees. Angular cell bounds
are quantized; extent is visible appearance, never true size, distance or identity.
FOV-clipped patches do not complete a close inspection. Occluded fragments remain separate.

Post-fix three-seed direction ablation gives visited cells 38/63, 57/37, 45/34
(full/reset). This is mixed evidence, not a memory competence score.
Measurements include exact production source hashes in plan-challenge-after-retinal-fix.json.

A preparation probe places radius-.3/distance-3 and radius-.6/distance-6 objects in
separate scenes: initial retinas are identical. Equal lateral body movement gives distinct
retinas with identical realized body motion. relation-observability.json records this.
Active motion can disambiguate these fixtures; range inference and a material relation
activity are not implemented. No host coordinates or object sizes were added to policy input.
Browser QA and completed independent review remain open.

## Broader campaign started
CAMPAIGN_PRIVATE_MODEL.md preserves the broader organism goal and makes object/landmark
maintenance an optional episode, not the project's mandatory objective. PrivateVision
now derives tentative stationary-fragment estimates from private visual/proprioceptive
history, with no host coordinates, sizes, distances or IDs in its input. It is integrated
in runtime checkpoint version 3, including takeover and exact tested continuation.
It does not yet influence motor demand. This is analytic inference, not NN training.
Real-world fixtures fit static near/far ranges closely but a moving alias gives a
wrong range near twice the actual value with an even smaller residual. Assumption and
tentative status must remain explicit; low fit error is not calibrated confidence.
Raw characterization is retained. Active information-seeking, multi-hypothesis reasoning,
learned challenger and a material activity remain unimplemented.
# Etap predykcji wcześniejszej hipotezy — 2026-10-08

PrivateVision ocenia poprzedni estimate na kolejnym obrazie, warunkując przewidywany
bearing aktualną prywatną odometrią i gaze. Wynik zapisuje przed refitem. Compatible
oznacza zgodność kierunku pojedynczej plamy z tolerancją .08 rad; nie pewność dystansu,
tożsamości ani nieruchomości. Missing/ambiguous/clipped daje unavailable; brak poprzedniego
estimate daje null. Diagnostyka przechowuje tylko ostatnie porównanie, nie długą pamięć błędów.
Checkpoint runtime v4 zawiera ten stan; motor pozostaje sterowany przez occupant.

Kontrpróba czterech scen ze zmianą osi translacji nie odrzuciła aliasów: 23 zgodne
porównania w każdej scenie, 0 sprzecznych; scale-alias ma range hosta 4.200 przy hipotezie
8.125. Także zamrożony fit z tick 60 pozostaje w tolerancji. To ograniczenie epistemiczne
tego pomiaru, nie sukces percepcji ruchu. Retiny far/scale nie są bitowo identyczne;
interwencja hosta po step wprowadza przesunięcie fazy cached sensor. Zapis:
evidence/living-organism/private-prediction.json; reprodukcja:
probes/living-organism-prediction.ts. Pełny check: 33 pliki / 83 testy, typy i build PASS.

Szczegółowy plan, krytyka oraz protokół następnego etapu:
docs/superpowers/plans/2026-10-08-private-prediction.md. Następny krok bada decyzję
jakościową z historii i kontaktu, nie czeka na nieomylną głębokość. QA renderu i
niezależna kwalifikacja całej kampanii nadal otwarte.
# Epizod zbliżenia i ponawiania — 2026-10-08

Dodano samodzielny ApproachEpisode, poza default runtime: reactive/permanent/reconsider.
72 headless przebiegi (8 rodzin × 3 starty × 3 polityki) wykazały użyteczną redukcję
bezskutecznych komend, lecz także fałszywe porzucenie osiągalnych dalekich rzeczy,
opóźnione wznowienie i zatrzymanie na obcym kontakcie. Nie promować tych regulatorów
do domyślnego brainu. Reconsider odzyskuje czynność w osobnej próbie15s, ale nie osiąga
sukcesu w podstawowej próbie10s po chwilowym oddalaniu celu. Nie mylić tych horyzontów.

Szczegóły, tabela, specyfikacja reguł i kierunek challengera:
docs/living-organism/APPROACH_EPISODE.md. Dane:
evidence/living-organism/approach-episode.json. Pełny check: 34 pliki / 89 testów,
typy i build PASS. Niezależny przegląd wykonany, render QA nadal otwarte.
Istniejący runtime/occupant i checkpoint v4 pozostają bieżącym organizmem; nowy
epizod to narzędzie badań, nie ogłoszona autonomiczna motywacja ani uczony brain.
# Atrybucja rzeczywistych kontaktów — 2026-10-08

World checkpoint v3 / runtime v5 zachowują hostową paczkę kontaktów z dodatnim solver
impulse, zgodną z tickiem prywatnego touch, także w częściowym oknie i po restore.
inspectContactSample() jest wyłącznie instrumentacją hosta; PrivateFrame bez zmian.
72 ponowione epizody zachowały końcowe stany, koszt, drogę i zapisane snapshoty;
klasyfikacje proxy i prawdziwych par są zgodne w tym zestawie. Osobny test wykazuje
błędną atrybucję proxy bliskości w scenie z celem obok i faktycznym dotykiem przeszkody.

Plan, wyniki oraz protokół challengera: docs/living-organism/CONTACT_EVIDENCE_PLAN.md.
Dane: evidence/living-organism/approach-contact-attribution.json. Check: 35 plików /
92 testy, typy/build PASS; niezależny review bez blokujących usterek. Następna praca
ma wrócić do prywatnego sprawdzania następstw i predykcji uczonej; instrumentacja
nie staje się zastępczym celem. Render QA i promocja nowych sterowników nadal niegotowe.
# Pierwszy wyuczony sensoryczny challenger — 2026-10-08

SensoryRegressor uczy współczynniki ridge i scaler tylko z train; sensoryFeatures
operują na dwóch prywatnych próbkach, proprio i bieżącej własnej komendzie. Cel:
delta bearing/log extent po24 tickach, z maskami pojedynczego nieuciętego fragmentu.
Nie jest NN, learned vision ani motor policy. Brak host XY/IDs/range w features/labels.

51 fizycznych przebiegów:24 train,21 test,6 stress dodanych po pierwszym pomiarze.
Test bearing MAE:ridge .01130rad vs hold .03813, body/gaze .01285 i no-history .01157.
Stress:ridge .03769 vs body/gaze .02687 i geometry/fallback .01806. Historia nie ma
tu udowodnionej ogólnej przewagi. Nagłe własne komendy ujawniają słabą generalizację.
Model pozostaje offline; istniejący runtimev5 i occupant nie zmienione.

Spec, tabela, ablacją i kierunek dalszej kampanii:docs/living-organism/LEARNED_PREDICTION.md.
Manifest splitu, per-episode metrics i wagi:evidence/living-organism/learned-prediction.json;
pełny model:evidence/living-organism/sensory-regressor-weights.json.
Check:37 plików /99 testów, typy/build PASS. Niezależny review bez blokującego błędu,
ze wskazanym ograniczeniem zależnych okien. RenderQA i wpływ na czynność niekwalifikowane.
# Held-action i kontrola rzeczywistych decyzji — 2026-10-09

Bogatszy train48 epizodów nie poprawił bearing względem frozen starego modelu na nowych
21test+6stress. Pary fizycznych fork oddzieliły przewidywanie pod nieznanymi komendami
od utrzymania własnej komendy. Held model .00721rad vs body/gaze .01306;1044 exact
scheduled fork matches i source physics/frame invariant. Train-only fit, prywatne labels.

Ranking261 stanów z9 nowych epizodów: full learned nie poprawia wyboru ponad motor-only
lub no-history. Następne36 przebiegów closed-loop12s: full koszt .08435 vs motor-only
.08004, przegrywa7/12 scen. Korzyść kalibracji ciała realna w tym authored zadaniu,
wartość historii dla decyzji niewykazana. Touch-positive windows większe niż body/gaze;
centrowanie nie kwalifikuje materialnego sukcesu ani bezpieczeństwa.

Raport/plan: ACTION_CONDITIONED_RESULTS.md i ACTION_CONDITIONED_PLAN.md.
Runtimev5 i occupant bez zmian.99 testów/typy/build PASS, niezależny review wykonany.
Następny klocek: prywatne touch-interruption i dalsze sprawdzanie następstw zamiast
terminalnego contact. RenderQA oraz doświadczenie Przemka nadal niekwalifikowane.
