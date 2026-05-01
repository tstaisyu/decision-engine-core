# decision-engine-core

`decision-engine-core` is a small decision engine that extracts
temperature control logic from the M5 side into Node.js.

## Structure

- `src/evaluate.js`: Entry point. Accepts input and returns `state` and
  `action`.
- `src/rules.js`: Evaluates and resolves state rules.
- `src/config.js`: Default config entry point.
- `src/presets/m5TemperatureConfig.js`: Preset for the M5 temperature control
  logic.

## Flow

`input -> normalize -> rule evaluation -> state resolution -> duration
handling -> action resolution -> output`

## Characteristics

- States are defined with a `rules` array instead of fixed `if` branches.
- State resolution and action resolution are separated.
- Duration-based escalation is supported.
- Different control logic can be introduced by swapping configs.

## Rule Example

```js
{
  states: {
    rules: [
      { name: "critical", type: "value_gte", threshold: 40.0 },
      { name: "hot", type: "value_gte", threshold: 26.0 },
      { name: "warming", type: "rate_gt", threshold: 0.02 },
      { name: "cooling", type: "rate_lt", threshold: -0.02 }
    ]
  }
}
```

## Config Validation

```bash
npm run check:config
```

## CI

GitHub Actions runs `npm test`, `npm run lint`, and `npm run format:check`
on `push` and `pull_request` with Node.js 20 and 22.

## Evaluate With Default Preset

```bash
npm run evaluate -- examples/input.normal.json
```

## Evaluate With Specific Preset

```bash
npm run evaluate -- examples/input.simple-warm.json --preset simpleTemperature
```

## Available Presets

- `m5Temperature`
- `simpleTemperature`

## Examples

- `examples/input.normal.json`
- `examples/input.simple-warm.json`

## License

Apache-2.0. See `LICENSE`.
