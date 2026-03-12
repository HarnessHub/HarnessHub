import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function createOpenClawFixture(dir: string) {
  fs.mkdirSync(path.join(dir, "workspace", "skills", "demo"), { recursive: true });
  fs.mkdirSync(path.join(dir, "agents", "main", "sessions"), { recursive: true });
  fs.mkdirSync(path.join(dir, "identity"), { recursive: true });

  fs.writeFileSync(path.join(dir, "openclaw.json"), JSON.stringify({
    agents: {
      defaults: { workspace: "./workspace" },
      list: [{ id: "main", default: true, workspace: "./workspace" }],
    },
  }, null, 2));
  fs.writeFileSync(path.join(dir, "workspace", "AGENTS.md"), "# Demo Agent\n");
  fs.writeFileSync(path.join(dir, "workspace", "SOUL.md"), "# Demo Soul\n");
  fs.writeFileSync(path.join(dir, "workspace", "skills", "demo", "SKILL.md"), "---\nname: demo\ndescription: demo\n---\nUse demo.\n");
  fs.writeFileSync(path.join(dir, "agents", "main", "sessions", "session.jsonl"), "{\"type\":\"message\"}\n");
  fs.writeFileSync(path.join(dir, "identity", "device.json"), JSON.stringify({ deviceId: "demo-device" }, null, 2));
}

describe("run-openclaw-e2e-validation.sh", () => {
  it("produces a local artifact and sanitized validation report", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-openclaw-e2e-"));
    const sourceDir = path.join(tmpDir, "source");
    const runDir = path.join(tmpDir, "run");
    const reportJson = path.join(tmpDir, "openclaw-e2e-validation.json");
    const reportMd = path.join(tmpDir, "openclaw-e2e-validation.md");

    createOpenClawFixture(sourceDir);

    const result = spawnSync("./scripts/run-openclaw-e2e-validation.sh", [], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HARNESSHUB_OPENCLAW_E2E_SOURCE_DIR: sourceDir,
        HARNESSHUB_OPENCLAW_E2E_RUN_DIR: runDir,
        HARNESSHUB_OPENCLAW_E2E_REPORT_JSON: reportJson,
        HARNESSHUB_OPENCLAW_E2E_REPORT_MD: reportMd,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("OpenClaw e2e validation complete.");
    expect(fs.existsSync(path.join(runDir, "openclaw-template.harness"))).toBe(true);

    const report = JSON.parse(fs.readFileSync(reportJson, "utf8"));
    expect(report.sourceDir).toBe(sourceDir);
    expect(report.export.success).toBe(true);
    expect(report.manifest.image.adapter).toBe("openclaw");
    expect(report.verify.valid).toBe(true);

    const markdown = fs.readFileSync(reportMd, "utf8");
    expect(markdown).toContain("Artifact path:");
    expect(markdown).toContain("Verify valid: `true`");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
