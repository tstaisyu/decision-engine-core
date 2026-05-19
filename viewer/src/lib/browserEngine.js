// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Browser runtime wrapper for viewer consumption.
//
// This module keeps browser/viewer-side convenience around the runtime core:
// - resolveConfig
// - normalizeInput
// - resolveCoolingEffectForBrowser
// - deriveAction (wrapper around core action resolution)
// - buildResult
// - evaluate (browser-facing wrapper)
//
// Portable helper semantics are being moved into browserRuntimeCore.js.
// The long-term direction is to keep this file as a thin browser wrapper while
// promoting core evaluation helpers toward an official JS runtime core.
import { deriveActionCore, deriveState, findStateAction } from "./browserRuntimeCore";
import { defaultConfig } from "./viewerPresets";

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

// JS/browser convenience:
// state/rule fallback keeps browser-side evaluation working even when callers
// provide a config that is not fully expanded yet.
//
// Preferred viewer paths now pass canonical-ready config through
// useSimulation + evaluateWithConfig, so rules[] and states[] are usually
// already present. This fallback remains as backward/defensive compatibility
// and could later be removed or reduced to an optional compatibility path.
function resolveDefinitionFallback(config, fallback) {
  const safeConfig = config || {};
  const stateEntries = resolveStateEntries(safeConfig, fallback);

  return {
    rules: resolveStateRules(safeConfig, fallback),
    stateEntries,
    states: stateEntries
  };
}

// JS/browser compatibility:
// escalation leaf fallback and legacy scalar field support remain here until
// browser callers consistently provide fully-expanded canonical escalations.
function resolveEscalationFallback(config, fallback) {
  const safeConfig = config || {};

  return {
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
  };
}

// JS/browser convenience + compatibility:
// merges preset/default config with the provided config so browser-side
// simulation can still run even when callers do not provide a fully-expanded
// canonical config object. This is not part of the minimum portable runtime
// contract and should stay outside a future extracted JS core.
function resolveConfig(config, fallback) {
  const safeConfig = config || {};
  const definitions = resolveDefinitionFallback(safeConfig, fallback);

  return {
    ...safeConfig,
    ...definitions,
    escalations: resolveEscalationFallback(safeConfig, fallback)
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
  const effectiveConfig = resolveConfig(config, defaultConfig);
  const stateContext = deriveState(normalized, effectiveConfig);
  const actionContext = deriveAction(normalized, stateContext, effectiveConfig);

  return buildResult(stateContext, actionContext);
}

export { evaluate };
