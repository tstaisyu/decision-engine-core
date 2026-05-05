# Runtime Specification (Draft)

This document defines the language-independent behavior of the Decision Runtime System.

## Scope (Initial)

The initial version focuses on minimal decision logic:

- input.value
- thresholds
- state
- action

More advanced features (duration, escalation, hysteresis, runtime state) will be added later.

## Purpose

- Provide a reference for multiple runtime implementations
- Ensure consistent behavior across JS, C++, and embedded environments

## 1. Extended Notes

This document also describes the minimal runtime specification that is currently implied by `decision-engine-core`.

The goal is to make the smallest useful runtime contract explicit in a language-independent way.

This spec is intended to become the baseline for future lightweight runtime implementations, including:

- C++ runtime
- M5Stack runtime
- Arduino-oriented runtime

This is intentionally a v0 minimal spec.
It should be stable enough to guide implementation, while still leaving room for future refinement.

## 2. Reference Implementation Status

The current JavaScript core should be treated as the reference implementation at this stage.

That means:

- the JS implementation is the current source of behavioral truth
- this document extracts the minimum portable behavior from that implementation
- future runtimes do not need to share JS internals, but they should match the intended behavior defined here

This document is not trying to freeze the full JS implementation as a permanent standard.
Instead, it defines the smallest runtime model that other implementations can follow.

## 3. Future Non-JS Runtime Implementations

A future C++ runtime is expected to be added as a separate implementation that satisfies this spec.

The expected relationship is:

- JavaScript core: current reference implementation
- C++ runtime: alternative implementation
- embedded runtimes: smaller platform-specific implementations derived from the same contract

The long-term goal is behavioral compatibility, not implementation identity.

In other words:

- the JS core and the C++ runtime may have different internal structures
- but they should accept equivalent input and config
- and they should produce equivalent state/action decisions for the same conditions

## 4. Minimal Runtime Model

The minimal runtime model is:

`input + config -> result`

At the v0 level, the most important output is:

- `state`
- `action`

This keeps the core contract small enough for embedded and simulator implementations.

## 5. Minimal Input Format

The minimal input format is defined around a single measured value.

Required fields:

- `value`

Optional fields:

- `timestamp`

Minimal conceptual shape:

```js
{
  value: 26.4,
  timestamp: 1710000000000 // optional
}
```

Notes:

- `value` is the minimum required runtime signal
- `timestamp` may be included when a runtime wants to preserve observation time
- this v0 spec does not require `timestamp` for basic threshold evaluation
- this v0 spec does not define multi-value input

The exact numeric type may vary by language, but `value` is expected to be a numeric measurement.

## 6. Minimal Config Format

The minimal config format should be small enough to support threshold-based runtime decisions.

Minimum fields:

- `warmThreshold`
- `hotThreshold`
- `states`
- `actions`

Minimal conceptual shape:

```js
{
  warmThreshold: 26.0,
  hotThreshold: 30.0,
  states: {
    normal: "normal",
    warming: "warming",
    hot: "hot"
  },
  actions: {
    normal: "no_action",
    warming: "fan_low",
    hot: "fan_high"
  }
}
```

Notes:

- this is a minimal runtime-facing contract, not a full representation of the current JS config model
- `states` and `actions` exist to make runtime intent explicit
- a future implementation may map these into more structured internal representations
- the spec only requires enough structure to derive `state` and `action`

This v0 spec does not require the runtime to support the full current preset schema.

## 7. Minimal Result Format

The minimal result format is:

- `state`
- `action`

Optional fields:

- `debug`

Minimal conceptual shape:

```js
{
  state: "warming",
  action: "fan_low",
  debug: {
    matchedRule: "warmThreshold"
  }
}
```

Notes:

- `state` and `action` are the required portable outputs
- `debug` is optional and may be omitted in constrained runtimes
- an embedded runtime may choose to exclude `debug` entirely to reduce memory and code size

## 8. Basic Rule Evaluation

The minimal runtime behavior for v0 is based on ordered threshold evaluation.

The intended rules are:

- if `value >= hotThreshold`, return `hot` / `fan_high`
- else if `value >= warmThreshold`, return `warming` / `fan_low`
- else return `normal` / `no_action`

The evaluation order is:

1. `hot`
2. `warming`
3. `normal`

This order is important.

The runtime should evaluate the higher-priority state first.
That means `hotThreshold` must be checked before `warmThreshold`.

Minimal pseudo logic:

```txt
if value >= hotThreshold:
  state = hot
  action = fan_high
else if value >= warmThreshold:
  state = warming
  action = fan_low
else:
  state = normal
  action = no_action
```

This section describes the minimal behavior only.
It does not attempt to cover the richer rule system already present in the JS implementation.

## 9. Core Responsibility Boundary

The core runtime is responsible for converting input and config into a decision result.

Its minimum responsibility is:

- accept runtime input
- accept config
- evaluate rules
- return `state` and `action`

The core should not directly perform platform I/O.

Out of scope for the core:

- sensor reading
- PWM control
- GPIO control
- device communication
- transport
- file deployment
- hardware initialization

In short:

`core decides, but does not execute hardware operations`

## 10. Separation from Viewer / Adapter / Device

The runtime spec assumes a clear separation between the core and surrounding layers.

### Viewer

The viewer is responsible for:

- editing config
- simulating behavior
- visualizing results
- exporting config

The viewer is not part of the runtime core contract.

### Adapter

Adapters translate between runtime-specific data and core-friendly data.

Examples:

- sensor value -> input object
- action string -> PWM command

Adapters are responsible for integration, not decision logic.

### Device

The device or platform is responsible for actual execution.

Examples:

- read temperature
- call core evaluation
- convert returned action into command
- write PWM or GPIO

The device should not re-implement decision rules as ad hoc `if` statements if the core already defines them.

## 11. Items Explicitly Out of Scope for This v0 Spec

The following topics are important, but are not standardized by this document yet:

- duration
- escalation
- hysteresis
- runtime state
- config version
- multi-value input
- dynamic config loading

These are intentionally excluded from the minimal runtime spec for now.

Reasons:

- they increase implementation complexity
- some of them may need a stateful runtime model
- some of them may need a stronger config schema
- some of them may differ between JS, C++, and embedded environments

They should be documented and standardized later, after the minimal runtime contract is validated.

## 12. Design Intent

The design intent of this spec is to preserve the main architectural principle of the project:

- decision logic should remain externalized as config
- runtime implementations should stay portable across platforms
- device-specific behavior should stay in adapters or device code

This allows the same decision behavior to be reused across:

- browser simulation
- Node.js simulation
- future C++ runtime
- future M5Stack or Arduino targets

## 13. Summary

The v0 minimal runtime spec currently assumes:

- a single numeric `value`
- an optional `timestamp`
- a minimal threshold-based config
- a result containing `state` and `action`
- ordered evaluation: `hot -> warming -> normal`
- strict separation between decision logic and device execution

At this stage, the JS core remains the reference implementation.
Future runtimes should use this document as the minimum behavioral contract, while leaving room for later spec expansion.
