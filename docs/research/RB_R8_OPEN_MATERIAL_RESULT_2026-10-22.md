# R8 — otwarty materialny warsztat: wynik i ograniczenia, 22.10.2026

## Krytyczna kampania po odzyskaniu kierunku — 22/23.10 (nowe wyniki)

**Qualified source `561e148`**: [full CI: 54 pliki / 160 testów PASS](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39871681899), [real Chromium PASS](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39871681900). Na tym etapie PR pozostaje izolowanym draftem; **żaden z tych wyników nie jest Owner-experience / artificial-life PASS**.

### Causal intervention versus actor-private experience — confirmed historical violation and correction
- Wcześniej po przejęciu napędu przez Ownera kod UI przestawał wywoływać `Occupant.decide`, a `Occupant.lastTick` pozostawał stary. Po 3600 realnych krokach ręcznego obrotu, powrót do autonomii rekonstruował cały brakujący czas z **jednej końcowej prędkości kątowej**, co przy realnym obrocie -0.265 rad dawało syntetyczną zmianę heading -2.489 rad: **błąd 2.224 rad (~127°)**, 901 brakujących prywatnych próbek.
- Teraz `Occupant.witnessExternalMotor(privateFrame)` stale przetwarza *wyłącznie legalną, już pobraną próbkę 30Hz* podczas oddania napędu człowiekowi. Włącza zegar oraz orientację, ale resetuje niezrealizowane własne polecenia i hipotezy celu, NIE dopisuje Owner-motion do authored exploration ani nie pobiera World identity. To nie uczący się agent, lecz poprawna granica atrybucji.
- Ten sam frozen 30-second motor sequence: **901 próbek uwzględnionych, luka 0, błąd heading 0.0364 rad (~2.1°), zachowany PRNG seed i brak samozaliczonego ruchu**. Kontrpróba starego zachowania i korekta są w `tests/living-organism/r8-manual-authority-history.test.ts`. Real Chrome dodatkowo kontroluje świeżość ostatniego sampled frame przy ręcznym przejęciu i zwrocie ciała.
- Granica poznawcza: to wąska pasywna propriocepcja i utrzymanie chronologii, nie dowód samodzielnej pamięci przyczynowej, internal-model learning ani autobiografii.

### Portable R8 save: actual physics must agree with claimed metadata
- Poprzednio poprawny składniowo JSON mógł wskazywać nieistniejące collidery, kłamać o kształcie, body type albo pomijać aktywną bryłę. Jedynie `Rapier.World.restoreSnapshot` nie weryfikował prawdziwości osobnej listy części. W razie podmiany starego świata błędny plik mógł uszkodzić działającą sesję.
- R8 teraz **stages and verifies**, jeszcze przed zastąpieniem aktywnego świata: prawdziwy aktor B0, każdy collider materiałowy i jego rzeczywista geometria, body type, brak duplikatów i nieopisanych colliders. Test real Chrome odrzuca pięć wariantów forged metadata przy nienaruszonym prawdziwym świecie i przyjmuje poprawny roundtrip.
- Krytyczna korekta własnej walidacji: w użytej deterministycznej wersji Rapiera legalny `collider.handle` może być np. `5e-324`, a nie JS safe integer. Nie wolno utożsamiać opaque handle z liczbą całkowitą; dowodem prawdziwości ID jest rozstrzygnięcie go w realnym świecie i zgodność bryły. **Ujawniony red test na poprawnym pliku został naprawiony**, nie zamaskowany.
- Kontrola gwarantuje jedynie zgodność strukturalną z realnymi colliderami w danym snapshot. Nie jest kryptograficznym poświadczeniem autorstwa ani dowodem prawdziwości wszystkich historycznych sensor samples.
- Nie ma publicznego Owner-playable URL, tylko izolowany branch + statyczny artefakt. **Nie wdrażać automatycznie w `main`, Pages ani Jaskinię.**

---


## Nocny audyt przed Owner testem — 22/23.10.2026 (prymat nauki nad pokazem)

**NOWA KANONICZNA GRANICA:** R8 jest coraz bardziej niezawodnym narzędziem fizyki, ale jeszcze nie środowiskiem podtrzymującym wielorakie sposoby życia. Nie wolno mylić PASS przeglądarki, ciekawych kontaktów ani ruchu mieszkańca z żywym organizmem.

