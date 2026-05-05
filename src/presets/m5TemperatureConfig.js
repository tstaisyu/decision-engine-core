// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const m5TemperatureConfig = {
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
    {
      name: "critical",
      action: "alert"
    },
    {
      name: "hot",
      action: "fan_high"
    },
    {
      name: "warming",
      action: "fan_low"
    },
    {
      name: "cooling",
      action: "fan_low"
    },
    {
      name: "normal",
      action: "no_action"
    }
  ],
  rules: [
    {
      type: "value_gte",
      threshold: 40.0,
      state: "critical"
    },
    {
      type: "value_gte",
      threshold: 26.0,
      state: "hot"
    },
    {
      type: "hysteresis",
      state: "hot",
      onThreshold: 26.0,
      offThreshold: 25.5
    },
    {
      type: "rate_gt",
      threshold: 0.02,
      state: "warming"
    },
    {
      type: "rate_lt",
      threshold: -0.02,
      state: "cooling"
    }
  ]
};

module.exports = {
  m5TemperatureConfig
};
