// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import test from "node:test";
import assert from "node:assert/strict";
import { IMPORTED_CONFIG_PRESET, normalizeViewerReadyConfig } from "../src/lib/viewerConfigRoundTrip.js";
import {
  buildWorkspacePayload,
  parseWorkspacePayload,
  VIEWER_WORKSPACE_VERSION
} from "../src/lib/viewerWorkspacePersistence.js";

function buildCanonicalFixture() {
  return {
    states: [
      { name: "normal", action: "no_action" },
      { name: "warm", action: "fan_low" },
      { name: "hot", action: "fan_high" }
    ],
    rules: [
      { type: "value_gte", threshold: 30, state: "hot", name: "hot-rule" },
      { type: "value_gte", threshold: 26, state: "warm", name: "warm-rule" }
    ],
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
    }
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("workspace payload round-trip preserves imported workspace state", () => {
  const selectedConfig = normalizeViewerReadyConfig(buildCanonicalFixture());
  assert.ok(selectedConfig);

  const importedBaseConfig = clone(selectedConfig);
  const editedConfig = clone(selectedConfig);
  editedConfig.rules[1].threshold = 27;

  const payload = buildWorkspacePayload({
    selectedPreset: IMPORTED_CONFIG_PRESET,
    selectedConfig: editedConfig,
    importedBaseConfig,
    inputText: JSON.stringify({ value: 26.5 }, null, 2),
    sequenceText: JSON.stringify([{ value: 26.5, elapsedMs: 1000 }], null, 2)
  });

  assert.equal(payload.version, VIEWER_WORKSPACE_VERSION);
  assert.equal(payload.selectedPreset, IMPORTED_CONFIG_PRESET);
  assert.equal(payload.selectedConfig.rules[1].threshold, 27);
  assert.equal(payload.importedBaseConfig.rules[1].threshold, 26);
  assert.ok(!("name" in payload.selectedConfig.rules[0]));

  const restored = parseWorkspacePayload(JSON.stringify(payload), {
    simpleTemperature: buildCanonicalFixture()
  });

  assert.equal(restored.selectedPreset, IMPORTED_CONFIG_PRESET);
  assert.equal(restored.selectedConfig.rules[1].threshold, 27);
  assert.equal(restored.importedBaseConfig.rules[1].threshold, 26);
  assert.equal(restored.inputText, JSON.stringify({ value: 26.5 }, null, 2));
  assert.equal(restored.sequenceText, JSON.stringify([{ value: 26.5, elapsedMs: 1000 }], null, 2));
});

test("workspace payload round-trip preserves built-in preset workspace state", () => {
  const selectedConfig = normalizeViewerReadyConfig(buildCanonicalFixture());
  assert.ok(selectedConfig);

  const payload = buildWorkspacePayload({
    selectedPreset: "simpleTemperature",
    selectedConfig,
    importedBaseConfig: null,
    inputText: '{"value":25}',
    sequenceText: '[{"value":25}]'
  });

  const restored = parseWorkspacePayload(JSON.stringify(payload), {
    simpleTemperature: buildCanonicalFixture()
  });

  assert.equal(restored.selectedPreset, "simpleTemperature");
  assert.equal(restored.importedBaseConfig, null);
  assert.equal(restored.selectedConfig.rules[1].threshold, 26);
  assert.equal(restored.inputText, '{"value":25}');
  assert.equal(restored.sequenceText, '[{"value":25}]');
});

test("workspace payload rejects unsupported version", () => {
  const invalidPayload = {
    version: VIEWER_WORKSPACE_VERSION + 1,
    selectedPreset: "simpleTemperature",
    selectedConfig: buildCanonicalFixture(),
    importedBaseConfig: null,
    inputText: "{}",
    sequenceText: "[]"
  };

  assert.throws(
    () => parseWorkspacePayload(JSON.stringify(invalidPayload), { simpleTemperature: buildCanonicalFixture() }),
    /未対応バージョン/
  );
});
