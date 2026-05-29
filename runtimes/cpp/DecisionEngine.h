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
  std::string defaultState{};
  std::string stateEscalationFromState{};
  std::string stateEscalationToState{};
  unsigned long stateEscalationDurationMs = 0UL;
  std::string actionEscalationFromAction{};
  std::string actionEscalationToAction{};
  unsigned long actionEscalationDurationMs = 0UL;
  bool requireNoCoolingEffect = true;
  std::vector<StateConfig> states{};
  std::vector<Rule> rules{};
};

class DecisionEngine {
 public:
  void loadConfig(const DecisionConfig& config);
  DecisionResult evaluate(const DecisionInput& input) const;

 private:
  DecisionConfig config_{};
};

#endif
