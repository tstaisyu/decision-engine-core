// Copyright (c) 2025 tstaisyu
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const path = require("path");
const { evaluate } = require("../src");
const { presets } = require("../src/presets");
const { validateConfig } = require("../src/validateConfig");

const inputPath = process.argv[2];
let presetName = "m5Temperature";

for (let i = 3; i < process.argv.length; i += 1) {
  if (process.argv[i] === "--preset") {
    presetName = process.argv[i + 1];
    i += 1;
  }
}

if (!inputPath) {
  console.error("Usage: node scripts/evaluate-cli.js <input-json-path>");
  process.exit(1);
}

const config = presets[presetName];
if (!config) {
  console.error(`Unknown preset: ${presetName}`);
  console.error(`Available presets: ${Object.keys(presets).join(", ")}`);
  process.exit(1);
}

const validationResult = validateConfig(config);
if (!validationResult.valid) {
  console.error("Invalid config");
  for (const error of validationResult.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), inputPath);
const input = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
const result = evaluate(input, config);

console.log(JSON.stringify(result, null, 2));
