// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Portable runtime semantics helpers used by JS runtime consumers.
// This layer keeps rule evaluation and state/action derivation logic only
// and intentionally excludes debug/reason enrichment, config resolution,
// and input normalization.

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

function findStateAction(states, stateName) {
  if (!Array.isArray(states)) {
    return "no_action";
  }

  const matchedState = states.find((state) => state && state.name === stateName);
  return typeof matchedState?.action === "string" ? matchedState.action : "no_action";
}

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

module.exports = {
  matchRule,
  findStateAction,
  deriveState,
  deriveActionCore
};
