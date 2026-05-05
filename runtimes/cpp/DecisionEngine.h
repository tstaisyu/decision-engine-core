// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#ifndef DECISION_ENGINE_H
#define DECISION_ENGINE_H

#include <string>
#include <vector>

struct DecisionInput {
  float value;
  unsigned long timestamp;
  float previousValue = 0.0F;
  unsigned long stateDurationMs = 0UL;
  bool coolingEffect = false;
  std::string previousState{};
};

struct DecisionResult {
  std::string state;
  std::string action;
};

struct StateConfig {
  std::string name;
  std::string action;
};

struct Rule {
  std::string type;
  float threshold = 0.0F;
  std::string state;
  float onThreshold = 0.0F;
  float offThreshold = 0.0F;
};

struct DecisionConfig {
  unsigned long hotToCriticalDurationMs = 5000UL;
  unsigned long fanLowToHighDurationMs = 1000UL;
  bool requireNoCoolingEffect = true;
  std::vector<StateConfig> states{
      {"normal", "no_action"},
      {"warm", "fan_low"},
      {"hot", "fan_high"},
  };
  std::vector<Rule> rules{
      {"value_gte", 30.0F, "hot"},
      {"value_gte", 26.0F, "warm"},
  };
};

class DecisionEngine {
 public:
  void loadConfig(const DecisionConfig& config);
  DecisionResult evaluate(const DecisionInput& input) const;

 private:
  DecisionConfig config_{};
};

#endif
