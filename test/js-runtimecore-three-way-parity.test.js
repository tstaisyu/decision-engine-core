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

let viewerCorePromise;
function loadViewerCore() {
  if (!viewerCorePromise) {
    const modulePath = pathToFileURL(path.resolve(__dirname, "../viewer/src/lib/browserRuntimeCore.js")).href;
    viewerCorePromise = import(modulePath);
  }

  return viewerCorePromise;
}

test("runtimeCore three-way parity: matchRule stays aligned", async () => {
  const { matchRule: esmMatchRule } = await loadEsmCore();
  const { matchRule: viewerMatchRule } = await loadViewerCore();
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
    const expected = cjsMatchRule(rule, normalized);
    assert.equal(expected, esmMatchRule(rule, normalized));
    assert.equal(expected, viewerMatchRule(rule, normalized));
  }
});

test("runtimeCore three-way parity: findStateAction stays aligned", async () => {
  const { findStateAction: esmFindStateAction } = await loadEsmCore();
  const { findStateAction: viewerFindStateAction } = await loadViewerCore();
  const states = [
    { name: "normal", action: "no_action" },
    { name: "hot", action: "fan_high" }
  ];

  const expectedHot = cjsFindStateAction(states, "hot");
  const expectedMissing = cjsFindStateAction(states, "missing");
  const expectedNull = cjsFindStateAction(null, "hot");

  assert.equal(expectedHot, esmFindStateAction(states, "hot"));
  assert.equal(expectedHot, viewerFindStateAction(states, "hot"));
  assert.equal(expectedMissing, esmFindStateAction(states, "missing"));
  assert.equal(expectedMissing, viewerFindStateAction(states, "missing"));
  assert.equal(expectedNull, esmFindStateAction(null, "hot"));
  assert.equal(expectedNull, viewerFindStateAction(null, "hot"));
});

test("runtimeCore three-way parity: deriveState stays aligned", async () => {
  const { deriveState: esmDeriveState } = await loadEsmCore();
  const { deriveState: viewerDeriveState } = await loadViewerCore();
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
    const expected = cjsDeriveState(normalized, config);
    assert.deepEqual(expected, esmDeriveState(normalized, config));
    assert.deepEqual(expected, viewerDeriveState(normalized, config));
  }
});

test("runtimeCore three-way parity: deriveActionCore stays aligned", async () => {
  const { deriveActionCore: esmDeriveActionCore } = await loadEsmCore();
  const { deriveActionCore: viewerDeriveActionCore } = await loadViewerCore();
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
    const expected = cjsDeriveActionCore(
      sample.baseAction,
      sample.effectiveStateDurationMs,
      sample.hasCoolingEffectForDecision,
      config
    );

    assert.deepEqual(
      expected,
      esmDeriveActionCore(
        sample.baseAction,
        sample.effectiveStateDurationMs,
        sample.hasCoolingEffectForDecision,
        config
      )
    );
    assert.deepEqual(
      expected,
      viewerDeriveActionCore(
        sample.baseAction,
        sample.effectiveStateDurationMs,
        sample.hasCoolingEffectForDecision,
        config
      )
    );
  }
});

test("runtimeCore three-way parity: strict requireNoCoolingEffect semantics stay aligned", async () => {
  const { deriveActionCore: esmDeriveActionCore } = await loadEsmCore();
  const { deriveActionCore: viewerDeriveActionCore } = await loadViewerCore();
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

  const noCoolingEffectExpected = cjsDeriveActionCore("fan_low", 1500, false, strictNoCoolingConfig);
  const coolingEffectExpected = cjsDeriveActionCore("fan_low", 1500, true, strictNoCoolingConfig);

  assert.deepEqual(noCoolingEffectExpected, esmDeriveActionCore("fan_low", 1500, false, strictNoCoolingConfig));
  assert.deepEqual(noCoolingEffectExpected, viewerDeriveActionCore("fan_low", 1500, false, strictNoCoolingConfig));
  assert.deepEqual(coolingEffectExpected, esmDeriveActionCore("fan_low", 1500, true, strictNoCoolingConfig));
  assert.deepEqual(coolingEffectExpected, viewerDeriveActionCore("fan_low", 1500, true, strictNoCoolingConfig));

  assert.equal(coolingEffectExpected.action, "fan_low");
  assert.equal(coolingEffectExpected.actionEscalated, false);
  assert.equal(noCoolingEffectExpected.action, "fan_high");
  assert.equal(noCoolingEffectExpected.actionEscalated, true);
});
