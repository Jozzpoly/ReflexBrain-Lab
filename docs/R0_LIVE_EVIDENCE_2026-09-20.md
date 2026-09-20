# R0 Live Evidence — 2026-09-20

Status: **EMPIRICAL CHECKPOINT · NOT A FINAL MODEL VERDICT**

This document records live browser/GPU evidence collected on the Owner's desktop Opera session from the branch `experiment/r0-semantic-shadow-bootstrap`.

## Runtime facts

- Browser runtime: desktop Opera with WebGPU available.
- GPU path exposed no `shader-f16`; `q4f16` failed at inference with:
  - `Gather requires f16 but the device does not support it.`
- Runtime routing was changed to:
  - `shader-f16=true -> q4f16`
  - `shader-f16=false -> q8`
- Qwen backend:
  - `onnx-community/Qwen3-0.6B-ONNX`
  - pinned revision `b1ece21c06dfce3839272e86b7fa12a985d97a7a`
  - live runtime: WebGPU / q8
- SmolLM2 backend:
  - `onnx-community/SmolLM2-135M-Instruct-ONNX`
  - pinned revision `b8a5c0f183b78c55955a5364f610c36668b5e681`
  - live runtime: WebGPU / q8

## Direct-logit probe

Transformers.js 4.3.0 documents generation scores, but its shipped `generate()` implementation still leaves returned scores/logits as TODO. The lab therefore tested direct `model.forward()` next-token logits.

The Qwen ONNX export returned logits shaped approximately:

`[1, 193, 151936]`

despite passing `num_logits_to_keep=1` to the direct forward path. This means the current direct-forward experiment materializes sequence-wide logits and is not an acceptable fast-reflex implementation.

The direct-logit path remains useful for diagnostics but is currently a performance anti-target.

## Qwen choice-only low-stakes matrix

Mechanism:
- one constrained generated token;
- only A–E permitted by a logits processor;
- semantic actions remapped between canonical and reverse option orders;
- zero authority over World or actor motion.

12 runs:
- 3 exposure states: addressed / overheard / none;
- 2 orders: canonical / reverse;
- 2 repetitions.

Observed:
- selected semantic action: **continue in 12/12**;
- canonical emitted `A`;
- reverse emitted `E`;
- therefore the low-stakes case passed a narrow order-remapping check;
- the family did **not** demonstrate exposure sensitivity.

Latency:
- mean: **3195.1 ms**
- median: **3225.1 ms**
- range: **2960.9–3547.5 ms**

Warm repetition did not collapse latency to a reflex-scale regime.

## SmolLM2-135M choice-only matrix

Same 12-run low-stakes protocol.

Observed:
- canonical: token `A` -> semantic `continue`;
- reverse: token `A` -> semantic `withdraw`;
- this happened across addressed / overheard / none and both repetitions.

Interpretation:
- **strong label/first-position bias**;
- semantic remapping FAIL;
- unsuitable as a semantic reflex provider under the current A–E interface.

Latency:
- mean: **1453.3 ms**
- median: **1406.2 ms**
- range: **1296.2–1985.3 ms**

SmolLM2 is materially faster than Qwen here but still far outside a high-frequency reflex target and semantically much less trustworthy.

## Qwen semantic challenge matrix

Five embodied situations, each tested in canonical and reverse order:

1. silent-pass
2. addressed-request
3. overheard-request
4. urgent-warning
5. fast-close

Observed semantic actions:

| challenge | canonical | reverse |
| --- | --- | --- |
| silent-pass | continue | continue |
| addressed-request | continue | continue |
| overheard-request | continue | continue |
| urgent-warning | withdraw | continue |
| fast-close | continue | continue |

The urgent warning changed the canonical decision, proving that prompt content can influence the readout. However that decision did not survive remapping, so this is **not yet robust semantic choice evidence**.

Latency:
- mean: **3265.4 ms**
- median: **3207.8 ms**
- range: **2981.5–3543.0 ms**

## Qwen five-position permutation sweep

Purpose: separate semantic preference from A–E / option-position bias.

Each semantic action occupied every one of the five label positions exactly once.

### silent-pass

| order | selected token | selected semantic action |
| --- | --- | --- |
| canonical | A | continue |
| rotate1 | A | orient |
| rotate2 | D | continue |
| rotate3 | A | investigate |
| rotate4 | A | withdraw |

Token `A` won **4/5** rotations.

### urgent-warning

| order | selected token | selected semantic action |
| --- | --- | --- |
| canonical | E | withdraw |
| rotate1 | E | continue |
| rotate2 | E | orient |
| rotate3 | E | acknowledge |
| rotate4 | A | withdraw |

Token `E` won **4/5** rotations.

Latency:
- mean: **3330.9 ms**
- median: **3301.9 ms**
- range: **3221.5–3473.2 ms**

## Current verdicts

### PASS

- WebGPU local inference works on the Owner machine using q8 fallback.
- Backend/model revisions are pinned.
- Actor-private state remains separated from World debug truth.
- Learned inference remains zero-authority.
- Qwen contains non-zero semantic signal: prompt meaning changes token preference.
- The lab can detect label/position bias instead of mistaking it for intelligence.

### FAIL / NOT ADEQUATE

