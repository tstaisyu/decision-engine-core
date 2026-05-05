// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeConfig } = require("../src/normalizeConfig");

// Canonical rules require rule.state.
// Rules without state are dropped during normalize().

test("normalizes legacy shape into canonical states and rules", () => {
  const normalized = normalizeConfig({
    states: {
      rules: [
        { state: "hot", type: "value_gte", threshold: 30 },
        { state: "warm", type: "value_gte", threshold: 26 }
      ]
    },
    actions: {
      byState: {
        normal: "no_action",
        warm: "fan_low",
        hot: "fan_high"
      }
    },
    escalations: {
      state: {}
    }
  });

  assert.deepEqual(normalized.states, [
    { name: "normal", action: "no_action" },
    { name: "warm", action: "fan_low" },
    { name: "hot", action: "fan_high" }
  ]);
  assert.deepEqual(normalized.rules, [
    { state: "hot", type: "value_gte", threshold: 30 },
    { state: "warm", type: "value_gte", threshold: 26 }
  ]);
  assert.deepEqual(normalized.escalations, {
    state: {}
  });
});

test("drops canonical rules that do not define rule.state", () => {
  const normalized = normalizeConfig({
    states: [
      { name: "normal", action: "no_action" },
      { name: "warm", action: "fan_low" },
      { name: "hot", action: "fan_high" }
    ],
    rules: [
      { name: "hot", type: "value_gte", threshold: 30 },
      { state: "warm", type: "value_gte", threshold: 26 }
    ]
  });

  assert.deepEqual(normalized.states, [
    { name: "normal", action: "no_action" },
    { name: "warm", action: "fan_low" },
    { name: "hot", action: "fan_high" }
  ]);
  assert.deepEqual(normalized.rules, [
    { state: "warm", type: "value_gte", threshold: 26 }
  ]);
});
