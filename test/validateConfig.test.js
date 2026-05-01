// Copyright (c) 2025 tstaisyu
// SPDX-License-Identifier: Apache-2.0

const test = require("node:test");
const assert = require("node:assert/strict");
const { validateConfig } = require("../src/validateConfig");
const { m5TemperatureConfig } = require("../src/presets/m5TemperatureConfig");
const { simpleTemperatureConfig } = require("../src/presets/simpleTemperatureConfig");

test("m5TemperatureConfig is valid", () => {
  const result = validateConfig(m5TemperatureConfig);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("simpleTemperatureConfig is valid", () => {
  const result = validateConfig(simpleTemperatureConfig);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("unsupported rule type is invalid", () => {
  const result = validateConfig({
    states: {
      rules: [{ name: "hot", type: "unknown_type", threshold: 30 }]
    },
    actions: {
      byState: {
        hot: "fan_high"
      }
    },
    escalations: {}
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /type is not supported/);
});

test("missing action mapping for a rule state is invalid", () => {
  const result = validateConfig({
    states: {
      rules: [{ name: "warm", type: "value_gte", threshold: 26 }]
    },
    actions: {
      byState: {
        normal: "no_action"
      }
    },
    escalations: {}
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /must define an action for state: warm/);
});
