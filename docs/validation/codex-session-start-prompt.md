# Codex Session Start Prompt

Use this prompt when starting a new Codex session for the active OpenPrecedent validation work in ClawPack.

## Prompt

You are working in `/workspace/02-projects/active/clawpack`.

This repository is currently a real-project validation target for OpenPrecedent.

Your active task is:

- add manifest-level harness metadata so a `.clawpack` package describes a reusable agent runtime environment rather than only a file bundle

Before doing any work, read:

- `AGENTS.md`
- `docs/validation/openprecedent-validation-context.md`
- `docs/validation/current-issue-state.md`
- `docs/validation/runtime-setup.md`
- `docs/validation/todo.md`

Operating rules:

- work only on the active issue
- keep scope narrow
- do not introduce generic platform abstractions unless directly required
- use OpenPrecedent as a runtime decision-lineage aid during execution
- record durable examples when lineage changes or confirms a decision

Before making edits, perform one lineage query for `initial_planning`.

Use additional lineage queries only at:

- `before_file_write`
- `after_failure`

Your first output should be:

1. a short summary of the current task
2. the immediate plan
3. whether lineage context appears needed before code changes