### Przeciwtest dwóch źródeł dynamiki
W nowym rzeczywistym `tests/living-organism/r8-occupant-long-horizon-diagnostic.test.ts` wykonano:
- **120 s nienaruszonego autorskiego Occupanta na autentycznych 7 początkowych częściach R8:** 14 400 aktualizacji Rapiera i 3 600 prywatnych próbek 30 Hz. Materiał o rzeczywistym kolorze sensorycznym był obecny w **2 576 / 3 600 próbek (71.6%)**; **22 / 3 600** próbek zawierało impuls kontaktu. Materia rzeczywiście zmieniła pozycję. Ten licznik dotyczy próbek z impulsem, NIE dokładnej liczby sekund kontaktu.
- Po 100 s aktor był około **13 jednostek** od początku, po 110 s około **15.6**, po 120 s około **12.6**, przy prawidłowym upływie czasu fizycznego. Nie był monotonicznie oddalający się: wcześniej wracał w rejon materiału. Raportowanie 97/120 s wewnątrz arbitralnego promienia 12 jednostek to wyłącznie metryka diagnostyczna, nie definicja ekologicznej więzi.
- **60 s świata bez działania aktora i ingerencji Ownera:** 7 200 kroków, 7 części, **maksymalne przemieszczenie wszystkich części 0**. To poprawna mechanika bez grawitacji/procesów, ale obala każdą sugestię, że R8 już posiada samoczynnie aktywną ekologię.
- Kontrolowany **dwuczęściowy łańcuch fizycznego kontaktu** udowodnił mediację siły bez dotyku aktora do dalszej części w kroku 61 i wąski negatywny kontrast po zakotwiczeniu części pośredniej; dodatkowy negatywny kontrast przy wysunięciu dalej położonego bloku poza geometrię kontaktu rzeczywiście pozostawił go bez ruchu. Ani jeden z tych testów nie dowodzi wyuczonego znaczenia.

**Decydująca rozbieżność:** mieszkaniec wielokrotnie otrzymuje legalny obraz materiałów, ale jego odziedziczony sterownik `visibleTurquoisePatches` poszukuje turkusowych cech, których złotobrązowe części R8 nie posiadają. Nie „naprawiać” tego ślepym zakodowaniem nowego pogoniowego zachowania. Brakuje realnego procesu, dzięki któremu konsekwencja mogłaby nabrać trwałego znaczenia dla samego aktora.

### Dostępność warsztatu bez fałszowania świata
- Camera-only `Pokaż materię` centruje aktualną geometrię rzeczywistych części i nie teleportuje mieszkańca, nie zmienia fizycznego zegara ani próbek prywatnego wzroku; real-Chrome test utrwala ten kontrakt.
- **Fresh World is a new episode, not a disguised continuation.** The New World action now explicitly resets the authored/manual controller authority, camera follow, current tool, active touch gesture, edit undo history and old intervention log, while preserving the Owner's deliberate paused/unpaused choice. Real-Chrome [source #39867359341](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39867359341) proves this after importing a previous world and deliberately changing its controls; this test initially exposed an obsolete test assumption that the previous placement tool survives reset, which was corrected. The actual product behavior is now explicit.
- **A saved checkpoint is a causal *state*, not the whole elapsed causal narrative.** Portable JSON stores real Rapier snapshot, material identities and sampled private frame and authored controller state, NOT the sequence of all past interactions, human interventions or alternative futures. Temporary undo stores up to 20 edit-level physical checkpoints. The on-screen intervention ledger is not exported and never becomes resident-private memory. Do not promise 'the organism remembers its whole life' from a replayable physics checkpoint.
- `Śledź ciało` pokazuje prawidłowy początkowy stan; przyciski części pojawiają się tylko przy prawdziwie wybranym obiekcie, pozostawiając pierwszy widok czystszy.
- Na mobile widoczny podczas działania na scenie podgląd siatkówki jest kopią **tej samej** ostatniej legalnej próbki 30 Hz; test przeglądarkowy porównuje piksele z panelem zmysłu, bez dodatkowego pobierania percepcji.
- Oddzielny `rb-r8-static-preview` jest artefaktem skompilowanego builda, NIE publicznym live-test URL. Strony GitHub Pages, Jaskinia i main nie były zmieniane.

