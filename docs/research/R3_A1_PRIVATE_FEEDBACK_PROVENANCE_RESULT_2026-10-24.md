# R3/A1 — native feedback and private-check evidence (24 Oct 2026)

**Engineering PASS / No learned meaning qualification.**

Frozen protocol committed first at `69381e2cb99376280b1793ec0c912b4bd1fd5e71`; original unchanged R3 #3 world/policies SHA `04f2835c2aec6a6e82248b2ff5744e89bd7b54e8`. Research test committed `0cfa5d38f40e4c731022b8125e27f92b53258f04`. [Source executed Actions #40050912012](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/40050912012) **49/49 test files, 216/216 Vitest PASS, TS/build PASS**. Raw machine logs `RB_R3_A1_PRIVATE_FEEDBACK` and `RB_R3_A1_CHECKING` remain in the job for replication. No R3/World/fixture policy modifications.

## Ordinary 5400-tick arms

| Original R3 mode | Ida forwards | Private Mira 'rack stocked' heard by Ida | Heard ACKs without directly seeing source raw | Heard ACKs when host sees source below capacity3 | Cumulative host source-reserve deficit ticks | Workshop completions |
|---|---:|---:|---:|---:|---:|---:|
| reserve-purpose-aware | 0 | 0 | — | — | 0 | 0 |
| reserve-purpose-blind | 24 | 23 | **23/23** | **22/23** | **2871** | 23 |
| supply-ideal | 24 | 23 | **23/23** | **22/23** | **2871** | 23 |

Listener Ida stays at (6,0), with sight radius 0.75, source center (4,0); `visibleObjects=0` on those 23 stocked-report observation rows. Host reservoir stock is full 3 at first report (tick179), below capacity **2** at next real stocked report (tick407) and 21 other report observations. This is from real actor-first observations and host `World.snapshot` attributed *only* to researcher. The source capacity replenishes (sourceReplenishTicks120), so lower-than-capacity on sampled rows is **not proof of irrevocable loss**.

The same-purpose blind vs aware action difference is an **authored policy mode**, not an evolving policy. Supplier Mira's completion statement is factually grounded to seeing rack stock; it says **nothing about protecting the source reserve**. Importantly, Ida could in theory maintain an actor-private causal estimate from her own requests and other cues; this assay establishes *absence of direct same-frame visual evidence*, NOT an impossibility theorem that all remote knowledge is unavailable.

## True actor-private legal investigation, but researcher-directed

At earliest first confirmed completion tick179, two deterministic `reserve-purpose-blind` runs had identical World snapshots and Ida-private frames. The researcher stopped ordinary fixture execution and commanded only Ida to `move_to` the source center for 12 ticks in one branch; the other continued with all intents idle. Original World replenishment timer remained active in both. Direct source raw visible: **0 at fork** for both; in the moving arm 1 at the **7th future tick**, 3 at the **8th**, while passive arm still saw 0 at t12. **This first tick179 scene actually had source full 3**, so this arm illustrates legal fact acquisition, **not detecting harmful reserve depletion after a request**. Do not overpromote.

Independent two native-R3 World controls: exact same Ida-private initial frame at x6 with either **0 or 3** World source blanks (host knows ground truth); both idle controls remain privately indistinguishable for 12 ticks; both independently given the **same** lawful `move_to` action produce the **first privately visible divergence at move tick7**, without altering original World sources or secret perception. This demonstrates an actual lawful path to reducing hidden-state aliasing. It does not establish actor's learned choice, valuation, generalization, available free time or human-like meaning.

## Strict answer to A1

- **YES**, a physically relevant concern can be negatively affected while a remote 'completed' report remains literally true.
- **YES**, the current host allows a legally private physical check to discover source stock.
- **NO evidence** that Ida voluntarily checked at an appropriate time, inferred the reserve condition from private history, or learned to protect it. The only present policy that protects it is authored.
- **NO evidence** the present reporter/consumer material supports *independent actor-relative supervision* for learned semantic policy. A completion report itself is an action-effect fact, not a valence/relevance label.
- Falsifier still open: whether a **real depleted-source** feedback moment (instead of the full t179 sample) can be privately verified by a matched post-feedback inquiry. That deserves one separately frozen bounded follow-up before considering a learner, not repeated hidden-reward tuning.

Next path after the follow-up: if a lawful check still only reveals raw material state, classify it as ordinary Local Brain/checking competence. The harder, unsolved ReflexBrain question remains *when is a costly inquiry relevant to my continuing private concern, particularly under other ongoing obligations?* Do not build a new organism, reward, ontology or semantic classifier based on this alone.

No merges, R8, Jaskinia, Pages or main changed.
