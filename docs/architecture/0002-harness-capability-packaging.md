# Harness Capability Packaging

## Status

Direction memo for future product and architecture work.

This document explains what HarnessHub is actually packaging and why that unit should not be defined as "an agent process".

## Decision

HarnessHub should be understood as packaging reusable **environment capability**, not packaging an agent process itself.

More concretely:

- the model supplies raw cognitive potential
- the runtime supplies execution machinery
- the harness supplies the working environment that shapes how that potential becomes useful work

HarnessHub therefore packages the harness as a portable, inspectable, importable environment capability.

It does not try to package:

- the model itself
- one exact running process
- one runtime's directory structure as the permanent product abstraction

## Why This Decision Matters

Without this distinction, the product drifts toward the wrong object.

If HarnessHub is framed as "agent packaging", it will tend to collapse into one of these mistakes:

- backup-and-restore for one runtime directory
- serialization of one runtime-specific process shape
- prompt-plus-config bundles with weak operational meaning

Those framings miss the real reusable unit.

In practice, an agent becomes reliable because of a harness:

- instructions
- skills
- tool access
- environment bindings
- guardrails
- selected state
- readiness conditions

The harness determines how a capable model actually performs work in a concrete context.

## What HarnessHub Should Treat As The Packaged Unit

The packaged unit should be the **reusable working environment profile** that lets an agent perform a kind of work reliably.

That profile should include, at minimum:

- role or job intent
- instructions and working method
- tools and binding expectations
- environment constraints and guardrails
- transportable state and non-transportable state boundaries
- readiness conditions for restored use

This means the harness is closer to an application-layer operating environment than to a process snapshot.

## What This Means For Agent Identity

An agent identity may be part of a harness, but it is not the whole harness.

HarnessHub should not assume:

- one harness equals one named agent
- one runtime instance equals one durable harness identity

Instead, the harness identity should center on the reusable environment capability being transported.

Examples:

- a coding harness
- a research harness
- a marketing operations harness
- a customer support harness

Those may later be materialized for different runtimes and still remain recognizably the same harness in intent and method.

## Cross-Runtime Examples

### OpenClaw

For OpenClaw, the harness materialization currently lands in:

- workspace files
- config files
- selected runtime state
- OpenClaw-specific bindings and restore rules

That is a concrete runtime realization of the harness, not the definition of the harness itself.

### Codex

A comparable coding harness for Codex would likely share:

- coding instructions
- repo workflow rules
- code review expectations
- local skills and validation habits

But it would differ in:

- config surface
- directory conventions
- tool invocation plumbing
- persisted state layout

The harness identity could remain "coding delivery harness" even though the runtime materialization differs from OpenClaw.

### Claude Code

A comparable Claude Code harness might also share:

- coding task orientation
- repo-local guardrails
- planning and validation habits
- tool expectations

But it would again differ in:

- runtime-specific config
- workspace wiring
- tool adapter details
- import and rebinding mechanics

So the same harness capability can have different runtime materializations.

That is the core reason HarnessHub should package **capability with adapter-specific realization**, not runtime snapshots disguised as a universal format.

## The Right Product Shape

The product should converge on:

- a standard base harness contract
- specialized role or domain harnesses on top of that base
- runtime adapters that materialize the harness for OpenClaw, Codex, Claude Code, or future runtimes

This is better than either extreme:

- one generic but empty universal harness
- many unrelated runtime-specific bundles with no shared identity

The correct center of gravity is:

- standard base
- specialized room types
- adapter-specific realization

## Design Implications

### 1. Harness Identity Should Be Runtime-Agnostic

Future image identity should be able to answer:

- what kind of environment capability is this
- what role or domain is it for
- what work method does it encode

It should not be reducible to:

- which runtime happened to export it first

### 2. Adapters Should Materialize, Not Define, The Harness

Adapters should remain responsible for:

- source detection
- layout mapping
- config rebinding
- import materialization
- verification hooks

But they should not own the top-level meaning of the harness.

### 3. Layering Should Reflect Capability Composition

Future layering should move toward composition like:

- base harness
- role harness
- domain harness
- runtime-specific realization metadata

That is a more meaningful long-term model than layering arbitrary filesystem slices.

### 4. Verification Should Check Environment Fitness

Verification should continue evolving from:

- "did the files unpack"

toward:

- "is this restored environment fit for the intended kind of work"

The current readiness direction is consistent with that move.

## What This Memo Does Not Claim

This memo does not claim that HarnessHub is already runtime-neutral in implementation.

Today:

- OpenClaw is the first production-grade adapter
- the MVP remains OpenClaw-first
- import/export/verify behavior is still shaped by that reality

The claim is narrower and more important:

- the product abstraction should already be centered on harness capability
- future runtime support should materialize that abstraction rather than replace it

## Consequence For Future Work

Future 1.0 work should use this memo as a boundary constraint.

When making decisions about:

- image identity
- adapter boundaries
- layering
- catalogs
- runtime support

the repository should prefer answers that strengthen HarnessHub as an environment-capability system rather than drifting back toward runtime-specific snapshot tooling.
