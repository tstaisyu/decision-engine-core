# Runtime Specification

This document defines the language-independent behavior of the Decision Runtime System.

## Scope

The current scope focuses on rules-based decision logic and escalation:

- input.value
- input.previousValue
- input.previousState
- input.stateDurationMs
- input.coolingEffect
- rules-based config
- state
- action

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

This document started as a v0 minimal spec and is now moving toward a v1 rules-based spec.
It should stay small enough to guide implementation, while still leaving room for future refinement.

## 2. Reference Implementation Status

The current JavaScript core should be treated as the reference implementation at this stage.

That means:

- the JS implementation is the current source of behavioral truth
- this document extracts the minimum portable behavior from that implementation
- future runtimes do not need to share JS internals, but they should match the intended behavior defined here

This document is not trying to freeze the full JS implementation as a permanent standard.
Instead, it defines the smallest runtime model that other implementations can follow.

## 3. Non-JS Runtime Implementations

The current C++ runtime is implemented as a separate runtime that follows this spec.

The expected relationship is:

- JavaScript core: current reference implementation
- C++ runtime: current alternative implementation
- embedded runtimes: smaller platform-specific implementations derived from the same contract

The long-term goal is behavioral compatibility, not implementation identity.

In other words:

- the JS core and the C++ runtime may have different internal structures
- but they should accept equivalent input and config
- and they should produce equivalent state/action decisions for the same conditions

## 4. Minimal Runtime Model

The minimal runtime model is:

`input + config -> result`

At the minimal level, the most important output is:

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

The minimal config format should be small enough to support rules-based runtime decisions.

The v1 canonical shape of this specification is:

- `states[]`
- `rules[]`

Minimum fields:

- `states[]`
- `rules[]`

Minimal conceptual shape:

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

Notes:

- this is a minimal runtime-facing contract, not a full representation of the current JS config model
- `rules[]` is the minimum portable representation of state decision logic in the current architecture
- `states[]` is the minimum portable representation of state-to-action mapping
- rules are evaluated in array order
- the first matching rule determines the base state
- if no rule matches, the runtime falls back to a default state equivalent to `normal`
- the resolved state is matched against `states[]` to obtain the action
- a future implementation may map these into more structured internal representations

Current implementation note:

- the JavaScript core is the current reference implementation
- the current C++ runtime prototype is implemented around the same canonical `states[]` and `rules[]` shape

This spec does not require the runtime to support the full current preset schema.

## 7. Why `rules[]` and `states[]` Are Separate

The runtime model separates state decision from state-to-action mapping.

- `rules[]` defines how the runtime decides state
- `states[]` defines how a chosen state maps to a base action

This separation is intentional because it allows:

- reuse of the same state interpretation with different action mappings
- action replacement without changing rule logic
- clearer simulation and logging of `baseState` and resolved action
- separate handling of state escalation and action escalation
- reuse of the same runtime behavior across different hardware or output integrations

In other words, the runtime first decides what state the system is in, then
resolves what action should be associated with that state.

## 8. Canonical Config Shape

The canonical config shape for v1 is:

- `states[]`
- `rules[]`

### 8.1 `states[]`

Each state entry should contain:

- `name`
- `action`

Example:

```js
{ name: "warm", action: "fan_low" }
```

### 8.2 `rules[]`

Each rule entry should contain:

- `type`
- `threshold`
- `state`

Example:

```js
{ type: "value_gte", threshold: 26.0, state: "warm" }
```

## 9. Normalization Flow

Before evaluation, config data may be normalized into canonical form.

The intended flow is:

1. accept canonical shape
2. normalize the config
3. evaluate only against canonical shape internally

Policy note:

- canonical shape is the formal config shape of this specification
- new config definitions, presets, exports, and examples should use canonical shape

## 10. Minimal Result Format

The minimal result format is:

- `state`
- `action`

Optional fields:

- `debug`

Minimal conceptual shape:

```js
{
  state: "warm",
  action: "fan_low",
  debug: {
    matchedRule: "warm"
  }
}
```

Notes:

- `state` and `action` are the required portable outputs
- `debug` is optional and may be omitted in constrained runtimes
- an embedded runtime may choose to exclude `debug` entirely to reduce memory and code size

## 11. Evaluation Flow

The runtime behavior is based on ordered rule evaluation and ordered escalation.

`evaluate()` should be understood as operating on canonical config shape only.

The intended decision model is:

- read `rules[]` from top to bottom
- evaluate each rule against the input
- adopt `rule.state` from the first matching rule as `baseState`
- if a rule type is unsupported, ignore it and continue to the next rule
- if a rule is invalid, such as missing `state`, ignore it and continue to the next rule
- if no rule matches, use the default fallback state as `baseState`
- apply state escalation to determine `finalState`
- resolve `baseAction` by finding the matching state entry in `states[]`
- apply action escalation to determine `finalAction`

