# Harness Image Architecture

## Status

Target architecture for the product line.

This document describes the 1.0-oriented architecture and the MVP subset that should be implemented first.

The currently implemented MVP image contract is specified in [../specs/0001-mvp-harness-image-specification.md](../specs/0001-mvp-harness-image-specification.md).

## Architectural Decision

HarnessHub should adopt a 1.0-oriented harness image architecture now, then implement only the MVP subset of that architecture.

This avoids a split where the MVP is a flat OpenClaw snapshot tool but 1.0 needs a different conceptual model.

## Boundary Clarification

HarnessHub is not the agent runtime itself.

The runtime layer is responsible for execution concerns such as process startup, model calls, tool invocation machinery, persistence services, and host integration.

The harness layer is responsible for the reusable application-layer operating environment around the agent, including instructions, skills, configuration, bindings, guardrails, and selected state that must travel with the working environment.

This distinction matters because HarnessHub should package, compose, import, and verify the harness layer while remaining compatible with existing runtimes rather than trying to replace them.

## 1.0 Architecture

At 1.0, the architecture should be organized around six layers.

### 1. Image Specification Layer

Defines the portable image contract:

- image identity
- schema version
- pack type
- included components
- workspace bindings
- sensitivity and risk metadata
- parent image references
- layer ordering
- import-time rebinding requirements
- verification expectations

### 2. Adapter Layer

Product-specific adapters translate concrete runtimes into the image model.

Examples:

- OpenClaw adapter
- future non-OpenClaw agent runtime adapters

An adapter is responsible for:

- inspection rules
- source layout detection
- component classification
- rebinding rules
- import materialization rules

An adapter does not redefine the runtime's execution engine. It maps a runtime's concrete layout into HarnessHub's harness-image model.

### 3. Image Builder Layer

Builds a harness image from adapter output.

Responsibilities:

- stage files
- separate layers and components
- compute manifest
- emit archive or installation material

### 4. Composition Layer

Resolves parent/base image references and composes layered harnesses into a final materialized environment.

Responsibilities:

- merge ordered layers
- apply override rules
- detect conflicts
- preserve lineage metadata

### 5. Import And Materialization Layer

Restores a harness image into a target environment.

Responsibilities:

- unpack image content
- materialize composed layers
- perform rebinding
- persist imported manifest metadata

### 6. Verification Layer

Validates the imported result against both filesystem expectations and image semantics.

Responsibilities:

- structural checks
- schema checks
- binding checks
- layer expectation checks
- adapter-specific validation hooks

## MVP Architecture Subset

The MVP should implement the same architecture in reduced form.

### Present In MVP

- image specification layer
- OpenClaw adapter layer
- image builder layer
- import and materialization layer
- verification layer

### Deferred From MVP

- full composition engine
- parent image resolution
- registry-backed image lookup
- sophisticated layer conflict resolution

## Mapping To The Current Repository

The current repository already roughly maps to this architecture:

- `src/core/types.ts`
  image specification seed
- `src/core/scanner.ts`
  OpenClaw adapter seed
- `src/core/packer.ts`
  builder plus import and materialization seed
- `src/core/verifier.ts`
  verification seed

What is still missing is explicit separation of concerns around:

- adapter abstraction
- image identity vs source-instance identity
- parent and layer semantics
- composition rules

## Recommended Near-Term Refactor Direction

The next architectural moves should be:

1. separate OpenClaw-specific detection and materialization logic from generic image-building logic
2. evolve `Manifest` toward a true `HarnessImageManifest`
3. introduce explicit image references and reserved parent and layer fields without requiring full composition yet
4. keep CLI verbs stable while improving the internal model

## Why This Is Architecture-Consistent

This direction keeps the public CLI simple while changing the internal center of gravity:

- from filesystem snapshot operations
- toward adapter-driven harness image construction

It also keeps the product boundary stable:

- runtimes remain the execution substrate
- HarnessHub remains the application-layer harness packaging system

That is an additive evolution, not a rewrite, provided the internal abstractions are introduced before too much more product surface area accumulates.
