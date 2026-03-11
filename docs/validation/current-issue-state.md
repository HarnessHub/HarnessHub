# Current Issue State

## Active Goal

Use ClawPack as the first real external project for validating OpenPrecedent decision-lineage reuse and harness transfer during live Codex development.

## Current Product Position

ClawPack should be treated as an agent harness packaging tool.
It packages reusable agent runtime environments, not only one OpenClaw-specific bundle format.

## Current Constraints

- keep the work issue-scoped
- do not introduce generic platform abstractions unless the chosen task requires them
- use OpenPrecedent during execution, not only for post-hoc analysis
- transfer only a minimal harness set at first
- prefer one real feature task over infrastructure-only changes

## What Has Already Been Decided

- OpenPrecedent owns the main research plan and final validation report
- ClawPack owns the local execution documents for new Codex sessions
- all Codex sessions should share `OPENPRECEDENT_HOME=$HOME/.openprecedent/runtime`
- lineage queries should be used at `initial_planning`, `before_file_write`, and `after_failure`

## Next Actions

1. align ClawPack docs and local instructions with the validation setup
2. implement the first real feature task: add manifest-level harness metadata that makes a package describe a reusable agent runtime environment
3. run that task with OpenPrecedent lineage queries enabled
4. record concrete examples where lineage changed or confirmed a decision

## Not In Scope Right Now

- generic runtime SDK design
- hosted multi-user architecture
- broad process migration beyond the minimal harness set
