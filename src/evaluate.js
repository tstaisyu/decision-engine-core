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
  // Portable runtimes only need a small input snapshot such as value,
  // previousValue, previousState, stateDurationMs, and coolingEffect.
  // The JS reference runtime also accepts richer derived fields so viewer,
  // local simulation, and compatibility paths can reuse the same entrypoint.
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

function resolveCoolingEffectForBrowser(baseAction, coolingEffect, stateRate, coolingEffectRateThreshold) {
  if (baseAction !== "fan_high" && baseAction !== "fan_low") {
    return false;
  }

  if (typeof coolingEffect === "boolean") {
    return coolingEffect;
  }

  return stateRate < coolingEffectRateThreshold;
}

function deriveActionCore(baseAction, effectiveStateDurationMs, hasCoolingEffectForDecision, config) {
  const fanLowToHighEscalationConfig = config.escalations.action.fanLowToHigh;
  let action = baseAction;

  // Portable action resolution:
  // apply the configured action escalation on top of the base action and
  // return the final action decision.
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

function deriveAction(normalized, stateContext, config) {
  const { coolingEffect, stateRate } = normalized;
  const { state, effectiveStateDurationMs } = stateContext;
  const { coolingEffectRateThreshold = -0.01 } = config;

  // Portable action resolution:
  // resolve the base action from the chosen state mapping first.
  const baseAction = findStateAction(config.states, state);

  // JS/browser convenience:
  // portable runtimes prefer explicit caller-provided coolingEffect input.
  // The JS runtime keeps a fallback path based on stateRate so existing
  // simulation and compatibility flows can continue to work without a
  // dedicated flag.
  const hasCoolingEffectForDecision = resolveCoolingEffectForBrowser(
    baseAction,
    coolingEffect,
    stateRate,
    coolingEffectRateThreshold
  );

  return deriveActionCore(baseAction, effectiveStateDurationMs, hasCoolingEffectForDecision, config);
}

function buildResult(stateContext, actionContext) {
  const { state, baseState, previousStateSafe, rawStateDurationMs, effectiveStateDurationMs } = stateContext;
  const { action, actionEscalated } = actionContext;
  // reason/debug are JS-side diagnostic enrichment. Portable runtimes only
  // need the state/action result and may omit these fields entirely.
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
  // Compatibility/default resolution is kept outside the portable evaluation
  // core. Canonical config callers can provide full config directly, while
  // JS-side convenience paths may still rely on preset/default fallback data.
  const resolvedConfigDefaults = resolveConfig(isCanonicalConfigShape(config) ? {} : config, defaultConfig);
  const effectiveConfig = normalizeConfig(
    isCanonicalConfigShape(config)
      ? {
          ...resolvedConfigDefaults,
          ...config,
          escalations: {
            ...resolvedConfigDefaults.escalations,
            ...(config?.escalations || {}),
            action: {
              ...resolvedConfigDefaults.escalations.action,
              ...(config?.escalations?.action || {})
            },
            state: {
              ...resolvedConfigDefaults.escalations.state,
              ...(config?.escalations?.state || {})
            }
          }
        }
      : resolvedConfigDefaults
  );
  const stateContext = deriveState(normalized, effectiveConfig);
  const actionContext = deriveAction(normalized, stateContext, effectiveConfig);

  return buildResult(stateContext, actionContext);
}

module.exports = {
  evaluate
};
