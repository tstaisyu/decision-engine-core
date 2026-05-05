// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluate } = require("../src");
const { m5TemperatureConfig } = require("../src/presets/m5TemperatureConfig");

function buildInput(overrides) {
  return {
    deviceId: "parity-device-001",
    sensorId: "parity-sensor-001",
    valueType: "temperature",
    timestamp: 1710000000000,
    value: 25.0,
    previousValue: 25.0,
    tempDelta: 0,
    tempRate: 0,
    tempRateAvg: 0,
    coolingEffect: false,
    previousState: "normal",
    previousAction: "no_action",
    stateDurationMs: 0,
    ...overrides
  };
}

function runCase(name, config, input, expectedState, expectedAction) {
  test(name, () => {
    const result = evaluate(buildInput(input), config);
    assert.deepEqual({ state: result.state, action: result.action }, { state: expectedState, action: expectedAction });
  });
}

const minimalTemperatureConfig = {
  escalations: {},
  states: [
    { name: "normal", action: "no_action" },
    { name: "warm", action: "fan_low" },
    { name: "hot", action: "fan_high" }
  ],
  rules: [
    { type: "value_gte", threshold: 30, state: "hot" },
    { type: "value_gte", threshold: 26, state: "warm" }
  ]
};

const customActionConfig = {
  escalations: {},
  states: [
    { name: "normal", action: "no_action" },
    { name: "warm", action: "fan_mid" },
    { name: "hot", action: "fan_high" }
  ],
  rules: [
    { type: "value_gte", threshold: 30, state: "hot" },
    { type: "value_gte", threshold: 26, state: "warm" }
  ]
};

const unsupportedRuleConfig = {
  escalations: {},
  states: [
    { name: "normal", action: "no_action" },
    { name: "warm", action: "fan_low" },
    { name: "hot", action: "fan_high" }
  ],
  rules: [
    { type: "unknown_type", threshold: 0, state: "hot" },
    { type: "value_gte", threshold: 30, state: "hot" },
    { type: "value_gte", threshold: 26, state: "warm" }
  ]
};

const hysteresisConfig = {
  escalations: {},
  states: [
    { name: "normal", action: "no_action" },
    { name: "hot", action: "fan_high" }
  ],
  rules: [{ type: "hysteresis", state: "hot", onThreshold: 26.0, offThreshold: 25.5 }]
};

const rateGtConfig = {
  escalations: {},
  states: [
    { name: "normal", action: "no_action" },
    { name: "warming", action: "fan_low" }
  ],
  rules: [{ type: "rate_gt", threshold: 0.1, state: "warming" }]
};

const rateLtConfig = {
  escalations: {},
  states: [
    { name: "normal", action: "no_action" },
    { name: "cooling", action: "fan_low" }
  ],
  rules: [{ type: "rate_lt", threshold: -0.1, state: "cooling" }]
};

runCase("value_gte.normal", minimalTemperatureConfig, { value: 25.0, previousValue: 25.0 }, "normal", "no_action");
runCase("value_gte.warm", minimalTemperatureConfig, { value: 26.4, previousValue: 26.4 }, "warm", "fan_low");
runCase("value_gte.hot", minimalTemperatureConfig, { value: 30.1, previousValue: 30.1 }, "hot", "fan_high");
runCase("value_gte.custom_action", customActionConfig, { value: 26.4, previousValue: 26.4 }, "warm", "fan_mid");

runCase(
  "unsupported_rule.skip_to_next",
  unsupportedRuleConfig,
  { value: 26.4, previousValue: 26.4 },
  "warm",
  "fan_low"
);

runCase(
  "hysteresis.hold_hot",
  hysteresisConfig,
  { value: 25.7, previousValue: 25.7, previousState: "hot" },
  "hot",
  "fan_high"
);
runCase(
  "hysteresis.no_hold_previous_state",
  hysteresisConfig,
  { value: 25.7, previousValue: 25.7, previousState: "normal" },
  "normal",
  "no_action"
);
runCase(
  "hysteresis.no_hold_threshold",
  hysteresisConfig,
  { value: 25.4, previousValue: 25.4, previousState: "hot" },
  "normal",
  "no_action"
);

