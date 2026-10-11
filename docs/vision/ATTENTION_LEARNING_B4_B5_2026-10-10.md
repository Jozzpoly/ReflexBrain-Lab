# ReflexBrain B4–B5 — Private-outcome attention learning, information aliases and exploration traps

**2026-10-10 · ORGANISM-FRONTIER SCOUT · NO NEW CANONICAL OR LEARNED-AGENCY CLAIM**

**Research branch:** `research/vision-lived-retina-loop-2026-10-10`  
**Draft PR:** https://github.com/Jozzpoly/ReflexBrain-Lab/pull/54  
**Qualified exact test-source head:** `e9088de2bec0d394a00e207320b2096877030790`.  
**Full CI:** https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/38096382941 — **49/49 test files, 146/146 tests PASS**, TypeScript, Vite PASS.  
**Source:** `tests/living-organism/vision-private-attention-learning.test.ts`. No production code modified. Additional C1 touch/reward challenge is being investigated separately; do not infer its result from this B4–B5 qualification.

## Question and answer

B1–B3 already causally connected **lawful private visual history → additional gaze → renewed RGB perception → actual Rapier body movement → contact**. But the attention policies were authored; the history-conditional eye was beaten by a simple unconditional gaze sweep on time-to-contact.

B4 asks: can a modest agent **learn which eye action pays**, from its own actual contact/time/gaze history, without being told where a World object is or which scene is present? B5 asks whether that learned value remains useful as the rate of *new, previously unseen objects* changes.

**Answer, qualified:** the tiny contextual bandit genuinely updates action preferences using actor-private outcome signals. It learns to scan following a previous sighting's loss, and avoid costly scanning in worlds where prior history is empty and no objects exist. But it only matches the researcher-written history-gate; on a held-out novelty family the cheaper unconditional scan beats it. **Without some controlled alternative-action exploration, the learner's initial belief becomes self-confirming and it never discovers that novelty has become common.** With forced exploration, its experience-driven preference eventually changes and contact opportunities appear. A running average then adapts poorly when the environment switches back to emptiness.

Most fundamentally, the reward itself is still authored. Contact is a physical private signal, NOT organism-owned value or proof of contact with the specific earlier target.

## Strict actor boundary

Training scenario creation and end-of-run scientific evaluation belong to host; the eye learner never receives scenario IDs, target x/y, relocation time, World color/identity, presence/absence labels, hindsight action costs or test outcomes. It receives one of three investigator-defined, actor-private visual contexts:
- `currently-seen`: the native 96×RGB retina presently contains the chosen turquoise patch,
- `previously-seen-now-missing`: there is real prior target RGB but it is currently absent,
- `never-seen`: neither prior nor current native RGB contains turquoise.

These contexts are **hand-engineered, color-specific** and carry task relevance from the investigator's design. They are not self-formed meanings.

Two possible actions use **exactly the same native 96 RGB rays per 30Hz frame and same existing ApproachEpisode motor**: hold eye body-forward versus broad ocular sweep when target is absent. Physical contact is produced by real 120Hz Rapier contact. The training reward is computed from private contact, own motor command and elapsed ticks:

`reward = (touchOccurred ? 1 - 0.2 * elapsed120HzTicks/1200 : 0) - 0.03 * integral(abs(gazeDemand) dt)`.

Those coefficients, touch-as-valuable convention, authored ApproachEpisode turquoise-contact goal and 10-second horizon are not organism discoveries or biological energy. They are explicit design priors. Body movement and source sensory physics remain untouched.

**Training is 32 independently reset real physical episodes whose learned statistical values survive between resets**, rather than one continuous lived organism World. The online model is a tiny two-arm empirical contextual bandit with initial arm coverage and an authored exploration probability (0.24). This is a meaningful minimal reinforcement experiment, not robust neural/general cognition.

## B4 — 32 physical training experiences, 7 held-out evaluations

Training experience allocations:
- 8 visible stationary target cases,
- 12 previously sighted but relocated left/right,
- 12 no-prior-turquoise / no material target cases.

Resulting learned values and decisions:

