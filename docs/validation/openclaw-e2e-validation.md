# OpenClaw End-to-End Validation

This record comes from a real local `~/.openclaw` validation run using the current `harness` CLI path.

- Validated at: `2026-03-12T07:51:35.298Z`
- Source directory: `~/.openclaw`
- Artifact path: `.artifacts/openclaw-e2e/20260312T075132Z/openclaw-template.harness`
- Artifact sha256: `9dbcdb3878de3a12c25c14e9499a55f862f26afdab869616f007be3ce0360015`
- Artifact size: `4071021` bytes

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
- Pack ID: `b0e14d8c-2781-4364-9ed1-4c07084d0a28`
- Pack type: `template`
- Risk level: `internal-only`
- File count: `321`
- Total size: `7011102` bytes

## Export Policy

- Inspect recommended instance; exporting template diverges from the recommended pack type.

## Manifest

- Schema version: `0.5.0`
- Adapter: `openclaw`
- Image ID: `b0e14d8c-2781-4364-9ed1-4c07084d0a28`
- Binding workspace count: `1`
- Harness intent: `agent-runtime-environment`
- Harness target product: `openclaw`
- Harness components: `workspace, config, skills, cron, extensions, completions`

## Import And Verify

- Import success: `true`
- Imported target: `.artifacts/openclaw-e2e/20260312T075132Z/imported`
- Imported file count: `322`
- Verify valid: `true`
- Readiness class: `runtime_ready`
- Runtime ready: `true`
- Readiness summary: Imported harness is structurally valid and ready to run without additional manual steps.
- Verify checks: `directory_exists, config_exists, workspace_exists, workspace_file_agents.md, config_valid, manifest_contract, manifest_schema, manifest_pack_type, manifest_placement, manifest_rebinding, pack_type_contract, manifest_image, manifest_lineage, manifest_harness, workspace_bindings, binding_semantics, file_count, workspace_readable`

## Warnings

- Inspect: Config contains API keys or tokens
- Inspect: Agent auth-profiles.json detected (contains API credentials)
- Inspect: Credentials directory exists
- Import: Rebound workspace paths in openclaw.json to ./.artifacts/openclaw-e2e/20260312T075132Z/imported; JSON5 formatting/comments were normalized.
- Verify: none

The `.harness` artifact itself is retained only in the local `.artifacts/` directory and is intentionally not committed.
