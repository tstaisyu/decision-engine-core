// Copyright (c) 2025 tstaisyu
// SPDX-License-Identifier: Apache-2.0

const SUPPORTED_RULE_TYPES = new Set([
  "value_gte",
  "hysteresis",
  "rate_gt",
  "rate_lt"
]);

function matchRule(rule, normalized) {
  if (rule.type === "value_gte") {
    return normalized.value >= rule.threshold;
  }

  if (rule.type === "hysteresis") {
    return (
      normalized.previousStateSafe === rule.state &&
      normalized.value > rule.offThreshold
    );
  }

  if (rule.type === "rate_gt") {
    return normalized.stateRate > rule.threshold;
  }

  if (rule.type === "rate_lt") {
    return normalized.stateRate < rule.threshold;
  }

  return false;
}

function resolveStateRules(config, defaultConfig) {
  if (config && config.states && Array.isArray(config.states.rules)) {
    return config.states.rules;
  }

  return [
    {
      name: "critical",
      type: "value_gte",
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
    {
      name: "hot",
      type: "value_gte",
      threshold:
        typeof config.hotOnThreshold === "number"
          ? config.hotOnThreshold
          : config &&
              config.states &&
              config.states.hot &&
              typeof config.states.hot.onThreshold === "number"
            ? config.states.hot.onThreshold
            : defaultConfig.states.hot.onThreshold
    },
    {
      name: "hot_hysteresis",
      type: "hysteresis",
      state: "hot",
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
    {
      name: "warming",
      type: "rate_gt",
      threshold:
        typeof config.warmingRateThreshold === "number"
          ? config.warmingRateThreshold
          : config &&
              config.states &&
              config.states.warming &&
              typeof config.states.warming.rateThreshold === "number"
            ? config.states.warming.rateThreshold
            : defaultConfig.states.warming.rateThreshold
    },
    {
      name: "cooling",
      type: "rate_lt",
      threshold:
        typeof config.coolingRateThreshold === "number"
          ? config.coolingRateThreshold
          : config &&
              config.states &&
              config.states.cooling &&
              typeof config.states.cooling.rateThreshold === "number"
            ? config.states.cooling.rateThreshold
            : defaultConfig.states.cooling.rateThreshold
    }
  ];
}

module.exports = {
  SUPPORTED_RULE_TYPES,
  matchRule,
  resolveStateRules
};