| Actor-private context | Hold observations / value | Sweep observations / value | Chosen |
|---|---:|---:|---|
| Current target visible | 6 / 0.9158 | 2 / 0.9158 | HOLD (indifferent) |
| Prior target now missing | 2 / 0 | 10 / 0.861 | **SWEEP** |
| No prior target | 10 / 0 | 2 / -0.285 | **HOLD** |

One held-out batch contains visible/stationary, lost-rear left/right, no target, previously unseen rear target left/right, and prior target permanently gone.

| Policy | Real actor-private contact success / 7 | Mean investigator reward | Mean gaze-command integral |
|---|---:|---:|---:|
| Learned contextual bandit | **3** | 0.3346 | 1.719 |
| Strong unconditional scan | **5** | **0.5385** | 3.438 |
| Never scan | 1 | 0.1308 | 0 |
| Cheap authored history gate | **3** | **0.3346** | 1.719 |

The learned rule **exactly matches** the simple authored history-gate on the seven tests. No model capacity, learned preference or simulation test pass warrants calling it better than that simple baseline.

## Strict identifiability / genuine private-history aliases

**B4A (never seen):** a World with no target vs a World with a never-yet-seen target behind the actor produce precisely identical lawful RGB histories and private context. Yet the same eye choice has opposite estimated material value:

| Unseen hidden material reality | HOLD reward | SWEEP reward |
|---|---:|---:|
| No target | **0** | -0.285 |
| Fresh unseen target to discover | 0 | **+0.8817** (real touch) |

**B4B (prior personally seen target):** after EXACTLY the same lawful original turquoise encounter, the host moves it outside all sensor range vs moves it to a reachable rear location. Present lawful retina and the actor-private earlier RGB evidence are equal:

| Hidden fate of previously seen target | HOLD reward | SWEEP reward |
|---|---:|---:|
| Reachable somewhere else | 0 | **+0.830** (real touch) |
| Gone outside the medium | **0** | -0.285 |

Thus neither simplistic "no history so never inspect" nor "lost remembered object so always inspect" can be optimal across these aliases. A better model might use probabilities, more temporally grounded exploration, or information gathering—but **no deterministic policy can correctly distinguish fully aliased hidden scenarios at the choice boundary without fresh legal observation**.

## B5 — after deployment conditions change, over multiple independent physical episodes

Start with identical B4-trained policy weights, then change the *host's hidden training-situation prevalence*: in 36 further real trial continuations, 30 have a newly discoverable rear object without personal prior sighting, 6 have none. The policy gets no drift flag, provider goal, World target type or presence label. Results:

| Strategy on 36 altered physical episodes | Contact successes | Mean private-derived reward | Eye sweep selection count |
|---|---:|---:|---:|
| **Greedy learned policy, zero exploration** | **0/36** | 0 | 0 |
| Learned policy, continuing bounded experiments | **22/36** | +0.4964 | 25 |
| **Always scan** | **30/36** | **+0.6614** | 36 |
| Scan every third episode | 6/36 | +0.0908 | 12 |

The exploratory learner initially remains still for **9 actual physical episodes**; on episode 10 it executes a non-greedy visual scan, finds a target and receives real private touch reward. Its empirical no-history sweep value later rises from **−0.285 to +0.6407** and its preferred choice becomes SWEEP. The non-exploring clone never scans, never makes contact and obtains no new private evidence that its previous experience ceased to be representative.

This is legitimate **actor-private empirical updating**, with a **researcher-forced exploration schedule and repeatedly reset material host**. Stronger always-scan still wins this evaluation distribution. No learned dominance claim.

### Reverse prevalence shift — learned inertia

Without relearning from scratch, subject the exploratory learner to **12 further worlds with no reachable turquoise target**. It continues scanning in all 12, generating **114 units** of gaze-demand integral with zero material contact. Despite the new empty sequence, its all-history empirical mean remains positive, **+0.3559**, so it still prefers SCAN.

This is an explicit **FAILED generality/rapid adaptation** result. A fixed cumulative empirical mean cannot robustly track non-stationary world statistics. Adding a fixed decay rate alone would introduce another authored assumption rather than autonomous uncertainty.

