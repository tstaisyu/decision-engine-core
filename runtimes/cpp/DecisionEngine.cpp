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
  if (input.value >= config_.hotThreshold) {
    const StateConfig state = findStateConfig(config_, "hot");
    return {state.name, state.action};
  }

  if (input.value >= config_.warmThreshold) {
    const StateConfig state = findStateConfig(config_, "warm");
    return {state.name, state.action};
  }

  const StateConfig state = findStateConfig(config_, "normal");
  return {state.name, state.action};
}
