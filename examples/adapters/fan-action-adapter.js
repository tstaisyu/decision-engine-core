// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const ACTION_TO_PWM = {
  no_action: 0,
  fan_low: 80,
  fan_high: 180,
  alert: 255
};

function mapActionToFanCommand(action) {
  return {
    action,
    pwm: ACTION_TO_PWM[action] ?? 0
  };
}

module.exports = {
  ACTION_TO_PWM,
  mapActionToFanCommand
};
