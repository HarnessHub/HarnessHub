<p align="center">
  <img src="./assets/logo.svg" alt="HarnessHub" width="200" />
</p>

<h1 align="center">HarnessHub</h1>

<p align="center">
  <a href="./README_zh.md">中文文档</a>
</p>

HarnessHub is a harness image packaging standard for agent runtime environments.

The current implementation ships as the `harness` CLI and started with standardized export, import, and verification of tuned OpenClaw agents. It's not a container or a VM; it is the application-layer packaging system built on top of those infrastructures.

## Product Direction

The repository started with an OpenClaw-first packaging CLI, but the broader product direction is now clearer: HarnessHub is evolving toward a harness image packaging standard for agent runtime environments, with OpenClaw as the first production adapter.

For the current product framing, see:

- `docs/prds/0002-product-foundation.md`
- `docs/prds/0003-roadmap-mvp-to-v1.md`
- `docs/architecture/0001-harness-image-architecture.md`
- `docs/releases/0001-mvp-exit-criteria.md`
- `docs/releases/0002-mvp-release-candidate.md`

## Why

An OpenClaw agent's usable state is more than just code or config. It includes:

```
┌─────────────────────────────────────────────────────┐
│              OpenClaw Agent Instance                 │
│                                                     │
│  ┌─────────────┐       ┌────────────────────────┐   │
│  │  Workspace  │       │  Provider Config       │   │
│  │  AGENTS.md  │       │  API keys, model prefs │   │
│  │  SOUL.md    │       └────────────────────────┘   │
│  │  TOOLS.md   │                                    │
│  │  skills/    │       ┌────────────────────────┐   │
│  └─────────────┘       │  Channel Config        │   │
│                        │  Telegram / Slack /     │   │
│  ┌─────────────┐       │  Discord               │   │
│  │  State &    │       └────────────────────────┘   │
│  │  Memory     │                                    │
│  │  sessions   │       ┌────────────────────────┐   │
│  │  vector DBs │       │  Credentials &         │   │
│  └─────────────┘       │  Runtime Info          │   │
│                        └────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

Docker can distribute the runtime environment, but it can't express "which parts are templates, which are state, and which need rebinding." HarnessHub fills that gap:

```
                 Docker                          HarnessHub
            ┌─────────────┐               ┌──────────────────┐
            │  OS + deps  │               │  template vs     │
            │  runtime    │               │  state vs        │
            │  binaries   │               │  credentials     │
            └─────────────┘               │  ─────────────── │
                                          │  risk detection  │
           Distributes the                │  selective export│
           "how to run"                   └──────────────────┘

                                          Distributes the
                                          "what the agent is"
