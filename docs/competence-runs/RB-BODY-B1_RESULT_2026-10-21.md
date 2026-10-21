# RB-BODY/B1 — source-run physics, 60s resident, real Chrome · RESULT (2026-10-21)

**ENGINEERING PASS · NARROW PHYSICAL BODY AFFORDANCE POSITIVE · OWNER/ORGANISM SUCCESS NOT DEMONSTRATED.**

Frozen [pre-execution morphology contract](RB-BODY-B1_ARMED_2026-10-21.md), [draft PR #79](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/79). Parent true physics is D1 research `7caa9e89acad7ad67ac49a2b838ea92d6cb4f0d1`. B0 unchanged by default. B1 adds a separately selectable mass1 frictionless length2.60 × width1.30 capsule, along local X, with E0 motor force law and same damping coefficients. **Rotational inertia is not identical**, so this study does not isolate shape alone when steering changes. World checkpoints now record optional morphology and reject restore into an incompatible one.

## 1. Native 10s physical action viability: valid

Actual **9 Rapier worlds**, 1200 steps each, fixed 120Hz and legal 30Hz 96RGB/touch/proprio sensors, with a manufactured 1.70-wide corridor from x3 to7 and a movable cyan disk behind. The researcher predeclared command; no organism planner or hidden route oracle.

| Body / protocol | Crossed corridor? | Cyan body displacement (10s) |
|---|---|---:|
| B0 + aligned own constant motor | No | 0 |
| B1 aligned + same motor | Yes; tick284 | **24.6933** |
| B1 transverse + fixed world-X **external force** | No | 0 |
| B0 + open corridor same motor | Yes; tick280 | **24.4468** |
| B1 + open corridor same motor | Yes; tick284 | **24.6933** |
| B0/B1 + no motor | No | 0 |
| B0 + fixed external X | No | 0 |
| B1 aligned + fixed external X | Yes; tick274 | **25.9667** |

All material states are native physics, not teleport/manual `success()` flags. The fixed X force conditions distinguish shape orientation independently of forward motor orientation, but are not actor-owned actions. B1 is a REAL orientation-sensitive contact geometry. The fabricated narrow passage intentionally matches width differences; **do not infer general superiority, useful affordance learning or autonomous orientation choice from this alone**.

## 2. 60s real resident pressure in the same ecology

Paired `LivingWorld(false,'B0'|'B1')`, real corridor, cyan object, second movable material object, and independent physical rail; six arms B0/B1 × motor-off / constant cheap drive / **UNCHANGED authored cyan-preferring `Occupant`**. 7200 physics steps and 1800 legal private frames each. Actual real physical material afterstate is compared to no-actor controls.

| Condition | 60s actor path | 2m cells | Cyan object final displacement | Movable-contact sampled windows |
|---|---:|---:|---:|---:|
| B0, no motor | 0 | 1 | 0 | 0 |
| B0, constant forward | **2.473** | 2 | 0 | 0 |
| B0, old Occupant | **48.394** | **4** | **0** | **0** |
| B1, no motor | 0 | 1 | 0 | 0 |
| B1, constant forward | **190.493** | 96 | **183.343** | 1738 |
| B1, old Occupant | **29.529** | **14** | **0.976** | **14** |

Owner-relevant read: B0 color-preferring resident saw cyan in **1800/1800** private samples yet did not reach or move its physical object, instead spending 1156/1800 decision frames in `yield` near blocking geometry (and 644 in approach). Visibility is not body-conditioned reachability. B1 old Occupant saw cyan in 1174/1800 frames and first physically moved the target at tick694, first passed the far side of the corridor at tick1200. It did not learn the opportunity: it was the same authored controller, and body morphology made its simple action physically possible.

**Unflattering cheap control:** B1 constant forward moved the cyan object ~183 units in unbounded World, massively more than the old Occupant. This distance is NOT useful-life evidence; it highlights the artificiality of using raw displacement, travel, contact windows or target color as a goal. B0 old Occupant traveled *more* than B1 while accomplishing less material effect. Bigger traveled distance would be misleading.

An independent rail mover was present, but no host data here supports a special learned relationship with the rail. Contact windows are not independent impacts.

## 3. Real interactive browser field (still ONLY on research branch)

Built a standalone responsive dual-world HTML entry `probes/b1-material-field.html` and TS `src/living-organism/b1-material-field.ts` **on the same optional B0/B1 physics**: two uninterrupted real Rapier Worlds, side-by-side actual actor observations (96RGB), unchanged authored Occupant, optional paired manual motor authority, mouse/touch drag of *real movable materials* in one world, pause, reset, and two-world **checkpoint + restore** including policy history, material state and physics. Research microscope clearly separated from actor-private view.

Real headless system Chrome test `tests/browser/b1-material-field.e2e.mjs` through *branch-restricted* extra CI job [run #39524381566](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39524381566), **PASS**: initial physics observed; the same manual command displaced BOTH bodies; B1-only pointer material drag moved a physical object **1.92094** world units while untouched B0 object did not move; restoring saved snapshot returned B1 disk to x9/y0 at the **same tick147**, then a repeat drag and autonomous resumption succeeded. Browser errors **0** and horizontal-overflow checks passed at 900, 390 and 320px. **This is real browser execution, not a screenshot mockup.** Chrome screenshots (dual panel, manual, one-world intervention, restoration, resumed state, mobile widths) uploaded under artifact `reflexbrain-b1-material-browser` in the run. Vite build produced `dist/probes/b1-material-field.html`.

Final visual/UX verification followed the first browser pass: the 320px screenshot showed the world too small and excessive introductory copy. Only the **observer camera** was changed to 18×12 world-units on narrow mobile (desktop remains 30×20); the underlying physics, body, retina and motor laws stayed unchanged. Shortened intro and clarified disabled Restore button. A fresh actual mobile Chrome context with touch emulation was tested using real Chrome DevTools touchStart/touchMove/touchEnd: **B1-only physical turquoise object moved 1.38924 world units under actual touch while paused**, and the other world was not modified. Latest [full browser + native check #39525260393](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39525260393) PASS, 43 test files / 129 native tests PASS, TypeScript and Vite build PASS. Latest artifact `reflexbrain-b1-material-browser` contains both desktop and mobile screenshots plus the touch-interaction evidence. Initial browser QA failed due non-atomic sequential DOM clock reading; fixed it by reading both clocks in one evaluation. The next browser QA failed solely on a missing default favicon resource; explicit data-URI favicon prevents the spurious 404. Full later screenshot/restore/control verification PASSED. No physics or scenario parameters were tuned to produce a preferred outcome.

**Availability:** prototype source and built CI screenshots are in PR/Actions but this research-only branch has **not** been deployed to the public ReflexBrain Pages. Do not supply an invented playable public URL. The current public site still contains the previous experiments. No user/Owner quality acceptance for B1 has yet been obtained.

## 4. Scientific disposition and next pressure

Keep the specific **physical affordance finding**: body morphology can change what subsequent material outcomes are reachable under the same available actions and privately visible colors. This makes body/geometry part of a potentially useful substrate for a future brain.

Do not promote generic B1 superiority, navigation, learned affordance, "I understand the passage" or autonomous organism capability. Zero trained network was used in this entire branch. The old `Occupant` remains a color-fixated authored policy, and Owner's old S0 product FAIL is not superseded by this result.

**Next study should NOT retune the narrow corridor or count cyan pushes.** Need a live, material ecology where a continuing actor can discover and reuse consequences with at least one simple natural alternative, using body-legal sensor/motor history and evaluating future activity rather than scripted goal successes. The branch currently offers the first comparative interactive surface for Owner observation, but it needs a deliberate safe staging delivery before claiming usability outside CI. Keep draft/isolated; do not merge to main or deploy by inertia.
