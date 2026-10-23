# PP0A — bounded source-recovery fixture correction after archive metadata (BEFORE first source run)
Date 2026-10-23. **Technical change**, NOT biological retuning. The originally frozen PP0 dummy selection `01dumbbell_shaped/01normal` could not be extracted under the frozen 70MB-per-file gate: actual authoritative TAR central/index traversal shows `cells_file` **405,953,641 B** and folder **434,876,721 B**. [Original RED without source execution #40004146144](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/40004146144). Do NOT call that a model FAIL.

[Archive metadata-only PASS #40004706011](https://github.com/Jozzpoly/ReflexBrain-Lab/actions/runs/40004706011) established:
- `examples.tar.gz` compressed 47,189,898 bytes; **934,413,148 B** across 34 uncompressed files. We did NOT extract it.
- Published `examples/01dumbbell_shaped/01normal`: 434,876,721 B, max file 405,953,641 B — exceeds safe bounds.
- Published `examples/02reticulated/01normal`: 421,198,662 B, max 392,275,972 B — exceeds.
- **Published `examples/02reticulated/02fix`: 57,971,688 B, max file 29,049,130 B** — fits bounded extraction.
- `examples/03mix/inputs` ~20MB but requires the author's separate Python orchestration; not a standalone single original executable input.

**Revised one-time source execution fixture:** EXACTLY `examples/02reticulated/02fix`, with all author's original fix/fragment/seed.ini settings left unchanged. The word `fix` may imply **manually fixed cells, not an unassisted organism**; any ecological or biological conclusion is therefore forbidden in PP0A, even if steps execute. This is **only original exemplar-state recoverability**, no spontaneous behavior qualification.

Revised caps: individual TAR member ≤50MB; selected directory extracted total ≤90MB; entire archive UNCOMPRESSED sum indexed ≤1.1GB (only **selected** folder extracted). Original source commit, unchanged `praparat_cui`, exact 10 steps, only `&cycle` altered, 150s process timeout, 3GB cap, no other edits. Keep old failure and new decision in history. If this bounded fixture fails, STOP source execution; no automatic scaling to 400MB archival examples or expensive full evolution.
