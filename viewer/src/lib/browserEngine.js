// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// TODO: Replace this temporary browser-side copy with an official ESM/browser build from the core package.

const m5TemperatureConfig = {
  criticalThreshold: 40.0,
  hotOnThreshold: 26.0,
  hotOffThreshold: 25.5,
  warmingRateThreshold: 0.02,
  coolingRateThreshold: -0.02,
  escalations: {
    action: {
      fanLowToHigh: {
        durationMs: 1000,
        requireNoCoolingEffect: false
      }
    },
    state: {
      hotToCritical: {
        durationMs: 5000
      }
    }
  },
  states: [
    {
      name: "critical",
      action: "alert"
    },
    {
      name: "hot",
      action: "fan_high"
    },
    {
      name: "warming",
      action: "fan_low"
    },
    {
      name: "cooling",
      action: "fan_low"
    },
    {
      name: "normal",
      action: "no_action"
    }
  ],
  rules: [
    {
      type: "value_gte",
      threshold: 40.0,
      state: "critical"
    },
    {
      type: "value_gte",
      threshold: 26.0,
      state: "hot"
    },
    {
      name: "hot_hysteresis",
      type: "hysteresis",
      state: "hot",
      onThreshold: 26.0,
      offThreshold: 25.5
    },
    {
      type: "rate_gt",
      threshold: 0.02,
      state: "warming"
    },
    {
      type: "rate_lt",
      threshold: -0.02,
      state: "cooling"
    }
  ]
};

const simpleTemperatureConfig = {
  escalations: {},
  states: [
    {
      name: "normal",
      action: "no_action"
    },
    {
      name: "warm",
      action: "fan_low"
    },
    {
      name: "hot",
      action: "fan_high"
    }
  ],
  rules: [
    {
      type: "value_gte",
      threshold: 30,
      state: "hot"
    },
    {
      type: "value_gte",
      threshold: 26,
      state: "warm"
    }
  ]
};

const presets = {
  m5Temperature: m5TemperatureConfig,
  simpleTemperature: simpleTemperatureConfig
};

const defaultConfig = m5TemperatureConfig;

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

function normalizeRule(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return rule;
  }

  const nextRule = { ...rule };
  if (typeof nextRule.state !== "string" || nextRule.state.length === 0) {
    nextRule.state = nextRule.name;
  }

  return nextRule;
}

function resolveStateRules(config, fallback) {
  if (Array.isArray(config?.rules)) {
    return config.rules.map(normalizeRule);
  }

  if (config && config.states && Array.isArray(config.states.rules)) {
    return config.states.rules.map(normalizeRule);
  }

  return [
    {
      name: "critical",
      type: "value_gte",
      threshold:
        typeof config.criticalThreshold === "number"
            ? config.criticalThreshold
          : config && config.states && config.states.critical && typeof config.states.critical.threshold === "number"
            ? config.states.critical.threshold
            : fallback.criticalThreshold
    },
    {
      name: "hot",
      type: "value_gte",
      threshold:
        typeof config.hotOnThreshold === "number"
            ? config.hotOnThreshold
          : config && config.states && config.states.hot && typeof config.states.hot.onThreshold === "number"
            ? config.states.hot.onThreshold
            : fallback.hotOnThreshold
    },
    {
      name: "hot_hysteresis",
      type: "hysteresis",
      state: "hot",
      onThreshold:
        typeof config.hotOnThreshold === "number"
            ? config.hotOnThreshold
          : config && config.states && config.states.hot && typeof config.states.hot.onThreshold === "number"
            ? config.states.hot.onThreshold
            : fallback.hotOnThreshold,
      offThreshold:
        typeof config.hotOffThreshold === "number"
          ? config.hotOffThreshold
          : config && config.states && config.states.hot && typeof config.states.hot.offThreshold === "number"
            ? config.states.hot.offThreshold
            : fallback.hotOffThreshold
    },
    {
      name: "warming",
      type: "rate_gt",
      threshold:
        typeof config.warmingRateThreshold === "number"
            ? config.warmingRateThreshold
          : config && config.states && config.states.warming && typeof config.states.warming.rateThreshold === "number"
            ? config.states.warming.rateThreshold
            : fallback.warmingRateThreshold
    },
    {
      name: "cooling",
      type: "rate_lt",
      threshold:
        typeof config.coolingRateThreshold === "number"
            ? config.coolingRateThreshold
          : config && config.states && config.states.cooling && typeof config.states.cooling.rateThreshold === "number"
            ? config.states.cooling.rateThreshold
            : fallback.coolingRateThreshold
    }
  ].map(normalizeRule);
}

function resolveStateEntries(config, fallback) {
  if (Array.isArray(config?.states)) {
    return config.states.map((state) => ({ ...state }));
  }

  if (config?.actions?.byState && typeof config.actions.byState === "object") {
    return Object.entries(config.actions.byState).map(([name, action]) => ({ name, action }));
  }

  return Array.isArray(fallback?.states) ? fallback.states.map((state) => ({ ...state })) : [];
}

function findStateAction(stateEntries, stateName) {
  if (Array.isArray(stateEntries)) {
    const matchedState = stateEntries.find((state) => state && state.name === stateName);
    if (typeof matchedState?.action === "string") {
      return matchedState.action;
    }
  }

  return "no_action";
}

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
  const effectiveConfig = resolveConfig(config, defaultConfig);
  const stateContext = deriveState(normalized, effectiveConfig);
  const actionContext = deriveAction(normalized, stateContext, effectiveConfig);

  return buildResult(stateContext, actionContext);
}

export { evaluate, presets };
