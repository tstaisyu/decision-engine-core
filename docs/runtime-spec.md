# Runtime Specification (Draft)

This document defines the language-independent behavior of the Decision Runtime System.

## Scope (Initial)

The initial version focuses on minimal decision logic:

- input.value
- rules-based config
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

- the JavaScript core is still the reference implementation, but its current config shape is legacy/current rather than canonical
- the current JS shape uses `states.rules`
- the current JS shape uses `actions.byState`
- the current JS core accepts both `rule.state` and `rule.name` as the source of the resolved state
- the current C++ runtime prototype is implemented closer to the v1 canonical shape using `states[]` and `rules[]`

This minimal spec does not require the runtime to support the full current preset schema.

This also means the spec does not require fixed fields such as `warmThreshold` or `hotThreshold`.
Those can appear in specific presets or compatibility layers, but they are not the minimal runtime contract.

## 7. Canonical Config Shape

The canonical config shape for v1 is:

- `states[]`
- `rules[]`

### 7.1 `states[]`

Each state entry should contain:

- `name`
- `action`

Example:

```js
{ name: "warm", action: "fan_low" }
```

### 7.2 `rules[]`

Each rule entry should contain:

- `type`
- `threshold`
- `state`

Example:

```js
{ type: "value_gte", threshold: 26.0, state: "warm" }
```

## 8. Legacy Config Shape

The current JavaScript reference implementation still supports a legacy/current config shape for compatibility.

Legacy shape:

- `states.rules`
- `actions.byState`

This shape remains a compatibility target, but it is not the canonical v1 shape.

The current JS core also accepts both:

- `rule.state`
- `rule.name`

when resolving the destination state from a rule.

## 9. Normalization Flow

Before evaluation, config data may be normalized into canonical form.

The intended flow is:

1. accept either canonical shape or legacy shape
2. convert the config through `normalizeConfig`
3. evaluate only against canonical shape internally

In practice:

- legacy `states.rules` becomes canonical `rules[]`
- legacy `actions.byState` becomes canonical `states[]`
- `rule.name` may be normalized into `rule.state`

This allows compatibility to remain in place while internal evaluation converges on a single structure.

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

## 11. Rule-Based Evaluation

The runtime behavior is based on ordered rule evaluation.

`evaluate()` should be understood as operating on canonical config shape only.

The intended decision model is:

- read `rules[]` from top to bottom
- evaluate each rule against the input
- adopt the state represented by the first matching rule
- if a rule type is unsupported, ignore it and continue to the next rule
- if no rule matches, use the default fallback state
- resolve the final action by finding the matching state entry in `states[]`

The default fallback state is expected to be equivalent to `normal`.

In a minimal example, this may look like:

1. `hot`
2. `warm`
3. fallback `normal`

This order is important.

The runtime should evaluate higher-priority rules first, because the first match wins.

Minimal pseudo logic:

```txt
state = normal

for rule in rules:
  if rule.type is unsupported:
    continue
  if rule matches input:
    state = rule.state
    break

action = find action in states by matching state name
if action is not found:
  action = no_action
```

### 8.1 Minimal Rule Shape

The minimal supported rule shape is:

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

### 8.2 Supported Rule Type in the Minimal Spec

The minimal supported rule type is:

- `value_gte`

Meaning:

- if `input.value >= rule.threshold`, the rule matches

Unsupported rule types should not stop evaluation.
They should be ignored and the runtime should continue to the next rule.

This section describes the minimal behavior only.
It does not attempt to fully standardize all rule types already present in the JS implementation.

For example:

- `simpleTemperatureConfig` is a valid minimal example because it uses ordered `value_gte` rules
- `m5TemperatureConfig` is also valid in principle, because a preset may use rate-based rules such as `warming`

So the v0 spec should be understood as rules-based, not as temperature-threshold-only.

## 12. Version Progression

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

At the same time, there is still a shape gap between the canonical spec and the current JS config representation.

Possible future directions include:

- migrating the JavaScript core toward the canonical `states[]` / `rules[]` shape
- adding a conversion adapter between the current JS config shape and the canonical runtime shape

## 13. Core Responsibility Boundary

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

## 14. Separation from Viewer / Adapter / Device

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

## 15. Items Explicitly Out of Scope for This Minimal Spec

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

## 16. Design Intent

The design intent of this spec is to preserve the main architectural principle of the project:

- decision logic should remain externalized as config
- runtime implementations should stay portable across platforms
- device-specific behavior should stay in adapters or device code

This allows the same decision behavior to be reused across:

- browser simulation
- Node.js simulation
- future C++ runtime
- future M5Stack or Arduino targets

## 17. Summary

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
