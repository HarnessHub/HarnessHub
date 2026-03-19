# HarnessHub v0.2.0 PRD: Define And Local Compose

## Status

Planned post-`0.1.0` product scope document.

This PRD defines the first post-MVP version line after the published `0.1.0` release.

## Version Intent

`0.1.0` proved that HarnessHub can inspect, export, import, and verify a reusable OpenClaw-first harness image.

`0.2.0` should be the next step:

- from packaging one runtime realization
- toward defining and locally composing a reusable harness image

This is not the registry release and not the multi-adapter release.

## Product Goal

`0.2.0` should make HarnessHub meaningfully more reusable without trying to finish the full `1.0` architecture in one step.

The release should let an operator:

1. define a harness image explicitly
2. declare one local parent/base image relationship
3. materialize one narrow local composed result
4. continue using `export -> import -> verify` on that result

In short:

- `0.1.0` = package and move one image
- `0.2.0` = define and locally compose one reusable image on top of a parent

## Why This Version Exists

The current product direction already defines the intended lifecycle as:

`inspect -> define -> compose -> export -> import -> verify -> evolve`

The repository currently implements only:

`inspect -> export -> import -> verify`

The most valuable post-`0.1.0` gap to close is therefore not a registry or a second runtime adapter. It is the missing `define` and first `compose` step.

## Scope

`0.2.0` should deliver all of the following.

### 1. Explicit Harness Definition

HarnessHub should gain a repository-local harness definition model.

That definition should capture, at minimum:

- image identity
- target adapter/runtime realization
- included components
- parent image reference when present
- binding and rebinding expectations
- verification intent

The definition should become the source of truth for a reusable harness image, rather than treating a runtime directory as the only starting point.

### 2. `harness init`

`0.2.0` should add `harness init` as the public bootstrap command.

It should support:

- creating a new starter definition in the current directory
- bootstrapping from an existing OpenClaw source path when appropriate

The mental model should be:

- use `init` to begin a harness definition
- use `compose` to layer it on top of a local parent when needed
- continue through `export`, `import`, and `verify`

### 3. Local Parent Image References

The current lineage fields should become operational for local use.

`0.2.0` should support:

- one local parent/base image reference
- local path or local image identity references only

`0.2.0` should not support:

- remote registry lookup
- remote namespaced image resolution
- network-backed catalog behavior

### 4. Narrow Local Composition

`0.2.0` should add a first real composition flow through `harness compose`.

That flow should stay intentionally narrow:

- one parent
- one child
- one local materialized result

Supported composition should be explicit and fail-fast.

`0.2.0` should prefer:

- a small, truthful composition model

over:

- a broad but underspecified merge model

### 5. Lineage-Aware Export And Verify

The current lifecycle should be extended so composed images are first-class within the supported `0.2.0` scope.

That means:

- `export` can operate on a definition-driven or composed local result
- `import` remains compatible with existing `0.1.x` images
- `verify` checks lineage semantics, not only field presence

## Public CLI Shape

The `0.2.0` CLI shape should be:

- `harness init`
- `harness compose`
- existing `harness inspect`
- existing `harness export`
- existing `harness import`
- existing `harness verify`

Design intent:

- `init` is the explicit entry into definition
- `compose` is the explicit entry into local layering
- existing verbs remain stable where possible

## Composition Rules For 0.2.0

The version should enforce a narrow composition contract.

### Supported Shape

- one parent/base image
- one child image or definition
- one local materialized result

### Supported Result

The materialized result should be suitable for:

- local inspection when relevant
- export to `.harness`
- import into a target runtime layout
- lineage-aware verification

### Merge Policy

The merge policy should be explicit.

Child-over-parent behavior is acceptable only for the supported component set.

Unsupported overlap should produce a clear operator-facing conflict instead of silent merge.

### Deferred Semantics

`0.2.0` should defer:

- multi-parent graphs
- deep multi-layer resolution
- sophisticated conflict-resolution strategies
- registry-backed parent resolution

## Recommended Component Boundary For 0.2.0

The version should focus composition on the most meaningful reusable harness components first.

Priority composable components:

- workspace
- config
- skills

Other component classes may remain:

- pass-through
- unsupported for composition
- or explicitly deferred

The key requirement is that `0.2.0` must not imply broad composition support that it does not actually implement.

## Verification Semantics

`verify` should evolve from:

- "did the unpacked files look structurally valid"

to:

- "is this image and its declared local lineage materially coherent"

Within `0.2.0`, that means verifying:

- parent reference validity
- layer ordering validity
- composed materialization expectations
- binding and rebinding expectations after composition/import

`verify` should clearly distinguish:

- structurally valid single-image imports
- valid lineage-aware imports
- lineage declaration failures
- composition/materialization mismatches

## Non-goals

`0.2.0` should explicitly not do the following:

- remote registry or catalog primitives
- a second production-grade runtime adapter
- cryptographic signing
- advanced policy engines
- generalized deep layer inheritance
- full multi-runtime neutrality in implementation
- hosted UI or SaaS behavior

## Success Criteria

`0.2.0` is successful when:

1. a user can create a harness definition with `harness init`
2. a user can declare one local parent/base image relationship
3. a user can run `harness compose` for one supported two-layer case
4. the composed result can still flow through `export -> import -> verify`
5. `verify` reports lineage-aware success and failure meaningfully
6. the documentation for `0.2.0` is specific enough to drive issue decomposition and implementation ordering

## Implementation Consequence

This version should continue the current architectural direction:

- keep OpenClaw as the only production-grade adapter
- move the internal center of gravity toward definition-driven and composition-aware image handling
- avoid letting the release collapse into a registry project or a second-adapter project

That makes `0.2.0` a real product step, not just a documentation release:

- it adds the missing define step
- it adds the first local compose step
- it keeps the path to `1.0` architecture-consistent

## References

- `docs/prds/0002-product-foundation.md`
- `docs/prds/0003-roadmap-mvp-to-v1.md`
- `docs/architecture/0001-harness-image-architecture.md`
- `docs/architecture/0002-harness-capability-packaging.md`
- `docs/specs/0001-mvp-harness-image-specification.md`
