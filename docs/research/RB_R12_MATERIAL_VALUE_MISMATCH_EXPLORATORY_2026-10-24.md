# RB-R12 — material work versus motor-efficiency proxy (exploratory, 24 Oct 2026)

**Status: EXPLORATORY. NOT preregistered, NOT an organism/learning-skill PASS.** This comparison was conceived and first executed outside the repository on 24 Oct using the unchanged *compiled* R8 static artifact from source PR #89 (GitHub Actions 39871990222, SHA `329e1d99`). The fixed geometry and five scenes below were already inspected before this repository test was authored. Consequently, green CI on this test does NOT constitute independent confirmatory validation.

## Question

Does the original O-DEV `DevResident.finish` score (`clamp(mobility - .5*resistance,-.5,1)`) necessarily favor manipulation of matter over avoiding its resistance? No. The model estimates body movement and sensed resistance, **not persistent World value or altered affordances**.

## Frozen REPLAY of exploratory comparison

Original unchanged `LivingWorld(false,'B0')`, Rapier 120 Hz, private `observe()` 30 Hz, true author commands: forward (0.55), left/right (0.4 drive, +/-0.65 turn), reverse (-0.35 drive). Five independently initialized worlds: empty; 1 small dynamic square at (3,0), half-extents (.65,.65); two dynamic squares at (3,0) and (4.5,0); corresponding anchored square; one large dynamic square at (3,0), half-extents (1.2,1.2). Each 180 real ticks (1.5 s), 45 lawful perception samples, same actor initial pose, full physical reset between independent arms. Host `inspect()` ONLY assesses true moved material; motor scores use only actor-private sampled proprio and touch. No new model, reward, motion controller, World ID or label passes to the resident.

Initial independently executed compiled R8 exploratory measurement:

| Environment | motor0 forward score / moved | motor1 turn score / moved | motor2 turn score / moved | motor3 reverse score / moved |
|---|---:|---:|---:|---:|
| empty | .84930 / 0 | .60537 / 0 | .60537 / 0 | .54046 / 0 |
| oneMovable | .68052 / 1.7858 | .58125 / .4015 | .58125 / .4015 | .54046 / 0 |
| twoMovable | .59438 / 2.6211 | .58125 / .4015 | .58125 / .4015 | .54046 / 0 |
| oneAnchored | .27875 / 0 | .54801 / 0 | .54801 / 0 | .54046 / 0 |
| largeMovable | .44718 / 1.3032 | .47236 / .5680 | .47236 / .5680 | **.54046 / 0** |

**Qualified interpretation:** One actual high-resistance starting situation ranks non-manipulating reverse higher than moving heavy material; two lighter geometries rank forward manipulation highest. This exposes a conditional mismatch between body-local mobility and world-scale material effects. It does **NOT** show a persistent resident preferring reverse over its entire life, because a real O-DEV explores sequential states and two local contact contexts and may observe other opportunities. These are *researcher-imposed candidate command* comparisons, NOT self-authored aspirations or a proof of meaningful affordance, ecological needs or life.

## New source-run parity challenge

The repository test replays all 20 controls using the actual source `LivingWorld`, and separately runs unchanged `DevResident('adaptive')` for its first *real* 180-tick training window to compare the predicted numeric score against the original learner's saved value at tick180. This is the primary check for accidental diagnostic misreading. If parity fails, retract numerical interpretation rather than retune the physics/learning parameters to make the test green.

## Limits and next decision

Do not make material displacement the next reward! That would replace one narrow engineered proxy with another. True future significance should eventually be assessed in a continuing embodied history, including what actions the material change later makes possible and whether *individual learned history* changes a subsequent decision against cheap controls.

This isolated draft is **based directly on R8 #89**. Do not merge R12 into R8, main, Pages, Jaskinia or active living resident automatically. No Owner experience qualification. Avoid indefinitely expanding seed/geometry sweeps. If parity/physics tests agree, stop this micro-probe and return to the broader organism/world coupling question.
