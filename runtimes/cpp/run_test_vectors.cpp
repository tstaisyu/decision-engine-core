// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include <iostream>

#include "DecisionEngine.h"

int main() {
  DecisionEngine engine;
  engine.loadConfig(DecisionConfig{});

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

  DecisionConfig hysteresisConfig;
  hysteresisConfig.states = {
      {"normal", "no_action"},
      {"hot", "fan_high"},
  };
  hysteresisConfig.rules = {
      {"hysteresis", 0.0F, "hot", 26.0F, 25.5F},
  };
  engine.loadConfig(hysteresisConfig);

  const DecisionInput hysteresisHold{25.7F, 6000UL, 0.0F, 0UL, false, "hot"};
  const DecisionResult hysteresisHoldResult = engine.evaluate(hysteresisHold);
  std::cout << hysteresisHold.value << " -> " << hysteresisHoldResult.state << " / " << hysteresisHoldResult.action
            << '\n';

  const DecisionInput hysteresisNoHoldPreviousState{25.7F, 7000UL, 0.0F, 0UL, false, "normal"};
  const DecisionResult hysteresisNoHoldPreviousStateResult = engine.evaluate(hysteresisNoHoldPreviousState);
  std::cout << hysteresisNoHoldPreviousState.value << " -> " << hysteresisNoHoldPreviousStateResult.state << " / "
            << hysteresisNoHoldPreviousStateResult.action << '\n';

  const DecisionInput hysteresisNoHoldThreshold{25.4F, 8000UL, 0.0F, 0UL, false, "hot"};
  const DecisionResult hysteresisNoHoldThresholdResult = engine.evaluate(hysteresisNoHoldThreshold);
  std::cout << hysteresisNoHoldThreshold.value << " -> " << hysteresisNoHoldThresholdResult.state << " / "
            << hysteresisNoHoldThresholdResult.action << '\n';

  DecisionConfig rateGtConfig;
  rateGtConfig.states = {
      {"normal", "no_action"},
      {"warming", "fan_low"},
  };
  rateGtConfig.rules = {
      {"rate_gt", 0.1F, "warming"},
  };
  engine.loadConfig(rateGtConfig);

  const DecisionInput rateGtMatch{25.3F, 9000UL, 25.1F, 0UL, false, ""};
  const DecisionResult rateGtMatchResult = engine.evaluate(rateGtMatch);
  std::cout << rateGtMatch.value << " -> " << rateGtMatchResult.state << " / " << rateGtMatchResult.action << '\n';

  const DecisionInput rateGtBoundary{25.2F, 10000UL, 25.1F, 0UL, false, ""};
  const DecisionResult rateGtBoundaryResult = engine.evaluate(rateGtBoundary);
  std::cout << rateGtBoundary.value << " -> " << rateGtBoundaryResult.state << " / " << rateGtBoundaryResult.action
            << '\n';

  const DecisionInput rateGtNegative{25.1F, 11000UL, 25.3F, 0UL, false, ""};
  const DecisionResult rateGtNegativeResult = engine.evaluate(rateGtNegative);
  std::cout << rateGtNegative.value << " -> " << rateGtNegativeResult.state << " / " << rateGtNegativeResult.action
            << '\n';

  DecisionConfig rateLtConfig;
  rateLtConfig.states = {
      {"normal", "no_action"},
      {"cooling", "fan_low"},
  };
  rateLtConfig.rules = {
      {"rate_lt", -0.1F, "cooling"},
  };
  engine.loadConfig(rateLtConfig);

  const DecisionInput rateLtMatch{25.1F, 12000UL, 25.3F, 0UL, false, ""};
  const DecisionResult rateLtMatchResult = engine.evaluate(rateLtMatch);
  std::cout << rateLtMatch.value << " -> " << rateLtMatchResult.state << " / " << rateLtMatchResult.action << '\n';

  const DecisionInput rateLtBoundary{25.2F, 13000UL, 25.3F, 0UL, false, ""};
  const DecisionResult rateLtBoundaryResult = engine.evaluate(rateLtBoundary);
  std::cout << rateLtBoundary.value << " -> " << rateLtBoundaryResult.state << " / " << rateLtBoundaryResult.action
            << '\n';

  const DecisionInput rateLtPositive{25.3F, 14000UL, 25.1F, 0UL, false, ""};
  const DecisionResult rateLtPositiveResult = engine.evaluate(rateLtPositive);
  std::cout << rateLtPositive.value << " -> " << rateLtPositiveResult.state << " / " << rateLtPositiveResult.action
            << '\n';

  DecisionConfig stateEscalationConfig;
  stateEscalationConfig.states = {
      {"normal", "no_action"},
      {"hot", "fan_high"},
      {"critical", "alert"},
  };
  stateEscalationConfig.rules = {
      {"value_gte", 26.0F, "hot"},
  };
  stateEscalationConfig.hotToCriticalDurationMs = 5000UL;
  engine.loadConfig(stateEscalationConfig);

  const DecisionInput stateEscalationMatch{26.1F, 15000UL, 26.0F, 5000UL, false, "hot"};
  const DecisionResult stateEscalationMatchResult = engine.evaluate(stateEscalationMatch);
  std::cout << stateEscalationMatch.value << " -> " << stateEscalationMatchResult.state << " / "
            << stateEscalationMatchResult.action << '\n';

  const DecisionInput stateEscalationShortDuration{26.1F, 16000UL, 26.0F, 4999UL, false, "hot"};
  const DecisionResult stateEscalationShortDurationResult = engine.evaluate(stateEscalationShortDuration);
  std::cout << stateEscalationShortDuration.value << " -> " << stateEscalationShortDurationResult.state << " / "
            << stateEscalationShortDurationResult.action << '\n';

  const DecisionInput stateEscalationDifferentPreviousState{26.1F, 17000UL, 26.0F, 5000UL, false, "warming"};
  const DecisionResult stateEscalationDifferentPreviousStateResult =
      engine.evaluate(stateEscalationDifferentPreviousState);
  std::cout << stateEscalationDifferentPreviousState.value << " -> "
            << stateEscalationDifferentPreviousStateResult.state << " / "
            << stateEscalationDifferentPreviousStateResult.action << '\n';

  const DecisionInput stateEscalationBaseNormal{25.0F, 18000UL, 26.0F, 5000UL, false, "hot"};
  const DecisionResult stateEscalationBaseNormalResult = engine.evaluate(stateEscalationBaseNormal);
  std::cout << stateEscalationBaseNormal.value << " -> " << stateEscalationBaseNormalResult.state << " / "
            << stateEscalationBaseNormalResult.action << '\n';

  DecisionConfig actionEscalationConfig;
  actionEscalationConfig.states = {
      {"normal", "no_action"},
      {"warming", "fan_low"},
      {"hot", "fan_high"},
  };
  actionEscalationConfig.rules = {
      {"rate_gt", 0.1F, "warming"},
      {"value_gte", 26.0F, "hot"},
  };
  actionEscalationConfig.fanLowToHighDurationMs = 1000UL;
  actionEscalationConfig.requireNoCoolingEffect = true;
  engine.loadConfig(actionEscalationConfig);

  const DecisionInput actionEscalationMatch{25.3F, 19000UL, 25.1F, 1000UL, false, "warming"};
  const DecisionResult actionEscalationMatchResult = engine.evaluate(actionEscalationMatch);
  std::cout << actionEscalationMatch.value << " -> " << actionEscalationMatchResult.state << " / "
            << actionEscalationMatchResult.action << '\n';

  const DecisionInput actionEscalationShortDuration{25.3F, 20000UL, 25.1F, 999UL, false, "warming"};
  const DecisionResult actionEscalationShortDurationResult = engine.evaluate(actionEscalationShortDuration);
  std::cout << actionEscalationShortDuration.value << " -> " << actionEscalationShortDurationResult.state << " / "
            << actionEscalationShortDurationResult.action << '\n';

  const DecisionInput actionEscalationCoolingEffect{25.3F, 21000UL, 25.1F, 1000UL, true, "warming"};
  const DecisionResult actionEscalationCoolingEffectResult = engine.evaluate(actionEscalationCoolingEffect);
  std::cout << actionEscalationCoolingEffect.value << " -> " << actionEscalationCoolingEffectResult.state << " / "
            << actionEscalationCoolingEffectResult.action << '\n';

  const DecisionInput actionEscalationBaseHigh{26.2F, 22000UL, 26.0F, 1000UL, false, "hot"};
  const DecisionResult actionEscalationBaseHighResult = engine.evaluate(actionEscalationBaseHigh);
  std::cout << actionEscalationBaseHigh.value << " -> " << actionEscalationBaseHighResult.state << " / "
            << actionEscalationBaseHighResult.action << '\n';

  return 0;
}
