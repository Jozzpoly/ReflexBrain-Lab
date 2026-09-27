# R3 Temporal Project-Then-Compare Execution Protocol Incident — 2026-09-27

Status: **APPARATUS PROTOCOL VIOLATION · RESULT UNOBSERVED · ORIGINAL THREE EXECUTIONS INVALIDATED**

## Incident

The frozen project-then-compare diagnostic page was deployed and qualified on implementation head:
`b51da418a718f060da37771eb0aa8b0d6ee07bab`.

During the first Opera launch attempt, `go_to_page` succeeded but the Browser Connector disconnected before the follow-up tab listing could confirm the new tab.

The retry loop incorrectly retried **navigation** rather than retrying only passive tab discovery.

This created three page instances:
- tab `631130111`;
- tab `631130112`;
- tab `631130113`.

Because the page auto-runs on load, the original contract's literal one-page-load execution boundary was violated.

## Evidence-preservation boundary

Before reading any result content:
- the duplicate tab count was discovered;
- no `tab_content` call was made for any of the three diagnostic tabs;
- no metric, classification, probability, JSON result or rendered output from those runs was observed;
- all three tabs were closed without reading their content.

Therefore the original executions are:

**INVALIDATED / UNOBSERVED**

They must not be cited as experiment results.

## Recovery rule

The semantic/model experiment remains frozen exactly as specified in:
`docs/R3_TEMPORAL_PROJECT_THEN_COMPARE_DIAGNOSTIC_CONTRACT_2026-09-27.md`.

Only the launch apparatus may change.

Before a recovery execution:
1. add a same-origin persistent run lock with one frozen recovery token;
2. the first page load acquiring that token may execute the diagnostic;
3. any duplicate page load with the same token must return `BLOCKED_DUPLICATE_EXECUTION` before encoder/model work;
4. do not clear or change the token after deployment;
5. do not change corpus, texts, labels, features, encoder, learner, optimizer, gates or interpretation matrix.

Frozen recovery token:

`r3-temporal-project-then-compare-recovery-20260927-a`

## Qualification

A recovery result may be interpreted through the original precommitted matrix only if:
- the run-lock implementation passes CI/build/deploy;
- one logical execution acquires the token;
- any accidental duplicate loads are blocked before model work;
- exact result content is read from the executing tab;
- provenance explicitly records this recovery incident.

This is an apparatus recovery, not permission for an experimental rerun or alternate model choice.
