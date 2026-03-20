# `0.2.0` Local Compose Materialization

This document defines the narrow local compose path introduced by `harness compose` in `0.2.0`.

## Scope

`0.2.0` supports exactly one local composition shape:

- one local parent materialization
- one local child OpenClaw state directory
- one materialized output directory

It is intentionally not a general layering engine.

## Required Inputs

- a local `harness.definition.json`
- `lineage.parentImage.refType = "path"`
- `lineage.parentImage.value` resolving to a local parent materialization
- a child OpenClaw state directory passed to `harness compose`

The parent path must resolve to a directory that already looks like an OpenClaw-style materialized harness.

## Supported Override Set

`0.2.0` compose only overrides these roots:

- root config file (`openclaw.json` / product config equivalent)
- `workspace/`
- `workspace-*/`
- `hooks/`
- `extensions/`
- `completions/`

This means the child layer can replace config and workspace-oriented content while the parent remains the source of truth for untouched paths.

## Passthrough Behavior

All other roots are passthrough-only in `0.2.0`.

Examples:

- `agents/`
- `credentials/`
- `memory/`
- `cron/`
- `browser/`
- `logs/`
- `.env`

If one side contributes a passthrough root and the other side does not, that root is carried into the composed output unchanged.

## Conflict Rule

If both parent and child contribute the same passthrough root class, compose must fail explicitly.

Examples of explicit compose conflicts:

- parent and child both contain `agents/`
- parent and child both contain `credentials/`
- parent and child both contain `memory/`

`0.2.0` does not attempt to merge those roots.

## Output Shape

The output directory is a local OpenClaw-style materialization suitable for:

- later `harness export`
- local `harness verify`
- manual inspection of the composed result

After compose, workspace paths in the output config are rebound to the materialized output directory.
The output also persists a local `harness.definition.json` snapshot with the resolved parent image id so later export and verify flows can recover lineage semantics without depending on the original repo path layout.

## Non-Goals

`0.2.0` local compose does not include:

- remote parent lookup
- image registry resolution
- multi-parent composition
- deep multi-layer ordering
- generalized conflict resolution across all component classes
