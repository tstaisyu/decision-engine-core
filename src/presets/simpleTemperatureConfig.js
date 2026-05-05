// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const simpleTemperatureConfig = {
  escalations: {},
  states: [
    {
      name: "normal",
      action: "no_action"
    },
    {
      name: "warm",
      action: "fan_low"
    },
    {
      name: "hot",
      action: "fan_high"
    }
  ],
  rules: [
    {
      type: "value_gte",
      threshold: 30,
      state: "hot"
    },
    {
      type: "value_gte",
      threshold: 26,
      state: "warm"
    }
  ]
};

module.exports = {
  simpleTemperatureConfig
};