- A–E constrained-choice generation is **not a trustworthy semantic action interface**.
- Qwen3-0.6B WebGPU/q8 at ~3.0–3.5 s per decision is **not a fast reflex brain**.
- SmolLM2-135M at ~1.3–1.5 s warm is also **not reflex-scale** in this browser path.
- SmolLM2 A–E behavior is dominated by first-label bias.
- Qwen semantic decisions are materially confounded by label/position bias.

## Next hypothesis

Do **not** tune the A–E prompt further as the primary route.

Next test:
- constrain generation directly to **semantic single-token action words**, not arbitrary letters;
- proposed semantic surfaces: `work / look / reply / inspect / leave`;
- dynamically verify that each chosen surface is a distinct single tokenizer token;
- map token identity directly to semantic action;
- repeat challenge and permutation/order tests;
- only if semantic-token readout survives bias checks should latency optimization become the next priority.

Longer-term alternatives if semantic-token generation remains unstable:
- candidate-wise yes/no scoring;
- batched semantic scoring;
- dedicated learned decision/readout head;
- LoRA / task-specific local reflex model;
- non-browser runtime if WebGPU overhead remains dominant.


## Semantic-token permutation sweep

The next hypothesis removed arbitrary A–E labels entirely.

Runtime dynamically resolved five distinct single-token semantic surfaces on Qwen:

- `work` -> continue
- `look` -> orient
- `reply` -> acknowledge
- `inspect` -> investigate
- `leave` -> withdraw

All five resolved as bare one-token surfaces on the live Qwen tokenizer.

The same two situations were tested across the five cyclic presentation orders.

### silent-pass

| order | selected keyword | selected action | latency |
| --- | --- | --- | ---: |
| canonical | work | continue | 3299.1 ms |
| rotate1 | look | orient | 3019.4 ms |
| rotate2 | look | orient | 2971.8 ms |
| rotate3 | look | orient | 3060.3 ms |
| rotate4 | look | orient | 3076.8 ms |

### urgent-warning

| order | selected keyword | selected action | latency |
| --- | --- | --- | ---: |
| canonical | reply | acknowledge | 3193.9 ms |
| rotate1 | look | orient | 3157.9 ms |
| rotate2 | reply | acknowledge | 3128.7 ms |
| rotate3 | look | orient | 3088.1 ms |
| rotate4 | leave | withdraw | 3114.6 ms |

Latency:
- mean: **3111.1 ms**
- median: **3101.4 ms**
- range: **2971.8–3299.1 ms**

### Interpretation

Removing A–E removes the arbitrary letter-token failure mode, but it does **not** make single-choice action selection robust.

The same private state changes its selected semantic action when only the presentation order changes. The model carries real semantic information, but the single mutually-exclusive choice interface remains materially confounded by contextual / presentation-order effects.

**Verdict: semantic-token single-choice path is NOT ADEQUATE as a trusted ReflexBrain action selector.**

This strengthens a broader architectural correction:

> R0 should stop treating “pick the next action” as the primary primitive.

The original ReflexBrain hypothesis was richer: fast independent appraisal signals such as attention, interruption pressure, threat, social relevance and deeper-cognition pressure. Those signals should not need to suppress one another inside one five-way softmax.

## Revised next hypothesis — independent semantic judgements

Next experiment should be closer to Jev Noul / appraisal than Jev Choice:

- evaluate bounded semantic propositions independently;
- use direct semantic `yes / no` token identities rather than arbitrary letters;
- capture the pre-mask yes/no logits inside the generation logits processor;
- convert the two captured values to a bounded conditional probability;
- keep each judgement independent from the other judgement labels;
- test proposition inversion / counterfactual pairs to expose yes/no or framing bias.

Initial candidate judgements:

- player deserves attention;
- current task should be interrupted;
- situation is socially relevant;
- situation may be immediately dangerous;
- deeper cognition is warranted.

This is not yet a claim that these are the final ReflexBrain dimensions. They are an R0 probe surface.

Important implementation opportunity: Transformers.js generation already computes only the next-token logits for sampling. A custom logits processor can capture the allowed `yes/no` scores **before masking**, avoiding the sequence-wide direct-forward tensor used by the earlier diagnostic path.


## Independent binary appraisal matrix — live result

The first Noul-like appraisal experiment evaluated five independent semantic propositions:

- attention;
- interrupt;
- social relevance;
- threat;
- deeper cognition.

Two embodied situations were used:

- `silent-pass`;
- `urgent-warning`.

Each appraisal was evaluated twice against the exact same private state:

1. positive proposition framing;
2. explicitly negated proposition framing.

The worker captured the **pre-mask yes/no logits** and normalized them to `P(yes)`. For the negative framing, the workbench converts the result back onto `P(positive) = 1 - P(yes)`, so positive and negated formulations should approximately agree if the binary semantic judgement is stable.

### Live Qwen result

All 20 evaluations selected **yes** — both for every positive proposition and for every explicitly negated proposition.

| situation | appraisal | P+ positive frame | P+ negative frame | framing Δ |
| --- | --- | ---: | ---: | ---: |
| silent-pass | attention | 0.963 | 0.001 | 0.962 |
| silent-pass | interrupt | 0.977 | 0.000 | 0.977 |
| silent-pass | social | 1.000 | 0.001 | 0.999 |
| silent-pass | threat | 1.000 | 0.000 | 1.000 |
| silent-pass | cognition | 1.000 | 0.056 | 0.944 |
| urgent-warning | attention | 1.000 | 0.000 | 1.000 |
| urgent-warning | interrupt | 0.995 | 0.000 | 0.995 |
| urgent-warning | social | 1.000 | 0.001 | 0.999 |
| urgent-warning | threat | 1.000 | 0.000 | 1.000 |
| urgent-warning | cognition | 1.000 | 0.008 | 0.992 |

