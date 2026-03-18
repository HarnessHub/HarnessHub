# OpenClaw End-to-End Validation

This record comes from a real local `~/.openclaw` validation run using the current `harness` CLI path.

- Validated at: `2026-03-18T09:24:46.421Z`
- Source directory: `~/.openclaw`
- Artifact path: `.artifacts/openclaw-e2e/20260318T092439Z/openclaw-template.harness`
- Artifact sha256: `329857a47217b9dbd15c188ae9d8f9f3a7cd07c3c4c33d8ede4d9878eb7428c3`
- Artifact size: `947462` bytes

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
- Pack ID: `5e311579-f0cb-4148-b550-b659e1ee6c47`
- Pack type: `template`
- Risk level: `internal-only`
- File count: `322`
- Total size: `7655990` bytes

## Export Policy

- Inspect recommended instance; exporting template diverges from the recommended pack type.

## Manifest

- Schema version: `0.5.0`
- Adapter: `openclaw`
- Image ID: `5e311579-f0cb-4148-b550-b659e1ee6c47`
- Binding workspace count: `1`
- Harness intent: `agent-runtime-environment`
- Harness target product: `openclaw`
- Harness components: `workspace, config, skills, cron, extensions, completions`

## Import And Verify

- Import success: `true`
- Imported target: `.artifacts/openclaw-e2e/20260318T092439Z/imported`
- Imported file count: `199`
- Verify valid: `true`
- Readiness class: `runtime_ready`
- Runtime ready: `true`
- Readiness summary: Imported harness is structurally valid and ready to run without additional manual steps.
- Verify checks: `directory_exists, config_exists, workspace_exists, workspace_file_agents.md, config_valid, manifest_contract, manifest_schema, manifest_pack_type, manifest_placement, manifest_rebinding, pack_type_contract, manifest_image, manifest_lineage, manifest_harness, workspace_bindings, binding_semantics, file_count, workspace_readable`

## Warnings

- Inspect: Config contains API keys or tokens
- Inspect: Agent auth-profiles.json detected (contains API credentials)
- Inspect: Credentials directory exists
- Import: Rebound workspace paths in openclaw.json to ./.artifacts/openclaw-e2e/20260318T092439Z/imported; JSON5 formatting/comments were normalized.
- Verify: Some files may not have been imported: 199 found vs 322 expected

The `.harness` artifact itself is retained only in the local `.artifacts/` directory and is intentionally not committed.
