// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Minimal JS evaluate() usage example with inline canonical config and inline inputs.

const { evaluate } = require("../src");

const config = {
  coolingEffectRateThreshold: -0.01,
  escalations: {
    action: {
      fanLowToHigh: {
        durationMs: 1000,
        requireNoCoolingEffect: false
      }
    },
    state: {
      hotToCritical: {
        durationMs: 5000
      }
    }
  },
  states: [
    { name: "critical", action: "alert" },
    { name: "hot", action: "fan_high" },
    { name: "warming", action: "fan_low" },
    { name: "cooling", action: "fan_low" },
    { name: "normal", action: "no_action" }
  ],
  rules: [
    { type: "value_gte", threshold: 40.0, state: "critical" },
    { type: "value_gte", threshold: 26.0, state: "hot" },
    { type: "hysteresis", state: "hot", onThreshold: 26.0, offThreshold: 25.5 },
    { type: "rate_gt", threshold: 0.02, state: "warming" },
    { type: "rate_lt", threshold: -0.02, state: "cooling" }
  ]
};

const inputs = [
  {
    label: "warming",
    input: {
      value: 25.3,
      previousValue: 25.1,
      tempDelta: 0.2,
      tempRate: 0.2,
      tempRateAvg: 0.03,
      previousState: "normal",
      previousAction: "no_action",
      stateDurationMs: 500,
      coolingEffect: false
    }
  },
  {
    label: "hot",
    input: {
      value: 26.4,
      previousValue: 26.1,
      tempDelta: 0.3,
      tempRate: 0.3,
      tempRateAvg: 0.2,
      previousState: "warming",
      previousAction: "fan_low",
      stateDurationMs: 900,
      coolingEffect: false
    }
  },
  {
    label: "cooling_escalated",
    input: {
      value: 25.1,
      previousValue: 25.3,
      tempDelta: -0.2,
      tempRate: -0.2,
      tempRateAvg: -0.15,
      previousState: "cooling",
      previousAction: "fan_low",
      stateDurationMs: 1200,
      coolingEffect: false
    }
  }
];

for (const { label, input } of inputs) {
  const result = evaluate(
    {
      deviceId: "m5-gray-001",
      sensorId: "si7021-001",
      valueType: "temperature",
      timestamp: Date.now(),
      ...input
    },
    config
  );

  console.log(label, result);
}