Aggregate:

- mean framing disagreement: **0.9868**;
- mean normalized `P(positive)` across paired frames: **0.5001**;
- latency mean: **2624.7 ms**;
- latency median: **2638 ms**;
- latency range: **2380–2963 ms**.

### Interpretation

**FAIL — proposition + yes/no is not presently a trustworthy appraisal primitive for this stock Qwen path.**

The inversion test did exactly what it was intended to do: it exposed severe acquiescence / framing dependence that would have looked like extremely high confidence if only the positive prompts had been measured.

This result does **not** falsify independent appraisals as an architecture. It falsifies this particular readout:

`natural-language proposition -> is this true? -> yes/no logits`

under the current stock Qwen3-0.6B instruction model and browser runtime.

### Architectural consequence

The broader R0 evidence now rejects three naive stock-model interfaces as trusted ReflexBrain primitives:

1. arbitrary A–E multi-action choice — strong label / position confounds;
2. semantic-token multi-action choice — presentation-order instability remains;
3. independent proposition yes/no — severe acquiescence / negation framing failure.

The remaining hypothesis should stay close to **independent semantic dimensions**, but remove the yes/no proposition framing itself.

A stronger next falsifier is a **bipolar semantic appraisal** where each dimension is represented directly by opposed semantic token identities rather than a proposition plus generic yes/no answer, e.g.:

- relevant / irrelevant;
- interrupt / continue;
- social / unrelated;
- danger / safe;
- think / routine.

Each pair must be tokenizer-verified, counterbalanced with wording/order/synonym mutations, and evaluated as a bounded semantic contrast rather than as an instruction-following affirmation task.

If that also fails to provide stable counterfactual discrimination, R0 should stop trying to extract a trustworthy reflex primitive from an untrained stock instruction LM interface and move toward a dedicated learned readout/head or task-specific model.


## Bipolar semantic appraisal matrix — live result

The final stock-instruction-model readout falsifier removed generic yes/no entirely.

Each appraisal dimension was represented by two opposed semantic pole tokens shown simultaneously, e.g.:

- attention: `relevant / irrelevant`;
- interrupt: `interrupt / continue`;
- social: `social / unrelated`;
- threat: `danger / safe`;
- cognition: `think / routine`.

For the same private state, each pair was tested twice with **only presentation order reversed**:

- positive-first;
- negative-first.

The worker captured the two pre-mask semantic token logits and normalized them to `P(positive)`.

### Live Qwen result

| situation | dimension | poles + / - | P+ positive-first | P+ negative-first | order Δ | mean P+ |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| silent-pass | attention | relevant / irrelevant | 1.000 | 1.000 | 0.000 | 1.000 |
| silent-pass | interrupt | interrupt / continue | 0.997 | 0.207 | 0.790 | 0.602 |
| silent-pass | social | social / unrelated | 1.000 | 1.000 | 0.000 | 1.000 |
| silent-pass | threat | danger / safe | 0.873 | 0.429 | 0.444 | 0.651 |
| silent-pass | cognition | think / routine | 0.995 | 0.854 | 0.141 | 0.924 |
| urgent-warning | attention | relevant / irrelevant | 1.000 | 1.000 | 0.000 | 1.000 |
| urgent-warning | interrupt | interrupt / continue | 1.000 | 0.140 | 0.859 | 0.570 |
| urgent-warning | social | social / unrelated | 1.000 | 1.000 | 0.000 | 1.000 |
| urgent-warning | threat | danger / safe | 0.892 | 0.108 | 0.784 | 0.500 |
| urgent-warning | cognition | think / routine | 1.000 | 0.196 | 0.804 | 0.598 |

Aggregate:

- mean order disagreement across the ten situation/dimension pairs: **0.3822**;
- attention and social were order-stable but saturated at **1.000** in both tested situations;
- interrupt, threat and cognition showed material-to-severe order sensitivity;
- threat did not move in the expected direction from silent-pass to urgent-warning after order averaging;
- latency remained roughly **2.8–3.2 s** warm, with one first evaluation at ~5.0 s.

### Interpretation

**FAIL — bipolar semantic token appraisal is not a trustworthy stock-Qwen ReflexBrain primitive under this interface.**

This experiment removes the earlier yes/no acquiescence failure mode but exposes a deeper issue:

- some semantic dimensions collapse to a saturated default regardless of the embodied counterfactual;
- other dimensions remain materially controlled by presentation order;
- the resulting averaged values do not reliably track causal situation changes.

This is the fourth independently falsified stock-model interface:

1. arbitrary A–E action choice — label / position confounds;
2. semantic-token multi-action choice — presentation-order instability;
3. proposition + yes/no appraisal — severe acquiescence / negation framing failure;
4. bipolar semantic appraisal — saturation plus strong order sensitivity.

## R0 stock-readout decision

**STOP primary investment in prompt/readout engineering over an untrained stock instruction LM.**

The lab has enough convergent evidence that the next question is no longer:

> Which prompt or token surface extracts the ReflexBrain we want from a stock instruction model?

The next question is:

