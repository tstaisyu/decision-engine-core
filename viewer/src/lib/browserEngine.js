// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Browser-side runtime wrapper for viewer consumption.
//
// This module keeps browser/viewer-side convenience around the runtime core:
// - resolveConfig
// - normalizeInput
// - resolveCoolingEffectForBrowser
// - deriveAction (wrapper around core action resolution)
// - buildResult
// - evaluate (browser-facing wrapper)
//
// Portable helper semantics live in browserRuntimeCore.js as a viewer-local
// ESM copy aligned with the CommonJS source-of-truth under runtimes/js/core.
// The long-term direction is to keep this file as a thin browser wrapper while
// future ESM/browser consumption of the official JS runtime core remains
// undecided.
import { deriveActionCore, deriveState, findStateAction } from "./browserRuntimeCore.js";
import { defaultConfig } from "./viewerPresets.js";

// Config boundary convenience:
// lightweight rule copying/filtering for the browser-side runtime path.
function normalizeRule(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return rule;
  }

  return { ...rule };
}

function assertCanonicalEscalationLeaves(config) {
  const actionEscalation = config?.escalations?.action?.fanLowToHigh;
  const stateEscalation = config?.escalations?.state?.hotToCritical;

  if (typeof stateEscalation?.durationMs !== "number") {
    throw new Error("escalations.state.hotToCritical.durationMs is required for browser evaluation");
  }

  if (typeof actionEscalation?.durationMs !== "number") {
    throw new Error("escalations.action.fanLowToHigh.durationMs is required for browser evaluation");
  }

  if (typeof actionEscalation?.requireNoCoolingEffect !== "boolean") {
    throw new Error("escalations.action.fanLowToHigh.requireNoCoolingEffect is required for browser evaluation");
  }
}

// JS/browser convenience:
// prepare a canonical-ready config for evaluation without supplementing
// missing rules/states/escalation leaves.
function resolveConfig(config) {
  const safeConfig = config || {};
  const stateEntries = Array.isArray(safeConfig.states) ? safeConfig.states.map((state) => ({ ...state })) : [];
  const rules = Array.isArray(safeConfig.rules)
    ? safeConfig.rules.map(normalizeRule).filter((rule) => typeof rule?.state === "string" && rule.state.length > 0)
    : [];
  assertCanonicalEscalationLeaves(safeConfig);

  return {
    ...safeConfig,
    rules,
    stateEntries,
    states: stateEntries
  };
}

// JS/browser convenience:
// portable runtimes only require a small input snapshot such as value,
// previousValue, previousState, stateDurationMs, and coolingEffect.
// The browser runtime also accepts richer derived fields so simulation and
// local inspection can reuse the same entrypoint.
function normalizeInput(input) {
  const {
    value,
    previousValue,
    tempDelta,
    tempRate,
    tempRateAvg,
    coolingEffect,
    maxTemp,
    previousState,
    previousAction,
    stateDurationMs,
    timestamp
  } = input;

  const effectiveTempDelta =
    typeof tempDelta === "number"
      ? tempDelta
      : typeof value === "number" && typeof previousValue === "number"
        ? value - previousValue
        : 0;
  const effectiveTempRate = typeof tempRate === "number" ? tempRate : effectiveTempDelta;
  const stateRate = typeof tempRateAvg === "number" ? tempRateAvg : effectiveTempRate;
  const previousStateSafe = typeof previousState === "string" ? previousState : "normal";
  const rawStateDurationMs = typeof stateDurationMs === "number" ? stateDurationMs : 0;

  return {
    value,
    previousValue,
    tempDelta,
    tempRate,
    tempRateAvg,
    coolingEffect,
    maxTemp,
    previousState,
    previousAction,
    stateDurationMs,
    timestamp,
    effectiveTempDelta,
    effectiveTempRate,
    stateRate,
    previousStateSafe,
    rawStateDurationMs
  };
}

// Portable runtime semantics plus JS convenience:
// action resolution itself is part of the portable runtime contract.
// The coolingEffect -> stateRate fallback is JS/browser convenience and would
// likely remain outside a future minimal extracted core.
function resolveCoolingEffectForBrowser(baseAction, coolingEffect, stateRate, coolingEffectRateThreshold) {
  if (baseAction !== "fan_high" && baseAction !== "fan_low") {
    return false;
  }

  if (typeof coolingEffect === "boolean") {
    return coolingEffect;
  }

  return stateRate < coolingEffectRateThreshold;
}

function deriveAction(normalized, stateContext, config) {
  const { coolingEffect, stateRate } = normalized;
  const { state, effectiveStateDurationMs } = stateContext;
  const { coolingEffectRateThreshold = -0.01 } = config;

  // Portable action resolution:
  // resolve the base action from the chosen state mapping first.
  const baseAction = findStateAction(config.stateEntries, state);

  // JS/browser convenience:
  // portable runtimes prefer explicit coolingEffect input. The browser runtime
  // also falls back to stateRate when coolingEffect is omitted so local
  // simulation can still infer an action-escalation condition.
  const hasCoolingEffectForDecision = resolveCoolingEffectForBrowser(
    baseAction,
    coolingEffect,
    stateRate,
    coolingEffectRateThreshold
  );

  return deriveActionCore(baseAction, effectiveStateDurationMs, hasCoolingEffectForDecision, config);
}

// Diagnostics/debug convenience:
// the portable runtime contract only requires state/action.
// reason/debug are browser/JS-side enrichment for inspection and UI display.
function buildResult(stateContext, actionContext) {
  const { state, baseState, previousStateSafe, rawStateDurationMs, effectiveStateDurationMs } = stateContext;
  const { action, actionEscalated } = actionContext;
  const reason =
    `baseState=${baseState}; previousState=${previousStateSafe}; ` +
    `rawDuration=${rawStateDurationMs}; ` +
    `effectiveDuration=${effectiveStateDurationMs}; ` +
    `actionEscalated=${actionEscalated}`;

  return {
    state,
    action,
    reason,
    debug: {
      baseState,
      rawStateDurationMs,
      effectiveStateDurationMs,
      actionEscalated
    }
  };
}

// Runtime entrypoint:
// evaluate() is the browser-facing runtime wrapper. It currently combines
// portable runtime evaluation with browser-side config/input convenience.
// A future extraction would keep the deterministic state/action core while
// moving config fallback and result enrichment into a thinner wrapper layer.
function evaluate(input, config) {
  const normalized = normalizeInput(input);
  const effectiveConfig = resolveConfig(config ?? defaultConfig);
  const stateContext = deriveState(normalized, effectiveConfig);
  const actionContext = deriveAction(normalized, stateContext, effectiveConfig);

  return buildResult(stateContext, actionContext);
}

export { evaluate };
