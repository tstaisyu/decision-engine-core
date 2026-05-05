// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// TODO: Replace this temporary browser-side copy with an official ESM/browser build from the core package.

const m5TemperatureConfig = {
  actions: {
    byState: {
      critical: "alert",
      hot: "fan_high",
      warming: "fan_low",
      cooling: "fan_low",
      normal: "no_action"
    }
  },
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
  states: {
    critical: {
      threshold: 40.0
    },
    hot: {
      onThreshold: 26.0,
      offThreshold: 25.5
    },
    rules: [
      {
        name: "critical",
        type: "value_gte",
        threshold: 40.0
      },
      {
        name: "hot",
        type: "value_gte",
        threshold: 26.0
      },
      {
        name: "hot_hysteresis",
        type: "hysteresis",
        state: "hot",
        onThreshold: 26.0,
        offThreshold: 25.5
      },
      {
        name: "warming",
        type: "rate_gt",
        threshold: 0.02
      },
      {
        name: "cooling",
        type: "rate_lt",
        threshold: -0.02
      }
    ],
    warming: {
      rateThreshold: 0.02
    },
    cooling: {
      rateThreshold: -0.02
    }
  }
};

const simpleTemperatureConfig = {
  actions: {
    byState: {
      normal: "no_action",
      warm: "fan_low",
      hot: "fan_high"
    }
  },
  escalations: {},
  states: {
    rules: [
      {
        name: "hot",
        type: "value_gte",
        threshold: 30
      },
      {
        name: "warm",
        type: "value_gte",
        threshold: 26
      }
    ]
  }
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
            : fallback.states.critical.threshold
    },
    {
      name: "hot",
      type: "value_gte",
      threshold:
        typeof config.hotOnThreshold === "number"
          ? config.hotOnThreshold
          : config && config.states && config.states.hot && typeof config.states.hot.onThreshold === "number"
            ? config.states.hot.onThreshold
            : fallback.states.hot.onThreshold
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
            : fallback.states.hot.onThreshold,
      offThreshold:
        typeof config.hotOffThreshold === "number"
          ? config.hotOffThreshold
          : config && config.states && config.states.hot && typeof config.states.hot.offThreshold === "number"
            ? config.states.hot.offThreshold
            : fallback.states.hot.offThreshold
    },
    {
      name: "warming",
      type: "rate_gt",
      threshold:
        typeof config.warmingRateThreshold === "number"
          ? config.warmingRateThreshold
          : config && config.states && config.states.warming && typeof config.states.warming.rateThreshold === "number"
            ? config.states.warming.rateThreshold
            : fallback.states.warming.rateThreshold
    },
    {
      name: "cooling",
      type: "rate_lt",
      threshold:
        typeof config.coolingRateThreshold === "number"
          ? config.coolingRateThreshold
          : config && config.states && config.states.cooling && typeof config.states.cooling.rateThreshold === "number"
            ? config.states.cooling.rateThreshold
            : fallback.states.cooling.rateThreshold
    }
  ].map(normalizeRule);
}

function resolveStateEntries(config, fallback) {
  if (Array.isArray(config?.states)) {
    return config.states.map((state) => ({ ...state }));
  }

  const actionByState = {
    ...fallback.actions.byState,
    ...((config && config.actions && config.actions.byState) || {})
  };

  return Object.entries(actionByState).map(([name, action]) => ({ name, action }));
}

function findStateAction(stateEntries, actionByState, stateName) {
  if (Array.isArray(stateEntries)) {
    const matchedState = stateEntries.find((state) => state && state.name === stateName);
    if (typeof matchedState?.action === "string") {
      return matchedState.action;
    }
  }

  return actionByState[stateName] || "no_action";
}

function resolveConfig(config, fallback) {
  const safeConfig = config || {};

  return {
    ...safeConfig,
    rules: resolveStateRules(safeConfig, fallback),
    stateEntries: resolveStateEntries(safeConfig, fallback),
    actions: {
      ...(safeConfig.actions || {}),
      byState: {
        ...fallback.actions.byState,
        ...((safeConfig.actions && safeConfig.actions.byState) || {})
      }
    },
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
    },
    states: {
      ...(safeConfig.states || {}),
      critical: {
        threshold:
          typeof safeConfig.criticalThreshold === "number"
            ? safeConfig.criticalThreshold
            : safeConfig.states && safeConfig.states.critical && typeof safeConfig.states.critical.threshold === "number"
              ? safeConfig.states.critical.threshold
              : fallback.states.critical.threshold
      },
      hot: {
        onThreshold:
          typeof safeConfig.hotOnThreshold === "number"
            ? safeConfig.hotOnThreshold
            : safeConfig.states && safeConfig.states.hot && typeof safeConfig.states.hot.onThreshold === "number"
              ? safeConfig.states.hot.onThreshold
              : fallback.states.hot.onThreshold,
        offThreshold:
          typeof safeConfig.hotOffThreshold === "number"
            ? safeConfig.hotOffThreshold
            : safeConfig.states && safeConfig.states.hot && typeof safeConfig.states.hot.offThreshold === "number"
              ? safeConfig.states.hot.offThreshold
              : fallback.states.hot.offThreshold
      },
      warming: {
        rateThreshold:
          typeof safeConfig.warmingRateThreshold === "number"
            ? safeConfig.warmingRateThreshold
            : safeConfig.states &&
                safeConfig.states.warming &&
                typeof safeConfig.states.warming.rateThreshold === "number"
              ? safeConfig.states.warming.rateThreshold
              : fallback.states.warming.rateThreshold
      },
      cooling: {
        rateThreshold:
          typeof safeConfig.coolingRateThreshold === "number"
            ? safeConfig.coolingRateThreshold
            : safeConfig.states &&
                safeConfig.states.cooling &&
                typeof safeConfig.states.cooling.rateThreshold === "number"
              ? safeConfig.states.cooling.rateThreshold
              : fallback.states.cooling.rateThreshold
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
  const actionByState = config.actions.byState;
  const fanLowToHighEscalationConfig = config.escalations.action.fanLowToHigh;
  const { coolingEffectRateThreshold = -0.01 } = config;

  const baseAction = findStateAction(config.stateEntries, actionByState, state);
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
