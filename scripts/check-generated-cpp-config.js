// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const { execFileSync } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const inputPath = path.resolve(repoRoot, "examples/m5-temp-fan/config/fan_config.sample.json");
const committedOutputPath = path.resolve(repoRoot, "examples/m5-temp-fan/config/generated_fan_config.h");

function printFirstDiffSummary(committed, generated) {
  const committedLines = committed.split("\n");
  const generatedLines = generated.split("\n");
  const maxLines = Math.max(committedLines.length, generatedLines.length);

  for (let index = 0; index < maxLines; index += 1) {
    if (committedLines[index] !== generatedLines[index]) {
      const start = Math.max(0, index - 2);
      const end = Math.min(maxLines, index + 3);

      console.error(`First difference at line ${index + 1}:`);
      for (let lineIndex = start; lineIndex < end; lineIndex += 1) {
        const committedLine = committedLines[lineIndex] ?? "";
        const generatedLine = generatedLines[lineIndex] ?? "";
        const marker = lineIndex === index ? "!" : " ";

        console.error(`${marker} committed[${lineIndex + 1}]: ${committedLine}`);
        console.error(`${marker} generated[${lineIndex + 1}]: ${generatedLine}`);
      }
      return;
    }
  }

  if (committed !== generated) {
    console.error("Files differ, but no differing line was isolated by the line scanner.");
    console.error(`Committed length: ${committed.length}`);
    console.error(`Generated length: ${generated.length}`);
  }
}

function main() {
  const committed = fs.readFileSync(committedOutputPath, "utf8");

  try {
    execFileSync(process.execPath, [path.resolve(__dirname, "generate-cpp-config.js"), inputPath, committedOutputPath], {
      cwd: repoRoot,
      stdio: "pipe"
    });

    const generated = fs.readFileSync(committedOutputPath, "utf8");

    if (committed !== generated) {
      console.error("generated_fan_config.h is out of date.");
      printFirstDiffSummary(committed, generated);
      console.error("Regenerate it with:");
      console.error("npm run generate:m5-config");
      console.error("or:");
      console.error(
        "node scripts/generate-cpp-config.js examples/m5-temp-fan/config/fan_config.sample.json examples/m5-temp-fan/config/generated_fan_config.h"
      );
      process.exit(1);
    }

    console.log("generated_fan_config.h is consistent with fan_config.sample.json");
  } finally {
    if (fs.existsSync(committedOutputPath)) {
      const current = fs.readFileSync(committedOutputPath, "utf8");
      if (current !== committed) {
        fs.writeFileSync(committedOutputPath, committed);
      }
    }
  }
}

main();
