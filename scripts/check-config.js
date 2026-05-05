// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const { m5TemperatureConfig } = require("../src/presets/m5TemperatureConfig");
const { validateConfig } = require("../src/validateConfig");

const result = validateConfig(m5TemperatureConfig);

console.log(JSON.stringify(result, null, 2));

if (!result.valid) {
  process.exit(1);
}
