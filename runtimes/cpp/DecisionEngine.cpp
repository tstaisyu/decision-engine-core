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
  std::string baseState = config_.defaultState;

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
  if (!config_.stateEscalationFromState.empty() && !config_.stateEscalationToState.empty() &&
      baseState == config_.stateEscalationFromState && input.previousState == config_.stateEscalationFromState &&
      input.stateDurationMs >= config_.stateEscalationDurationMs) {
    stateName = config_.stateEscalationToState;
  }

  const StateConfig state = findStateConfig(config_, stateName);
  std::string action = state.action;
  if (!config_.actionEscalationFromAction.empty() && !config_.actionEscalationToAction.empty() &&
      state.action == config_.actionEscalationFromAction &&
      input.stateDurationMs >= config_.actionEscalationDurationMs) {
    if (!config_.requireNoCoolingEffect || !input.coolingEffect) {
      action = config_.actionEscalationToAction;
    }
  }

  return {state.name, action};
}
