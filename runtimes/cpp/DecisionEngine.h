// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#ifndef DECISION_ENGINE_H
#define DECISION_ENGINE_H

#include <string>

struct DecisionInput {
  float value;
  unsigned long timestamp;
};

struct DecisionResult {
  std::string state;
  std::string action;
};

struct DecisionConfig {
  float warmThreshold;
  float hotThreshold;
};

class DecisionEngine {
 public:
  void loadConfig(const DecisionConfig& config);
  DecisionResult evaluate(const DecisionInput& input) const;

 private:
  DecisionConfig config_{0.0F, 0.0F};
};

#endif
