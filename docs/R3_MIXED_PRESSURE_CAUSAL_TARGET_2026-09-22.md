# R3 Mixed-Pressure Causal Target — Qualification 2026-09-22

Status: **TARGET QUALIFIED · NO MODEL RUN YET**

Qualified code head:

`07448da82be795661fbecea39a23d74f3ac939a9`

CI:
- Check: PASS;
- Research Preview: PASS.

## Why this target exists

The prior concurrent-matter causal probe improved supervision by using paired matter ablation, but causal responsibility was still perfectly associated with separate ecologies.

That allowed a hypothetical learned relation function to succeed by recognizing ecology/domain rather than actor-relative relevance.

The mixed-pressure fixture removes that shortcut.

## Setup

One Janek remains inside one continuous autonomous ecology.

He owns two matters simultaneously:
- `resident:janek:matter:workshop-processing`;
- `resident:janek:matter:local-report-response`.

Different private local conditions make different matters causally necessary for the next local decision.

Ground truth remains intervention-derived:

1. replay identical deterministic prefix with both matters;
2. include decision-time private observation in the query;
3. remove one matter only in the paired variant;
4. advance one tick;
5. compare the next local decision;
6. retain the state only when exactly one matter ablation changes that decision.

## Qualified audit

Each wording variant yields:

| Property | Result |
| --- | ---: |
| retained examples | 12 |
| workshop-responsible | 6 |
| report-responsible | 6 |
| unique transition histories | 9 |
| ambiguous histories | 0 |
| chance top-1 | 0.5 |

Lexical control:

| Wording | Top-1 | Tie rate |
| --- | ---: | ---: |
| baseline | 0.333 | 0.333 |
| paraphrase | 0.583 | 0.583 |

The paraphrase lexical result is one hit above a 6/12 chance outcome and the corpus is intentionally tiny. It is not evidence of a lexical solver.

## Important property

Responsibility now switches **within the same ecology for the same actor with both matters concurrently present**.

This removes the strongest structural confound from the previous causal probe.

## What this qualifies

- the research-only mixed-pressure ecology;
- the causal-ablation target;
- responsibility switching within one ecology;
- decision-time temporal alignment;
- baseline/paraphrase pairing;
- a small feasibility corpus suitable for the next frozen-representation falsifier.

## What it does not qualify

- MiniLM or another encoder on this target;
- direct cosine;
- a learned head;
- semantic generalization;
- production matter architecture;
- ReflexBrain authority.

The next model run must be a separate, bounded experiment and must not silently promote the fixture or target into production architecture.
