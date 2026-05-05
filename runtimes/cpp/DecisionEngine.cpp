// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include "DecisionEngine.h"

void DecisionEngine::loadConfig(const DecisionConfig& config) {
  config_ = config;
}

DecisionResult DecisionEngine::evaluate(const DecisionInput& input) const {
  if (input.value >= config_.hotThreshold) {
    return {"hot", "fan_high"};
  }

  if (input.value >= config_.warmThreshold) {
    return {"warming", "fan_low"};
  }

  return {"normal", "no_action"};
}
