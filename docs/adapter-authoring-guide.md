# Adapter Authoring Guide

This guide describes how to implement adapters around `decision-engine-core`
without breaking the intended boundary between runtime, adapters,
orchestration, and hardware or platform code.

`runtime-integration.md` describes the overall integration flow.
`adapter-pattern.md` describes the conceptual boundary.
This document focuses on implementation guidance.

## 1. Purpose

Use this guide to keep responsibilities separated between:

- runtime core
- adapter
- orchestration
- hardware or platform code

The goal is to preserve portable runtime behavior while allowing device-specific integration.

## 2. Recommended Layer Structure

The recommended layered architecture is:

```text
config
  ↓
runtime
  ↓
adapter
  ↓
hardware / platform
```

Meaning:

- config defines behavior
- runtime evaluates behavior
- adapters translate between runtime data and external effects
- hardware or platform code performs real I/O

## 3. What Belongs in Runtime

The runtime is responsible for:

- rule evaluation
- state resolution
- action resolution
- escalation behavior
- deterministic evaluation logic

The runtime is not responsible for:

- sensor SDK calls
- GPIO
- PWM
- I2C
- network access
- RTOS tasks
- timers
- vendor APIs
- hardware lifecycle
- electrical protection

If a concern depends on a specific board, SDK, operating model, or transport, it should stay outside the runtime.

## 4. What Belongs in Input Adapters

An input adapter is responsible for:

- sensor or external state acquisition
- normalization
- lightweight preprocessing
- conversion to `DecisionInput`

An input adapter should not contain:

- state resolution
- action selection
- business logic
- escalation logic

Example:

```text
temperature sensor
  -> normalized temperature
  -> DecisionInput
```

## 5. What Belongs in Output Adapters

An output adapter is responsible for:

- interpreting `DecisionResult.action`
- translating that action into a hardware or software effect

Examples:

```text
fan_high
  -> PWM 180

relay_on
  -> GPIO HIGH
```

An output adapter should not contain:

- rule evaluation
- runtime state management
- action escalation logic

It translates an already-decided action. It does not re-decide behavior.

## 6. What Belongs in Orchestration

The orchestration or main layer is responsible for:

- runtime context management
  - `previousValue`
  - `previousState`
  - `stateDurationMs`
- scheduling
- polling timing
- loop or task lifecycle
- adapter coordination
- `DecisionEngine.evaluate()` execution

This layer exists because the runtime is stateless.

## 7. Stateless Runtime Model

The runtime does not keep internal mutable state.

Its model is:

```text
input snapshot
  ↓
deterministic evaluation
  ↓
result
```

Context and history stay outside the runtime and are passed in as part of the input snapshot.

This makes it easier to preserve behavior parity across:

- embedded environments
- simulation
- browser viewer
- replay
- server-side execution

## 8. Adapter Design Principles

Follow these rules when writing adapters:

- adapters should remain thin
- adapters should translate, not decide
- runtime should remain portable
- hardware SDKs should remain isolated
- avoid embedding vendor dependencies into the runtime core

When in doubt, put device-specific logic in the adapter or orchestration layer, not in the runtime.

## 9. Representative Example

`examples/m5-temp-fan/` is the representative example of this pattern.

Its current flow is:

```text
Si7021
  -> input adapter
  -> DecisionInput
  -> DecisionEngine.evaluate()
  -> DecisionResult
  -> output adapter
  -> PWM
  -> LED / fan
```

This example shows:

- sensor read outside the runtime
- caller-managed runtime context
- action translation outside the runtime
- hardware interaction outside the runtime

## 10. Future Direction

This project does not aim to become an all-device SDK.

It aims to provide:

- a portable runtime core
- a consistent runtime specification
- an adapter pattern
- representative examples

Device-specific integrations are expected to be implemented by users or applications on top of that pattern.
