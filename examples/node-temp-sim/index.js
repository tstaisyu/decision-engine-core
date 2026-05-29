// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const path = require("path");
const { evaluate } = require("../../src");
const { presets } = require("../../src/presets");
const { toEngineInput } = require("./adapters/temperature-input-adapter");
const { mapActionToFanCommand } = require("./adapters/fan-action-adapter");

const DEFAULT_CONFIG = presets.m5Temperature;
const DEFAULT_SEQUENCE = [
  { value: 25.0, timestamp: 1000 },
  { value: 25.3, timestamp: 2000 },
  { value: 25.8, timestamp: 3000 },
  { value: 26.2, timestamp: 4000 },
  { value: 26.6, timestamp: 5000 },
  { value: 26.3, timestamp: 6000 },
  { value: 25.9, timestamp: 7000 },
  { value: 25.4, timestamp: 8000 }
];

function parseArgs(argv) {
  const options = { configPath: "", inputPath: "" };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--config") {
      options.configPath = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (arg === "--input") {
      options.inputPath = argv[i + 1] || "";
      i += 1;
      continue;
    }
  }

  return options;
}

function loadJson(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  return JSON.parse(raw);
}

function resolveStepDeltaMs(step, previousTimestamp) {
  if (typeof step.elapsedMs === "number" && Number.isFinite(step.elapsedMs)) {
    return step.elapsedMs;
  }
  if (typeof step.timestamp === "number" && Number.isFinite(step.timestamp) && previousTimestamp !== null) {
    return Math.max(0, step.timestamp - previousTimestamp);
  }
  return 1000;
}

function runSimulation(sequence, config) {
  const rows = [];
  let previousValue = typeof sequence[0]?.value === "number" ? sequence[0].value : 25.0;
  let previousState = "normal";
  let previousAction = "no_action";
  let stateDurationMs = 0;
  let previousTimestamp = null;
  let elapsedMs = 0;

  sequence.forEach((step, index) => {
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      throw new Error(`Step ${index + 1}: item must be an object`);
    }
    if (typeof step.value !== "number" || !Number.isFinite(step.value)) {
      throw new Error(`Step ${index + 1}: value must be a finite number`);
    }

    const deltaMs = resolveStepDeltaMs(step, previousTimestamp);
    elapsedMs += deltaMs;

    const input = toEngineInput({
      value: step.value,
      previousValue,
      previousState,
      previousAction,
      stateDurationMs,
      timestamp: typeof step.timestamp === "number" && Number.isFinite(step.timestamp) ? step.timestamp : elapsedMs
    });

    const result = evaluate(input, config);
    const fan = mapActionToFanCommand(result.action);
    const nextStateDurationMs = result.state === previousState ? stateDurationMs + deltaMs : 0;

    rows.push({
      step: index + 1,
      elapsedMs,
      value: step.value,
      state: result.state,
      action: result.action,
      pwm: fan.pwm,
      stateDurationMs: nextStateDurationMs
    });

    previousValue = step.value;
    previousState = result.state;
    previousAction = result.action;
    stateDurationMs = nextStateDurationMs;
    if (typeof step.timestamp === "number" && Number.isFinite(step.timestamp)) {
      previousTimestamp = step.timestamp;
    }
  });

  return rows;
}

function main() {
  const { configPath, inputPath } = parseArgs(process.argv);
  const config = configPath ? loadJson(configPath) : DEFAULT_CONFIG;
  const sequence = inputPath ? loadJson(inputPath) : DEFAULT_SEQUENCE;

  if (!Array.isArray(sequence)) {
    throw new Error("Input sequence JSON must be an array.");
  }

  const timeline = runSimulation(sequence, config);
  console.table(timeline);
}

main();
