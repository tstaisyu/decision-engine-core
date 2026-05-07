// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include <iostream>

#include "DecisionEngine.h"
#include "../../examples/m5-temp-fan/config/generated_fan_config.h"

namespace {

struct TestCase {
  const char* name;
  DecisionInput input;
  const char* expectedState;
  const char* expectedAction;
};

void runCase(DecisionEngine& engine, const TestCase& testCase, int& passed, int& failed) {
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

}  // namespace

int main() {
  DecisionEngine engine;
  engine.loadConfig(buildGeneratedConfig());

  int passed = 0;
  int failed = 0;

  const TestCase testCases[] = {
      {"generated_config.normal", {31.0F, 1000UL}, "normal", "no_action"},
      {"generated_config.warm", {32.0F, 2000UL}, "warm", "fan_low"},
      {"generated_config.hot", {34.0F, 3000UL}, "hot", "fan_high"},
  };

  for (const TestCase& testCase : testCases) {
    runCase(engine, testCase, passed, failed);
  }

  std::cout << "\nSummary: " << passed << " passed, " << failed << " failed\n";
  return failed == 0 ? 0 : 1;
}
