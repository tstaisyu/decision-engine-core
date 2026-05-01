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
