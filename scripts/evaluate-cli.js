const fs = require("fs");
const path = require("path");
const { evaluate } = require("../src");
const { m5TemperatureConfig } = require("../src/presets/m5TemperatureConfig");

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node scripts/evaluate-cli.js <input-json-path>");
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), inputPath);
const input = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
const result = evaluate(input, m5TemperatureConfig);

console.log(JSON.stringify(result, null, 2));
