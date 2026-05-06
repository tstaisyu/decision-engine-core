// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#ifndef M5_TEMP_FAN_CONFIG_FAN_CONFIG_H
#define M5_TEMP_FAN_CONFIG_FAN_CONFIG_H

#include "../../../runtimes/cpp/DecisionEngine.h"

inline DecisionConfig buildFanConfig() {
  DecisionConfig config;
  config.hotToCriticalDurationMs = 5000UL;
  // Temporary duration for LED-based verification of warm -> fan_low before escalation.
  config.fanLowToHighDurationMs = 10000UL;
  config.requireNoCoolingEffect = true;
  config.states = {
      {"normal", "no_action"},
      {"warm", "fan_low"},
      {"hot", "fan_high"},
      {"critical", "fan_high"},
  };
  // Temporary thresholds for on-device verification around typical room temperature.
  config.rules = {
      {"value_gte", 34.0F, "hot"},
      {"value_gte", 32.0F, "warm"},
  };
  return config;
}

#endif
