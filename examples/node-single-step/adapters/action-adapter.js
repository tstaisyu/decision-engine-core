// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

function toApplicationCommand(action) {
  switch (action) {
    case "fan_high":
      return { type: "set_fan_pwm", value: 180 };
    case "fan_low":
      return { type: "set_fan_pwm", value: 96 };
    case "alert":
      return { type: "raise_alert", level: "critical" };
    default:
      return { type: "noop" };
  }
}

module.exports = {
  toApplicationCommand
};
