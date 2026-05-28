<!-- Copyright (c) 2026- taisyu shibata -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Scripts

`scripts/` contains development and local verification utilities.
These files are not part of the published runtime API.

## Files

- `check-config.js`
  - validate the default preset config
  - validate the exported canonical config sample used by `node-temp-sim`
- `check-generated-cpp-config.js`
  - regenerate the sample generated C++ config into a temporary file
  - fail if the committed generated header is out of date
  - this check targets `examples/m5-temp-fan/config/fan_config.sample.json`
    and `examples/m5-temp-fan/config/generated_fan_config.h`
  - generator output depends on the output path/filename because the
    generated include path and header guard are derived from them
  - for that reason, the check regenerates under the committed target path
    conditions before comparing
  - if it fails, regenerate the committed header with
    `generate-cpp-config.js`
- `check-evaluate.js`
  - run representative local evaluation cases
- `evaluate-cli.js`
  - evaluate an input JSON file with a selected preset
- `generate-cpp-config.js`
  - generate a C++ `DecisionConfig` header from canonical JSON config
  - runtime config only; hardware config is out of scope
  - used because the C++ runtime does not include a JSON parser
- `npm run generate:m5-config`
  - regenerate `examples/m5-temp-fan/config/generated_fan_config.h`
    from `fan_config.sample.json`

## Examples

```bash
npm run check:config
npm run check:generated-config
npm run generate:m5-config
npm run check:evaluate
npm run evaluate -- examples/inputs/input.normal.json --preset simpleTemperature
node scripts/generate-cpp-config.js examples/m5-temp-fan/config/fan_config.sample.json examples/m5-temp-fan/config/generated_fan_config.h
```

## Generated/Exported Config Change Checklist

When you change generated or exported config-related files, run:

```bash
npm run check:config
npm run check:generated-config
# if generated_fan_config.h is stale:
npm run generate:m5-config
npm test
npm run cpp:test-vectors
```

Role of each command:

- `npm run check:config`
  - canonical validity for preset and exported config samples
- `npm run check:generated-config`
  - generated artifact consistency
- `npm run generate:m5-config`
  - regenerate `generated_fan_config.h` when it is stale
- `npm test`
  - JS/runtime/example verification
- `npm run cpp:test-vectors`
  - C++ parity and generated-config consume verification

## CI Minimum Verification Set

```bash
npm run check:config
npm run check:generated-config
npm test
npm run cpp:test-vectors
```

Use `generate:m5-config` as the repair command.
Use `check:generated-config` as the verification command.
