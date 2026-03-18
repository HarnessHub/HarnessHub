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

describe("run-fresh-operator-validation.sh", () => {
  it("validates the packaged CLI path and records the fresh-directory version check", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-fresh-operator-"));
    const sourceDir = path.join(tmpDir, "source");
    const runDir = path.join(tmpDir, "run");
    const reportJson = path.join(tmpDir, "fresh-operator-validation.json");
    const reportMd = path.join(tmpDir, "fresh-operator-validation.md");

    createOpenClawFixture(sourceDir);

    const result = spawnSync("./scripts/run-fresh-operator-validation.sh", [], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HARNESSHUB_FRESH_OPERATOR_SOURCE_DIR: sourceDir,
        HARNESSHUB_FRESH_OPERATOR_RUN_DIR: runDir,
        HARNESSHUB_FRESH_OPERATOR_REPORT_JSON: reportJson,
        HARNESSHUB_FRESH_OPERATOR_REPORT_MD: reportMd,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Fresh-operator validation complete.");
    expect(fs.existsSync(path.join(runDir, "openclaw-template.harness"))).toBe(true);

    const report = JSON.parse(fs.readFileSync(reportJson, "utf8"));
    expect(report.packageSpec).toContain("harnesshub-0.1.0-rc.1.tgz");
    expect(report.freshVersion).toBe(report.installedVersion);
    expect(report.freshVersionCommand).toBe("temp install harness --version");
    expect(report.export.success).toBe(true);
    expect(report.manifest.image.adapter).toBe("openclaw");
    expect(report.verify.valid).toBe(true);
    expect(report.verify.readinessClass).toBe("runtime_ready");

    const markdown = fs.readFileSync(reportMd, "utf8");
    expect(markdown).toContain("Fresh-directory version check:");
    expect(markdown).toContain("Fresh-directory command:");
    expect(markdown).toContain("Installed version:");
    expect(markdown).toContain("Readiness class: `runtime_ready`");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
