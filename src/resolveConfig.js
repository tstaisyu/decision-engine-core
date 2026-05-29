// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// JS config resolution / fallback helpers stay outside the portable runtime
// core so preset/default merging can evolve independently.

function resolveStateRules(config, defaultConfig) {
  if (config && Array.isArray(config.rules)) {
    return config.rules;
  }

  return Array.isArray(defaultConfig?.rules) ? defaultConfig.rules : [];
}

function resolveConfig(config, defaultConfig) {
  const resolvedStates = Array.isArray(config?.states)
    ? config.states.map((state) => ({ ...state }))
    : Array.isArray(defaultConfig?.states)
      ? defaultConfig.states.map((state) => ({ ...state }))
      : [];
  const resolvedRules = Array.isArray(resolveStateRules(config, defaultConfig))
    ? resolveStateRules(config, defaultConfig).map((rule) => ({ ...rule }))
    : [];

  return {
    ...config,
    states: resolvedStates,
    rules: resolvedRules,
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
                  typeof config.escalations.action.fanLowToHigh.durationMs === "number"
                ? config.escalations.action.fanLowToHigh.durationMs
                : defaultConfig.escalations.action.fanLowToHigh.durationMs,
          requireNoCoolingEffect:
            config &&
            config.escalations &&
            config.escalations.action &&
            config.escalations.action.fanLowToHigh &&
            typeof config.escalations.action.fanLowToHigh.requireNoCoolingEffect === "boolean"
              ? config.escalations.action.fanLowToHigh.requireNoCoolingEffect
              : defaultConfig.escalations.action.fanLowToHigh.requireNoCoolingEffect
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
                  typeof config.escalations.state.hotToCritical.durationMs === "number"
                ? config.escalations.state.hotToCritical.durationMs
                : defaultConfig.escalations.state.hotToCritical.durationMs
        }
      }
    }
  };
}

module.exports = {
  resolveConfig
};
