# decision-engine-core

`decision-engine-core` is a lightweight decision engine that converts sensor inputs into state and action using configurable rules.

Originally extracted from temperature control logic on M5 devices, it can be reused for any control scenario that requires state transitions and action decisions.

## Decision Runtime System (DRS)

This project is part of the **Decision Runtime System (DRS)**.

DRS is a system that externalizes decision logic as configuration and executes it consistently across environments such as viewer, simulator, and embedded devices.

In DRS:

- Decision logic is defined as config (JSON)
- A runtime interprets the config and produces state/action
- The same logic can run in multiple environments (Node.js, browser, embedded devices)

## Position of this repository

`decision-engine-core` is the **JavaScript reference implementation** of the Decision Runtime System.

It is used for:

- Config evaluation
- Viewer simulation
- Node-based runtime validation

Future runtimes (e.g. C++ for embedded systems) will follow the same runtime specification.

## Config Shape Policy

The canonical config shape of this project is:

- `states[]`
- `rules[]`

New config definitions and exported config should use the canonical shape.
The C++ runtime prototype also assumes the canonical shape.

Legacy shape is still supported for backward compatibility:

- `states.rules`
- `actions.byState`

This legacy shape may be deprecated in the future.

At the implementation level, compatibility is currently absorbed by normalization logic such as `normalizeConfig` and viewer-side compatibility handling.

## Structure

- `src/evaluate.js`: Entry point. Accepts input and returns `state` and `action`.
- `src/rules.js`: Evaluates and resolves state rules.
- `src/config.js`: Default config entry point.
- `src/presets/m5TemperatureConfig.js`: Preset for the M5 temperature control logic.

## Flow

`input -> normalize -> rule evaluation -> state resolution -> duration handling -> action resolution -> output`

## Characteristics

- States are defined with a `rules` array instead of fixed `if` branches.
- State resolution and action resolution are separated.
- Duration-based escalation is supported.
- Different control logic can be introduced by swapping configs.

## Rule Example

```js
{
  states: [
    { name: "normal", action: "no_action" },
    { name: "warming", action: "fan_low" },
    { name: "hot", action: "fan_high" },
    { name: "critical", action: "alert" }
  ],
  rules: [
    { type: "value_gte", threshold: 40.0, state: "critical" },
    { type: "value_gte", threshold: 26.0, state: "hot" },
    { type: "rate_gt", threshold: 0.02, state: "warming" },
    { type: "rate_lt", threshold: -0.02, state: "cooling" }
  ]
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

## Local Preset Viewer

```bash
open examples/viewer.html
```

Or open `examples/viewer.html` directly in a browser.

This viewer uses a Japanese-first UI with English terms shown alongside key concepts.

This viewer is for inspection only. It does not support editing or saving presets.

You can:

- Select a preset
- Inspect canonical `rules[]`
- Inspect canonical `states[]`
- Inspect `escalations`
- Edit sample input JSON
- Check the evaluate result

## License

Apache-2.0. See `LICENSE`.
