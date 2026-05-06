// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include <Arduino.h>
#include <M5Stack.h>
#include <Wire.h>

#include "../../runtimes/cpp/DecisionEngine.h"
#include "config/fan_config.h"
#include "fan_adapter.h"
#include "input_adapter.h"

DecisionEngine engine;
RuntimeState runtimeState;
constexpr uint8_t kSi7021Address = 0x40;
constexpr uint8_t kSi7021MeasureTempHoldMaster = 0xE3;

bool isSi7021Available() {
  Wire.beginTransmission(kSi7021Address);
  return Wire.endTransmission() == 0;
}

float readTemperature() {
  Wire.beginTransmission(kSi7021Address);
  Wire.write(kSi7021MeasureTempHoldMaster);
  if (Wire.endTransmission() != 0) {
    return NAN;
  }

  delay(25);
  const int bytesRead = Wire.requestFrom(static_cast<int>(kSi7021Address), 2);
  if (bytesRead < 2) {
    return NAN;
  }

  const uint16_t rawValue = (static_cast<uint16_t>(Wire.read()) << 8) | static_cast<uint16_t>(Wire.read());
  return ((175.72F * static_cast<float>(rawValue)) / 65536.0F) - 46.85F;
}

void setup() {
  M5.begin();
  Wire.begin();
  Serial.begin(115200);

  engine.loadConfig(buildFanConfig());

  if (!isSi7021Available()) {
    Serial.println("warning: Si7021 not detected on I2C");
  }
}

void loop() {
  const unsigned long nowMs = millis();
  const float currentTemp = readTemperature();
  if (!isfinite(currentTemp)) {
    Serial.println("sensor error: failed to read temperature");
    delay(1000);
    return;
  }

  const DecisionInput input = buildDecisionInput(currentTemp, runtimeState, nowMs);

  const DecisionResult result = engine.evaluate(input);
  const int pwm = actionToPwm(String(result.action.c_str()));
  applyPwm(pwm);

  Serial.print("value=");
  Serial.print(currentTemp);
  Serial.print(", state=");
  Serial.print(result.state.c_str());
  Serial.print(", action=");
  Serial.print(result.action.c_str());
  Serial.print(", pwm=");
  Serial.println(pwm);
  updateRuntimeState(runtimeState, currentTemp, String(result.state.c_str()), nowMs);

  delay(1000);
}
