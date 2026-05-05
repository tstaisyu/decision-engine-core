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
  for (const Rule& rule : config_.rules) {
    if (rule.type == "value_gte" && input.value >= rule.threshold) {
      const StateConfig state = findStateConfig(config_, rule.state);
      return {state.name, state.action};
    }
  }

  const StateConfig state = findStateConfig(config_, "normal");
  return {state.name, state.action};
}