## Principal criticisms

1. **Meaning imported by feature and reward.** The actor never learned turquoise means anything worth touching; the researcher selected the color class, standing goal, reward bonus and penalties. Generic private touch can reward the wrong kind of event. Future reward-target attribution needs serious falsification, not architectural assumptions.
2. **Resets and supervised experience distribution.** Statistics transfer between complete separate Rapier episodes. This is not lifelong learning by one organism in one persistent ecology. The host controls frequencies and resets, though their IDs never enter the learner's inputs.
3. **One fixed training shuffle and one fixed exploration seed.** Quantities are deterministic specimens, not general population estimates or averaged robustness across independent seeds and holdouts. No confidence intervals warranted.
4. **Attention cost proxy.** `integral(abs(gazeDemand))` is not energy, real brain attention, missed threat cost, or wall-time CPU. Earlier A4 established a real RGB optical peripheral tradeoff, but B4–B5 do not physically include competing threat/periphery decisions.
5. **Only 2 actions and 3 handcrafted contexts.** No dynamic placement of rays, fine focus vs peripheral budget, learning of eye angle, movement for parallax, proprioceptive uncertainty or adaptive interruption.
6. **Reward causal feedback only after whole episode.** Credit assignment is extremely coarse; an actor reaching touch may not know it touched what it intended. Even that local result may be mediated by authored motor behavior rather than learned motor competence.
7. **Simple alternatives are strong.** The hand-authored history gate matched the learned policy in B4; always-scan beat it in novelty-rich worlds; the learned mean fails reverse drift. No source evidence for learned self-forming curiosity.
8. **No higher-LLM cognition needed.** The experiment deliberately has zero provider calls, but this does not prove any optimal boundary for LLM escalation.

## Relation to canonical ReflexBrain F3/F4

The Control Room on `research/pre-o0-foundations-campaign` distinguishes:
- F2/P0: scalar surprise/error is not trustworthy competence;
- F3/D0: actor-private relational and directional material information can break an alias of binary touch and error;
- G5A: lawful independent ecology and private history can causally affect later behavior;
- F3: owned significance/reason formation remains substantially OPEN;
- F4: learning when to seek more private evidence remains OPEN.

B4–B5 qualifies a **tiny experience-updated eye-choice learner** but also shows that encoding a task-relevant 'prior seen' feature and a reward scalar simply **relocates the designer's notion of what matters**. This does not close F3/F4. It makes *personally meaningful feedback* and *counterfactual opportunity cost* the next priority.

**Next material falsifier:** allow the actor to contact **unrelated** physical matter while pursuing turquoise. Does private 'touch' mistakenly count as completing its prior activity? Does directional touch or a stable private relational history distinguish useful touch from incidental contact? The target identity and host object handles must remain evaluation-only. The experimental choice of *what constitutes success* must be separately qualified.

**Research-only external orientation, not evidence for our results:** 2025 Nature Communications `Discovery of the reward function for embodied reinforcement learning agents` https://www.nature.com/articles/s41467-025-66009-y discusses the unresolved difficulty of forming useful rewards without manual definitions. `Active sensing with predictive coding and uncertainty minimization` https://pmc.ncbi.nlm.nih.gov/articles/PMC11240181/ contrasts extrinsic reward with active/intrinsic exploration. These motivate falsifiers; neither proves what this organism can do.

## Continuity

All B4/B5 code is **one test-only file** on a separate draft donor branch; original `LivingWorld`, `ApproachEpisode`, `Occupant`, learning models and canonical Control Room remain unchanged. Do not merge or import this policy into product. Do not choose another fixed epsilon, gaze schedule or reward function on the sole basis of its positive finite fixtures. Preserve strong cheap baselines and both aliased families as permanent regressions if this question resumes.

The next run should preferably bridge **actual body-relative material contact/situation → privately recognized relevance → measured subsequent action value**, or fail explicitly. Rewriting our learned contextual bandit as a neural network does not change what it knows.
