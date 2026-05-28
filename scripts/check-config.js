// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const path = require("path");
const { m5TemperatureConfig } = require("../src/presets/m5TemperatureConfig");
const { validateConfig } = require("../src/validateConfig");

function validateOrExit(label, config) {
  const result = validateConfig(config);
  console.log(`${label}: ${JSON.stringify(result, null, 2)}`);

  if (!result.valid) {
    process.exit(1);
  }
}

const exportedConfigSamplePath = path.resolve(
  __dirname,
  "../examples/node-temp-sim/config/exported-config.sample.json"
);
const exportedConfigSample = JSON.parse(fs.readFileSync(exportedConfigSamplePath, "utf8"));

validateOrExit("m5TemperatureConfig", m5TemperatureConfig);
validateOrExit("exported-config.sample.json", exportedConfigSample);