> What is the smallest dedicated learned semantic-reflex mechanism that can learn stable independent appraisals from embodied counterfactual state while remaining fast, local, inspectable and zero-authority?

This promotes the project toward a learned-readout experiment. It does **not** yet commit to a final architecture, backbone, LoRA strategy or training recipe.

The next campaign should preserve the R0 falsifiers as regression tests:

- same-state provider comparison;
- hidden-World non-leakage;
- semantic counterfactual mutations;
- order / surface permutation;
- proposition inversion where applicable;
- deterministic repeats;
- latency;
- zero World authority.

A learned candidate earns promotion only by surviving these tests more robustly than the stock baselines.


## R1 tiny encoder feasibility — MiniLM-L3 live result

After closing the stock generative-readout route, R1 tested a fundamentally different local substrate:

- model: `Xenova/paraphrase-MiniLM-L3-v2`;
- pinned revision: `4b544e74dfc3256b2b56849ea5d7064fee1ac846`;
- 3-layer BERT/MiniLM encoder, 384-dimensional pooled representation;
- Transformers.js feature extraction only;
- WebGPU / q8;
- no decoding, no action selection, no authority.

The benchmark used all eight held-out TEST private states from the R1 counterfactual suite.

### Runtime

- load/setup: **3123.3 ms**;
- first warm-up inference: **447.5 ms**;
- sequential mean: **88.0 ms**;
- sequential median: **65.1 ms**;
- sequential range: **55.2–244.3 ms**;
- batch 8: **245.8 ms total = 30.7 ms/state**.

This is one live run on the Owner browser/GPU and should not yet be treated as a final latency distribution. It is nevertheless a different execution regime from the earlier generative baselines (~seconds per judgement).

### Representation sensitivity

Cosine distances between matched held-out counterfactual private states:

| pair | cosine similarity | distance |
| --- | ---: | ---: |
| addressed vs overheard | 0.995680 | 0.004320 |
| warning vs ordinary request | 0.979798 | 0.020202 |
| fast close vs ordinary pass | 0.993989 | 0.006011 |
| hidden World event vs epistemic control | 1.000000 | 0.000000 |

Interpretation:

- **PASS — runtime feasibility worth pursuing.**
- **PASS — hard epistemic equality survives serialization/encoding exactly in this run.**
- Observable causal mutations create non-zero representation changes.
- The largest tested separation is the semantic warning/request mutation, which is encouraging but is **not** evidence that the embedding direction already corresponds to our appraisal dimensions.

The next earned experiment is therefore a frozen-encoder learned head:

`private state -> frozen MiniLM embedding -> learned per-dimension appraisal head`

trained only on R1 TRAIN relational constraints and evaluated untouched on DEV/TEST.

The encoder itself should remain frozen for this first learned baseline. This isolates whether a cheap readout can recover the causal appraisal relations before introducing LoRA/backbone adaptation.


## R1 frozen MiniLM prototype head — seed generalization result

The first learned R1 candidate deliberately kept the encoder frozen.

Pipeline:

`actor-private state -> frozen MiniLM-L3 q8 embedding -> per-dimension linear direction`

The five head directions were constructed **only from TRAIN directional embedding differences**. There was no gradient update to MiniLM, no DEV/TEST fitting, no absolute target probability and no action authority.

The seed R1 suite contained:

- 24 actor-private states;
- 33 causal relations;
- 11 relations per TRAIN / DEV / TEST;
- split-specific wording and physical context;
- hard hidden-World equality constraints.

A lexical surface-memorizer negative control had already established that the split is non-trivial:

- TRAIN: **11/11**;
- DEV: **8/11**;
- TEST: **8/11**;
- all three held-out warning-vs-request semantic relations failed on both DEV and TEST.

### Live frozen-encoder learned-head result

On the Owner browser/GPU:

- TRAIN: **11/11**;
- DEV: **11/11**;
- TEST: **11/11**;
- every dimension passed its current seed relations:
  - attention: 2/2 per split;
  - interrupt: 2/2 per split;
  - social: 2/2 per split;
  - threat: 3/3 per split;
  - cognition: 2/2 per split.
- all 24 state embeddings were produced in **411.9 ms** using batches of 8;
- head construction + evaluation took **1.300 ms**;
- embedding width: 384.

### Interpretation

**POSITIVE SEED SIGNAL — NOT YET PROMOTION.**

This is the first R1 experiment where held-out success can reasonably be called a small amount of learned semantic generalization rather than prompt compliance:

- the head never saw DEV/TEST relations during construction;
- warning-vs-request holds physics and addressee fixed;
- DEV/TEST use different warning/request wording;
- the surface memorizer fails exactly these held-out semantic relations;
- frozen MiniLM + train-only direction passes them.

However the suite is still tiny and structurally simple. 11/11 can still be explained by an easy pretrained embedding geometry or semantic shortcut.

The next gate is therefore adversarial OOD testing, not architecture expansion:

- danger-word decoy without immediate danger;
- explicit reassurance / safe-to-continue speech;
- additional paraphrases with no TRAIN overlap;
- matched private-state context wherever possible.

Only if the same train-only head survives those should R1 invest in a richer trained head or LoRA/backbone adaptation.


## R1 supervision correction + frozen encoder rerun

The initial 11/11 seed result exposed a supervision-design issue during red-team review: using an urgent warning as the positive target for **deeper cognition** was not sufficiently defensible. An urgent warning may demand immediate reflex rather than deliberation.

