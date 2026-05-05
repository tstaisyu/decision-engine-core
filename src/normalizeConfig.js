// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

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

function normalizeCanonicalConfig(config) {
  const { states = [], rules = [], ...rest } = config;

  return {
    ...rest,
    states: Array.isArray(states) ? states.map((state) => ({ ...state })) : [],
    rules: Array.isArray(rules) ? rules.map(normalizeRule) : []
  };
}

function normalizeLegacyConfig(config) {
  const { states, actions, ...rest } = config;
  const legacyRules = Array.isArray(states?.rules) ? states.rules : [];
  const byState = actions?.byState && typeof actions.byState === "object" ? actions.byState : {};

  return {
    ...rest,
    states: Object.entries(byState).map(([name, action]) => ({ name, action })),
    rules: legacyRules.map(normalizeRule)
  };
}

function normalizeConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {
      states: [],
      rules: []
    };
  }

  if (Array.isArray(config.states) || Array.isArray(config.rules)) {
    return normalizeCanonicalConfig(config);
  }

  return normalizeLegacyConfig(config);
}

module.exports = {
  normalizeConfig
};
