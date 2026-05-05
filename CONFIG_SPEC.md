# Config Specification

This document defines the canonical config structure used by `decision-engine-core`.

Scope:

- config shape and fields
- canonical rule and state structure

Out of scope:

- runtime evaluation behavior
- rule execution order details
- escalation execution logic

Those runtime behavior details are defined in [docs/runtime-spec.md](docs/runtime-spec.md).

## Top-Level Structure

The canonical config shape is:

- `states[]`
- `rules[]`
- `escalations`

Example:

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
    { type: "hysteresis", state: "hot", onThreshold: 26.0, offThreshold: 25.5 },
    { type: "rate_gt", threshold: 0.02, state: "warming" },
    { type: "rate_lt", threshold: -0.02, state: "cooling" }
  ],
  escalations: {
    state: {
      hotToCritical: {
        durationMs: 5000
      }
    },
    action: {
      fanLowToHigh: {
        durationMs: 1000,
        requireNoCoolingEffect: false
      }
    }
  }
}
```

## `states[]`

`states[]` defines the available states and the base action for each state.

Each state entry contains:

- `name`
- `action`

Example:

```js
{ name: "hot", action: "fan_high" }
```

### Fields

- `name`
  - string
  - required
  - unique state identifier
- `action`
  - string
  - required
  - base action resolved when this state is selected

## `rules[]`

`rules[]` defines ordered state decision rules.

Each rule entry contains:

- `type`
- `state`

Additional fields depend on `type`.

### Common Fields

- `type`
  - string
  - required
- `state`
  - string
  - required
  - target state name

### Supported Rule Types

- `value_gte`
- `hysteresis`
- `rate_gt`
- `rate_lt`

### `value_gte`

Required fields:

- `threshold`

Shape:

```js
{ type: "value_gte", threshold: 26.0, state: "hot" }
```

### `hysteresis`

Required fields:

- `state`
- `offThreshold`

Optional fields:

- `onThreshold`

Shape:

```js
{ type: "hysteresis", state: "hot", onThreshold: 26.0, offThreshold: 25.5 }
```

Notes:

- `offThreshold` is used by the current runtime behavior
- `onThreshold` may be kept for compatibility and future use

### `rate_gt`

Required fields:

- `threshold`

Shape:

```js
{ type: "rate_gt", threshold: 0.02, state: "warming" }
```

### `rate_lt`

Required fields:

- `threshold`

Shape:

```js
{ type: "rate_lt", threshold: -0.02, state: "cooling" }
```

## `escalations`

`escalations` defines state and action escalation settings.

Top-level entries:

- `state`
- `action`

### `escalations.state`

Current canonical entry:

- `hotToCritical.durationMs`

Shape:

```js
state: {
  hotToCritical: {
    durationMs: 5000;
  }
}
```

### `escalations.action`

Current canonical entry:

- `fanLowToHigh.durationMs`
- `fanLowToHigh.requireNoCoolingEffect`

Shape:

```js
action: {
  fanLowToHigh: {
    durationMs: 1000,
    requireNoCoolingEffect: false
  }
}
```

## Role Separation

- `CONFIG_SPEC.md`
  - defines canonical config structure
  - defines fields and supported config entries
- `docs/runtime-spec.md`
  - defines runtime evaluation behavior
  - defines rule matching semantics
  - defines state/action escalation behavior