**Evidence na źródłowym HEAD `c084728` (test + minimalne UI aż do e42a0a6):** [Check #39866167372](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39866167372): **53 pliki / 158 testów PASS, TypeScript, Vite PASS**. [Chromium #39866167361](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39866167361): **PASS**. Te rezultaty kwalifikują wykonanie, nie doświadczenie Ownera.

**Następny rozsądny próg:** bezpieczny niezależny adres uruchomienia, swobodny Owner test bez narzuconego zadania, a potem decyzja, czy materiałowy substrat wspiera więcej niż ruchy prostokątów. Jeśli nie, przyjąć Owner FAIL i badać jedną rzeczywiście generatywną zależność materia–konsekwencja–historia. Nie rozbudowywać dziś sterownika dla atrakcyjności demonstracji.

---


> **LATE R8 PREFLIGHT REVISION — 22.10, source 688120a, not an Owner PASS.** The detailed first implementation evidence below is an *earlier historical baseline* at b277db8. In particular, its claim that R8 has **only in-memory saves** is NOW OBSOLETE. This revision records actual later code and QA without rewriting the original evidence.

### Later material-composition challenge — actually executed, bounded
At source `c03c440`, an independently authored physics test [`r8-mediated-contacts.test.ts`](../../tests/living-organism/r8-mediated-contacts.test.ts) compares exactly the same forward actor motor against two near-body modes, with a far dynamic block behind it. A **movable** near block physically transmits displacement to the far block at solver **tick 61**, while there is still **1.0948 world-unit clearance** between actor and the far collider, ruling out direct actor contact as that first cause. Repeating with the near block **anchored** leaves the far block unchanged throughout 720 physical ticks. [Check #39860745412](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39860745412): **52 test files / 155 tests PASS**; [real Chrome #39860745501](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39860745501): **PASS**.

Interpretation is narrow: R8 supports *physical causal mediation via two separate movable objects* and actual counterfactual contrast, not merely a mouse-translated or actor-directly-hit second piece. The same results also underline the severe limitation: a frozen authored `drive:1` simply pushes the whole line for as long as it runs. No new learned affordance, self-organized control, ecology, metabolic loop, or novel animal behavior has been demonstrated. Do not turn this exact geometry into an authored demo puzzle or broaden these numbers into a universal robustness claim.

## Current independently reviewed R8 (after Owner-readiness campaign)
- **Actual code:** added Owner-facing first-contact scene and blank reset, world/actor undo that pauses real solver time, camera zoom/recenter/two-finger touch, correct mouse/touch input and contextual selection/physical rotation, portable JSON export/import with validation and a real fresh-browser-page roundtrip. Fixed fixed→dynamic damping equivalence and genuine rotated Rapier collider/hit testing. This is not an organism nor novel automatic controller.
- **Current automated evidence:** [Check run #39858664765](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39858664765) = **51 test files / 154 tests PASS**, TypeScript/Vite build PASS; [Real Chrome run #39858664905](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39858664905) = PASS at source 688120a. Screenshots and observed browser layout evidence are archived in `rb-r8-workbench-chromium`, including first desktop/mobile viewport and actually on-screen 320px / 390px controls.
- **Adversarial correction:** an older 320px *full-page* screenshot after automatic scroll to controls **omitted the in-world pad in the image**. Direct computed layout showed the pad remained visible and correctly sized. Capturing a scrolled-to-field **viewport** screenshot now shows the pad; new tests assert its actual on-screen location. Treat source-executed *first-viewport* captures, not offscreen full-page captures, as Owner UX evidence.
- **Important controller limit directly supported by code:** the authored Occupant controller's `visibleTurquoisePatches` uses a turquoise threshold; R8 material is sensed with a brown/gold RGB triplet. R8 parts physically affect touch and private rays, but the existing authored visual pursuit cannot be interpreted as general recognition of those parts. Do NOT silently recolor parts or rewrite the controller to manufacture impressive-looking life.
- **Qualitative status:** desktop/mobile screenshots show a clean and functional material board but still extremely elementary ecology — one B0-style actor, a few rectangles, no joints/gravity/material metabolism, and no learned actor history. Browser automation does not establish enjoyable Owner play, and no independent physical handheld device usability test is claimed.
- **Delivery boundary:** branch-only draft PR #89; **NO PUBLIC PLAYABLE OWNER URL, no Jaskinia integration, no merge/deploy**. This remains a real blocker to inviting Owner. Do not call it Owner-ready merely because both CIs passed.

## Original initial R8 baseline — preserved, historically accurate only at the source IDs below
**Engineering PASS, NOT an artificial-life or Owner-experience qualification.**
[Pre-registered research contract](RB_R8_OPEN_MATERIAL_ARMED_2026-10-22.md), isolated [PR #89](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/89) stacked directly on qualified LIFE/L1 PR #84. No merge, no public deploy, L2 #86, R6 #87 and R7 #88 untouched. R7 doorway physical science FAIL is preserved.

## What was ACTUALLY implemented
- A standalone real Vite entry `probes/material-workbench-r8.html` and responsive canvas `src/living-organism/material-workbench-view.ts`. No artificial objective/task, no closed map or authored colored target. World camera is free-pan or actor-follow.
- Existing `LivingWorld(false)` on real 120 Hz Rapier remains the authority. Added at most 64 rectangular **real material parts** with Rapier colliders (actual 2D box, linear damping, friction, rotation locked). OWNER can add anywhere, switch actual FIXED↔DYNAMIC using a stable collider handle, directly reposition/remove material. Existing world physics, retina, touch and proprio continue unchanged.
- The same single O-CTRL/Occupant authored controller and/or manual WASD/touch drive stay as motor authority. The controller is NOT a new learner and may behave stupidly/roam into emptiness.
- Session-local **in-memory** checkpoint saves/restores World+the authored resident; it is NOT yet an exported durable LIFE/L1 file across browser close or new process. Camera/tool selection and human authority controls are not serialized. Humans must know they are making an intervention.
- No global actor-facing part handle, mode, task ID or world coordinate. Observe still contains only tick, 96 RGB ray samples, touch, proprio. **Important defect found and fixed during review:** initial material methods invalidated the private frame on paused OWNER manipulation. They now preserve the last 30 Hz sampled frame until the World genuinely advances; no duplicate newly manufactured sensory history at the same tick.

## Actually source-executed QA
[Full GitHub Actions Check #39814075608](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39814075608) at source SHA `b277db80139913d19d2d9f3336061879b23f3383`: TypeScript compilation PASS; **48 test files / 145 native tests PASS**, Vite multi-entry bundle PASS.
- Test actual anchored solid versus genuinely dynamic box under the **same forward actor motor**; fixed part does not move but dynamic part does. After anchoring then releasing, actor force can move the same collider again; no handle replacement.
- Test legal private frame under paused-owner part creation/motion/anchoring: old retina persists at actor tick4 during physical ticks5–7; only physics tick8 creates new 30Hz sample. Restoring snapshot at tick5 also restores historical frame tick4. No retroactive memory injection.
- Test multiple parts, deleting one while keeping the other's identity intact, material mode retained in World checkpoint, exact replay after 304 actual future solver updates including physics bytes, actor state and private sensory observations.

[Real Chrome desktop/mobile UI #39814075599](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39814075599): **PASS**, with preserved screenshots and machine-readable evidence artifact `rb-r8-workbench-chromium`.
- Real mouse pointer adds/anchors/drags/releases/deletes, then saves and restores EXACT same physical collider handle, mode and x coordinate at original physics tick45; paused edit does not mutate actor's previously sampled retina.
- Actual manual physical actor drives into a created dynamic block: **4.8702743 world units** of part displacement. This is true solved body–material interaction, not a mouse-driven movement.
- Chromium mobile touch viewports 390 and 320px: no horizontal overflow, physical anchored part successfully created by touch. Page JavaScript console errors: **none**.
- Original Chrome run [#39812980492](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39812980492) failed due to an automatically requested missing favicon (HTTP404), not a physical/browser-interaction failure; added explicit empty data icon; subsequent Chrome runs passed. Preserved original failure.
- Tests are programmatically verified browser interactions, not an Owner gameplay recording or proof that touch feels good.

## What this changes and what it does NOT
This supplies an **open research medium** to create more than one physical environment layout without designing a gate puzzle. Objects can carry old collisions, become obstacles or be physically pushed, and the same timeline is checkpointed, with legal 30 Hz sensory exposure. It is a *capability to explore causality*, not evidence that animals learn to build, construct niches, generate an internal goal, have chemistry, evolve/repair their bodies, or develop varied daily practices. A collection of human-placed blocks could still be lifeless scenery. Even a perfect, long-lived fixed model must not be promoted from machine PASS against explicit Owner feeling.
Only 2D bounded rigid boxes, no joints/connectors, no gravity, no shape deformation, no persistent global library, no multi-agent social processes and no automatic source of novelty. Actor's autonomous routine remains the previously criticized basic authored control; manual Owner actions are labeled as OWNER, not inferred resident agency.

## Next scientific leverage, without another conveyor-belt fixture
Let a human freely build/test/alter this world and record **which configurations evoke interesting unplanned causal relations**, rather than scripting "complete structure" or "push cyan". If useful, design one legal sensor/history counterfactual against a simple reactive null **inside a configuration discovered through actual play**. Don't declare R8 a prerequisite to all future living studies; it can also falsify whether current Rapier/material capabilities are too impoverished. Narrow engineering alternatives from Splot Box3D remain donors, not automatic engine migration.
Do not merge/deploy until user-guided evaluation. Browser version is on isolated PR branch and not published as a live site.