The default fallback state is expected to be equivalent to `normal`.

Pseudo flow:

```txt
baseState = normal

for rule in rules:
  if rule.type is unsupported:
    continue
  if rule matches input:
    baseState = rule.state
    break

finalState = apply state escalation(baseState, input, config)
baseAction = find action in states by matching finalState name
finalAction = apply action escalation(baseAction, input, config)
```

### 10.1 Supported Rule Types

The current common rule types are:

- `value_gte`
- `hysteresis`
- `rate_gt`
- `rate_lt`

### 10.2 Rule Shape

Each rule entry uses the same canonical shape:

```js
{
  type: "value_gte",
  threshold: 26.0,
  state: "warm"
}
```

Required fields:

- `type`
- `threshold`
- `state`

`rule.state` is required in the canonical shape.

### 10.3 Rule Matching Semantics

- `value_gte`
  - match when `input.value >= rule.threshold`
- `hysteresis`
  - match when `input.previousState == rule.state && input.value > rule.offThreshold`
- `rate_gt`
  - compute `stateRate = input.value - input.previousValue`
  - match when `stateRate > rule.threshold`
- `rate_lt`
  - compute `stateRate = input.value - input.previousValue`
  - match when `stateRate < rule.threshold`

Unsupported rule types should not stop evaluation.
They should be ignored and the runtime should continue to the next rule.

## 12. State Escalation

State escalation is applied after base state selection.

Condition:

- `baseState == targetState`
- `input.previousState == targetState`
- `input.stateDurationMs >= duration`

Example:

- `hot -> critical`

The current JS/C++ aligned example is:

- if `baseState == "hot"`
- and `previousState == "hot"`
- and `stateDurationMs >= hotToCriticalDurationMs`
- then `finalState = "critical"`

## 13. Action Escalation

Action escalation is applied after state resolution and base action lookup.

Condition:

- `baseAction == targetAction`
- `input.stateDurationMs >= duration`
- if `requireNoCoolingEffect == true`, then `input.coolingEffect == false`

Example:

- `fan_low -> fan_high`

The current JS/C++ aligned example is:

- if `baseAction == "fan_low"`
- and `stateDurationMs >= fanLowToHighDurationMs`
- and `requireNoCoolingEffect == false` or `coolingEffect == false`
- then `finalAction = "fan_high"`

## 14. Input Model

The current portable input model is:

- `value`
- `previousValue`
- `previousState`
- `stateDurationMs`
- `coolingEffect`

Optional:

- `timestamp`

Example:

```js
{
  value: 25.3,
  previousValue: 25.1,
  previousState: "warming",
  stateDurationMs: 1000,
  coolingEffect: false,
  timestamp: 1710000000000
}
```

## 15. C++ Runtime Constraints

The embedded-oriented C++ runtime is intentionally small.

Current constraints:

- stateless engine design
- runtime state is managed by the caller
- no built-in JSON parser
- config is loaded through C++ structures
- the caller is responsible for preparing `previousValue`, `previousState`, `stateDurationMs`, and `coolingEffect`

## 16. Version Progression

This specification can be understood as evolving in stages.

### v0: Threshold-Based Minimal Model

The original minimal framing was intentionally simple:

- a single numeric `value`
- threshold-oriented evaluation
- `state` / `action` output

That model was useful for bootstrapping a small C++ prototype, but it was too narrow to accurately describe the current implementation direction.

### v1: Rule-Based Evaluation Model

The current direction should be treated as v1 of the minimal portable spec:

- config contains `rules[]`
- rules are evaluated in order
- the first matching rule wins
- unsupported rule types are ignored
- if no rule matches, fallback state is used
- action is resolved from `states[]`

This matches the current implementation direction more closely in both:

- the JavaScript reference implementation
- the evolving C++ runtime prototype

## 17. Core Responsibility Boundary

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

## 18. Separation from Viewer / Adapter / Device

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

## 19. Design Intent

The design intent of this spec is to preserve the main architectural principle of the project:

- decision logic should remain externalized as config
- runtime implementations should stay portable across platforms
- device-specific behavior should stay in adapters or device code

This allows the same decision behavior to be reused across:

- browser simulation
- Node.js simulation
- C++ runtime
- future M5Stack or Arduino targets

## 20. Summary

The current minimal runtime spec assumes:

- a single numeric `value`
- an optional `timestamp`
- a minimal config using `states[]` and `rules[]`
- a minimal rule shape containing `type`, `threshold`, and `state`
- a result containing `state` and `action`
- ordered evaluation where the first matching rule wins
- unsupported rule types are ignored
- a fallback/default state equivalent to `normal`
- action resolution from the chosen state by matching `states[]`
- strict separation between decision logic and device execution

At this stage, the JS core remains the reference implementation.
Future runtimes should use this document as the minimum behavioral contract, while leaving room for later spec expansion.
