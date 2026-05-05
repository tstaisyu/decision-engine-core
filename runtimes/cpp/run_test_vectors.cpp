// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include <iostream>

#include "DecisionEngine.h"

int main() {
  DecisionEngine engine;
  engine.loadConfig({26.0F, 30.0F});

  // Mirrors test-vectors/minimal-temperature.json without introducing a JSON parser.
  const DecisionInput inputs[] = {
      {25.0F, 1000UL},
      {26.4F, 2000UL},
      {30.1F, 3000UL},
  };

  for (const DecisionInput& input : inputs) {
    const DecisionResult result = engine.evaluate(input);
    std::cout << input.value << " -> " << result.state << " / " << result.action << '\n';
  }

  DecisionConfig customConfig;
  customConfig.states[1].action = "fan_mid";
  engine.loadConfig(customConfig);

  const DecisionInput customInput{26.4F, 4000UL};
  const DecisionResult customResult = engine.evaluate(customInput);
  std::cout << customInput.value << " -> " << customResult.state << " / " << customResult.action << '\n';

  DecisionConfig unsupportedRuleConfig;
  unsupportedRuleConfig.rules = {
      {"unknown_type", 0.0F, "hot"},
      {"value_gte", 30.0F, "hot"},
      {"value_gte", 26.0F, "warm"},
  };
  engine.loadConfig(unsupportedRuleConfig);

  const DecisionInput unsupportedRuleInput{26.4F, 5000UL};
  const DecisionResult unsupportedRuleResult = engine.evaluate(unsupportedRuleInput);
  std::cout << unsupportedRuleInput.value << " -> " << unsupportedRuleResult.state << " / "
            << unsupportedRuleResult.action << '\n';

  return 0;
}
