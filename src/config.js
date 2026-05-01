const config = {
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

module.exports = {
  config
};
