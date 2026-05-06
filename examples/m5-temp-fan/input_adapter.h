// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#ifndef M5_TEMP_FAN_INPUT_ADAPTER_H
#define M5_TEMP_FAN_INPUT_ADAPTER_H

#include <Arduino.h>

#include "../../runtimes/cpp/DecisionEngine.h"

struct RuntimeState {
  float previousValue = 0.0F;
  String previousState = "normal";
  unsigned long stateStartedAtMs = 0UL;
  bool initialized = false;
};

inline DecisionInput buildDecisionInput(float currentTemp, const RuntimeState& state, unsigned long nowMs) {
  DecisionInput input;
  input.value = currentTemp;
  input.previousValue = state.initialized ? state.previousValue : currentTemp;
  input.previousState = state.initialized ? std::string(state.previousState.c_str()) : std::string();
  input.stateDurationMs = state.initialized ? nowMs - state.stateStartedAtMs : 0UL;
  input.coolingEffect = false;
  input.timestamp = nowMs;
  return input;
}

inline void updateRuntimeState(RuntimeState& state, float currentTemp, const String& currentState, unsigned long nowMs) {
  if (!state.initialized) {
    state.previousValue = currentTemp;
    state.previousState = currentState;
    state.stateStartedAtMs = nowMs;
    state.initialized = true;
    return;
  }

  if (state.previousState != currentState) {
    state.stateStartedAtMs = nowMs;
  }

  state.previousValue = currentTemp;
  state.previousState = currentState;
}

#endif
