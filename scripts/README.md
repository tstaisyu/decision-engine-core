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

## Examples

```bash
npm run check:config
npm run check:evaluate
npm run evaluate -- examples/input.normal.json --preset simpleTemperature
```
