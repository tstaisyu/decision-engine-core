// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const { evaluate } = require("../src");

const config = {
  criticalThreshold: 40.0,
  hotOnThreshold: 26.0,
  hotOffThreshold: 25.5,
  warmingRateThreshold: 0.02,
  coolingRateThreshold: -0.02,
  hotCriticalDurationMs: 5000,
  fanLowEscalationDurationMs: 1000,
  coolingEffectRateThreshold: -0.01
};

const cases = [
  {
    label: "normal",
    input: {
      value: 25.0,
      previousValue: 24.95,
      tempDelta: 0.05,
      tempRate: 0.05,
      tempRateAvg: 0.01,
      previousState: "normal",
      previousAction: "no_action",
      stateDurationMs: 500,
      coolingEffect: false
    }
  },
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
    label: "cooling",
    input: {
      value: 24.9,
      previousValue: 25.1,
      tempDelta: -0.2,
      tempRate: -0.2,
      tempRateAvg: -0.03,
      previousState: "normal",
      previousAction: "no_action",
      stateDurationMs: 500,
      coolingEffect: false
    }
  },
  {
    label: "hot",
    input: {
      value: 26.2,
      previousValue: 25.9,
      tempDelta: 0.3,
      tempRate: 0.3,
      tempRateAvg: 0.05,
      previousState: "warming",
      previousAction: "fan_low",
      stateDurationMs: 900,
      coolingEffect: false
    }
  },
  {
    label: "hot hysteresis",
    input: {
      value: 25.7,
      previousValue: 25.8,
      tempDelta: -0.1,
      tempRate: -0.1,
      tempRateAvg: 0.0,
      previousState: "hot",
      previousAction: "fan_high",
      stateDurationMs: 1200,
      coolingEffect: false
    }
  },
  {
    label: "hot duration escalation to critical",
    input: {
      value: 26.1,
      previousValue: 26.0,
      tempDelta: 0.1,
      tempRate: 0.1,
      tempRateAvg: 0.02,
      previousState: "hot",
      previousAction: "fan_high",
      stateDurationMs: 5000,
      coolingEffect: false
    }
  },
  {
    label: "critical",
    input: {
      value: 40.2,
      previousValue: 39.8,
      tempDelta: 0.4,
      tempRate: 0.4,
      tempRateAvg: 0.1,
      previousState: "hot",
      previousAction: "fan_high",
      stateDurationMs: 1000,
      coolingEffect: false
    }
  },
  {
    label: "fan_low escalation to fan_high",
    input: {
      value: 25.4,
      previousValue: 25.2,
      tempDelta: 0.2,
      tempRate: 0.2,
      tempRateAvg: 0.03,
      previousState: "warming",
      previousAction: "fan_low",
      stateDurationMs: 1000,
      coolingEffect: false
    }
  }
];

for (const testCase of cases) {
  const result = evaluate(
    {
      deviceId: "m5-gray-001",
      sensorId: "si7021-001",
      valueType: "temperature",
      timestamp: Date.now(),
      ...testCase.input
    },
    config
  );

  console.log(`\n[${testCase.label}]`);
  console.log(
    JSON.stringify(
      {
        state: result.state,
        action: result.action,
        debug: result.debug
      },
      null,
      2
    )
  );
}
