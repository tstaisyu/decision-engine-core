// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#ifndef M5_TEMP_FAN_ADAPTERS_FAN_OUTPUT_ADAPTER_H
#define M5_TEMP_FAN_ADAPTERS_FAN_OUTPUT_ADAPTER_H

#include <Arduino.h>

constexpr int FAN_PWM_PIN = 26;
constexpr int PWM_CHANNEL = 0;
constexpr int PWM_FREQUENCY = 5000;
constexpr int PWM_RESOLUTION = 8;

inline int actionToPwm(const String& action) {
  if (action == "no_action") {
    return 0;
  }
  if (action == "fan_low") {
    return 80;
  }
  if (action == "fan_high") {
    return 180;
  }
  return 0;
}

inline void setupFanPwm() {
  ledcSetup(PWM_CHANNEL, PWM_FREQUENCY, PWM_RESOLUTION);
  ledcAttachPin(FAN_PWM_PIN, PWM_CHANNEL);
}

inline void applyPwm(int pwm) {
  ledcWrite(PWM_CHANNEL, pwm);
  Serial.print("apply pwm: ");
  Serial.println(pwm);
}

#endif
