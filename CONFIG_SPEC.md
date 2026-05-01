# Config Specification

## Top-level structure

`config` has the following top-level structure:

- `states`
- `actions`
- `escalations`

## `states.rules`

An array of state evaluation rules.

Common fields for each rule:

- `name`: state name
- `type`: rule type

Currently supported `type` values:

- `value_gte`
- `hysteresis`
- `rate_gt`
- `rate_lt`

Required fields by rule type:

### `value_gte`

- `threshold`

### `hysteresis`

- `state`
- `offThreshold`

### `rate_gt`

- `threshold`

### `rate_lt`

- `threshold`

## `actions.byState`

Defines the base action for each state.

Examples:

- `normal -> no_action`
- `warming -> fan_low`
- `hot -> fan_high`
- `critical -> alert`

## `escalations.state`

Defines time-based state escalation.

Current field:

- `hotToCritical.durationMs`

## `escalations.action`

Defines time- and condition-based action escalation.

Current fields:

- `fanLowToHigh.durationMs`
- `fanLowToHigh.requireNoCoolingEffect`

## Notes

- `rules` are evaluated from top to bottom, and the first matching rule becomes `baseState`
- duration-based state escalation is applied after rule evaluation
- action is determined from the final state
- action escalation is applied after `baseAction` is determined