R1 therefore changed the cognition family before further promotion:

- removed `urgent warning > ordinary request` as a cognition target;
- added a dedicated matched `ambiguous/conditional instruction > clear instruction` cognition family;
- physics and addressee are identical within each cognition pair;
- TRAIN / DEV / TEST wording was made deliberately lexically distinct.

The current seed suite contains:

- **30 private states**;
- **33 relations**;
- 10 states and 11 relations per split;
- five hard hidden-World equality constraints per split.

The surface-memorizer negative control still passes TRAIN but remains at **8/11** on DEV and TEST, confirming that the new semantic families are not solved by its TRAIN lexical vocabulary.

### Frozen MiniLM head on corrected supervision

The same frozen MiniLM + train-only prototype-direction method was rerun.

Result:

- TRAIN: **11/11**;
- DEV: **11/11**;
- TEST: **10/11**.

The only TEST failure was:

- dimension: `threat`;
- family: `test:approach-speed`;
- constraint: `test:fast-close-threat-over-pass`;
- margin: **-1.522e-3**.

The new cognition ambiguity relation passed on DEV and TEST.

Runtime for this run:

- embedding all 30 states in batches of 8: **620.0 ms**;
- linear head construction + all-relation evaluation: **1.300 ms**.

### Interpretation

This is a more useful result than the earlier perfect score.

The frozen sentence encoder transfers the held-out linguistic relations, including the corrected cognition family, but fails one explicitly physical/numeric relation. That suggests an architectural split rather than a reason to train the language encoder harder:

- semantic/language representation can come from a tiny encoder;
- precise physical/perceptual quantities should remain explicit structured channels;
- the learned reflex head should consume both.

The next controlled experiment should therefore keep the encoder and training method fixed and compare:

1. encoder-only representation;
2. encoder embedding + explicit normalized actor-private structured features.

If the hybrid fixes the physical threat relation without degrading held-out semantic relations, that is evidence for a hybrid ReflexBrain substrate rather than a text-only brain.


## R1 adversarial OOD red-team — encoder-only vs hybrid

To avoid contaminating the shared execution branch, this campaign branched from the qualified hybrid checkpoint at:

- base: `c5d937095ecc563a30d8334c6bb7e076ff7991bd`;
- OOD branch: `experiment/r1-ood-red-team-v1`;
- qualified/deployed code checkpoint for the margin readout: `91812657420b5e9d27a0f70b41069f1d8bb950ac`.

The red-team adds an evaluation-only fourth split:

- **10 OOD private states**;
- **11 OOD causal relations**;
- OOD labels never participate in head construction;
- training remains the original TRAIN directional relations only.

The OOD mirror includes:

1. novel addressed vs overheard request;
2. immediate warning vs a matched reassurance containing the literal word `DANGER`;
3. novel unresolved-prerequisite vs clear instruction;
4. alternate fast-closing vs pass-by kinematics;
5. hidden urgent `DANGER! Run now!` World event outside actor perception, constrained equal on all five dimensions.

The apparatus itself was qualified before live inference:

- warning and danger-word reassurance differ only in speech content;
- hidden urgent speech changes World events but leaves actor-private state identical;
- serialized semantic input is identical for hidden/control;
- structured channels are also identical for hidden/control;
- OOD constraints provably do not update prototype-head weights.

### Live A/B result

Same frozen MiniLM encoder, same train-only prototype head construction, same 40 total states:

| representation | TRAIN | DEV | TEST | OOD |
| --- | ---: | ---: | ---: | ---: |
| encoder-only 384d | 11/11 | 11/11 | 10/11 | 10/11 |
| hybrid 384d + 12 structured | 11/11 | 11/11 | 11/11 | 11/11 |

Encoder-only failed the same class of relation in both ordinary TEST and adversarial OOD:

- TEST physical threat: `fast-close > pass`, margin about **-2.122e-3** in this run;
- OOD physical threat: `fast-close > pass`, margin **-1.6302e-5**.

Hybrid fixed both while preserving the held-out semantic relations.

### OOD margin comparison

| OOD relation | encoder-only | hybrid | interpretation |
| --- | ---: | ---: | --- |
| addressed social > overheard | +3.2022e-2 | +9.9808e-1 | explicit addressee channel dominates as intended |
| addressed attention > overheard | +3.2022e-2 | +9.9808e-1 | explicit addressee channel dominates as intended |
| warning interrupt > danger-word reassurance | +4.0324e-2 | +4.0324e-2 | semantic separation comes from encoder |
| warning threat > danger-word reassurance | +4.5587e-2 | +3.1493e-2 | semantic relation survives hybrid, with reduced margin |
| ambiguous cognition > clear instruction | +1.3254e-2 | +1.3254e-2 | semantic relation survives, but margin is small |
| fast-close threat > pass | -1.6302e-5 FAIL | +7.1542e-1 | structured kinematics fix sentence-encoder blind spot |
| hidden urgent danger equalities | exactly 0 on all five axes | exactly 0 on all five axes | epistemic boundary preserved |

Runtime in these live 40-state passes remained sub-second for the embedding stage:

- encoder-only embedding pass: **761.1 ms / 40 states**;
- hybrid embedding pass: **742.2 ms / 40 states**;
- head construction + all relation evaluation: roughly **1.2–1.3 ms**.

