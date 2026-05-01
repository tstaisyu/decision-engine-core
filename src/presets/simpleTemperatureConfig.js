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

module.exports = {
  simpleTemperatureConfig
};
