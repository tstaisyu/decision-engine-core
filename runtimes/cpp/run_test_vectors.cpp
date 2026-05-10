// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include <iostream>
#include <string>

#include "DecisionEngine.h"

// Mirrors the named parity cases used by test/js-cpp-parity.test.js.
// The C++ runtime stays parser-free, so parity cases are handwritten here.
// Shared vector intent lives under vectors/.

namespace {

struct TestCase {
  const char* name;
  DecisionConfig config;
  DecisionInput input;
  const char* expectedState;
  const char* expectedAction;
};

void runCase(DecisionEngine& engine, const TestCase& testCase, int& passed, int& failed) {
  engine.loadConfig(testCase.config);

  const DecisionResult result = engine.evaluate(testCase.input);
  const bool isPass = result.state == testCase.expectedState && result.action == testCase.expectedAction;

  std::cout << (isPass ? "[PASS] " : "[FAIL] ") << testCase.name << ": " << testCase.input.value << " -> "
            << result.state << " / " << result.action << " (expected " << testCase.expectedState << " / "
            << testCase.expectedAction << ")\n";

  if (isPass) {
    passed += 1;
  } else {
    failed += 1;
  }
}

DecisionConfig buildMinimalTemperatureConfig() {
  DecisionConfig config;
  config.defaultState = "normal";
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
  int passed = 0;
  int failed = 0;

  const DecisionConfig minimalTemperatureConfig = buildMinimalTemperatureConfig();
  const TestCase minimalCases[] = {
      {"value_gte.normal", minimalTemperatureConfig, {25.0F, 1000UL}, "normal", "no_action"},
      {"value_gte.warm", minimalTemperatureConfig, {26.4F, 2000UL}, "warm", "fan_low"},
      {"value_gte.hot", minimalTemperatureConfig, {30.1F, 3000UL}, "hot", "fan_high"},
  };

  DecisionConfig customActionConfig;
  customActionConfig.defaultState = "normal";
  customActionConfig.states[1].action = "fan_mid";
  const TestCase customActionCase{
      "value_gte.custom_action",
      customActionConfig,
      {26.4F, 4000UL},
      "warm",
      "fan_mid",
  };

  DecisionConfig unsupportedRuleConfig;
  unsupportedRuleConfig.defaultState = "normal";
  unsupportedRuleConfig.rules = {
      {"unknown_type", 0.0F, "hot"},
      {"value_gte", 30.0F, "hot"},
      {"value_gte", 26.0F, "warm"},
  };
  const TestCase unsupportedRuleCase{
      "unsupported_rule.skip_to_next",
      unsupportedRuleConfig,
      {26.4F, 5000UL},
      "warm",
      "fan_low",
  };

  DecisionConfig hysteresisConfig;
  hysteresisConfig.defaultState = "normal";
  hysteresisConfig.states = {
      {"normal", "no_action"},
      {"hot", "fan_high"},
  };
  hysteresisConfig.rules = {
      {"hysteresis", 0.0F, "hot", 26.0F, 25.5F},
  };
  const TestCase hysteresisCases[] = {
      {"hysteresis.hold_hot", hysteresisConfig, {25.7F, 6000UL, 0.0F, 0UL, false, "hot"}, "hot", "fan_high"},
      {"hysteresis.no_hold_previous_state",
       hysteresisConfig,
       {25.7F, 7000UL, 0.0F, 0UL, false, "normal"},
       "normal",
       "no_action"},
      {"hysteresis.no_hold_threshold",
       hysteresisConfig,
       {25.4F, 8000UL, 0.0F, 0UL, false, "hot"},
       "normal",
       "no_action"},
  };

  DecisionConfig rateGtConfig;
  rateGtConfig.defaultState = "normal";
  rateGtConfig.states = {
      {"normal", "no_action"},
      {"warming", "fan_low"},
  };
  rateGtConfig.rules = {
      {"rate_gt", 0.1F, "warming"},
  };
  const TestCase rateGtCases[] = {
      {"rate_gt.match", rateGtConfig, {25.3F, 9000UL, 25.1F, 0UL, false, ""}, "warming", "fan_low"},
      {"rate_gt.boundary", rateGtConfig, {25.199F, 10000UL, 25.1F, 0UL, false, ""}, "normal", "no_action"},
      {"rate_gt.negative_delta", rateGtConfig, {25.1F, 11000UL, 25.3F, 0UL, false, ""}, "normal", "no_action"},
  };

  DecisionConfig rateLtConfig;
  rateLtConfig.defaultState = "normal";
  rateLtConfig.states = {
      {"normal", "no_action"},
      {"cooling", "fan_low"},
  };
  rateLtConfig.rules = {
      {"rate_lt", -0.1F, "cooling"},
  };
  const TestCase rateLtCases[] = {
      {"rate_lt.match", rateLtConfig, {25.1F, 12000UL, 25.3F, 0UL, false, ""}, "cooling", "fan_low"},
      {"rate_lt.boundary", rateLtConfig, {25.2F, 13000UL, 25.3F, 0UL, false, ""}, "normal", "no_action"},
      {"rate_lt.positive_delta", rateLtConfig, {25.3F, 14000UL, 25.1F, 0UL, false, ""}, "normal", "no_action"},
  };

  DecisionConfig stateEscalationConfig;
  stateEscalationConfig.defaultState = "normal";
  stateEscalationConfig.stateEscalationFromState = "hot";
  stateEscalationConfig.stateEscalationToState = "critical";
  stateEscalationConfig.states = {
      {"normal", "no_action"},
      {"hot", "fan_high"},
      {"critical", "alert"},
  };
  stateEscalationConfig.rules = {
      {"value_gte", 26.0F, "hot"},
  };
  stateEscalationConfig.stateEscalationDurationMs = 5000UL;
  const TestCase stateEscalationCases[] = {
      {"state_escalation.hot_to_critical",
       stateEscalationConfig,
       {26.1F, 15000UL, 26.0F, 5000UL, false, "hot"},
       "critical",
       "alert"},
      {"state_escalation.short_duration",
       stateEscalationConfig,
       {26.1F, 16000UL, 26.0F, 4999UL, false, "hot"},
       "hot",
       "fan_high"},
      {"state_escalation.different_previous_state",
       stateEscalationConfig,
       {26.1F, 17000UL, 26.0F, 5000UL, false, "warming"},
       "hot",
       "fan_high"},
      {"state_escalation.base_normal",
       stateEscalationConfig,
       {25.0F, 18000UL, 26.0F, 5000UL, false, "hot"},
       "normal",
       "no_action"},
  };

  DecisionConfig actionEscalationConfig;
  actionEscalationConfig.defaultState = "normal";
  actionEscalationConfig.actionEscalationFromAction = "fan_low";
  actionEscalationConfig.actionEscalationToAction = "fan_high";
  actionEscalationConfig.states = {
      {"normal", "no_action"},
      {"warming", "fan_low"},
      {"hot", "fan_high"},
  };
  actionEscalationConfig.rules = {
      {"value_gte", 26.0F, "hot"},
      {"rate_gt", 0.1F, "warming"},
  };
  actionEscalationConfig.actionEscalationDurationMs = 1000UL;
  actionEscalationConfig.requireNoCoolingEffect = true;
  const TestCase actionEscalationCases[] = {
      {"action_escalation.fan_low_to_high",
       actionEscalationConfig,
       {25.3F, 19000UL, 25.1F, 1000UL, false, "warming"},
       "warming",
       "fan_high"},
      {"action_escalation.short_duration",
       actionEscalationConfig,
       {25.3F, 20000UL, 25.1F, 999UL, false, "warming"},
       "warming",
       "fan_low"},
      {"action_escalation.cooling_effect_blocks",
       actionEscalationConfig,
       {25.3F, 21000UL, 25.1F, 1000UL, true, "warming"},
       "warming",
       "fan_low"},
      {"action_escalation.base_action_already_high",
       actionEscalationConfig,
       {26.2F, 22000UL, 26.0F, 1000UL, false, "hot"},
       "hot",
       "fan_high"},
  };

  for (const TestCase& testCase : minimalCases) {
    runCase(engine, testCase, passed, failed);
  }
  runCase(engine, customActionCase, passed, failed);
  runCase(engine, unsupportedRuleCase, passed, failed);
  for (const TestCase& testCase : hysteresisCases) {
    runCase(engine, testCase, passed, failed);
  }
  for (const TestCase& testCase : rateGtCases) {
    runCase(engine, testCase, passed, failed);
  }
  for (const TestCase& testCase : rateLtCases) {
    runCase(engine, testCase, passed, failed);
  }
  for (const TestCase& testCase : stateEscalationCases) {
    runCase(engine, testCase, passed, failed);
  }
  for (const TestCase& testCase : actionEscalationCases) {
    runCase(engine, testCase, passed, failed);
  }

  std::cout << "\nSummary: " << passed << " passed, " << failed << " failed\n";
  return failed == 0 ? 0 : 1;
}
