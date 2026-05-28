// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Minimal public evaluate() example:
// use canonical-ready config, provide the smallest practical input shape,
// and treat reason/debug as diagnostics rather than stable formatting contracts.

const { evaluate } = require("../src");

const config = {
  states: [
    { name: "normal", action: "no_action" },
    { name: "warm", action: "fan_low" },
    { name: "hot", action: "fan_high" }
  ],
  rules: [
    { type: "value_gte", threshold: 30.0, state: "hot" },
    { type: "value_gte", threshold: 26.0, state: "warm" }
  ]
};

const input = {
  value: 26.4,
  previousValue: 26.1,
  previousState: "normal",
  stateDurationMs: 500,
  coolingEffect: false
};

const result = evaluate(input, config);

console.log("state:", result.state);
console.log("action:", result.action);

// Diagnostics exist in the JS convenience runtime, but callers should not
// depend on exact string formatting or the full debug object shape.
console.log("has reason:", typeof result.reason === "string");
console.log("has debug:", Boolean(result.debug && typeof result.debug === "object"));
