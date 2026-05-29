// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const path = require("path");
const { evaluate } = require("../../src");
const { toEngineInput } = require("./adapters/input-adapter");
const { toApplicationCommand } = require("./adapters/action-adapter");

const configPath = path.resolve(__dirname, "../node-temp-sim/config/exported-config.sample.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const rawSensorReading = {
  sensorName: "lab-temp-sensor-01",
  currentCelsius: 26.4,
  previousCelsius: 26.1,
  observedAtMs: Date.now(),
  lastState: "warming",
  lastAction: "fan_low",
  lastStateDurationMs: 900
};

const engineInput = toEngineInput(rawSensorReading);
const result = evaluate(engineInput, config);
const command = toApplicationCommand(result.action);

console.log("raw input:", rawSensorReading);
console.log("engine input:", engineInput);
console.log("application result:", {
  state: result.state,
  action: result.action,
  command
});

// Diagnostics exist in the JS convenience runtime, but callers should not
// depend on exact reason formatting or the full debug object shape.
console.log("diagnostics:", {
  hasReason: typeof result.reason === "string",
  hasDebug: Boolean(result.debug && typeof result.debug === "object")
});
