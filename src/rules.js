// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const SUPPORTED_RULE_TYPES = new Set(["value_gte", "hysteresis", "rate_gt", "rate_lt"]);

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

function resolveStateRules(config, defaultConfig) {
  if (config && Array.isArray(config.rules)) {
    return config.rules;
  }

  return Array.isArray(defaultConfig?.rules) ? defaultConfig.rules : [];
}

module.exports = {
  SUPPORTED_RULE_TYPES,
  matchRule,
  resolveStateRules
};
