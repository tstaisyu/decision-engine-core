// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include <Arduino.h>

#include "../../runtimes/cpp/DecisionEngine.h"

DecisionEngine engine;

float nextTemperatureValue() {
  static const float values[] = {25.0F, 26.0F, 30.0F};
  static size_t index = 0;

  const float value = values[index];
  index = (index + 1) % (sizeof(values) / sizeof(values[0]));
  return value;
}

int mapActionToPwm(const String& action) {
  if (action == "fan_high") {
    return 180;
  }
  if (action == "fan_low") {
    return 80;
  }
  return 0;
}

void setup() {
  Serial.begin(115200);

  DecisionConfig config;
  engine.loadConfig(config);
}

void loop() {
  const float value = nextTemperatureValue();

  DecisionInput input;
  input.value = value;
  input.timestamp = millis();

  const DecisionResult result = engine.evaluate(input);
  const int pwm = mapActionToPwm(String(result.action.c_str()));

  Serial.print("value=");
  Serial.print(value);
  Serial.print(", state=");
  Serial.print(result.state.c_str());
  Serial.print(", action=");
  Serial.print(result.action.c_str());
  Serial.print(", pwm=");
  Serial.println(pwm);

  delay(1000);
}
