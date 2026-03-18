# OpenClaw End-to-End Validation

This record comes from a real local `~/.openclaw` validation run using the current `harness` CLI path.

- Validated at: `2026-03-18T02:10:05.553Z`
- Source directory: `~/.openclaw`
- Artifact path: `.artifacts/openclaw-e2e/20260318T020957Z/openclaw-template.harness`
- Artifact sha256: `9c94dbbb9e7715144f1bbc1799a572d225c0361c7eb8285c55ac8cd82ffaff2c`
- Artifact size: `4716857` bytes

## Inspect

- Detected: `true`
- Product: `openclaw`
- Config file: `openclaw.json`
- Recommended pack type: `instance`
- Risk assessment: `trusted-migration-only`
- Workspace dirs: `workspace`
- Workspace file count: `166`
- Skill dir count: `18`
- Agent ids: `main`

## Export

- Success: `true`
- Pack ID: `e1a3c842-8a53-455e-a211-a80ada21e59a`
- Pack type: `template`
- Risk level: `internal-only`
- File count: `322`
- Total size: `7655990` bytes

## Export Policy

- Inspect recommended instance; exporting template diverges from the recommended pack type.

## Manifest

- Schema version: `0.5.0`
- Adapter: `openclaw`
- Image ID: `e1a3c842-8a53-455e-a211-a80ada21e59a`
- Binding workspace count: `1`
- Harness intent: `agent-runtime-environment`
- Harness target product: `openclaw`
- Harness components: `workspace, config, skills, cron, extensions, completions`

## Import And Verify

- Import success: `true`
- Imported target: `.artifacts/openclaw-e2e/20260318T020957Z/imported`
- Imported file count: `323`
- Verify valid: `true`
- Readiness class: `runtime_ready`
- Runtime ready: `true`
- Readiness summary: Imported harness is structurally valid and ready to run without additional manual steps.
- Verify checks: `directory_exists, config_exists, workspace_exists, workspace_file_agents.md, config_valid, manifest_contract, manifest_schema, manifest_pack_type, manifest_placement, manifest_rebinding, pack_type_contract, manifest_image, manifest_lineage, manifest_harness, workspace_bindings, binding_semantics, file_count, workspace_readable`

## Warnings

- Inspect: Config contains API keys or tokens
- Inspect: Agent auth-profiles.json detected (contains API credentials)
- Inspect: Credentials directory exists
- Import: Rebound workspace paths in openclaw.json to ./.artifacts/openclaw-e2e/20260318T020957Z/imported; JSON5 formatting/comments were normalized.
- Verify: none

The `.harness` artifact itself is retained only in the local `.artifacts/` directory and is intentionally not committed.
