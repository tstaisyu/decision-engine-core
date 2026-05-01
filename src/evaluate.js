// Copyright (c) 2025 tstaisyu
// SPDX-License-Identifier: Apache-2.0

const { config: defaultConfig } = require("./config");
const { matchRule, resolveStateRules } = require("./rules");

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
  const effectiveTempRate =
    typeof tempRate === "number" ? tempRate : effectiveTempDelta;
  const stateRate =
    typeof tempRateAvg === "number" ? tempRateAvg : effectiveTempRate;
  const previousStateSafe =
    typeof previousState === "string" ? previousState : "normal";
  const rawStateDurationMs =
    typeof stateDurationMs === "number" ? stateDurationMs : 0;

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
  const stateRules = config.states.rules;

  let baseState = "normal";

  const matchedRule = stateRules.find((rule) => matchRule(rule, normalized));
  if (matchedRule) {
    baseState = matchedRule.state || matchedRule.name;
  }

  const effectiveStateDurationMs =
    baseState === previousStateSafe ? rawStateDurationMs : 0;

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
  const actionByState = config.actions.byState;
  const fanLowToHighEscalationConfig = config.escalations.action.fanLowToHigh;
  const {
    coolingEffectRateThreshold = -0.01
  } = config;

  const baseAction = actionByState[state] || "no_action";
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
  const {
    state,
    baseState,
    previousStateSafe,
    rawStateDurationMs,
    effectiveStateDurationMs
  } = stateContext;
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
  const effectiveConfig = {
    ...config,
    actions: {
      ...(config && config.actions),
      byState: {
        ...defaultConfig.actions.byState,
        ...(config && config.actions && config.actions.byState)
      }
    },
    escalations: {
      ...(config && config.escalations),
      action: {
        ...(config && config.escalations && config.escalations.action),
        fanLowToHigh: {
          durationMs:
            typeof config.fanLowEscalationDurationMs === "number"
              ? config.fanLowEscalationDurationMs
              : config &&
                  config.escalations &&
                  config.escalations.action &&
                  config.escalations.action.fanLowToHigh &&
                  typeof config.escalations.action.fanLowToHigh.durationMs ===
                    "number"
                ? config.escalations.action.fanLowToHigh.durationMs
                : defaultConfig.escalations.action.fanLowToHigh.durationMs,
          requireNoCoolingEffect:
            config &&
            config.escalations &&
            config.escalations.action &&
            config.escalations.action.fanLowToHigh &&
            typeof config.escalations.action.fanLowToHigh
              .requireNoCoolingEffect === "boolean"
              ? config.escalations.action.fanLowToHigh.requireNoCoolingEffect
              : defaultConfig.escalations.action.fanLowToHigh
                  .requireNoCoolingEffect
        }
      },
      state: {
        ...(config && config.escalations && config.escalations.state),
        hotToCritical: {
          durationMs:
            typeof config.hotCriticalDurationMs === "number"
              ? config.hotCriticalDurationMs
              : config &&
                  config.escalations &&
                  config.escalations.state &&
                  config.escalations.state.hotToCritical &&
                  typeof config.escalations.state.hotToCritical.durationMs ===
                    "number"
                ? config.escalations.state.hotToCritical.durationMs
                : defaultConfig.escalations.state.hotToCritical.durationMs
        }
      }
    },
    states: {
      ...(config && config.states),
      critical: {
        threshold:
          typeof config.criticalThreshold === "number"
            ? config.criticalThreshold
            : config &&
                config.states &&
                config.states.critical &&
                typeof config.states.critical.threshold === "number"
              ? config.states.critical.threshold
              : defaultConfig.states.critical.threshold
      },
      hot: {
        onThreshold:
          typeof config.hotOnThreshold === "number"
            ? config.hotOnThreshold
            : config &&
                config.states &&
                config.states.hot &&
                typeof config.states.hot.onThreshold === "number"
              ? config.states.hot.onThreshold
              : defaultConfig.states.hot.onThreshold,
        offThreshold:
          typeof config.hotOffThreshold === "number"
            ? config.hotOffThreshold
            : config &&
                config.states &&
                config.states.hot &&
                typeof config.states.hot.offThreshold === "number"
              ? config.states.hot.offThreshold
              : defaultConfig.states.hot.offThreshold
      },
      rules: resolveStateRules(config, defaultConfig),
      warming: {
        rateThreshold:
          typeof config.warmingRateThreshold === "number"
            ? config.warmingRateThreshold
            : config &&
                config.states &&
                config.states.warming &&
                typeof config.states.warming.rateThreshold === "number"
              ? config.states.warming.rateThreshold
              : defaultConfig.states.warming.rateThreshold
      },
      cooling: {
        rateThreshold:
          typeof config.coolingRateThreshold === "number"
            ? config.coolingRateThreshold
            : config &&
                config.states &&
                config.states.cooling &&
                typeof config.states.cooling.rateThreshold === "number"
              ? config.states.cooling.rateThreshold
              : defaultConfig.states.cooling.rateThreshold
      }
    }
  };
  const stateContext = deriveState(normalized, effectiveConfig);
  const actionContext = deriveAction(normalized, stateContext, effectiveConfig);

  return buildResult(stateContext, actionContext);
}

module.exports = {
  evaluate
};
