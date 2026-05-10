# Runtime Integration Design

## Decision Runtime System Context

This document describes how `decision-engine-core` fits into the Decision Runtime System (DRS).

DRS consists of:

- Runtime Specification (language-independent behavior rules)
- Runtime Implementations (JS, C++, etc.)
- Viewer (config design and simulation)
- Adapters (input/output transformation)
- Device Runtime (embedded execution environment)

In this structure:

- `decision-engine-core` is the canonical-config-centered runtime and tooling repository
- the JS runtime is the primary reference implementation
- the embedded-oriented C++ runtime already exists as an alternative implementation
- `docs/runtime-spec.md` defines the current portable behavior contract
- `examples/m5-temp-fan/` provides the representative embedded integration example

## 1. Purpose

This document defines how `decision-engine-core` connects to real or simulated devices.

For adapter boundary details, see [Adapter Pattern](adapter-pattern.md).

The current goal is not to control hardware directly from the core package.

The goal is to clarify the boundary between:

- core
- viewer
- config
- adapter
- device

---

## 2. Overall Flow

```mermaid
flowchart LR

  Viewer["Viewer<br/>config design / simulation"]
  Config["Config JSON<br/>rules / states / actions"]
  InputAdapter["Input Adapter<br/>sensor → engine input"]
  Core["decision-engine-core<br/>evaluate(input, config)"]
  ActionAdapter["Action Adapter<br/>action → command"]
  Device["Device / Simulator<br/>fan / actuator / mock"]

  Viewer -->|export| Config
  Config -->|load| Core
  InputAdapter --> Core
  Core -->|result.action| ActionAdapter
  ActionAdapter --> Device
```

This diagram represents the separation of responsibilities:

- Viewer creates and exports config
- Config is passed unchanged into the core
- Core evaluates input and determines state/action
- Adapters translate between real-world signals and engine data
- Device executes the final command

Important principle:
The core does not depend on device or platform.

```txt
viewer
  ↓ export config JSON
config
  ↓ load
decision-engine-core
  ↓ result.action
adapter
  ↓ device command
device / simulator
```

Detailed flow:

```txt
sensor value
  ↓
input adapter
  ↓
engine input
  ↓
evaluate(input, config)
  ↓
result: state / action
  ↓
action adapter
  ↓
device command
  ↓
fan / actuator / mock output
```

## 3. Responsibility Boundaries

### 3.1 `decision-engine-core`

Responsibility

`decision-engine-core` decides state and action from input and config.

`input + config -> state / action`

In scope

- rule evaluation
- state decision
- action decision
- duration / escalation logic
- config validation

Out of scope

- sensor reading
- GPIO / PWM control
- device communication
- file transfer
- UI
- real hardware deployment

### 3.2 `viewer`

Responsibility

The viewer is a design and verification tool for config.

In scope

- select preset
- edit config
- simulate input values
- visualize state / action transitions
- save workspace locally
- export config JSON

Out of scope

- direct hardware control
- direct M5 deployment
- PWM execution
- sensor reading

### 3.3 `config`

Responsibility

Config defines decision behavior as data.

In scope

- states
- rules
- thresholds
- actions
- escalations
- durations
- hysteresis-like conditions

Current transfer format

`JSON`

Current flow:

```txt
viewer
  ↓ Export Config
decision-engine-config.json
  ↓ copy / load
examples/node-temp-sim
```

Future options:

- add config version
- add schema version
- add target profile
- add lightweight embedded format
- generate device-specific code

For the current embedded-oriented C++ path, canonical JSON is projected by the
generator into a generated `DecisionConfig` header. The runtime consumes that
artifact and remains independent from JSON parsing and hardware-specific code.

### 3.4 `adapter`

Adapters connect real-world values and device operations to the engine.

There are two types of adapters.

`input adapter`:
sensor value -> engine input

`action adapter`:
engine action -> device command

Input adapter example

```js
toEngineInput({
  value,
  previousValue,
  timestamp
});
```

Action adapter example

```js
mapActionToFanCommand("fan_low");
// => { pwm: 80 }
```

In scope

- convert sensor values to engine input
- convert action names to device commands
- isolate device-specific mapping

Out of scope

- rule evaluation
- state decision
- config editing
- UI rendering

### 3.5 `device / platform`

Responsibility

The device or platform performs real I/O.

Examples:

- M5Stack
- Raspberry Pi
- Jetson
- browser simulator
- Node.js simulator

In scope

- read sensor
- call input adapter
- call engine
- call action adapter
- write PWM / GPIO / API command
- log runtime result