The small timing difference between encoder-only and hybrid should be treated as run noise; structured concatenation is negligible compared with encoder inference.

### Current interpretation

**MATERIAL POSITIVE FINDING — STILL NOT A PROMOTED FINAL REFLEXBRAIN.**

What is now supported:

- a tiny frozen semantic encoder is fast enough to remain a serious local-browser substrate;
- semantic relations can transfer beyond the lexical TRAIN surface;
- explicit actor-private structured channels are materially better than forcing exact physical/perceptual facts through text;
- hybrid representation repairs the repeated physical threat failure without breaking the current semantic OOD;
- hidden World facts remain excluded exactly.

What is not yet supported:

- that five prototype directions are a sufficiently robust appraisal head;
- that current semantic margins are wide enough for noisy temporal gameplay;
- calibrated probabilities;
- stability across many semantic paraphrase families;
- generalization across richer actor roles, commitments, relations and environments;
- temporal hysteresis / dynamics under live continuous streams;
- any World or body authority.

The semantic OOD margins are the limiting evidence now:

- danger-decoy margins are positive but only ~0.03–0.04;
- cognition is only ~0.013;
- hybrid threat semantics lose some margin when physical structured supervision is added to the same threat direction.

That last point matters: hybridization fixes physical truth, but a single normalized prototype direction per appraisal dimension can still trade semantic and physical geometry against each other.

### Earned next gate

Do **not** jump to LoRA, a larger backbone or agent integration yet.

Next R1 work should stress and improve the learned appraisal surface itself:

1. expand semantic OOD families rather than adding dimensions;
2. include negation, quoted-danger, reported speech, indirect warnings, benign hazard vocabulary and ambiguous/non-ambiguous paraphrases;
3. measure margin distributions, not only pass/fail;
4. repeat across multiple independent TRAIN family seeds;
5. compare prototype-direction heads with a tiny regularized learned linear/MLP head while the encoder remains frozen;
6. preserve structured actor-private channels as explicit inputs;
7. only after semantic robustness earns it, move into temporal Reflex Dynamics and embodied continuous episodes.

This keeps the project aimed at the real question: whether a cheap local semantic reflex layer can remain useful and stable under embodied causal variation, not whether a toy benchmark can be made green.


## R1 semantic OOD v2 — pragmatic/currentness adversaries

The OOD suite was expanded without changing TRAIN, DEV or TEST supervision.

New evaluation-only families add:

- indirect current warning vs non-current maintenance information using similar hazard vocabulary;
- the **same alarming quote** framed either as a current radio warning or as a completed historical drill;
- unsafe vs safe meaning with heavily overlapping lexical surface and negation;
- current unresolved uncertainty vs an old uncertainty report explicitly resolved later.

Current OOD size:

- **18 private states**;
- **18 causal relations**;
- OOD remains evaluation-only and cannot update prototype-head weights.

The apparatus passed CI before live inference. New matched semantic pairs were verified to have identical actor-private physical/addressee state after speech-text normalization. The quoted-warning pair contains the exact same alarming text on both sides:

`"RUN, THE CEILING IS FALLING!"`

Only pragmatic / temporal framing differs.

### Live result

| representation | TRAIN | DEV | TEST | OOD v2 |
| --- | ---: | ---: | ---: | ---: |
| encoder-only 384d | 11/11 | 11/11 | 10/11 | **16/18** |
| hybrid 384d + 12 structured | 11/11 | 11/11 | 11/11 | **16/18** |

Both representations fail the same two new semantic constraints:

- quoted current warning > completed old drill, `interrupt`;
- quoted current warning > completed old drill, `threat`.

Observed hybrid margins:

| OOD semantic relation | hybrid margin | result |
| --- | ---: | --- |
| danger-decoy interrupt | +2.3168e-2 | PASS |
| danger-decoy threat | +1.6263e-2 | PASS |
| indirect warning interrupt | +3.7537e-2 | PASS |
| indirect warning threat | +2.7529e-2 | PASS |
| quoted/current warning interrupt | **-7.9947e-3** | **FAIL** |
| quoted/current warning threat | **-5.9483e-3** | **FAIL** |
| negation unsafe > safe interrupt | +2.3092e-3 | PASS, very small margin |
| negation unsafe > safe threat | +2.2551e-3 | PASS, very small margin |
| ambiguity cognition | +1.5987e-2 | PASS |
| live uncertainty > resolved cognition | +3.8882e-2 | PASS |
| fast-close physical threat | +7.1871e-1 | PASS |
| hidden urgent danger equalities | exactly 0 on all five axes | PASS |

The encoder-only quoted interrupt failure was also **-7.9947e-3**. Hybrid threat changes slightly because the hybrid threat direction also incorporates explicit structured kinematic supervision, but it remains negative.

### Repeatability check

A second identical hybrid run on the same deployed code and same 48-state evaluation returned the same key margins to the displayed precision, including:

- quoted interrupt: **-7.9947e-3**;
- quoted threat: **-5.9483e-3**;
- negation interrupt: **+2.3092e-3**;
- negation threat: **+2.2551e-3**;
- physical threat: **+7.1871e-1**.

So the quoted failure is not currently behaving like a random sign flip from WebGPU numerical noise.

### Interpretation

**OOD v2 successfully found a real semantic boundary.**

The result is more informative than another perfect benchmark:

