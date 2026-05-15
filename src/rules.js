// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Shared rule contract / registry definitions used by config validation
// and JS-side config resolution helpers.

const SUPPORTED_RULE_TYPES = new Set(["value_gte", "hysteresis", "rate_gt", "rate_lt"]);

function resolveStateRules(config, defaultConfig) {
  if (config && Array.isArray(config.rules)) {
    return config.rules;
  }

  return Array.isArray(defaultConfig?.rules) ? defaultConfig.rules : [];
}

module.exports = {
  SUPPORTED_RULE_TYPES,
  resolveStateRules
};
