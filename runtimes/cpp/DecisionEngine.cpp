// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include "DecisionEngine.h"

void DecisionEngine::loadConfig(const DecisionConfig& config) {
  config_ = config;
}

DecisionResult DecisionEngine::evaluate(const DecisionInput& input) const {
  if (input.value >= config_.hotThreshold) {
    return {config_.hot.name, config_.hot.action};
  }

  if (input.value >= config_.warmThreshold) {
    return {config_.warm.name, config_.warm.action};
  }

  return {config_.normal.name, config_.normal.action};
}
