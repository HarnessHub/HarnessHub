# HarnessHub Roadmap: MVP To 1.0

## Status

Current roadmap and version framing document.

## Version Framing

The repository's original `v0.1` should now be treated as a historical seed release:

- it proves the narrow OpenClaw packaging loop can work
- it is not yet the full product definition
- it should inform the MVP rather than define the final product shape

## MVP Goal

The MVP should prove that HarnessHub can package and restore a reusable harness image with a stable, extensible format.

The MVP is intentionally narrow, but it must already reflect the eventual 1.0 architecture direction.

## MVP Scope

The MVP should deliver:

1. one production-grade adapter: OpenClaw
2. one canonical image format: `.harness`
3. one minimal lifecycle slice:
   `inspect -> export -> import -> verify`
4. one base image model with explicit metadata for:
   - source product
   - included components
   - workspace bindings
   - rebinding requirements
   - risk and sensitivity flags
5. two image modes:
   - share-oriented image
   - migration-oriented image
6. one local CLI implementation
7. one repository harness good enough to keep the format and CLI evolving safely

## MVP Non-goals

The MVP should not require:

- hosted registry
- image marketplace
- full visual UI
- deep layer inheritance
- cross-product universal adapters
- cryptographic signing
- advanced policy engines

## MVP Success Criteria

- users can reliably package and restore an OpenClaw harness image
- the manifest model is already extensible enough for future layering
- import-time rebinding is explicit and testable
- verification checks the restored environment and consumed manifest coherently
- the codebase does not assume OpenClaw is the only future adapter

## 1.0 Goal

Version 1.0 should establish HarnessHub as the standard image system for agent harness environments, with a stable layered image model and at least one fully mature adapter.

## 1.0 Scope

Version 1.0 should deliver:

1. a stable harness image specification
2. layered image composition
3. parent/base image references and inheritance metadata
4. install/import behavior that can materialize a composed harness
5. verification that understands image lineage and layer expectations
6. OpenClaw as a complete first-class adapter
7. local image catalog or registry primitives
8. stronger safety boundaries for share-oriented vs migration-oriented images
9. upgrade and compatibility rules for image schema evolution

## 1.0 Non-goals

Version 1.0 still does not need to imply:

- full SaaS hosting
- multi-tenant execution platform
- a public marketplace as a launch requirement
- every agent framework on day one

## Relationship Between MVP And 1.0

The MVP and 1.0 should be architecture-consistent.

The MVP is not a throwaway OpenClaw exporter that later gets replaced. It is the first adapter and first transport implementation of the eventual harness image system.

That means:

- the manifest must already have room for image identity, components, bindings, and future parent references
- the pack builder and importer must be organized around an image model rather than raw file copying alone
- verification must already consume manifest semantics, not only filesystem structure
- OpenClaw-specific logic should sit behind adapter-shaped boundaries

## Main Product Transition

The key conceptual transition is:

from:

- package one OpenClaw instance

to:

- define and transport a reusable harness image, with OpenClaw as the first adapter

That transition should happen now at the documentation and architecture level, even if the implementation sequence remains incremental.

