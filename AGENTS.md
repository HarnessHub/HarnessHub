# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, Cursor, etc.) when working with code in this repository.

## What is ClawPack?

ClawPack is an application-layer packaging and distribution CLI for OpenClaw agents. It packages an agent's workspace, config, state, and credentials into a portable `.clawpack` archive (gzipped tar containing `manifest.json`, `config/`, `workspace/`, `state/`, `reports/`).

## Commands

```bash
npm run build          # compile TypeScript (tsc)
npm test               # run all tests (vitest run)
npm run preflight      # build + tests + local harness checks
npm run smoke          # CLI smoke validation
npm run review:checkpoint  # create/update .codex-review + proof
npm run pm -- init     # initialize local PM workspace
npm run test:watch     # run tests in watch mode
npx vitest run test/e2e.test.ts              # run a single test file
npx vitest run -t "exports a template pack"  # run a single test by name
npm run dev            # tsc --watch
```

## Architecture

```
src/cli.ts               — entry point, registers four commands via commander
src/commands/
  inspect.ts             — scan and report on an OpenClaw instance
  export.ts              — export instance to .clawpack archive
  import.ts              — import .clawpack archive to target directory
  verify.ts              — post-import structural checks
src/core/
  scanner.ts             — detect OpenClaw instances, sensitive data detection (SENSITIVE_PATTERNS, detectSensitiveContent())
  packer.ts              — export/import logic, exclusion lists (TEMPLATE_EXCLUDES, ALWAYS_EXCLUDE)
  verifier.ts            — structural verification checks (VerifyCheck objects)
  types.ts               — shared types (PackType, RiskLevel, Manifest, etc.) and SCHEMA_VERSION constant
src/utils/
  output.ts              — text/json formatting helpers
```

Tests are in `test/e2e.test.ts` — a single file that tests the core modules directly (scanner, packer, verifier) using temp directories.

Harness and workflow support lives in:

- `.codex/skills/ccpm-codex/` — local issue-task-PR workflow guidance
- `.codex/skills/harness-gap-closure/` — convert repeated workflow failures into guardrails
- `.codex/pm/` — local PRD/epic/task/state documents
- `.githooks/pre-push` — local review/proof/closure guardrail
- `scripts/` — PM, review checkpoint, preflight, and CLI smoke commands

## Key Concepts

- **PackType**: `"template"` (excludes known secrets and is share-oriented) vs `"instance"` (full migration, includes everything)
- **RiskLevel**: `"safe-share"` | `"internal-only"` | `"trusted-migration-only"`
- **State directory**: defaults to `~/.openclaw`, auto-detected from several known names

## Conventions

- TypeScript strict mode, ESM (`"type": "module"` in package.json, `Node16` module resolution)
- All commands support `-f text` (default) and `-f json` output
- Errors set `process.exitCode = 1` — never call `process.exit()`
- JSON output goes to stdout; human-readable errors go to stderr
- File paths use `node:path` and `node:fs` — no third-party fs utilities
- Archive handling uses the `tar` npm package
- Import paths in source use `.js` extensions (ESM convention)
- Use `node scripts/codex-pm.mjs` for repository-local task, issue-state, and PR-body workflows instead of ad hoc notes
- Before push, prefer `./scripts/run-codex-review-checkpoint.sh` and `./scripts/run-agent-preflight.sh`
- Any repeated workflow mistake that should have been blocked locally should be treated as a harness gap and fixed through the local guardrail layer
