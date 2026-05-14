// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Browser runtime core helpers (portable semantics candidates):
// - matchRule
// - findStateAction
// - deriveState
// - deriveActionCore
//
// This module is intentionally kept free of viewer-only orchestration and
// browser convenience fallback so these helpers can be promoted toward an
// official JS runtime core over time.

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

// Portable runtime semantics:
// apply action escalation on top of the resolved base action and return the
// final action decision.
function deriveActionCore(baseAction, effectiveStateDurationMs, hasCoolingEffectForDecision, config) {
  const fanLowToHighEscalationConfig = config.escalations.action.fanLowToHigh;
  let action = baseAction;
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

export { deriveActionCore, deriveState, findStateAction, matchRule };
