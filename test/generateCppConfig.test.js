// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildHeader,
  generateCppConfig,
  numberLiteral,
  toDecisionEngineInclude,
  toHeaderGuard
} = require("../scripts/generate-cpp-config");

test("numberLiteral renders integer and fractional float literals", () => {
  assert.equal(numberLiteral(34), "34.0F");
  assert.equal(numberLiteral(32.5), "32.5F");
});

test("toHeaderGuard derives a stable include guard from the output filename", () => {
  assert.equal(toHeaderGuard("examples/m5-temp-fan/config/generated_fan_config.h"), "GENERATED_FAN_CONFIG_H");
});

test("toDecisionEngineInclude derives a relative include path from the output directory", () => {
  const includePath = toDecisionEngineInclude(
    path.resolve(process.cwd(), "examples/m5-temp-fan/config/generated_fan_config.h")
  );
  assert.equal(includePath, "../../../runtimes/cpp/DecisionEngine.h");
});

test("buildHeader projects canonical action escalation fields into the generated config header", () => {
  const config = {
    escalations: {
      action: {
        fanLowToHigh: {
          durationMs: 10000,
          requireNoCoolingEffect: false
        }
      }
    },
    states: [
      { name: "normal", action: "no_action" },
      { name: "warm", action: "fan_low" },
      { name: "hot", action: "fan_high" }
    ],
    rules: [
      { type: "value_gte", threshold: 34, state: "hot" },
      { type: "value_gte", threshold: 32, state: "warm" }
    ]
  };

  const header = buildHeader(config, path.resolve(process.cwd(), "examples/m5-temp-fan/config/generated_fan_config.h"));

  assert.match(header, /config\.defaultState = "normal";/);
  assert.match(header, /config\.actionEscalationFromAction = "fan_low";/);
  assert.match(header, /config\.actionEscalationToAction = "fan_high";/);
  assert.match(header, /config\.actionEscalationDurationMs = 10000UL;/);
  assert.match(header, /config\.requireNoCoolingEffect = false;/);
  assert.match(header, /\{"value_gte", 34\.0F, "hot", 0\.0F, 0\.0F\},/);
});

test("generateCppConfig writes a header file for a valid canonical config", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "generate-cpp-config-"));
  const inputPath = path.join(tempDir, "config.json");
  const outputPath = path.join(tempDir, "generated_config.h");
  const config = {
    escalations: {},
    states: [
      { name: "cool", action: "fan_off" },
      { name: "warm", action: "fan_low" }
    ],
    rules: [{ type: "value_gte", threshold: 32, state: "warm" }]
  };

  fs.writeFileSync(inputPath, JSON.stringify(config, null, 2));

  try {
    const writtenPath = generateCppConfig(inputPath, outputPath);
    assert.equal(writtenPath, outputPath);

    const generatedHeader = fs.readFileSync(outputPath, "utf8");
    assert.match(generatedHeader, /config\.defaultState = "cool";/);
    assert.match(generatedHeader, /config\.states = \{/);
    assert.match(generatedHeader, /config\.rules = \{/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
