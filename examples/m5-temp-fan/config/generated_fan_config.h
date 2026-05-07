// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0
//
// GENERATED FILE - DO NOT EDIT MANUALLY.
// Source config should be updated instead.

#ifndef GENERATED_FAN_CONFIG_H
#define GENERATED_FAN_CONFIG_H

#include "../../../runtimes/cpp/DecisionEngine.h"

inline DecisionConfig buildGeneratedConfig() {
  DecisionConfig config;
  config.hotToCriticalDurationMs = 5000UL;
  config.fanLowToHighDurationMs = 10000UL;
  config.requireNoCoolingEffect = false;
  config.states = {
      {"normal", "no_action"},
      {"warm", "fan_low"},
      {"hot", "fan_high"},
      {"critical", "fan_high"},
  };
  config.rules = {
      {"value_gte", 34.0F, "hot", 0.0F, 0.0F},
      {"value_gte", 32.0F, "warm", 0.0F, 0.0F},
  };
  return config;
}

#endif
