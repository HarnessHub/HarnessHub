# MVP Harness Image Specification

## Status

Current MVP specification for the implemented HarnessHub image contract.

This document describes the image model that currently exists in code. It is not a separate aspirational design.

## Purpose

HarnessHub packages the harness layer of an agent runtime environment into a portable `.harness` artifact.

For the MVP, the specification defines:

- archive shape
- manifest contract
- pack types
- placement rules
- rebinding rules
- verification semantics

The current production-grade adapter is OpenClaw, but the image contract is written at the HarnessHub image layer rather than as an OpenClaw-only snapshot format.

## Artifact Format

The artifact extension is `.harness`.

The payload is a gzipped tar archive. The archive currently contains:

- `manifest.json`
- `config/`
- `workspace/`
- `workspaces/`
- `reports/`
- `state/`

These top-level roots are reserved by the placement contract.

## Manifest Contract

Every valid image must declare:

- `schemaVersion`
- `packType`
- `packId`
- `createdAt`
- `image`
- `lineage`
- `placement`
- `rebinding`
- `bindings`
- `harness`
- `source`
- `includedPaths`
- `workspaces`
- `sensitiveFlags`
- `riskLevel`

### Schema Version

The current schema version is `0.5.0`.

### Image Metadata

`image` identifies the image itself:

- `image.imageId`
- `image.adapter`

This is distinct from the original source instance path or host-specific runtime identity.

### Lineage Metadata

`lineage` reserves future composition fields:

- `lineage.parentImage`
- `lineage.layerOrder`

In the MVP these fields are present and validated, but composition behavior is still deferred.

### Placement Contract

`placement` defines the archive namespaces and persisted manifest location:

- `placement.reservedRoots`
- `placement.componentRoots.config`
- `placement.componentRoots.workspace`
- `placement.componentRoots.workspaces`
- `placement.componentRoots.reports`
- `placement.componentRoots.state`
- `placement.persistedManifestPath`

The current persisted manifest path after import is `.harness-manifest.json`.

### Rebinding Contract

`rebinding` defines which imported values are expected to change at materialization time:

- `rebinding.workspaceTargetMode`
- `rebinding.mutableConfigTargets`

The current workspace target mode is `absolute-path`.

### Binding Semantics

`bindings.workspaces` declares import-time workspace rebinding requirements:

- `agentId`
- `logicalPath`
- `targetRelativePath`
- `configTargets`
- `required`

The importer is expected to materialize those workspace targets and rewrite the declared config targets accordingly.

### Harness Metadata

`harness` describes the portable harness layer being packaged:

- `harness.intent`
- `harness.targetProduct`
- `harness.components`

The current MVP intent is `agent-runtime-environment`.

### Source Metadata

`source` records the source runtime that the adapter inspected:

- `source.product`
- `source.version`
- `source.configPath`

### Sensitive Flags And Risk

`sensitiveFlags` records the source signals detected during inspection.

`riskLevel` is the export risk classification:

- `safe-share`
- `internal-only`
- `trusted-migration-only`

## Pack Types

The MVP defines two pack types.

### `template`

`template` is share-oriented and excludes known runtime-state and secret-heavy paths.

Current contract:

- allowed when the user explicitly wants a share-oriented artifact
- blocked by default when inspect recommends `instance` and the caller has not explicitly overridden that recommendation
- must not declare forbidden runtime-state components such as `agents`, `credentials`, `sessions`, `memory`, `logs`, or `browser`
- must not include forbidden top-level state paths such as `agents/`, `credentials/`, `memory/`, `logs/`, `browser/`, `devices/`, or `identity/`

### `instance`

`instance` is migration-oriented and retains more runtime state.

Current contract:

- recommended when inspection finds sensitive or migration-only signals
- allowed even when inspect would accept `template`
- emits policy warnings when the source qualifies for `template` but the caller still exports `instance`

## Placement Rules

The MVP reserves these archive namespaces:

- `config/` for adapter-visible configuration material
- `workspace/` for the default workspace
- `workspaces/` for additional named workspaces
- `reports/` for export metadata
- `state/` for retained runtime-oriented state that is still part of the current image contract

The placement contract is part of the manifest and is checked during verify.

## Import And Materialization Semantics

Import restores archive contents into the target directory and persists a copy of the manifest to `.harness-manifest.json`.

Current MVP materialization behavior includes:

- unpacking the archive
- restoring reserved roots
- rebinding workspace targets into the imported config
- validating the imported manifest contract before materialization continues

The MVP does not yet implement parent-image resolution or layer composition.

## Verification Semantics

Verification currently evaluates two related but distinct questions:

- is the imported harness structurally valid
- is the imported harness runtime-ready

### Structural Validity

`valid=true` means the imported result passed the structural verification gate.

This includes checks such as:

- target directory existence
- workspace existence
- manifest contract validity
- pack-type contract validity

### Readiness Classes

Verification also returns an explicit readiness class:

- `runtime_ready`
- `manual_steps_required`
- `structurally_invalid`

Current meaning:

- `runtime_ready`: structural verification passed and no remaining runtime-readiness issues were detected
- `manual_steps_required`: the import is structurally valid, but additional follow-up is still needed before it should be treated as runnable
- `structurally_invalid`: structural verification failed and the result should not be treated as an acceptable import

For compatibility, verification also still returns the boolean `runtimeReady`.

### Runtime Readiness Issues

`runtimeReadinessIssues` enumerates the follow-up or blocking conditions that prevented a `runtime_ready` classification.

Current examples include:

- missing required workspace files
- invalid or missing config needed for runtime binding checks
- missing imported workspace targets
- binding semantics not correctly rebound

## Current MVP Boundaries

This specification intentionally reflects the current implemented MVP, including its limits.

Not yet part of the active MVP behavior:

- composed parent images
- layered merge semantics
- registry lookup
- adapter-neutral runtime-readiness subclasses

## Reference Implementation

The current implementation of this specification is primarily represented by:

- `src/core/types.ts`
- `src/core/manifest.ts`
- `src/core/pack-contract.ts`
- `src/core/packer.ts`
- `src/core/verifier.ts`

The real OpenClaw validation record in `docs/validation/openclaw-e2e-validation.md` is the current concrete example of the implemented contract.
