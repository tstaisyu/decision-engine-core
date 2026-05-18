// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  matchRule: srcMatchRule,
  findStateAction: srcFindStateAction,
  deriveState: srcDeriveState,
  deriveActionCore: srcDeriveActionCore
} = require("../src/runtimeCore");

let viewerCorePromise;
function loadViewerCore() {
  if (!viewerCorePromise) {
    const modulePath = pathToFileURL(
      path.resolve(__dirname, "../viewer/src/lib/browserRuntimeCore.js")
    ).href;
    viewerCorePromise = import(modulePath);
  }

  return viewerCorePromise;
}

test("runtimeCore parity: matchRule stays aligned between src and viewer copy", async () => {
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
    assert.equal(srcMatchRule(rule, normalized), viewerMatchRule(rule, normalized));
  }
});

test("runtimeCore parity: deriveState stays aligned between src and viewer copy", async () => {
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
    assert.deepEqual(srcDeriveState(normalized, config), viewerDeriveState(normalized, config));
  }
});

test("runtimeCore parity: findStateAction stays aligned between src and viewer copy", async () => {
  const { findStateAction: viewerFindStateAction } = await loadViewerCore();
  const states = [
    { name: "normal", action: "no_action" },
    { name: "hot", action: "fan_high" }
  ];

  assert.equal(srcFindStateAction(states, "hot"), viewerFindStateAction(states, "hot"));
  assert.equal(srcFindStateAction(states, "missing"), viewerFindStateAction(states, "missing"));
  assert.equal(srcFindStateAction(null, "hot"), viewerFindStateAction(null, "hot"));
});

test("runtimeCore parity: deriveActionCore stays aligned between src and viewer copy", async () => {
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
    { baseAction: "fan_low", effectiveStateDurationMs: 800, hasCoolingEffectForDecision: false },
    { baseAction: "fan_high", effectiveStateDurationMs: 3000, hasCoolingEffectForDecision: false }
  ];

  for (const sample of samples) {
    assert.deepEqual(
      srcDeriveActionCore(
        sample.baseAction,
        sample.effectiveStateDurationMs,
        sample.hasCoolingEffectForDecision,
        config
      ),
      viewerDeriveActionCore(
        sample.baseAction,
        sample.effectiveStateDurationMs,
        sample.hasCoolingEffectForDecision,
        config
      )
    );
  }
});
