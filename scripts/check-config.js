const { m5TemperatureConfig } = require("../src/presets/m5TemperatureConfig");
const { validateConfig } = require("../src/validateConfig");

const result = validateConfig(m5TemperatureConfig);

console.log(JSON.stringify(result, null, 2));

if (!result.valid) {
  process.exit(1);
}
