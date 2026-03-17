import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

let tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

function makeTempDir(prefix: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

describe("render-coverage-summary CLI", () => {
  it("prints usage when no summary path is provided", () => {
    const result = spawnSync("node", ["scripts/render-coverage-summary.mjs"], {
      cwd: path.resolve(path.dirname(new URL(import.meta.url).pathname), ".."),
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Usage: node scripts/render-coverage-summary.mjs");
  });

  it("prints an error when the coverage summary file is missing", () => {
    const result = spawnSync("node", ["scripts/render-coverage-summary.mjs", "missing-summary.json"], {
      cwd: path.resolve(path.dirname(new URL(import.meta.url).pathname), ".."),
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Coverage summary not found:");
  });

  it("renders markdown to stdout when a summary exists", () => {
    const tempDir = makeTempDir("harnesshub-coverage-cli-");
    const summaryPath = path.join(tempDir, "coverage-summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify({
      total: {
        lines: { pct: 88.5, covered: 177, total: 200 },
        statements: { pct: 87.5, covered: 175, total: 200 },
        functions: { pct: 92, covered: 23, total: 25 },
        branches: { pct: 81.25, covered: 65, total: 80 },
      },
    }), "utf8");

    const result = spawnSync("node", ["scripts/render-coverage-summary.mjs", summaryPath], {
      cwd: path.resolve(path.dirname(new URL(import.meta.url).pathname), ".."),
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("## Test Coverage");
    expect(result.stdout).toContain("| Branches | 81.3% | 65 / 80 | medium |");
  });
});
