# RB-AFF/A1 — Action reveals hidden material constraint through lawful private senses
**2026-10-20 · EXECUTION PASS · STRONG NARROW IDENTIFIABILITY DISCOVERY · NO LEARNING / ORGANISM QUALIFICATION**

Frozen protocol committed **before** code execution: [RB-AFF-A1_ARMED_2026-10-20.md](RB-AFF-A1_ARMED_2026-10-20.md).
Exact test-source head `4ce2f87fe5041a394f2ac65c264ca5056a2c19a1` on isolated [draft PR #77](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/77).
Real GitHub-hosted Rapier / Vitest / TypeScript / Vite check: [run #39505028219](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39505028219), job `118911692645`; source result marker `RB_AFF_A1_RESULT`; all checks succeeded. Test performed **two independent deterministic replays in the same process**, exact result equality.

## Controlled conditions

2×2 world-factor experiment:
- a movable turquoise disk at (3,0), radius .65 in every world;
- a genuinely fixed backstop centered at (5,0), half-extents (.25,.85) in only one world, with exact RGB `[.025,.04,.06]`, same as sensory background;
- actor at (0,0), same actual 120Hz Rapier engine, 30Hz body-local 96RGB / directional touch / proprioception, 720 physics ticks = six simulated seconds;
- one action arm researcher-authored `drive=.95, turn=0, gazeRate=0` applied identically in both worlds, one zero-motor arm.
- No world identities, coordinates, collider constraints or labels enter any motor chooser: **there is no agent policy in this test**, only prescribed action. Host-only measurements compare World states.

Identical initial private frame was verified in both conditions.

## Result

| Outcome | No backstop | Backstop |
|---|---:|---:|
| Body displacement/path (6s) | 24.64595 | 2.45172 |
| Final body X | 24.64595 | 2.45164 |
| Final turquoise object X | 26.29595 | 4.10018 |
| Frames with turquoise appearance out of 180 | 180 | 180 |
| Windows with any physical actor contact | 167 | 167 |
| First private RGB channel difference | **none** | **none** |
| First lawful touch / proprioception difference | tick **96** | tick **96** |
| First host-only physical position difference | tick **96** | tick **96** |

Without actor motor action, body remains X=0 and disk remains X=3 in BOTH worlds; no difference in any private sensory channel during all 180 poststep frames.

Thus, under this exact pairing, **96RGB is observationally equivalent over six seconds despite enormous differences in physical effectivity**. Normal bodily touch and proprioception DO separate the worlds after the prescribed physical action; actor/world physical position itself diverges at the same sampled time tick96.

The equality of contact-window counts is deceptive: contact **presence** alone carries insufficient information here, while lawful *magnitudes/body motion* do change. We did not test a learned classifier, nor publish a scalar success/regret criterion.

## Scientific judgment

**Positive, qualified *observability* result:** a hidden physical constraint can leave complete ordinary color-retina aliasing yet be recoverable in **action-conditioned sensorimotor history**, with no World semantics or privilege. This supports researching a cheap local mechanism for interpreting own demand × subsequent proprio/touch rather than adding pixels or a researcher-authored 2D map solely to disambiguate material effectivity.

**No positive organism result:** the action was imposed by researcher, there is no learned causal model, memory-consumer, self-selected experiment, sustained resident concern, transfer across bodies/scenes, cross-environment statistical reliability, or Owner-accepted life. Color camouflage by assigning exact background RGB is a deliberate controlled fixture, not a natural optics observation. Contact windows are not individual impacts and their equal counts do not imply identical pressure curves.

**Adverse alternatives:** a trivial single-threshold velocity rule may already separate these two situations. A learner does not earn anything until it beats a cheap comparator under changed mass/size/friction, scenes and temporal contexts. This test does not establish robust geometric observability, actor-owned valuation or usefulness of a ReflexBrain-specific model.

## Next decision boundary

**Close A1 — do NOT add an A1b threshold tuned to these coordinates.**
Before a learned mechanism, compare what private touch magnitude and body response reveal about material action outcomes across *held-out* physical relations, and establish that a chosen downstream action is materially relevant in an actor's real continuing activity. No weight scaling or GPU demand follows from A1. Keep research-only draft branch; no promotion to canonical, no release, no changes to World or Occupant.
