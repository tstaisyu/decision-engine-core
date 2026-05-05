// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluate } = require("../src");

test("evaluate accepts canonical config shape", () => {
  const result = evaluate(
    {
      value: 26.4,
      previousValue: 26.4,
      tempRateAvg: 0,
      previousState: "normal",
      previousAction: "no_action",
      stateDurationMs: 0
    },
    {
      states: [
        { name: "normal", action: "no_action" },
        { name: "warm", action: "fan_low" },
        { name: "hot", action: "fan_high" }
      ],
      rules: [
        { type: "value_gte", threshold: 30, state: "hot" },
        { type: "value_gte", threshold: 26, state: "warm" }
      ]
    }
  );

  assert.equal(result.state, "warm");
  assert.equal(result.action, "fan_low");
});
