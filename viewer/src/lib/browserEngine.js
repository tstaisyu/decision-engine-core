// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// TODO: Replace this temporary browser-side copy with an official ESM/browser build from the core package.
//
// This file currently mixes:
// - portable runtime semantics
// - JS/browser-side convenience behavior
// - a small amount of browser packaging convenience
//
// It exists as a temporary browser-consumable copy of the JS runtime path.
// The long-term direction is to extract a smaller portable JS runtime core and
// leave only browser/viewer-specific convenience here.
import { defaultConfig } from "./viewerPresets";

// Portable runtime semantics:
// ordered rule matching shared conceptually with the JS core and C++ runtime.
function matchRule(rule, normalized) {
  if (rule.type === "value_gte") {
    return normalized.value >= rule.threshold;
  }

  if (rule.type === "hysteresis") {
    return normalized.previousStateSafe === rule.state && normalized.value > rule.offThreshold;
  }

  if (rule.type === "rate_gt") {
    return normalized.stateRate > rule.threshold;
  }

  if (rule.type === "rate_lt") {
    return normalized.stateRate < rule.threshold;
  }

  return false;
}

// Config boundary convenience:
// lightweight rule copying/filtering for the browser-side runtime path.
function normalizeRule(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return rule;
  }

  return { ...rule };
}

// Config boundary convenience:
// preserve only browser/runtime-usable canonical rule entries.
function resolveStateRules(config, fallback) {
  if (Array.isArray(config?.rules)) {
    return config.rules.map(normalizeRule).filter((rule) => typeof rule?.state === "string" && rule.state.length > 0);
  }

  return Array.isArray(fallback?.rules)
    ? fallback.rules.map(normalizeRule).filter((rule) => typeof rule?.state === "string" && rule.state.length > 0)
    : [];
}

// Config boundary convenience:
// resolve state entries from either explicit config or viewer preset fallback.
function resolveStateEntries(config, fallback) {
  if (Array.isArray(config?.states)) {
    return config.states.map((state) => ({ ...state }));
  }

  return Array.isArray(fallback?.states) ? fallback.states.map((state) => ({ ...state })) : [];
}

// Portable runtime semantics:
// resolve a base action from the chosen state mapping.
function findStateAction(stateEntries, stateName) {
  if (Array.isArray(stateEntries)) {
    const matchedState = stateEntries.find((state) => state && state.name === stateName);
    if (typeof matchedState?.action === "string") {
      return matchedState.action;
    }
  }

  return "no_action";
}

// JS/browser convenience + compatibility:
// merges preset/default config with the provided config so browser-side
// simulation can still run even when callers do not provide a fully-expanded
// canonical config object. This is not part of the minimum portable runtime
// contract and should stay outside a future extracted JS core.
function resolveConfig(config, fallback) {
  const safeConfig = config || {};
  const stateEntries = resolveStateEntries(safeConfig, fallback);

  return {
    ...safeConfig,
    rules: resolveStateRules(safeConfig, fallback),
    stateEntries,
    states: stateEntries,
    escalations: {
      ...(safeConfig.escalations || {}),
      action: {
        ...((safeConfig.escalations && safeConfig.escalations.action) || {}),
        fanLowToHigh: {
          durationMs:
            typeof safeConfig.fanLowEscalationDurationMs === "number"
              ? safeConfig.fanLowEscalationDurationMs
              : safeConfig.escalations &&
                  safeConfig.escalations.action &&
                  safeConfig.escalations.action.fanLowToHigh &&
                  typeof safeConfig.escalations.action.fanLowToHigh.durationMs === "number"
                ? safeConfig.escalations.action.fanLowToHigh.durationMs
                : fallback.escalations.action.fanLowToHigh.durationMs,
          requireNoCoolingEffect:
            safeConfig.escalations &&
            safeConfig.escalations.action &&
            safeConfig.escalations.action.fanLowToHigh &&
            typeof safeConfig.escalations.action.fanLowToHigh.requireNoCoolingEffect === "boolean"
              ? safeConfig.escalations.action.fanLowToHigh.requireNoCoolingEffect
              : fallback.escalations.action.fanLowToHigh.requireNoCoolingEffect
        }
      },
      state: {
        ...((safeConfig.escalations && safeConfig.escalations.state) || {}),
        hotToCritical: {
          durationMs:
            typeof safeConfig.hotCriticalDurationMs === "number"
              ? safeConfig.hotCriticalDurationMs
              : safeConfig.escalations &&
                  safeConfig.escalations.state &&
                  safeConfig.escalations.state.hotToCritical &&
                  typeof safeConfig.escalations.state.hotToCritical.durationMs === "number"
                ? safeConfig.escalations.state.hotToCritical.durationMs
                : fallback.escalations.state.hotToCritical.durationMs
        }
      }
    }
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

// Portable runtime semantics:
// determine base state from ordered rules, then apply state escalation.
function deriveState(normalized, config) {
  const { previousStateSafe, rawStateDurationMs } = normalized;
  const hotToCriticalEscalationConfig = config.escalations.state.hotToCritical;
  const stateRules = config.rules;

  let baseState = "normal";

  const matchedRule = stateRules.find((rule) => matchRule(rule, normalized));
  if (matchedRule) {
    baseState = matchedRule.state;
  }

  const effectiveStateDurationMs = baseState === previousStateSafe ? rawStateDurationMs : 0;

  let state = baseState;
  if (
    baseState === "hot" &&
    previousStateSafe === "hot" &&
    effectiveStateDurationMs >= hotToCriticalEscalationConfig.durationMs
  ) {
    state = "critical";
  }

  return {
    baseState,
    state,
    previousStateSafe,
    rawStateDurationMs,
    effectiveStateDurationMs
  };
}

// Portable runtime semantics plus JS convenience:
// action resolution itself is part of the portable runtime contract.
// The coolingEffect -> stateRate fallback is JS/browser convenience and would
// likely remain outside a future minimal extracted core.
function deriveAction(normalized, stateContext, config) {
  const { coolingEffect, stateRate } = normalized;
  const { state, effectiveStateDurationMs } = stateContext;
  const fanLowToHighEscalationConfig = config.escalations.action.fanLowToHigh;
  const { coolingEffectRateThreshold = -0.01 } = config;

  const baseAction = findStateAction(config.stateEntries, state);
  let action = baseAction;

  const hasCoolingEffectForDecision =
    baseAction === "fan_high" || baseAction === "fan_low"
      ? typeof coolingEffect === "boolean"
        ? coolingEffect
        : stateRate < coolingEffectRateThreshold
      : false;
  let actionEscalated = false;

  if (
    baseAction === "fan_low" &&
    effectiveStateDurationMs >= fanLowToHighEscalationConfig.durationMs &&
    (fanLowToHighEscalationConfig.requireNoCoolingEffect === false
      ? !hasCoolingEffectForDecision
      : hasCoolingEffectForDecision)
  ) {
    action = "fan_high";
    actionEscalated = true;
  }

  return {
    baseAction,
    action,
    actionEscalated
  };
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
  const effectiveConfig = resolveConfig(config, defaultConfig);
  const stateContext = deriveState(normalized, effectiveConfig);
  const actionContext = deriveAction(normalized, stateContext, effectiveConfig);

  return buildResult(stateContext, actionContext);
}

export { evaluate };
