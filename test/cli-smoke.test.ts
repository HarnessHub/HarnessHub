import { describe, expect, it } from "vitest";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("cli smoke script", () => {
  it("validates the documented CLI path", () => {
    const result = spawnSync("./scripts/run-cli-smoke.sh", [], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("CLI smoke passed.");
  }, 120000);
});
