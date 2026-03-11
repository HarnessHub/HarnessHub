# Runtime Setup

## Shared OpenPrecedent Home

Use one stable runtime home across all Codex sessions:

```bash
export OPENPRECEDENT_HOME="$HOME/.openprecedent/runtime"
```

This keeps runtime lineage history, invocation logs, and shared context in one place across sessions.

## Recommended Startup Check

Run:

```bash
export OPENPRECEDENT_HOME="$HOME/.openprecedent/runtime"
echo "$OPENPRECEDENT_HOME"
```

If you want a shell with the variable already set, use:

```bash
./scripts/dev-with-openprecedent.sh bash
```

## Query Timing

Use the OpenPrecedent workflow when prior judgment may materially affect direction:

- `initial_planning`
- `before_file_write`
- `after_failure`

Do not query on every turn.
