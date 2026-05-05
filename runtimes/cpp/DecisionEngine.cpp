// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include "DecisionEngine.h"

namespace {

StateConfig findStateConfig(const DecisionConfig& config, const std::string& stateName) {
  for (const StateConfig& state : config.states) {
    if (state.name == stateName) {
      return state;
    }
  }

  return {stateName, "no_action"};
}

}  // namespace

void DecisionEngine::loadConfig(const DecisionConfig& config) {
  config_ = config;
}

DecisionResult DecisionEngine::evaluate(const DecisionInput& input) const {
  const float stateRate = input.value - input.previousValue;
  std::string baseState = "normal";

  for (const Rule& rule : config_.rules) {
    if (rule.type == "value_gte" && input.value >= rule.threshold) {
      baseState = rule.state;
      break;
    }

    if (rule.type == "hysteresis" && input.previousState == rule.state && input.value > rule.offThreshold) {
      baseState = rule.state;
      break;
    }

    if (rule.type == "rate_gt" && stateRate > rule.threshold) {
      baseState = rule.state;
      break;
    }

    if (rule.type == "rate_lt" && stateRate < rule.threshold) {
      baseState = rule.state;
      break;
    }
  }

  std::string stateName = baseState;
  if (baseState == "hot" && input.previousState == "hot" && input.stateDurationMs >= config_.hotToCriticalDurationMs) {
    stateName = "critical";
  }

  const StateConfig state = findStateConfig(config_, stateName);
  std::string action = state.action;
  if (state.action == "fan_low" && input.stateDurationMs >= config_.fanLowToHighDurationMs) {
    if (!config_.requireNoCoolingEffect || !input.coolingEffect) {
      action = "fan_high";
    }
  }

  return {state.name, action};
}