Out of scope

- deciding state rules directly
- embedding business logic as if-statements
- editing config

## 4. Runtime / Adapter / Hardware Boundary Policy

The runtime is platform-independent.

`decision-engine-core` and compatible runtimes are responsible for evaluating config and returning `state / action`.
They are not responsible for sensor SDKs, GPIO, PWM, I2C, Wi-Fi, or board-specific device control.

The adapter layer connects the runtime to hardware.

- input adapter: sensor/device value -> `DecisionInput`
- output adapter: `action` -> PWM/GPIO/device command

This project provides the adapter pattern and representative examples, not official support for every hardware target.
Users can implement custom adapters for their own environment while keeping the same runtime behavior.

`examples/m5-temp-fan/` is a representative example of this boundary:

- M5Stack / Si7021 reading stays in the example
- DecisionEngine stays device-agnostic
- PWM mapping stays in an output adapter
- current verification target is M5Stack Gray + Si7021 + PWM LED verification
- real fan verification is not yet covered

What the runtime does not do:

- read sensors directly
- own hardware SDK integrations
- provide official board support for all devices

## 5. Current Minimum Architecture

Current repository structure:

```txt
src/
  core engine

viewer/
  config editor and simulator

examples/
  runtime integration experiments

examples/node-temp-sim/
  mock runtime simulation
  adapters/
    input/action adapter examples

examples/m5-temp-fan/
  M5 integration notes
```

Current verified flow:

```txt
viewer
  ↓ export config
examples/node-temp-sim/config/exported-config.sample.json
  ↓ load
examples/node-temp-sim/index.js
  ↓ evaluate
mock PWM output
```

## 6. Mock Deploy Flow

The current runtime verification flow is:

1. Edit config in viewer
2. Export config JSON
3. Replace `examples/node-temp-sim/config/exported-config.sample.json`
4. Run `node-temp-sim`
5. Check state / action / pwm table

Command:

```bash
npm run example:node-temp-sim:sample
```

Expected output concept:

`value -> state -> action -> pwm`

This validates behavior before using real hardware.

## 7. Minimal M5 Runtime Flow

The first real-device target is:

`M5Stack + temperature sensor + fan`

Minimal runtime flow:

```txt
readTemperature()
  ↓
toEngineInput()
  ↓
evaluate(input, config)
  ↓
mapActionToFanCommand(result.action)
  ↓
writePWM(command.pwm)
```

Pseudo code:

```js
const temperature = readTemperature();

const input = toEngineInput({
  value: temperature,
  previousValue,
  timestamp: Date.now()
});

const result = evaluate(input, config);

const command = mapActionToFanCommand(result.action);

writePWM(command.pwm);
```

## 8. Design Decisions So Far

Decided

- core does not control hardware
- viewer exports config as JSON
- adapters stay in examples for now
- M5 integration starts as documentation / example
- mock deploy comes before real device deploy

Not decided yet

- whether runtime state is managed inside engine or outside
- whether input should be single-value or multi-value
- whether action should remain string-based or become structured
- whether adapters should become official packages
- whether config needs versioning
- whether embedded targets need lightweight config format

## 9. Roadmap

Phase 1: Current

- core evaluate
- viewer edit / simulate / export
- node-temp-sim mock deploy
- examples adapters

Status:

`mostly done`

Phase 2: Runtime boundary stabilization

Goal:

make runtime integration understandable and repeatable

Tasks:

- document responsibility boundaries
- document mock deploy flow
- document M5 minimal flow
- compare viewer simulation and node-temp-sim behavior

Phase 3: Runtime state design

Goal:

clarify how `stateDuration` and `previousState` are managed

Options:

- A. external runtime state
- B. stateful engine instance

This should be decided before serious M5 implementation.

Phase 4: M5 prototype

Goal:

run exported config on M5-like runtime

Tasks:

- create M5 pseudo code
- port adapter idea to Arduino / M5 environment
- use exported config or generated equivalent
- compare M5 logs with node-temp-sim logs

Phase 5: Adapter promotion

Goal:

decide whether adapters should remain examples or become official API

Possible future structure:

```txt
packages/core
packages/viewer
packages/adapters
examples/m5-temp-fan
```

Do not move adapters into official packages until the pattern is stable.

## 10. Core Principle

The core principle of this project is:

Decision logic should be externalized as config.
Runtime platforms should only adapt inputs and execute actions.

In short:

- core decides
- viewer designs
- adapter translates
- device executes
