# ClawPack Product Foundation

## Status

Current top-level product direction document.

The earlier [0001-prd-v0.1](./0001-prd-v0.1.md) remains useful as the original OpenClaw-first starting point, but it no longer captures the full intended product scope.

## Product Thesis

ClawPack should be defined as a harness image packaging standard for agent runtime environments.

OpenClaw is the first production-grade adapter, not the terminal scope of the product.

## Problem Statement

An agent that works well in practice depends on more than prompt text or source code. It usually depends on a harness:

- workspace instructions
- prompts and skills
- provider and channel configuration
- tools and extensions
- runtime state and memory
- safety and operational guardrails
- domain-specific working context

These environments are still copied ad hoc, rebuilt manually, or hidden inside one-off runtime directories. That makes them hard to reuse, audit, version, migrate, and improve systematically.

## Product Goal

ClawPack exists to make harness environments portable, layered, inspectable, and reusable.

It should let teams define, package, distribute, compose, and validate agent harness images in the same way container tooling lets teams define and distribute runtime environments.

## Core Definitions

### Harness

A harness is the application-layer operating environment that helps an agent work reliably.

It may include:

- instructions and workspace files
- skills and reusable operational patterns
- tool configuration
- provider and channel settings
- runtime state and memory
- verification metadata
- local development and safety guardrails

### Harness Image

A harness image is a portable, versioned packaging unit for a harness.

It should describe:

- what environment is being packaged
- what layers or components it contains
- what must be rebound at import time
- what safety and risk characteristics apply
- what base image or parent image it depends on

### Layer

A layer is a reusable subset of a harness image.

Examples:

- a base secure-development harness
- a general marketing-agent harness
- an ecommerce-operations harness
- a Xiaohongshu agriculture marketing harness

Layers should be composable so specialized harnesses can build on more general ones instead of copying everything into one flat package.

## Ultimate Product Goal

The terminal goal is not just "package OpenClaw directories".

The terminal goal is:

1. define a general harness image model for agent runtime environments
2. provide one strong OpenClaw adapter as the first production-grade implementation
3. enable layered reuse so generic harnesses and domain harnesses can be composed
4. make harness environments importable, verifiable, and governable across teams

## Core Product Axis

The product should be organized around one main axis:

`agent harness image lifecycle`

That lifecycle is:

`inspect -> define -> compose -> export -> import -> verify -> evolve`

The current repository already covers only a narrower slice:

`inspect -> export -> import -> verify`

The missing pieces are:

- explicit harness definition
- parent/base image relationships
- layer composition
- versioned compatibility contracts
- reusable image catalogs or registries

## Design Principles

- OpenClaw-first, not OpenClaw-only
- image model first, transport format second
- layered reuse over flat snapshot copying
- explicit safety and rebinding contracts
- architecture continuity from MVP to 1.0
- repository harness and runtime harness should align conceptually, but they are not the same artifact

## What ClawPack Is Not

ClawPack is not:

- a container runtime
- a VM image builder
- a hosted agent platform
- a prompt library only
- a one-off backup script

It is the application-layer image system for agent harnesses.

