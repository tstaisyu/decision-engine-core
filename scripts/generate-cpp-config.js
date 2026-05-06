// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const path = require("path");
const { validateConfig } = require("../src/validateConfig");

function usage() {
  console.error("Usage: node scripts/generate-cpp-config.js <config-json-path> <output-header-path>");
}

function escapeCppString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function numberLiteral(value) {
  return `${Number(value)}F`;
}

function toHeaderGuard(outputPath) {
  return path
    .basename(outputPath)
    .replace(/[^A-Za-z0-9]/g, "_")
    .toUpperCase();
}

function toDecisionEngineInclude(outputPath) {
  const outputDir = path.dirname(outputPath);
  const targetPath = path.resolve(process.cwd(), "runtimes/cpp/DecisionEngine.h");
  let relativePath = path.relative(outputDir, targetPath).replace(/\\/g, "/");
  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }
  return relativePath;
}

function stateLine(state) {
  return `      {"${escapeCppString(state.name)}", "${escapeCppString(state.action)}"},`;
}

function ruleLine(rule) {
  const threshold = typeof rule.threshold === "number" ? numberLiteral(rule.threshold) : "0.0F";
  const onThreshold = typeof rule.onThreshold === "number" ? numberLiteral(rule.onThreshold) : "0.0F";
  const offThreshold = typeof rule.offThreshold === "number" ? numberLiteral(rule.offThreshold) : "0.0F";
  return `      {"${escapeCppString(rule.type)}", ${threshold}, "${escapeCppString(rule.state)}", ${onThreshold}, ${offThreshold}},`;
}

function buildHeader(config, outputPath) {
  const guard = toHeaderGuard(outputPath);
  const includePath = toDecisionEngineInclude(outputPath);
  const hotToCriticalDurationMs = config.escalations?.state?.hotToCritical?.durationMs ?? 5000;
  const fanLowToHighDurationMs = config.escalations?.action?.fanLowToHigh?.durationMs ?? 1000;
  const requireNoCoolingEffect = config.escalations?.action?.fanLowToHigh?.requireNoCoolingEffect ?? true;

  return `// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0
//
// GENERATED FILE - DO NOT EDIT MANUALLY.
// Source config should be updated instead.

#ifndef ${guard}
#define ${guard}

#include "${includePath}"

inline DecisionConfig buildGeneratedConfig() {
  DecisionConfig config;
  config.hotToCriticalDurationMs = ${hotToCriticalDurationMs}UL;
  config.fanLowToHighDurationMs = ${fanLowToHighDurationMs}UL;
  config.requireNoCoolingEffect = ${requireNoCoolingEffect ? "true" : "false"};
  config.states = {
${config.states.map(stateLine).join("\n")}
  };
  config.rules = {
${config.rules.map(ruleLine).join("\n")}
  };
  return config;
}

#endif
`;
}

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    usage();
    process.exit(1);
  }

  const resolvedInputPath = path.resolve(process.cwd(), inputPath);
  const resolvedOutputPath = path.resolve(process.cwd(), outputPath);
  const rawConfig = JSON.parse(fs.readFileSync(resolvedInputPath, "utf8"));
  const validationResult = validateConfig(rawConfig);

  if (!validationResult.valid) {
    console.error("Invalid canonical config:");
    for (const error of validationResult.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  fs.writeFileSync(resolvedOutputPath, buildHeader(rawConfig, resolvedOutputPath));
  console.log(`Generated ${resolvedOutputPath}`);
}

main();