```

HarnessHub understands the current OpenClaw layout, including `agents/*`, `workspace-*`, and config-defined workspaces outside the state dir. During import, it rebinds workspace paths in `openclaw.json` to the target directory so multi-agent packs remain runnable after migration.

## Install

```bash
npm install -g harnesshub
```

Requires Node.js >= 20.

## Quick Start

The four commands form a linear workflow:

```
  Machine A                                          Machine B
 ┌────────────────────────────────────┐    ┌─────────────────────────────┐
 │                                    │    │                             │
 │  ① inspect ──▶ ② export           │    │  ③ import ──▶ ④ verify     │
 │     scan          pack to          │    │     unpack        check    │
 │     & report      .harness  ──────┼───▶│     & restore     struct  │
 │                                    │    │                             │
 └────────────────────────────────────┘    └─────────────────────────────┘
```

```bash
# 1. Inspect an OpenClaw instance
harness inspect

# 2. Follow the inspect recommendation
#    - template recommendation: harness export -t template -o my-agent.harness
#    - instance recommendation: harness export -t instance -o my-agent.harness
#    - share-oriented override from an instance recommendation:
#      harness export -t template --allow-pack-type-override -o my-agent.harness

# 3. Import on another machine
harness import my-agent.harness -t ~/.openclaw

# 4. Verify the import
harness verify
```

## Commands

### `harness inspect`

Scan an OpenClaw instance, report its structure, sensitive data, and recommended export type.

```
 ~/.openclaw/
 ├── config/
 ├── workspace/         harness inspect
 ├── state/          ─────────────────────▶   Report:
 ├── .env                                     - structure overview
 └── ...                                      - sensitive data found
                                              - recommended pack type
```

```bash
harness inspect                  # auto-detect ~/.openclaw
harness inspect -p /path/to/dir  # custom path
harness inspect -f json          # JSON output
```

`harness inspect` now returns the recommended next export command directly. When inspect recommends `instance`, it also surfaces the explicit `template` override form for intentional share-oriented export.

### `harness export`

Export an instance as a `.harness` package.

```
 ~/.openclaw/                                my-agent.harness
 ├── config/          harness export        (gzipped tar)
 ├── workspace/    ─────────────────────▶    ┌──────────────┐
 ├── state/           -t template            │ manifest.json│
 ├── .env             -o my-agent.harness   │ config/      │
 └── ...                                     │ workspace/   │
                       ▲                     │ reports/     │
                       │                     └──────────────┘
                 secrets excluded
                 (template mode)
```

```bash
harness export -t template       # template pack (excludes secrets)
harness export -t instance       # instance pack (full migration)
harness export -o out.harness   # custom output path
harness export -p /path/to/dir   # custom source path
```

### `harness import`

Import a `.harness` package into a target environment.

```
 my-agent.harness                          ~/.openclaw/
 ┌──────────────┐    harness import        ├── config/
 │ manifest.json│  ─────────────────────▶   ├── workspace/
 │ config/      │    -t ~/.openclaw         ├── state/
 │ workspace/   │                           └── ...
 │ state/       │
 └──────────────┘
```

```bash
harness import my-agent.harness              # restore to ~/.openclaw
harness import my-agent.harness -t ./target  # custom target
```

### `harness verify`

Verify an imported instance is structurally complete and basically readable. When a persisted import manifest is present, `verify` also checks manifest-related expectations.

```
 ~/.openclaw/
 ├── config/  ✓        harness verify
 ├── workspace/  ✓   ─────────────────▶   All checks passed  ✓
 ├── AGENTS.md  ✓                          - directories exist
 └── state/  ✓                             - workspace intact
                                           - manifest checks (if imported manifest is available)
```

```bash
harness verify                  # verify ~/.openclaw
harness verify -p /path/to/dir  # custom path
```

## Package Types

```
                          .harness
                        ┌───────────┐
                        │           │
                ┌───────┴───┐ ┌────┴──────┐
                │ template  │ │ instance  │
                └─────┬─────┘ └─────┬─────┘
                      │             │
          ┌───────────┴──┐  ┌──────┴───────────────┐
          │ Workspace    │  │ Workspace             │
          │ Safe config  │  │ Full config           │
          │              │  │ State & sessions      │
          │ ✗ secrets    │  │ Credentials & .env    │
          │ ✗ sessions   │  │                       │
          │ ✗ .env       │  │                       │
          └──────────────┘  └──────────────────────┘
                │                     │
          safe-share           trusted-migration-only
         (share publicly)     (trusted environments only)
```

| Type | Use Case | Includes | Risk Level |
|------|----------|----------|------------|
| **template** | Share & reuse | Workspace, non-sensitive config | Share-oriented; manifest risk is still derived from detected source sensitivity |
| **instance** | Full migration | Config, workspace, state, credentials | Usually `trusted-migration-only` when credentials or state are present |

Template packs automatically exclude credentials, sessions, memory databases, and `.env` files, but the manifest still records what sensitive indicators were detected in the source instance.

## Package Format

A `.harness` file is a gzipped tar archive containing:

```
my-agent.harness (gzipped tar)
│
├── manifest.json ─── Pack metadata
│                     ├── schema version
│                     ├── pack type (template / instance)
│                     └── risk level
│
├── config/ ───────── Configuration files
│
├── workspace/ ────── Agent workspace
│                     ├── AGENTS.md
│                     ├── SOUL.md
│                     └── skills/
│
├── workspaces/ ───── Additional per-agent workspaces
│                     └── <agentId>/
│
├── state/ ────────── Session & credential data
│                     (instance packs only)
│
└── reports/ ──────── Export report
```

## Risk Levels

```
  safe-share              internal-only           trusted-migration-only
 ┌──────────────┐       ┌──────────────┐        ┌──────────────┐
 │  No secrets  │       │  Non-critical │        │  Credentials │
 │  No state    │       │  config only  │        │  State data  │
 │              │       │              │        │  Sessions    │
 │  Safe to     │       │  Team-only   │        │  Trusted env │
 │  distribute  │       │  sharing     │        │  only        │
 └──────────────┘       └──────────────┘        └──────────────┘
    Low risk ◀──────────────────────────────────────▶ High risk
```

| Level | Description |
|-------|-------------|
| `safe-share` | No sensitive data, safe to distribute |
| `internal-only` | May contain non-critical config, share within team |
| `trusted-migration-only` | Contains credentials/state, trusted environments only |

Risk level is assessed from the exported manifest metadata and detected source sensitivity, not only from the chosen pack type.

## Output Formats

All commands support `-f text` (default, human-readable) and `-f json` (machine-readable).

```
 harness inspect -f text          harness inspect -f json
 ┌─────────────────────┐           ┌──────────────────────┐
 │  === Scan Report === │           │ {                    │
 │  Path: ~/.openclaw   │           │   "path": "~/.oc..", │
 │  Files: 42           │           │   "files": 42,       │
 │  Risk: safe-share    │           │   "risk": "safe-sh.."│
 └─────────────────────┘           │ }                    │
    human-readable                 └──────────────────────┘
                                      machine-readable
```

```bash
harness inspect -f json | jq '.riskAssessment'
```

## How To Interpret Command Results

The four commands do not just report progress. Together they explain whether the source harness is share-oriented or migration-oriented, whether a `.harness` artifact was created successfully, whether it was materialized into a new target, and whether the imported result is actually runnable.

### `inspect`: what kind of source you have

The most important fields are:

- `recommendedPackType`: whether the source should normally be exported as `template` or `instance`
- `riskAssessment`: how sensitive the detected source appears before export
- `warnings`: why the source is considered sensitive or migration-oriented
- `workflow.recommendedExportCommand`: the exact next export command the operator should run

Practical meaning:

- `template` recommendation means the source is suitable for a share-oriented artifact
- `instance` recommendation means the source contains runtime state or credentials and should be treated as a migration pack

### `export`: what artifact was produced

The most important fields are:

- `success`: whether the `.harness` artifact was actually produced
- `outputFile`: where the artifact was written
- `packType`: whether the artifact is a `template` or `instance`
- `riskLevel`: the export-time risk classification recorded in the manifest
- `warnings` and `policyWarnings`: why the artifact should be handled carefully or why the chosen export diverged from inspect guidance

Practical meaning:

- a successful `template` export proves you produced a reusable share-oriented harness image
- a successful `instance` export proves you produced a migration-oriented harness image that can carry runtime state and credentials into a trusted target environment

### `import`: what changed at the target

The most important fields are:

- `success`: whether the artifact was restored into the target directory
- `targetDir`: where the imported harness was materialized
- `warnings`: especially rebinding warnings that describe config rewriting performed at import time

Practical meaning:

- import is not only archive extraction
- if import reports workspace rebinding, HarnessHub has rewritten OpenClaw config paths so the imported harness points at the new target directory instead of the old machine path

### `verify`: whether the imported harness is actually usable

The most important fields are:

- `valid`: whether the import passed the structural verification gate
- `runtimeReady`: whether the imported harness is considered runnable without further manual repair
- `readinessClass`: one of `runtime_ready`, `manual_steps_required`, or `structurally_invalid`
- `checks`: the individual manifest, placement, rebinding, and workspace checks that explain the result

Practical meaning:

- `valid=true` means the imported result satisfies the structural contract
- `runtimeReady=true` and `readinessClass=runtime_ready` mean the imported harness is not only present on disk, but is treated as ready to run under the current MVP contract

## How To Prove Migration Value Yourself

If you want to verify the MVP value directly, run the full OpenClaw flow yourself:

```bash
npm run build

node dist/cli.js inspect -p ~/.openclaw -f json
node dist/cli.js export -p ~/.openclaw -t instance -o /tmp/openclaw-instance.harness -f json
node dist/cli.js import /tmp/openclaw-instance.harness -t /tmp/openclaw-imported -f json
node dist/cli.js verify -p /tmp/openclaw-imported -f json
```

What success looks like:

- `inspect` recommends `instance` for a real OpenClaw with credentials or sessions
- `export` returns `success=true` and writes a `.harness` file
- `import` returns `success=true` and usually reports workspace rebinding in `openclaw.json`
- `verify` returns `valid=true`, `runtimeReady=true`, and `readinessClass=runtime_ready`

When those four things happen in sequence, the artifact has demonstrated real migration value: it captured a real OpenClaw harness, restored it into a new target path, rebound environment-specific config, and passed manifest-aware readiness checks after import.

## Development

```bash
git clone https://github.com/HarnessHub/HarnessHub.git
cd HarnessHub
npm install
npm run build
npm test
```

### Project Structure

```
src/
├── cli.ts ─────────── Entry point (commander, 4 commands)
├── commands/
│   ├── inspect.ts ─── Scan & report
│   ├── export.ts ──── Export to .harness
│   ├── import.ts ──── Import from .harness
│   └── verify.ts ──── Structural verification
├── core/
│   ├── scanner.ts ─── Instance detection, sensitive data scan
│   ├── packer.ts ──── Pack/unpack logic, exclusion rules
│   ├── verifier.ts ── Integrity checks
│   └── types.ts ───── Shared types & constants
└── utils/
    └── output.ts ──── Output formatting (text / json)
```

## License

MIT
