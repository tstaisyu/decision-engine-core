// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const { m5TemperatureConfig } = require("./m5TemperatureConfig");
const { simpleTemperatureConfig } = require("./simpleTemperatureConfig");

const presets = {
  m5Temperature: m5TemperatureConfig,
  simpleTemperature: simpleTemperatureConfig
};

module.exports = {
  presets
};
