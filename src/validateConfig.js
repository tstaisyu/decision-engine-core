// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const { SUPPORTED_RULE_TYPES } = require("./rules");
const { normalizeConfig } = require("./normalizeConfig");

function validateConfig(config) {
  const errors = [];

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {
      valid: false,
      errors: ["config must be an object"]
    };
  }

  if (!config.escalations || typeof config.escalations !== "object" || Array.isArray(config.escalations)) {
    errors.push("escalations must be an object");
  }

  if (
    !Array.isArray(config.states) &&
    (!config.states || typeof config.states !== "object" || Array.isArray(config.states))
  ) {
    errors.push("states must be an object or array");
  }

  if (!Array.isArray(config.rules) && !Array.isArray(config.states?.rules)) {
    errors.push("rules must be an array");
  }

  const normalizedConfig = normalizeConfig(config);
  const { states, rules } = normalizedConfig;

  if (!Array.isArray(states)) {
    errors.push("states must be an array");
  }

  if (!Array.isArray(rules)) {
    errors.push("rules must be an array");
  }

  if (Array.isArray(states)) {
    for (const [index, state] of states.entries()) {
      if (!state || typeof state !== "object" || Array.isArray(state)) {
        errors.push(`states[${index}] must be an object`);
        continue;
      }

      if (typeof state.name !== "string" || state.name.length === 0) {
        errors.push(`states[${index}].name must be a non-empty string`);
      }

      if (typeof state.action !== "string" || state.action.length === 0) {
        errors.push(`states[${index}].action must be a non-empty string`);
      }
    }
  }

  const stateNames = Array.isArray(states)
    ? new Set(
        states
          .filter((state) => state && typeof state.name === "string" && state.name.length > 0)
          .map((state) => state.name)
      )
    : new Set();

  if (Array.isArray(rules)) {
    for (const [index, rule] of rules.entries()) {
      if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
        errors.push(`rules[${index}] must be an object`);
        continue;
      }

      if (typeof rule.type !== "string" || rule.type.length === 0) {
        errors.push(`rules[${index}].type must be a non-empty string`);
      } else if (!SUPPORTED_RULE_TYPES.has(rule.type)) {
        errors.push(`rules[${index}].type is not supported: ${rule.type}`);
      }

      if (
        (rule.type === "value_gte" || rule.type === "rate_gt" || rule.type === "rate_lt") &&
        typeof rule.threshold !== "number"
      ) {
        errors.push(`rules[${index}].threshold must be a number`);
      }

      if (rule.type === "hysteresis") {
        if (typeof rule.state !== "string" || rule.state.length === 0) {
          errors.push(`rules[${index}].state must be a string`);
        }

        if (typeof rule.offThreshold !== "number") {
          errors.push(`rules[${index}].offThreshold must be a number`);
        }
      }

      if (typeof rule.state !== "string" || rule.state.length === 0) {
        errors.push(`rules[${index}].state must be a non-empty string`);
      } else if (!stateNames.has(rule.state)) {
        errors.push(`states must define an action for state: ${rule.state}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateConfig
};
