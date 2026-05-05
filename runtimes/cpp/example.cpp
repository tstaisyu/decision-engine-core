// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include <iostream>

#include "DecisionEngine.h"

int main() {
  DecisionEngine engine;
  engine.loadConfig(DecisionConfig{});

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
