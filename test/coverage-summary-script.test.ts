import { describe, expect, it } from "vitest";
import { classifyCoverage, renderCoverageSummary } from "../scripts/render-coverage-summary.mjs";

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
});
