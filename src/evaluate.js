// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const { config: defaultConfig } = require("./config");
const { normalizeConfig } = require("./normalizeConfig");
const { matchRule } = require("./rules");
const { resolveConfig } = require("./resolveConfig");

function isCanonicalConfigShape(config) {
  return Boolean(config && (Array.isArray(config.states) || Array.isArray(config.rules)));
}

function findStateAction(states, stateName) {
  if (!Array.isArray(states)) {
    return "no_action";
  }

  const matchedState = states.find((state) => state && state.name === stateName);
  return typeof matchedState?.action === "string" ? matchedState.action : "no_action";
}

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

function deriveState(normalized, config) {
  const { previousStateSafe, rawStateDurationMs } = normalized;
  const hotToCriticalEscalationConfig = config.escalations.state.hotToCritical;
  const stateRules = config.rules;

  let baseState = "normal";

  const matchedRule = stateRules.find((rule) => matchRule(rule, normalized));
  if (matchedRule) {
    baseState = matchedRule.state || matchedRule.name;
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

function deriveAction(normalized, stateContext, config) {
  const { coolingEffect, stateRate } = normalized;
  const { state, effectiveStateDurationMs } = stateContext;
  const fanLowToHighEscalationConfig = config.escalations.action.fanLowToHigh;
  const { coolingEffectRateThreshold = -0.01 } = config;

  const baseAction = findStateAction(config.states, state);
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

function evaluate(input, config) {
  const normalized = normalizeInput(input);
  const resolvedLegacyConfig = resolveConfig(isCanonicalConfigShape(config) ? {} : config, defaultConfig);
  const effectiveConfig = normalizeConfig(
    isCanonicalConfigShape(config)
      ? {
          ...resolvedLegacyConfig,
          ...config
        }
      : resolvedLegacyConfig
  );
  const stateContext = deriveState(normalized, effectiveConfig);
  const actionContext = deriveAction(normalized, stateContext, effectiveConfig);

  return buildResult(stateContext, actionContext);
}

module.exports = {
  evaluate
};
