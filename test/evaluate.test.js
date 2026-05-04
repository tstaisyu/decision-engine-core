// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluate } = require("../src");
const { m5TemperatureConfig } = require("../src/presets/m5TemperatureConfig");

function buildInput(overrides) {
  return {
    deviceId: "m5-gray-001",
    sensorId: "si7021-001",
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
    stateDurationMs: 500,
    ...overrides
  };
}

test("normal -> no_action", () => {
  const result = evaluate(buildInput(), m5TemperatureConfig);
  assert.equal(result.state, "normal");
  assert.equal(result.action, "no_action");
});

test("warming -> fan_low", () => {
  const result = evaluate(
    buildInput({
      value: 25.3,
      previousValue: 25.1,
      tempDelta: 0.2,
      tempRate: 0.2,
      tempRateAvg: 0.03
    }),
    m5TemperatureConfig
  );
  assert.equal(result.state, "warming");
  assert.equal(result.action, "fan_low");
});

test("cooling -> fan_low", () => {
  const result = evaluate(
    buildInput({
      value: 24.9,
      previousValue: 25.1,
      tempDelta: -0.2,
      tempRate: -0.2,
      tempRateAvg: -0.03
    }),
    m5TemperatureConfig
  );
  assert.equal(result.state, "cooling");
  assert.equal(result.action, "fan_low");
});

test("hot -> fan_high", () => {
  const result = evaluate(
    buildInput({
      value: 26.2,
      previousValue: 25.9,
      tempDelta: 0.3,
      tempRate: 0.3,
      tempRateAvg: 0.05,
      previousState: "warming",
      previousAction: "fan_low",
      stateDurationMs: 900
    }),
    m5TemperatureConfig
  );
  assert.equal(result.state, "hot");
  assert.equal(result.action, "fan_high");
});

test("hot hysteresis -> hot", () => {
  const result = evaluate(
    buildInput({
      value: 25.7,
      previousValue: 25.8,
      tempDelta: -0.1,
      tempRate: -0.1,
      tempRateAvg: 0,
      previousState: "hot",
      previousAction: "fan_high",
      stateDurationMs: 1200
    }),
    m5TemperatureConfig
  );
  assert.equal(result.state, "hot");
  assert.equal(result.action, "fan_high");
});

test("hot duration escalation -> critical / alert", () => {
  const result = evaluate(
    buildInput({
      value: 26.1,
      previousValue: 26.0,
      tempDelta: 0.1,
      tempRate: 0.1,
      tempRateAvg: 0.02,
      previousState: "hot",
      previousAction: "fan_high",
      stateDurationMs: 5000
    }),
    m5TemperatureConfig
  );
  assert.equal(result.state, "critical");
  assert.equal(result.action, "alert");
});

test("critical -> alert", () => {
  const result = evaluate(
    buildInput({
      value: 40.2,
      previousValue: 39.8,
      tempDelta: 0.4,
      tempRate: 0.4,
      tempRateAvg: 0.1,
      previousState: "hot",
      previousAction: "fan_high",
      stateDurationMs: 1000
    }),
    m5TemperatureConfig
  );
  assert.equal(result.state, "critical");
  assert.equal(result.action, "alert");
});

test("fan_low escalation -> fan_high / actionEscalated true", () => {
  const result = evaluate(
    buildInput({
      value: 25.4,
      previousValue: 25.2,
      tempDelta: 0.2,
      tempRate: 0.2,
      tempRateAvg: 0.03,
      previousState: "warming",
      previousAction: "fan_low",
      stateDurationMs: 1000
    }),
    m5TemperatureConfig
  );
  assert.equal(result.state, "warming");
  assert.equal(result.action, "fan_high");
  assert.equal(result.debug.actionEscalated, true);
});
