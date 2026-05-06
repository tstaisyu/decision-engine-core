// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

#include <Arduino.h>
#include <M5Stack.h>
#include <Wire.h>

#include "../../runtimes/cpp/DecisionEngine.h"

DecisionEngine engine;
constexpr uint8_t kSi7021Address = 0x40;
constexpr uint8_t kSi7021MeasureTempHoldMaster = 0xE3;

struct RuntimeState {
  float previousValue = 0.0F;
  String previousState = "normal";
  unsigned long stateStartedAtMs = 0UL;
  bool initialized = false;
};

RuntimeState runtimeState;

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

int actionToPwm(const String& action) {
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

void applyPwm(int pwm) {
  // TODO: 実機ではここで analogWrite や ledcWrite を呼ぶ
  // ESP32 (M5Stack) PWM example:
  // ledcSetup(0, 5000, 8);
  // ledcAttachPin(FAN_PIN, 0);
  // ledcWrite(0, pwm);
  Serial.print("apply pwm: ");
  Serial.println(pwm);
}

DecisionInput buildDecisionInput(float currentTemp, const RuntimeState& state, unsigned long nowMs) {
  DecisionInput input;
  input.value = currentTemp;
  input.previousValue = state.initialized ? state.previousValue : currentTemp;
  input.previousState = state.initialized ? std::string(state.previousState.c_str()) : std::string();
  input.stateDurationMs = state.initialized ? nowMs - state.stateStartedAtMs : 0UL;
  input.coolingEffect = false;
  input.timestamp = nowMs;
  return input;
}

void updateRuntimeState(RuntimeState& state, float currentTemp, const String& currentState, unsigned long nowMs) {
  if (!state.initialized) {
    state.previousValue = currentTemp;
    state.previousState = currentState;
    state.stateStartedAtMs = nowMs;
    state.initialized = true;
    return;
  }

  if (state.previousState != currentState) {
    state.stateStartedAtMs = nowMs;
  }

  state.previousValue = currentTemp;
  state.previousState = currentState;
}

void setup() {
  M5.begin();
  Wire.begin();
  Serial.begin(115200);

  DecisionConfig config;
  engine.loadConfig(config);

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
