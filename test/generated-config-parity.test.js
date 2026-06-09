// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluate } = require("../src");

const generatedConfigSamplePath = path.resolve(__dirname, "../examples/m5-temp-fan/config/fan_config.sample.json");
const generatedConfigSample = JSON.parse(fs.readFileSync(generatedConfigSamplePath, "utf8"));

function buildInput(overrides) {
  return {
    value: 31.0,
    previousValue: 31.0,
    previousState: "normal",
    previousAction: "no_action",
    stateDurationMs: 0,
    coolingEffect: false,
    ...overrides
  };
}

function runCase(name, input, expectedState, expectedAction) {
  test(name, () => {
    const result = evaluate(buildInput(input), generatedConfigSample);
    assert.deepEqual({ state: result.state, action: result.action }, { state: expectedState, action: expectedAction });
  });
}

// Mirrors the generated-config intent covered by runtimes/cpp/run_generated_config_test.cpp.
runCase("generated_config.normal", { value: 31.0, previousValue: 31.0, stateDurationMs: 1000 }, "normal", "no_action");
runCase("generated_config.warm", { value: 32.0, previousValue: 32.0, stateDurationMs: 2000 }, "warm", "fan_low");
runCase("generated_config.hot", { value: 34.0, previousValue: 34.0, stateDurationMs: 3000 }, "hot", "fan_high");
runCase(
  "generated_config.action_escalation_with_cooling_effect_false",
  { value: 32.0, previousValue: 32.0, previousState: "warm", stateDurationMs: 10000, coolingEffect: false },
  "warm",
  "fan_high"
);
runCase(
  "generated_config.action_escalation_with_cooling_effect_true",
  { value: 32.0, previousValue: 32.0, previousState: "warm", stateDurationMs: 10000, coolingEffect: true },
  "warm",
  "fan_high"
);