runCase(
  "rate_gt.match",
  rateGtConfig,
  { value: 25.3, previousValue: 25.1, tempDelta: 0.2, tempRate: 0.2, tempRateAvg: 0.2 },
  "warming",
  "fan_low"
);
runCase(
  "rate_gt.boundary",
  rateGtConfig,
  { value: 25.199, previousValue: 25.1, tempDelta: 0.099, tempRate: 0.099, tempRateAvg: 0.099 },
  "normal",
  "no_action"
);
runCase(
  "rate_gt.negative_delta",
  rateGtConfig,
  { value: 25.1, previousValue: 25.3, tempDelta: -0.2, tempRate: -0.2, tempRateAvg: -0.2 },
  "normal",
  "no_action"
);

runCase(
  "rate_lt.match",
  rateLtConfig,
  { value: 25.1, previousValue: 25.3, tempDelta: -0.2, tempRate: -0.2, tempRateAvg: -0.2 },
  "cooling",
  "fan_low"
);
runCase(
  "rate_lt.boundary",
  rateLtConfig,
  { value: 25.201, previousValue: 25.3, tempDelta: -0.099, tempRate: -0.099, tempRateAvg: -0.099 },
  "normal",
  "no_action"
);
runCase(
  "rate_lt.positive_delta",
  rateLtConfig,
  { value: 25.3, previousValue: 25.1, tempDelta: 0.2, tempRate: 0.2, tempRateAvg: 0.2 },
  "normal",
  "no_action"
);

runCase(
  "state_escalation.hot_to_critical",
  m5TemperatureConfig,
  {
    value: 26.1,
    previousValue: 26.0,
    tempDelta: 0.1,
    tempRate: 0.1,
    tempRateAvg: 0.02,
    previousState: "hot",
    previousAction: "fan_high",
    stateDurationMs: 5000
  },
  "critical",
  "alert"
);
runCase(
  "state_escalation.short_duration",
  m5TemperatureConfig,
  {
    value: 26.1,
    previousValue: 26.0,
    tempDelta: 0.1,
    tempRate: 0.1,
    tempRateAvg: 0.02,
    previousState: "hot",
    previousAction: "fan_high",
    stateDurationMs: 4999
  },
  "hot",
  "fan_high"
);
runCase(
  "state_escalation.different_previous_state",
  m5TemperatureConfig,
  {
    value: 26.1,
    previousValue: 26.0,
    tempDelta: 0.1,
    tempRate: 0.1,
    tempRateAvg: 0.02,
    previousState: "warming",
    previousAction: "fan_low",
    stateDurationMs: 5000
  },
  "hot",
  "fan_high"
);
runCase(
  "state_escalation.base_normal",
  m5TemperatureConfig,
  {
    value: 25.0,
    previousValue: 26.0,
    tempDelta: -1.0,
    tempRate: -1.0,
    tempRateAvg: 0,
    previousState: "hot",
    previousAction: "fan_high",
    stateDurationMs: 5000
  },
  "normal",
  "no_action"
);

runCase(
  "action_escalation.fan_low_to_high",
  m5TemperatureConfig,
  {
    value: 25.3,
    previousValue: 25.1,
    tempDelta: 0.2,
    tempRate: 0.2,
    tempRateAvg: 0.2,
    previousState: "warming",
    previousAction: "fan_low",
    stateDurationMs: 1000,
    coolingEffect: false
  },
  "warming",
  "fan_high"
);
runCase(
  "action_escalation.short_duration",
  m5TemperatureConfig,
  {
    value: 25.3,
    previousValue: 25.1,
    tempDelta: 0.2,
    tempRate: 0.2,
    tempRateAvg: 0.2,
    previousState: "warming",
    previousAction: "fan_low",
    stateDurationMs: 999,
    coolingEffect: false
  },
  "warming",
  "fan_low"
);
runCase(
  "action_escalation.cooling_effect_blocks",
  m5TemperatureConfig,
  {
    value: 25.3,
    previousValue: 25.1,
    tempDelta: 0.2,
    tempRate: 0.2,
    tempRateAvg: 0.2,
    previousState: "warming",
    previousAction: "fan_low",
    stateDurationMs: 1000,
    coolingEffect: true
  },
  "warming",
  "fan_low"
);
runCase(
  "action_escalation.base_action_already_high",
  m5TemperatureConfig,
  {
    value: 26.2,
    previousValue: 26.0,
    tempDelta: 0.2,
    tempRate: 0.2,
    tempRateAvg: 0.2,
    previousState: "hot",
    previousAction: "fan_high",
    stateDurationMs: 1000,
    coolingEffect: false
  },
  "hot",
  "fan_high"
);