- explicit structured channels continue to solve exact physical/directness facts;
- they do not hide semantic failure;
- the frozen sentence encoder + one prototype direction handles direct warnings, indirect warnings, danger-word reassurance, negation and two uncertainty forms in this small campaign;
- it fails when identical alarming content must be interpreted differently because one occurrence is current/operative and the other is merely quoted historical information.

The very small positive negation margins are also a warning: PASS alone is not evidence of a robust semantic reflex.

### Next falsifier: supervision breadth before model complexity

Do **not** train on the failed OOD examples and do not move to LoRA yet.

Freeze OOD v2 exactly as it is. Add several **independent TRAIN-only semantic families** whose wording and scenario do not copy the quoted adversary, but which teach broader distinctions such as:

- current physical hazard vs already-resolved past hazard;
- active failure vs serviced/verified historical failure;
- unresolved prerequisite vs independently confirmed prerequisite.

Then compare, on the unchanged OOD v2:

1. original/base supervision;
2. expanded TRAIN semantic supervision;

with the encoder still frozen and the same transparent head construction first.

If expanded independent supervision fixes the quoted/currentness OOD relation, the representation likely contains useful information and the earlier failure was primarily supervision/head-direction poverty.

If it remains failed, the next question becomes head capacity / representation geometry, at which point a tiny regularized linear or MLP readout is earned before any backbone adaptation.


## R1 hardened semantic OOD + supervision-breadth A/B

This checkpoint supersedes the earlier semantic OOD interpretation where several examples were later proven vulnerable to exact-token shortcuts.

### Benchmark correction

A dedicated negative-control gate evaluated every semantic OOD directional relation using the TRAIN-only surface memorizer.

The first pass exposed real benchmark defects:

- danger-decoy and indirect-warning pairs were solvable from exact TRAIN token presence;
- expanded semantic TRAIN would additionally make the cognition pairs lexically solvable;
- an earlier quoted-warning phrasing also reused a positively weighted TRAIN token.

The benchmark was therefore corrected **before further MiniLM evaluation**.

Four semantic pairs were rebuilt so left/right share the same binary token set while meaning changes through ordering / negation / temporal role:

- active unsecured beam vs secured beam;
- support-pin failure now vs the same failure earlier;
- seal unconfirmed + checking required vs confirmed + checking not required;
- clearance unestablished + review required vs established + review not required.

The quoted-warning family keeps the exact same alarming quote on both sides but uses new, held-out pragmatic framing.

Qualification on the hardened checkpoint:

- 18 OOD states / 18 OOD relations;
- all physical/addressee matching tests PASS;
- hidden urgent World event remains actor-private identical;
- OOD cannot update head weights;
- **all 10 semantic OOD directional relations are unsolved by the exact-token memorizer under both base TRAIN and expanded TRAIN**.

This is the current semantic benchmark authority. Earlier pre-hardening OOD pass rates remain historical evidence only.

### Hardened live baseline

On the same frozen MiniLM-L3 q8 encoder and original prototype-direction head:

| representation / supervision | TRAIN | DEV | TEST | hardened OOD |
| --- | ---: | ---: | ---: | ---: |
| encoder-only / base | 11/11 | 11/11 | 10/11 | **10/18** |
| hybrid / base | 11/11 | 11/11 | 11/11 | **10/18** |

Hybrid still repairs the precise physical TEST/OOD threat relation through explicit actor-private kinematics, but it does not increase the aggregate hardened semantic OOD score.

Representative hybrid/base hardened OOD margins:

- same-token-beam interrupt: **-1.3347e-2 FAIL**;
- same-token-beam threat: **-8.9998e-3 FAIL**;
- current-vs-earlier interrupt: **-6.3510e-3 FAIL**;
- current-vs-earlier threat: **-5.0537e-3 FAIL**;
- revised quoted/current warning interrupt: **+2.8014e-3 PASS**;
- revised quoted/current warning threat: **+3.4574e-3 PASS**;
- negation interrupt: **-6.8066e-3 FAIL**;
- negation threat: **-4.9289e-3 FAIL**;
- seal cognition: **-4.3923e-3 FAIL**;
- physical fast-close threat: **+7.1879e-1 PASS**.

The hardened benchmark materially weakens the earlier claim that a single prototype direction already generalizes broadly. That earlier optimism was partly benchmark leakage.

### Independent TRAIN semantic-breadth experiment

A separate TRAIN-only augmentation added 6 states / 5 relations without copying hardened OOD surfaces:

- active pressure failure > repaired pressure failure, interrupt + threat;
- active uncontrolled hoist > serviced historical fault, interrupt + threat;
- unresolved interlock > confirmed interlock, cognition.

No encoder, representation, prototype-head math, DEV/TEST or OOD labels were changed.

Hybrid + expanded TRAIN result:

- TRAIN: **16/16**;
- DEV: **11/11**;
- TEST: **11/11**;
- hardened OOD: **16/18**.

Expanded hybrid margins:

- same-token-beam interrupt: **+5.6070e-3 PASS**;
- same-token-beam threat: **+5.1329e-3 PASS**;
- current-vs-earlier interrupt: **+7.3006e-3 PASS**;
- current-vs-earlier threat: **+6.1616e-3 PASS**;
- quoted/current warning interrupt: **+2.5265e-2 PASS**;
- quoted/current warning threat: **+2.3157e-2 PASS**;
- negation interrupt: **+2.4343e-3 PASS**;
- negation threat: **+2.0501e-3 PASS**;
- seal cognition: **-4.4603e-3 FAIL**;
- clearance cognition: **-8.8312e-3 FAIL**;
- physical fast-close threat: **+4.8144e-1 PASS**;
- hidden World equalities: exactly zero.

