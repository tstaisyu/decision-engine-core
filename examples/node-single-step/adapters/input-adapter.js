// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

function toEngineInput(raw) {
  const value = raw.currentCelsius;
  const previousValue = raw.previousCelsius;

  return {
    value,
    previousValue,
    previousState: raw.lastState,
    previousAction: raw.lastAction,
    stateDurationMs: raw.lastStateDurationMs,
    coolingEffect: false,
    timestamp: raw.observedAtMs,
    tempDelta: value - previousValue,
    tempRate: value - previousValue,
    tempRateAvg: value - previousValue
  };
}

module.exports = {
  toEngineInput
};
