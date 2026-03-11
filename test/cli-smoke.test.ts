import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

describe("cli smoke script", () => {
  it("validates the documented CLI path", () => {
    const result = spawnSync("./scripts/run-cli-smoke.sh", [], {
      cwd: "/workspace/02-projects/active/clawpack",
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("CLI smoke passed.");
  }, 120000);
});
