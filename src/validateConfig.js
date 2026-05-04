// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const { SUPPORTED_RULE_TYPES } = require("./rules");

function validateConfig(config) {
  const errors = [];

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {
      valid: false,
      errors: ["config must be an object"]
    };
  }

  if (!config.states || typeof config.states !== "object" || Array.isArray(config.states)) {
    errors.push("states must be an object");
  }

  const rules = config.states && config.states.rules;
  if (!Array.isArray(rules)) {
    errors.push("states.rules must be an array");
  }

  if (!config.actions || typeof config.actions !== "object" || Array.isArray(config.actions)) {
    errors.push("actions must be an object");
  }

  const actionsByState = config.actions && config.actions.byState;
  if (!actionsByState || typeof actionsByState !== "object" || Array.isArray(actionsByState)) {
    errors.push("actions.byState must be an object");
  }

  if (!config.escalations || typeof config.escalations !== "object" || Array.isArray(config.escalations)) {
    errors.push("escalations must be an object");
  }

  if (Array.isArray(rules)) {
    for (const [index, rule] of rules.entries()) {
      if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
        errors.push(`states.rules[${index}] must be an object`);
        continue;
      }

      if (typeof rule.name !== "string" || rule.name.length === 0) {
        errors.push(`states.rules[${index}].name must be a non-empty string`);
      }

      if (typeof rule.type !== "string" || rule.type.length === 0) {
        errors.push(`states.rules[${index}].type must be a non-empty string`);
      } else if (!SUPPORTED_RULE_TYPES.has(rule.type)) {
        errors.push(`states.rules[${index}].type is not supported: ${rule.type}`);
      }

      if (
        (rule.type === "value_gte" || rule.type === "rate_gt" || rule.type === "rate_lt") &&
        typeof rule.threshold !== "number"
      ) {
        errors.push(`states.rules[${index}].threshold must be a number`);
      }

      if (rule.type === "hysteresis") {
        if (typeof rule.state !== "string" || rule.state.length === 0) {
          errors.push(`states.rules[${index}].state must be a string`);
        }

        if (typeof rule.offThreshold !== "number") {
          errors.push(`states.rules[${index}].offThreshold must be a number`);
        }
      }

      if (
        actionsByState &&
        typeof actionsByState === "object" &&
        !Array.isArray(actionsByState) &&
        typeof rule.name === "string" &&
        rule.name.length > 0
      ) {
        const stateName = typeof rule.state === "string" ? rule.state : rule.name;
        if (typeof actionsByState[stateName] !== "string") {
          errors.push(`actions.byState must define an action for state: ${stateName}`);
        }
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
