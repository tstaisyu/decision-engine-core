// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const path = require("path");
const { evaluate } = require("../../src");
const { simpleTemperatureConfig } = require("../../src/presets/simpleTemperatureConfig");
const { toEngineInput } = require("../adapters/temperature-input-adapter");

function main() {
  const vectorPath = path.resolve(__dirname, "../../vectors/minimal-temperature.json");
  const raw = fs.readFileSync(vectorPath, "utf8");
  const parsed = JSON.parse(raw);
  const inputs = Array.isArray(parsed.inputs) ? parsed.inputs : [];

  inputs.forEach((value, index) => {
    const input = toEngineInput({
      value,
      previousValue: value,
      timestamp: index + 1
    });
    const result = evaluate(input, simpleTemperatureConfig);

    console.log(`${value} -> ${result.state} / ${result.action}`);
  });
}

main();
