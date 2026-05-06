// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#ifndef M5_TEMP_FAN_ADAPTERS_FAN_OUTPUT_ADAPTER_H
#define M5_TEMP_FAN_ADAPTERS_FAN_OUTPUT_ADAPTER_H

#include <Arduino.h>

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

inline void applyPwm(int pwm) {
  // TODO: 実機ではここで analogWrite や ledcWrite を呼ぶ
  // ESP32 (M5Stack) PWM example:
  // ledcSetup(0, 5000, 8);
  // ledcAttachPin(FAN_PIN, 0);
  // ledcWrite(0, pwm);
  Serial.print("apply pwm: ");
  Serial.println(pwm);
}

#endif
