// Copyright (c) 2025 tstaisyu
// SPDX-License-Identifier: Apache-2.0

const { resolveStateRules } = require("./rules");

function resolveConfig(config, defaultConfig) {
  return {
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
    },
    states: {
      ...(config && config.states),
      critical: {
        threshold:
          typeof config.criticalThreshold === "number"
            ? config.criticalThreshold
            : config && config.states && config.states.critical && typeof config.states.critical.threshold === "number"
              ? config.states.critical.threshold
              : defaultConfig.states.critical.threshold
      },
      hot: {
        onThreshold:
          typeof config.hotOnThreshold === "number"
            ? config.hotOnThreshold
            : config && config.states && config.states.hot && typeof config.states.hot.onThreshold === "number"
              ? config.states.hot.onThreshold
              : defaultConfig.states.hot.onThreshold,
        offThreshold:
          typeof config.hotOffThreshold === "number"
            ? config.hotOffThreshold
            : config && config.states && config.states.hot && typeof config.states.hot.offThreshold === "number"
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
}

module.exports = {
  resolveConfig
};
