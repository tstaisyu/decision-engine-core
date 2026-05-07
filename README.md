# decision-engine-core

`decision-engine-core` is a config-driven decision runtime for turning sensor
input into deterministic `state` and `action`.

It is built around a canonical config model that can be edited in the viewer,
evaluated in the JS runtime for simulation and tooling, converted into generated
C++ config, and executed in an embedded-oriented C++ runtime.

It is intended for embedded, automation, and edge systems where decision logic
should stay separate from hardware-specific integration code.

Typical flow:
`sensor input -> state -> action`

Example:
`temperature -> hot -> fan_high`

## Decision Runtime System (DRS)

This project is part of the **Decision Runtime System (DRS)**.

DRS is a system that externalizes decision logic as configuration and executes it consistently across environments such as viewer, simulator, and embedded devices.

In DRS:

- Decision logic is defined as config (JSON)
- A runtime interprets the config and produces state/action
- The same logic can run in multiple environments (Node.js, browser, embedded devices)

## Position of this repository

`decision-engine-core` is the **canonical-config-centered runtime and tooling repository** of the Decision Runtime System.

It is used for:

- Config evaluation
- Viewer simulation and authoring
- Node-based runtime validation
- C++ config generation
- Embedded-oriented runtime parity

Future runtimes (e.g. C++ for embedded systems) will follow the same runtime specification.

## Config Shape Policy

The canonical config shape of this project is:

- `states[]`
- `rules[]`

New config definitions and exported config should use the canonical shape.
The C++ runtime prototype also assumes the canonical shape.
New presets and examples should also use the canonical shape.

## What's New

- Config shape is unified to canonical `states[] + rules[]`
- Legacy config support has been removed
- JS core, React viewer, and docs now assume canonical-only config
- C++ runtime now supports rule type parity for:
  - `value_gte`
  - `hysteresis`
  - `rate_gt`
  - `rate_lt`
- C++ runtime also supports:
  - state escalation
  - action escalation

## Breaking Changes

- `actions.byState` has been removed
- `states.rules` has been removed
- `rule.name` has been removed
- canonical config is now required

## Structure

- `src/evaluate.js`: Entry point. Accepts input and returns `state` and `action`.
- `src/rules.js`: Evaluates and resolves state rules.
- `src/config.js`: Default config entry point.
- `src/presets/m5TemperatureConfig.js`: Preset for the M5 temperature control logic.

## Project Structure

- `src/`
  - JS core library
  - package public API の実装元
- `runtimes/cpp/`
  - C++ runtime
- `viewer/`
  - config design and visualization UI
- `examples/`
  - usage examples: minimal JS evaluate, simulation, M5 skeleton
- `scripts/`
  - development / local verification utilities
  - published runtime API ではない補助スクリプト
- `test/`
  - JS tests
- `vectors/`
  - shared input / expected-output data for JS/C++ comparison

```text
config -> evaluate (JS / C++) -> state / action -> adapter / execution
```

JS and C++ runtimes are intended to evaluate the same canonical config under the same runtime specification.

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

## Minimal Canonical Config

```js
{
  states: [
    { name: "normal", action: "no_action" },
    { name: "warm", action: "fan_low" },
    { name: "hot", action: "fan_high" }
  ],
  rules: [
    { type: "value_gte", threshold: 30.0, state: "hot" },
    { type: "value_gte", threshold: 26.0, state: "warm" }
  ]
}
```

## Quick Start

Use `node-temp-sim` for the shortest end-to-end path:

```bash
npm install
npm run example:node-temp-sim:sample
```

This runs the engine against a sample input sequence and prints the evaluated timeline.

Output includes rows such as:

```text
value -> state -> action
25.0 -> normal -> no_action
26.2 -> hot -> fan_high
```

For a smaller inline example, see [examples/temperature.js](examples/temperature.js).

## Config Validation

```bash
npm run check:config
```

## Development Scripts

The files under `scripts/` are local development and verification utilities.
They are not part of the published runtime API.

- `scripts/check-config.js`
  - validates the default preset config
- `scripts/check-evaluate.js`
  - runs representative local evaluation cases
- `scripts/evaluate-cli.js`
  - evaluates an input JSON file with a selected preset
- `scripts/generate-cpp-config.js`
  - generates a C++ `DecisionConfig` header from canonical JSON config
  - runtime config only; hardware config is not included
  - used because the C++ runtime does not parse JSON at runtime
  - see `scripts/README.md` and `docs/toolchain-overview.md`

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
- `examples/m5-temp-fan/`
  - embedded end-to-end example
  - M5Stack Gray + Si7021 input -> DecisionEngine -> PWM LED verification

## Additional Docs

- [Config Spec](CONFIG_SPEC.md)
- [Runtime Spec](docs/runtime-spec.md)
- [Adapter Pattern](docs/adapter-pattern.md)
- [Adapter Authoring Guide](docs/adapter-authoring-guide.md)
- [Runtime Integration](docs/runtime-integration.md)
- [Toolchain Overview](docs/toolchain-overview.md)
- [Roadmap](docs/roadmap.md)
- [Release Checklist](docs/release-checklist.md)

## C++ Runtime

The C++ runtime prototype is designed for embedded-oriented use and follows the same canonical config shape.

Supported rule types:

- `value_gte`
- `hysteresis`
- `rate_gt`
- `rate_lt`

Supported escalation:

- state escalation
- action escalation

`DecisionInput` is intentionally small and caller-provided:

- `value`
- `previousValue`
- `previousState`
- `stateDurationMs`
- `coolingEffect`

The C++ runtime is stateless.
Runtime state is managed by the caller and passed into `evaluate()`.

## React Viewer

Use the React viewer for new work:

```bash
cd viewer
npm install
npm run dev
```

## License

Apache-2.0. See `LICENSE`.
