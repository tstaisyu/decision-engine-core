// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#ifndef M5_TEMP_FAN_CONFIG_FAN_CONFIG_H
#define M5_TEMP_FAN_CONFIG_FAN_CONFIG_H

#include "generated_fan_config.h"

inline DecisionConfig buildFanConfig() {
  return buildGeneratedConfig();
}

#endif
