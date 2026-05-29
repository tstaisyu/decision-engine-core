# Adapter Pattern

This document describes the adapter pattern used around `decision-engine-core`.

The goal is to keep decision logic separate from sensor SDKs, hardware control, and platform-specific lifecycle code.

`runtime-integration.md` describes the overall integration flow.
This document focuses on adapter responsibilities and boundary design.

## 1. Runtime Responsibility

The DecisionEngine runtime is responsible for decision behavior only.

In scope:

- rule evaluation
- state resolution
- action resolution
- escalation behavior

The runtime takes an input snapshot and config, then returns `state` and `action`.

## 2. Runtime Non-Goals

The runtime does not own:

- sensor read
- GPIO
- PWM
- I2C
- Wi-Fi
- Arduino / M5Stack / vendor SDK integration
- motor driver SDK integration
- electrical safety
- device-specific integration

These concerns stay outside the runtime.

## 3. Adapter Definition

An adapter is the translation layer between the runtime core and the external world.

- input adapter: external state -> `DecisionInput`
- output adapter: `DecisionResult.action` -> hardware or software effect

The adapter layer exists so that the runtime can stay platform-independent.

## 4. Input Adapter Responsibility

An input adapter is responsible for:

- reading sensor or external data
- applying required preprocessing
- converting values into `DecisionInput`

An input adapter does not implement decision logic.

It should not decide state or action on its own.

## 5. Output Adapter Responsibility

An output adapter is responsible for:

- interpreting `DecisionResult.action`
- converting it into PWM, GPIO, relay, motor, MQTT, REST, or another target effect

An output adapter does not perform:

- rule evaluation
- state resolution
- action resolution

It only translates the already-decided action into an external effect.

## 6. Orchestration Responsibility

Outside the runtime and adapters, an orchestration layer is still required.

Typical responsibilities:

- sensor read timing
- `previousValue`, `previousState`, and `stateDurationMs` management
- calling `DecisionEngine.evaluate()`
- passing the result into an output adapter
- main loop, task scheduling, and platform-specific lifecycle handling

This orchestration layer is usually implemented by the application or device runtime.

## 7. Stateless Runtime Model

The runtime is stateless.

It receives an input snapshot, evaluates deterministically, and returns a result.

It does not keep:

- `previousValue`
- `previousState`
- duration state

inside the runtime instance.

This makes it easier to preserve the same behavior across:

- embedded runtimes
- browser simulation
- server execution
- replay
- test environments

## 8. Adapter Pattern Included, Not Device SDK Included

This project does not aim to become an officially supported SDK collection for many devices.

The project includes:

- the runtime core
- representative examples
- adapter pattern guidance
- adapter templates and example structure

The project does not aim to include official integrations for every:

- board
- sensor
- actuator
- motor driver
- cloud or vendor SDK

Device-specific adapters should be implemented by the user or application.

## 9. Representative Example

`examples/m5-temp-fan/` is a representative example of this pattern.

Its current flow is:

```text
Si7021 temperature input
  -> DecisionInput adapter
  -> DecisionEngine.evaluate()
  -> DecisionResult state/action
  -> PWM output adapter
  -> LED / fan output
```

Current verification status:

- PWM LED verification is implemented
- real fan verification is not yet covered
