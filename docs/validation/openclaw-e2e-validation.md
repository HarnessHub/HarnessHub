# OpenClaw End-to-End Validation

This record comes from a real local `~/.openclaw` validation run using the current `harness` CLI path.

- Validated at: `2026-03-12T06:37:07.412Z`
- Source directory: `~/.openclaw`
- Artifact path: `.artifacts/openclaw-e2e/20260312T063701Z/openclaw-template.harness`
- Artifact sha256: `e15876aa51aef57ba57828481ce457a9adffe95610e3ceeccfdc37707e384cb4`
- Artifact size: `4154926` bytes

## Inspect

- Detected: `true`
- Product: `openclaw`
- Config file: `openclaw.json`
- Recommended pack type: `instance`
- Risk assessment: `trusted-migration-only`
- Workspace dirs: `workspace`
- Workspace file count: `165`
- Skill dir count: `18`
- Agent ids: `main`

## Export

- Success: `true`
- Pack ID: `64ceb066-b454-46b4-8755-88383a5817ab`
- Pack type: `template`
- Risk level: `internal-only`
- File count: `343`
- Total size: `7279282` bytes

## Manifest

- Schema version: `0.5.0`
- Adapter: `openclaw`
- Image ID: `64ceb066-b454-46b4-8755-88383a5817ab`
- Binding workspace count: `1`
- Harness intent: `agent-runtime-environment`
- Harness target product: `openclaw`
- Harness components: `workspace, config, skills, agents, sessions, cron, extensions, browser, completions`

## Import And Verify

- Import success: `true`
- Imported target: `.artifacts/openclaw-e2e/20260312T063701Z/imported`
- Imported file count: `344`
- Verify valid: `true`
- Verify checks: `directory_exists, config_exists, workspace_exists, workspace_file_agents.md, config_valid, agents_present, manifest_schema, manifest_pack_type, manifest_image, manifest_lineage, manifest_harness, workspace_bindings, binding_semantics, file_count, workspace_readable`

## Warnings

- Inspect: Config contains API keys or tokens
- Inspect: Agent auth-profiles.json detected (contains API credentials)
- Inspect: Credentials directory exists
- Import: Rebound workspace paths in openclaw.json to ./.artifacts/openclaw-e2e/20260312T063701Z/imported; JSON5 formatting/comments were normalized.
- Verify: Agent "main" missing agent/ subdirectory

The `.harness` artifact itself is retained only in the local `.artifacts/` directory and is intentionally not committed.
