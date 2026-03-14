#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function formatPercent(value) {
  return Number(value ?? 0).toFixed(1);
}

export function classifyCoverage(value) {
  if (value >= 90) return "high";
  if (value >= 75) return "medium";
  return "low";
}

export function renderCoverageSummary(summary) {
  const total = summary.total ?? {};
  const metrics = [
    ["Lines", total.lines],
    ["Statements", total.statements],
    ["Functions", total.functions],
    ["Branches", total.branches],
  ];

  const lines = [
    "## Test Coverage",
    "",
    "| Metric | Coverage | Covered / Total | Level |",
    "| --- | ---: | ---: | --- |",
  ];

  for (const [label, metric] of metrics) {
    const pct = Number(metric?.pct ?? 0);
    lines.push(`| ${label} | ${formatPercent(pct)}% | ${metric?.covered ?? 0} / ${metric?.total ?? 0} | ${classifyCoverage(pct)} |`);
  }

  return `${lines.join("\n")}\n`;
}

function main(argv = process.argv.slice(2)) {
  const [summaryPath] = argv;
  if (!summaryPath) {
    console.error("Usage: node scripts/render-coverage-summary.mjs <coverage-summary.json>");
    return 1;
  }

  const resolvedPath = path.resolve(summaryPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Coverage summary not found: ${resolvedPath}`);
    return 1;
  }

  const summary = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  process.stdout.write(renderCoverageSummary(summary));
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}
