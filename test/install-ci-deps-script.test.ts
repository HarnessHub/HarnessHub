import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function writeExecutable(filePath: string, contents: string) {
  fs.writeFileSync(filePath, contents, "utf8");
  fs.chmodSync(filePath, 0o755);
}

describe("install-ci-deps.sh", () => {
  it("succeeds when npm ci succeeds immediately", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-ci-install-"));
    const binDir = path.join(tmpDir, "bin");
    fs.mkdirSync(binDir);

writeExecutable(path.join(binDir, "npm"), `#!/usr/bin/env bash
set -euo pipefail
mkdir -p node_modules/.bin
touch node_modules/.bin/vitest
chmod +x node_modules/.bin/vitest
echo "$*" > npm-args.log
`);

    const result = spawnSync(path.join(repoRoot, "scripts", "install-ci-deps.sh"), [], {
      cwd: tmpDir,
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("CI dependencies installed.");
    expect(fs.readFileSync(path.join(tmpDir, "npm-args.log"), "utf8")).toContain("ci --no-audit --no-fund");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("falls back to npm install after repeated ci failures", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-ci-install-"));
    const binDir = path.join(tmpDir, "bin");
    fs.mkdirSync(binDir);

    writeExecutable(path.join(binDir, "npm"), `#!/usr/bin/env bash
set -euo pipefail
count_file="npm-count.log"
count=0
if [[ -f "$count_file" ]]; then
  count="$(cat "$count_file")"
fi
count=$((count + 1))
echo "$count" > "$count_file"
if [[ "$1" == "ci" ]]; then
  exit 1
fi
mkdir -p node_modules/.bin
touch node_modules/.bin/vitest
chmod +x node_modules/.bin/vitest
echo "$*" > npm-install.log
`);

    const result = spawnSync(path.join(repoRoot, "scripts", "install-ci-deps.sh"), [], {
      cwd: tmpDir,
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("npm ci failed twice; falling back to npm install.");
    expect(fs.readFileSync(path.join(tmpDir, "npm-install.log"), "utf8")).toContain("install --no-audit --no-fund");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("falls back when npm ci exits successfully without installing vitest", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-ci-install-"));
    const binDir = path.join(tmpDir, "bin");
    fs.mkdirSync(binDir);

    writeExecutable(path.join(binDir, "npm"), `#!/usr/bin/env bash
set -euo pipefail
count_file="npm-count.log"
count=0
if [[ -f "$count_file" ]]; then
  count="$(cat "$count_file")"
fi
count=$((count + 1))
echo "$count" > "$count_file"
if [[ "$1" == "ci" ]]; then
  exit 0
fi
mkdir -p node_modules/.bin
touch node_modules/.bin/vitest
chmod +x node_modules/.bin/vitest
echo "$*" > npm-install.log
`);

    const result = spawnSync(path.join(repoRoot, "scripts", "install-ci-deps.sh"), [], {
      cwd: tmpDir,
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("npm ci reported success but vitest is unavailable.");
    expect(result.stderr).toContain("npm ci failed twice; falling back to npm install.");
    expect(fs.readFileSync(path.join(tmpDir, "npm-install.log"), "utf8")).toContain("install --no-audit --no-fund");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
