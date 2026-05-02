const { evaluate } = require("../../src");
const { presets } = require("../../src/presets");
const { toEngineInput } = require("../adapters/temperature-input-adapter");
const { mapActionToFanCommand } = require("../adapters/fan-action-adapter");

const config = presets.m5Temperature;

const temperatureSequence = [25.0, 25.3, 25.8, 26.2, 26.6, 26.3, 25.9, 25.4];

function runSimulation(values) {
  const rows = [];
  let previousValue = values[0] ?? 25.0;
  let previousState = "normal";
  let previousAction = "no_action";
  let stateDurationMs = 0;

  values.forEach((value, index) => {
    const elapsedMs = (index + 1) * 1000;
    const input = toEngineInput({
      value,
      previousValue,
      previousState,
      previousAction,
      stateDurationMs,
      timestamp: Date.now() + elapsedMs
    });

    const result = evaluate(input, config);
    const fan = mapActionToFanCommand(result.action);

    stateDurationMs = result.state === previousState ? stateDurationMs + 1000 : 0;

    rows.push({
      step: index + 1,
      elapsedMs,
      value,
      state: result.state,
      action: result.action,
      pwm: fan.pwm
    });

    previousValue = value;
    previousState = result.state;
    previousAction = result.action;
  });

  return rows;
}

const timeline = runSimulation(temperatureSequence);
console.table(timeline);
