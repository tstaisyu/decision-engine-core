// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import test from "node:test";
import assert from "node:assert/strict";
import { deriveActionCore, deriveState, findStateAction, matchRule } from "../src/lib/browserRuntimeCore.js";

test("matchRule handles supported rule types and unsupported fallback", () => {
  const normalized = {
    value: 31,
    previousStateSafe: "hot",
    stateRate: 0.03
  };

  assert.equal(matchRule({ type: "value_gte", threshold: 30 }, normalized), true);
  assert.equal(matchRule({ type: "hysteresis", state: "hot", offThreshold: 25.5 }, normalized), true);
  assert.equal(matchRule({ type: "rate_gt", threshold: 0.02 }, normalized), true);
  assert.equal(matchRule({ type: "rate_lt", threshold: -0.01 }, normalized), false);
  assert.equal(matchRule({ type: "unknown_rule", threshold: 0 }, normalized), false);
});

test("findStateAction resolves mapped action and falls back to no_action", () => {
  const states = [
    { name: "normal", action: "no_action" },
    { name: "hot", action: "fan_high" }
  ];

  assert.equal(findStateAction(states, "hot"), "fan_high");
  assert.equal(findStateAction(states, "missing"), "no_action");
});

test("deriveState resolves base state and applies escalation", () => {
  const config = {
    rules: [
      { type: "value_gte", threshold: 30, state: "hot" },
      { type: "value_gte", threshold: 26, state: "warm" }
    ],
    escalations: {
      state: {
        hotToCritical: { durationMs: 5000 }
      }
    }
  };

  const escalated = deriveState(
    {
      value: 31,
      previousStateSafe: "hot",
      rawStateDurationMs: 6000,
      stateRate: 0,
      previousValue: 31
    },
    config
  );

  assert.equal(escalated.baseState, "hot");
  assert.equal(escalated.state, "critical");
  assert.equal(escalated.effectiveStateDurationMs, 6000);

  const noMatch = deriveState(
    {
      value: 24,
      previousStateSafe: "normal",
      rawStateDurationMs: 1200,
      stateRate: 0,
      previousValue: 24
    },
    config
  );

  assert.equal(noMatch.baseState, "normal");
  assert.equal(noMatch.state, "normal");
});

test("deriveActionCore resolves action escalation behavior", () => {
  const config = {
    escalations: {
      action: {
        fanLowToHigh: {
          durationMs: 1000,
          requireNoCoolingEffect: false
        }
      }
    }
  };

  const escalated = deriveActionCore("fan_low", 1500, false, config);
  assert.equal(escalated.baseAction, "fan_low");
  assert.equal(escalated.action, "fan_high");
  assert.equal(escalated.actionEscalated, true);

  const shortDuration = deriveActionCore("fan_low", 800, false, config);
  assert.equal(shortDuration.action, "fan_low");
  assert.equal(shortDuration.actionEscalated, false);

  const unchanged = deriveActionCore("fan_high", 3000, false, config);
  assert.equal(unchanged.action, "fan_high");
  assert.equal(unchanged.actionEscalated, false);
});
