// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluate } = require("../src");
const { simpleTemperatureConfig } = require("../src/presets/simpleTemperatureConfig");
const { toEngineInput } = require("../examples/node-temp-sim/adapters/temperature-input-adapter");

test("minimal temperature vectors match expected state/action", () => {
  const vectorPath = path.resolve(__dirname, "../vectors/minimal-temperature.json");
  const raw = fs.readFileSync(vectorPath, "utf8");
  const parsed = JSON.parse(raw);
  const inputs = Array.isArray(parsed.inputs) ? parsed.inputs : [];
  const expected = Array.isArray(parsed.expected) ? parsed.expected : [];

  assert.equal(inputs.length, expected.length, "inputs and expected must have the same length");

  inputs.forEach((value, index) => {
    const result = evaluate(
      toEngineInput({
        value,
        previousValue: value,
        timestamp: index + 1
      }),
      simpleTemperatureConfig
    );

    assert.deepEqual(
      { value, state: result.state, action: result.action },
      expected[index],
      `mismatch at input index ${index}`
    );
  });
});
