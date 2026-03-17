import { describe, expect, it, vi } from "vitest";
import { classifyCoverage, main, renderCoverageSummary } from "../scripts/render-coverage-summary.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("render-coverage-summary", () => {
  it("renders markdown from an Istanbul coverage summary", () => {
    const markdown = renderCoverageSummary({
      total: {
        lines: { pct: 81.25, covered: 65, total: 80 },
        statements: { pct: 80, covered: 80, total: 100 },
        functions: { pct: 90, covered: 18, total: 20 },
        branches: { pct: 70, covered: 14, total: 20 },
      },
    });

    expect(markdown).toContain("## Test Coverage");
    expect(markdown).toContain("| Lines | 81.3% | 65 / 80 | medium |");
    expect(markdown).toContain("| Functions | 90.0% | 18 / 20 | high |");
    expect(markdown).toContain("| Branches | 70.0% | 14 / 20 | low |");
  });

  it("classifies coverage levels consistently", () => {
    expect(classifyCoverage(95)).toBe("high");
    expect(classifyCoverage(80)).toBe("medium");
    expect(classifyCoverage(60)).toBe("low");
  });

  it("renders zero-valued rows when summary metrics are missing", () => {
    const markdown = renderCoverageSummary({});

    expect(markdown).toContain("| Lines | 0.0% | 0 / 0 | low |");
    expect(markdown).toContain("| Statements | 0.0% | 0 / 0 | low |");
    expect(markdown).toContain("| Functions | 0.0% | 0 / 0 | low |");
    expect(markdown).toContain("| Branches | 0.0% | 0 / 0 | low |");
  });

  it("returns usage and missing-file errors from the CLI entrypoint", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(main([])).toBe(1);
    expect(main(["missing-summary.json"])).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("Usage: node scripts/render-coverage-summary.mjs"));
    expect(error).toHaveBeenCalledWith(expect.stringContaining("Coverage summary not found:"));
  });

  it("renders summary text through the CLI entrypoint", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-coverage-main-"));
    const summaryPath = path.join(tempDir, "coverage-summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify({
      total: {
        lines: { pct: 75, covered: 3, total: 4 },
        statements: { pct: 75, covered: 3, total: 4 },
        functions: { pct: 100, covered: 2, total: 2 },
        branches: { pct: 50, covered: 1, total: 2 },
      },
    }), "utf8");

    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      expect(main([summaryPath])).toBe(0);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    expect(write).toHaveBeenCalledWith(expect.stringContaining("| Lines | 75.0% | 3 / 4 | medium |"));
  });
});
