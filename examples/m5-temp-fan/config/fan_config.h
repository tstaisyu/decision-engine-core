// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#ifndef M5_TEMP_FAN_CONFIG_FAN_CONFIG_H
#define M5_TEMP_FAN_CONFIG_FAN_CONFIG_H

#include "../../../runtimes/cpp/DecisionEngine.h"

inline DecisionConfig buildFanConfig() {
  DecisionConfig config;
  config.hotToCriticalDurationMs = 5000UL;
  config.fanLowToHighDurationMs = 1000UL;
  config.requireNoCoolingEffect = true;
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

#endif
