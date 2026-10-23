# RB/LIFE–X2 — RESULT, frozen four-seed two-layout episode control
Date: 2026-10-23. Original tested code HEAD `53110cf4cd4e7e5ef8635ab8c5ec5ce9610747d4`. [Actions #39875539148](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/39875539148) **56 Vitest files / 176 native tests PASS; TypeScript + Vite PASS**. Source and hypothesis [X2 ARMED](RB_LIFE_X2_ARMED_2026-10-23.md) committed BEFORE implementation and results.

## Scientific ruling: **SEED-SENSITIVE / NOT QUALIFIED AS ROBUST RETURN**
X1's single random seed `0x51babe` really yielded more than a continuous t30-boundary collision: **three independent later contact episodes with previously displaced physical parts in yard A; one episode in mirrored B**, with >1s of actor–specific-part contact absence defining distinct episodes. Source run faithfully reproduces original X1's 190 and 86 physical contact records for this exact seed/layout.

However, all **three additional fixed seeds in both A and B modified ordinary material in the first 30 seconds and then registered ZERO return episodes/contact records with their early-displaced parts** during the following 90 seconds. Therefore **only 1/4 fixed seeds per layout** had such an episode. This is a precise negative finding against interpreting the original apparent random success as a broadly dependable emergent practice.

| Layout | Seed | Material parts altered by first 30s | Raw later material-contact records *with those same parts* | Late episodes separated by >120 solver ticks | Distinct early-altered handles touched again |
|---|---|---:|---:|---:|---:|
| A yard | `0x51babe` | 3 | 190 | **3** | 3 |
| A yard | `0x31415926` | 1 | 0 | **0** | 0 |
| A yard | `0x27182818` | 1 | 0 | **0** | 0 |
| A yard | `0xc001d00d` | 4 | 0 | **0** | 0 |
| B mirror | `0x51babe` | 3 | 86 | **1** | 1 |
| B mirror | `0x31415926` | 1 | 0 | **0** | 0 |
| B mirror | `0x27182818` | 1 | 0 | **0** | 0 |
| B mirror | `0xc001d00d` | 3 | 0 | **0** | 0 |

8 histories × 14,400 genuine Rapier 120 Hz steps × 3,600 legal 30 Hz private sampled frames = **115,200 new actual solver steps and 28,800 sampled frames**. The 1-second gap criterion is a chosen diagnostic operationalization of a renewed episode; it does not establish new *purpose*, *memory*, *semantic learning*, *visit*, *intent*, or an organism. X2 episode results: A `[0,0,1,2]`, B `[0,0,1,0]` across 30s windows in positive seed. Other 6 histories: all episode bins zero.

## Correction to prior interpretation
We must hold **two truths together** rather than promoting either shortcut:
1. **Physical possibility exists:** seeded random actions sometimes physically re-contact an object the actor previously displaced. That falsifies the impossibility claim "a static/open R8 world cannot allow any later re-contact." Physical dynamical ecology need not continuously move to bear future consequences.
2. **No reliable relation / no learned organism:** this occurrence is narrow, one random seed out of four on both related layouts. Neither the stable 79-trial O-DEV motor learner nor cheap cyclic control showed comparable returns in X1, but that does not make stochastic motion a generally superior agent. It has no private internal use of its physical history.

Thus the principal known gap is not a single missing engine feature nor an absent random button. **The existing actor/world coupling does not reliably renew meaningful opportunities under available natural policies, and the only learned criterion is own mobility.** Future work must not tune the random seed or prescribe an organism-specific return script to get green.

## Follow-up decision, not a third microprobe immediately
Do not extend the seed search to find a flattering trajectory. Stop this X1/X2 family with its preserved negative robustness verdict. Return to broader existing donors (Splot: support/grip/physical assemblage, Gloop: ecological/time scales but low expressive rank, Cognitive Ecology: independent clock mechanisms but authored tasks, R6: self-maintenance patterns but no actor-owned meaning). Ask for **one** previously underrepresented *materially generative interaction* with accessible later actor-private consequence and more than one way to respond. No engine migration or custom reward yet; the mechanistic and Owner-value basis must be defended before code.

**Status:** research [draft PR #90](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/90), separate from R8 owner-test [draft #89](https://github.com/Jozzpoly/ReflexBrain-Lab/pull/89); no merge/deploy/Owner product PASS.
