// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  matchRule: cjsMatchRule,
  findStateAction: cjsFindStateAction,
  deriveState: cjsDeriveState,
  deriveActionCore: cjsDeriveActionCore
} = require("../runtimes/js/core");

let esmCorePromise;
function loadEsmCore() {
  if (!esmCorePromise) {
    const modulePath = pathToFileURL(path.resolve(__dirname, "../runtimes/js/core/index.mjs")).href;
    esmCorePromise = import(modulePath);
  }

  return esmCorePromise;
}

test("runtimeCore ESM parity: matchRule stays aligned with CommonJS core", async () => {
  const { matchRule: esmMatchRule } = await loadEsmCore();
  const normalized = {
    value: 31,
    previousStateSafe: "hot",
    stateRate: 0.03
  };

  const rules = [
    { type: "value_gte", threshold: 30, state: "hot" },
    { type: "hysteresis", state: "hot", offThreshold: 25.5 },
    { type: "rate_gt", threshold: 0.02, state: "warming" },
    { type: "rate_lt", threshold: -0.01, state: "cooling" },
    { type: "unknown_rule", threshold: 0, state: "normal" }
  ];

  for (const rule of rules) {
    assert.equal(cjsMatchRule(rule, normalized), esmMatchRule(rule, normalized));
  }
});

test("runtimeCore ESM parity: findStateAction stays aligned with CommonJS core", async () => {
  const { findStateAction: esmFindStateAction } = await loadEsmCore();
  const states = [
    { name: "normal", action: "no_action" },
    { name: "hot", action: "fan_high" }
  ];

  assert.equal(cjsFindStateAction(states, "hot"), esmFindStateAction(states, "hot"));
  assert.equal(cjsFindStateAction(states, "missing"), esmFindStateAction(states, "missing"));
  assert.equal(cjsFindStateAction(null, "hot"), esmFindStateAction(null, "hot"));
});

test("runtimeCore ESM parity: deriveState stays aligned with CommonJS core", async () => {
  const { deriveState: esmDeriveState } = await loadEsmCore();
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

  const samples = [
    {
      value: 31,
      previousStateSafe: "hot",
      rawStateDurationMs: 6000,
      stateRate: 0
    },
    {
      value: 24,
      previousStateSafe: "normal",
      rawStateDurationMs: 1200,
      stateRate: 0
    }
  ];

  for (const normalized of samples) {
    assert.deepEqual(cjsDeriveState(normalized, config), esmDeriveState(normalized, config));
  }
});

test("runtimeCore ESM parity: deriveActionCore stays aligned with CommonJS core", async () => {
  const { deriveActionCore: esmDeriveActionCore } = await loadEsmCore();
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

  const samples = [
    { baseAction: "fan_low", effectiveStateDurationMs: 1500, hasCoolingEffectForDecision: false },
    { baseAction: "fan_low", effectiveStateDurationMs: 1500, hasCoolingEffectForDecision: true },
    { baseAction: "fan_low", effectiveStateDurationMs: 800, hasCoolingEffectForDecision: false },
    { baseAction: "fan_high", effectiveStateDurationMs: 3000, hasCoolingEffectForDecision: false }
  ];

  for (const sample of samples) {
    assert.deepEqual(
      cjsDeriveActionCore(
        sample.baseAction,
        sample.effectiveStateDurationMs,
        sample.hasCoolingEffectForDecision,
        config
      ),
      esmDeriveActionCore(
        sample.baseAction,
        sample.effectiveStateDurationMs,
        sample.hasCoolingEffectForDecision,
        config
      )
    );
  }

  const strictNoCoolingConfig = {
    escalations: {
      action: {
        fanLowToHigh: {
          durationMs: 1000,
          requireNoCoolingEffect: true
        }
      }
    }
  };

  assert.deepEqual(
    cjsDeriveActionCore("fan_low", 1500, false, strictNoCoolingConfig),
    esmDeriveActionCore("fan_low", 1500, false, strictNoCoolingConfig)
  );
  assert.deepEqual(
    cjsDeriveActionCore("fan_low", 1500, true, strictNoCoolingConfig),
    esmDeriveActionCore("fan_low", 1500, true, strictNoCoolingConfig)
  );
});
