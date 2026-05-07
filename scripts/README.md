<!-- Copyright (c) 2026- taisyu shibata -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Scripts

`scripts/` contains development and local verification utilities.
These files are not part of the published runtime API.

## Files

- `check-config.js`
  - validate the default preset config
- `check-evaluate.js`
  - run representative local evaluation cases
- `evaluate-cli.js`
  - evaluate an input JSON file with a selected preset
- `generate-cpp-config.js`
  - generate a C++ `DecisionConfig` header from canonical JSON config
  - runtime config only; hardware config is out of scope
  - used because the C++ runtime does not include a JSON parser

## Examples

```bash
npm run check:config
npm run check:evaluate
npm run evaluate -- examples/input.normal.json --preset simpleTemperature
node scripts/generate-cpp-config.js examples/m5-temp-fan/config/fan_config.sample.json examples/m5-temp-fan/config/generated_fan_config.h
```
