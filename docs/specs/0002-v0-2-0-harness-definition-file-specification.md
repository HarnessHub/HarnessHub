# HarnessHub v0.2.0 Harness Definition File Specification

## Status

Planned for the `0.2.0` version line.

This document defines the repository-local harness definition file introduced by `harness init`.

## File Name

The default file name is:

`harness.definition.json`

The file is intended to live in the repository root of the harness being defined.

## Purpose

The definition file is the explicit source of truth for a reusable harness image intent.

Within `0.2.0`, it exists to capture:

- image identity
- target adapter/runtime realization
- declared harness components
- one future local parent-image reference slot
- binding and rebinding expectations
- verification intent

The definition file does not yet replace the `.harness` manifest. It defines the local image intent that later `compose`, `export`, and `verify` flows will consume.

## Top-level Shape

`harness.definition.json` must be a JSON object with the following top-level fields:

- `schemaVersion`
- `kind`
- `image`
- `lineage`
- `harness`
- `bindings`
- `rebinding`
- `source`
- `verify`

## Contract

### `schemaVersion`

- required string
- must equal `0.2.0`

### `kind`

- required string
- must equal `harness-definition`

### `image`

Required object:

- `image.imageId`
  - required non-empty string
  - repository-local image identifier
- `image.adapter`
  - required string
  - `0.2.0` currently allows only `openclaw`

### `lineage`

Required object:

- `lineage.parentImage`
  - `null` or an object
  - reserved for local parent/base image references
  - when present, must contain:
    - `refType`: `image-id` or `path`
    - `value`: non-empty string
- `lineage.layerOrder`
  - required array of strings
  - `0.2.0` starter definitions initialize this as `[]`

This file shape intentionally allows a parent-image slot before full local composition is implemented.

### `harness`

Required object:

- `harness.intent`
  - required string
  - must equal `agent-runtime-environment`
- `harness.targetProduct`
  - required non-empty string
  - `0.2.0` currently uses `openclaw`
- `harness.components`
  - required array
  - each entry must be one of:
    - `workspace`
    - `config`
    - `skills`
    - `agents`
    - `credentials`
    - `sessions`
    - `memory`
    - `cron`
    - `hooks`
    - `extensions`
    - `logs`
    - `browser`
    - `completions`

### `bindings`

Required object:

- `bindings.workspaces`
  - required array of workspace binding rules

Each workspace binding rule must contain:

- `agentId`: non-empty string
- `logicalPath`: non-empty string
- `targetRelativePath`: non-empty string
- `configTargets`: array of strings
- `required`: boolean

For `openclaw` definitions, starter initialization creates one default binding for `workspace`.

### `rebinding`

Required object:

- `rebinding.workspaceTargetMode`
  - required string
  - must equal `absolute-path`
- `rebinding.mutableConfigTargets`
  - required array of strings

### `source`

Required object:

- `source.bootstrap`
  - required string
  - `starter` or `openclaw-path`
- `source.detectedProduct`
  - string or `null`
- `source.configPath`
  - string or `null`

The source block records how the definition was initialized. It does not persist an absolute host-specific runtime path.

### `verify`

Required object:

- `verify.readinessTarget`
  - required string
  - one of:
    - `runtime_ready`
    - `manual_steps_required`
    - `structurally_invalid`
- `verify.expectedComponents`
  - required array of harness components
- `verify.requireWorkspaceBindings`
  - required boolean

## Initialization Rules

`harness init` supports two initialization modes in `0.2.0`:

1. starter definition
   - creates a new repository-local definition in the current directory
   - initializes a minimal OpenClaw-first component set:
     - `config`
     - `workspace`
     - `skills`

2. OpenClaw bootstrap
   - inspects an existing OpenClaw source path
   - infers components from the detected structure
   - initializes workspace binding expectations from the detected workspace layout

## Parent Image References

`0.2.0` allows one optional local parent reference in the definition file.

The supported forms are:

- `image-id`
  - the definition directly names the local parent image identity
- `path`
  - the definition points to a local `harness.definition.json`, `.harness-manifest.json`, `manifest.json`, or a directory containing one of them

Definition-layer rules:

- when `lineage.parentImage` is `null`, `lineage.layerOrder` must be `[]`
- when `lineage.parentImage` is present:
  - `lineage.layerOrder` must contain exactly two entries
  - `lineage.layerOrder[0]` must match `lineage.parentImage.value`
  - `lineage.layerOrder[1]` must match `image.imageId`

Manifest/export-layer rules:

- exported manifests do not preserve host-specific local paths
- if the definition uses `refType: "path"`, export resolves that local path to the parent image id before writing `manifest.json`
- exported `manifest.lineage` therefore always carries the resolved parent `imageId`
- when a parent image exists, the exported manifest must use:
  - `lineage.parentImage.imageId = <resolved parent image id>`
  - `lineage.layerOrder = [<resolved parent image id>, <child image id>]`

## Example

```json
{
  "schemaVersion": "0.2.0",
  "kind": "harness-definition",
  "image": {
    "imageId": "demo-agent",
    "adapter": "openclaw"
  },
  "lineage": {
    "parentImage": null,
    "layerOrder": []
  },
  "harness": {
    "intent": "agent-runtime-environment",
    "targetProduct": "openclaw",
    "components": ["config", "workspace", "skills"]
  },
  "bindings": {
    "workspaces": [
      {
        "agentId": "main",
        "logicalPath": "workspace",
        "targetRelativePath": "workspace",
        "configTargets": ["agents.defaults.workspace"],
        "required": true
      }
    ]
  },
  "rebinding": {
    "workspaceTargetMode": "absolute-path",
    "mutableConfigTargets": ["agents.defaults.workspace"]
  },
  "source": {
    "bootstrap": "starter",
    "detectedProduct": null,
    "configPath": null
  },
  "verify": {
    "readinessTarget": "runtime_ready",
    "expectedComponents": ["config", "workspace", "skills"],
    "requireWorkspaceBindings": true
  }
}
```

Example with a local parent image id:

```json
{
  "schemaVersion": "0.2.0",
  "kind": "harness-definition",
  "image": {
    "imageId": "child-agent",
    "adapter": "openclaw"
  },
  "lineage": {
    "parentImage": {
      "refType": "image-id",
      "value": "base-agent"
    },
    "layerOrder": ["base-agent", "child-agent"]
  },
  "harness": {
    "intent": "agent-runtime-environment",
    "targetProduct": "openclaw",
    "components": ["config", "workspace", "skills"]
  },
  "bindings": {
    "workspaces": [
      {
        "agentId": "main",
        "logicalPath": "workspace",
        "targetRelativePath": "workspace",
        "configTargets": ["agents.defaults.workspace"],
        "required": true
      }
    ]
  },
  "rebinding": {
    "workspaceTargetMode": "absolute-path",
    "mutableConfigTargets": ["agents.defaults.workspace"]
  },
  "source": {
    "bootstrap": "starter",
    "detectedProduct": null,
    "configPath": null
  },
  "verify": {
    "readinessTarget": "runtime_ready",
    "expectedComponents": ["config", "workspace", "skills"],
    "requireWorkspaceBindings": true
  }
}
```