An identical repeat returned the same displayed margins, so the remaining failures and small positive signs are repeatable at the current measurement precision.

### Interpretation

**MATERIAL FINDING: the frozen encoder contains more useful semantic structure than the base prototype direction exposed.**

Independent supervision breadth changed hardened OOD from **10/18 to 16/18** without:

- changing the backbone;
- fitting DEV/TEST/OOD;
- copying OOD wording;
- giving the exact-token memorizer a shortcut.

That supports the hypothesis that much of the earlier failure was supervision/readout poverty rather than absence of semantic information in MiniLM.

But the current head is still not robust enough:

- two cognition relations remain inverted;
- several newly passing hazard relations have small margins around 0.002–0.007;
- one normalized sum-of-deltas direction per dimension is now the likely bottleneck.

### Earned next experiment

Freeze:

- MiniLM encoder revision;
- q8 WebGPU execution;
- hybrid 384D + 12 actor-private structured representation;
- base + independent expanded TRAIN;
- hardened DEV/TEST/OOD.

Compare the current prototype-direction head against a **small deterministic regularized linear ranking head** trained only from TRAIN pairwise relations.

Do not tune it on OOD. Use fixed training/regularization settings or select only from TRAIN/DEV if a selection step becomes necessary.

If a linear ranking head improves cognition and increases semantic margins without degrading invariants, head capacity/training was the next bottleneck.

If not, the next earned step becomes a tiny MLP/readout-capacity test while the encoder remains frozen. LoRA/backbone adaptation remains premature.


## R1 deterministic linear-ranking head — no gain over prototype

The next candidate changed only the readout optimization.

Frozen inputs remained:

- MiniLM-L3 q8;
- hybrid 384D encoder + 12 actor-private structured channels;
- expanded TRAIN supervision;
- hardened exact-token-resistant DEV/TEST/OOD;
- zero World/body authority.

The new head is deterministic pairwise logistic ranking with fixed settings chosen before OOD evaluation:

- TRAIN directional deltas only;
- each TRAIN delta normalized before optimization, matching prototype scale treatment;
- 400 deterministic batch-gradient iterations;
- L2 = 0.1;
- initial learning rate = 0.2 with fixed decay;
- final per-dimension weight vector normalized;
- no random initialization;
- no DEV/TEST/OOD fitting.

CI tests prove:

- contradictory OOD constraints do not change learned weights;
- repeated training is bitwise deterministic in the synthetic qualification fixture;
- training pairs are positively ranked;
- final scorer vectors remain normalized.

### Live A/B result

Prototype expanded hybrid:

- TEST **11/11**;
- hardened OOD **16/18**;
- cognition failures:
  - seal: **-4.4603e-3**;
  - clearance: **-8.8312e-3**.

Regularized linear-ranking expanded hybrid:

- TEST **11/11**;
- hardened OOD **16/18**;
- cognition failures:
  - seal: **-4.4603e-3**;
  - clearance: **-8.8312e-3**.

Representative linear-ranking OOD margins:

- beam interrupt: +5.4557e-3;
- beam threat: +4.9791e-3;
- current-vs-earlier interrupt: +7.0152e-3;
- current-vs-earlier threat: +5.8679e-3;
- quoted/current interrupt: +2.4924e-2;
- quoted/current threat: +2.2644e-2;
- negation interrupt: +2.1551e-3;
- negation threat: +1.8205e-3;
- physical threat: +4.9920e-1.

Head construction + evaluation took about **66 ms** in this browser run versus roughly 1–2 ms for the prototype; encoder pass still dominated at ~1.13 s for 54 states.

### Interpretation

**FAIL AS A HEAD-CAPACITY IMPROVEMENT.**

The deterministic regularized linear ranker does not recover either remaining cognition relation and provides no aggregate OOD gain.

This also weakens the hypothesis that the current bottleneck is merely the prototype's naive equal-sum construction.

However a nonlinear head is **not yet earned**.

Current cognition supervision is materially thinner than hazard supervision:

- base + augmentation cognition directional TRAIN relations: 2;
- interrupt: 3;
- threat: 4.

The exact unchanged cognition margins under prototype vs regularized linear ranking suggest the next question is representation/supervision geometry, not optimizer sophistication.

### Earned next diagnostic

Before adding MLP capacity or more cognition examples, inspect the frozen hybrid relation geometry:

- normalize each TRAIN directional delta;
- normalize each held-out directional delta;
- for every held-out relation, report cosine alignment to every same-dimension TRAIN delta;
- report nearest TRAIN delta, mean alignment and alignment to the prototype direction.

Particularly inspect:

- `ood:seal-unconfirmed-cognition-over-confirmed`;
- `ood:clearance-unestablished-cognition-over-resolved`;

against:

- base TRAIN cognition ambiguity delta;
- expanded TRAIN interlock cognition delta.

If both OOD cognition deltas are poorly or negatively aligned with all available TRAIN cognition deltas, broader independent cognition supervision is the earned next experiment.

If useful alignment exists but the scorer still points incorrectly, then head capacity becomes a stronger hypothesis.
