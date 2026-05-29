// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include <iostream>

#include "DecisionEngine.h"

namespace {

DecisionConfig buildSampleConfig() {
  DecisionConfig config;
  config.defaultState = "normal";
  config.stateEscalationFromState = "hot";
  config.stateEscalationToState = "critical";
  config.stateEscalationDurationMs = 5000UL;
  config.actionEscalationFromAction = "fan_low";
  config.actionEscalationToAction = "fan_high";
  config.actionEscalationDurationMs = 1000UL;
  config.requireNoCoolingEffect = true;
  config.states = {
      {"normal", "no_action"},
      {"warm", "fan_low"},
      {"hot", "fan_high"},
  };
  config.rules = {
      {"value_gte", 30.0F, "hot"},
      {"value_gte", 26.0F, "warm"},
  };
  return config;
}

}  // namespace

int main() {
  DecisionEngine engine;
  engine.loadConfig(buildSampleConfig());

  const DecisionInput inputs[] = {
      {25.0F, 1000UL},
      {26.4F, 2000UL},
      {30.1F, 3000UL},
  };

  for (const DecisionInput& input : inputs) {
    const DecisionResult result = engine.evaluate(input);
    std::cout << input.value << " -> " << result.state << " / " << result.action << '\n';
  }

  return 0;
}
