// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import test from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../src/lib/browserEngine.js";
import {
  buildExportConfigJson,
  IMPORTED_CONFIG_PRESET,
  normalizeExportConfig,
  parseImportedConfigText
} from "../src/lib/viewerConfigRoundTrip.js";

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

function cloneConfig(value) {
  return JSON.parse(JSON.stringify(value));
}

test("import/edit/simulate/export/re-import round-trip preserves imported flow", () => {
  const imported = parseImportedConfigText(JSON.stringify(buildCanonicalFixture()));

  assert.equal(imported.selectedPreset, IMPORTED_CONFIG_PRESET);
  assert.deepEqual(imported.importedBaseConfig, imported.selectedConfig);
  assert.notEqual(imported.importedBaseConfig, imported.selectedConfig);

  const firstResult = evaluate(
    {
      value: 26.5,
      previousValue: 26.3,
      previousState: "normal",
      stateDurationMs: 0
    },
    imported.selectedConfig
  );
  assert.equal(firstResult.state, "warm");
  assert.equal(firstResult.action, "fan_low");

  const editedConfig = cloneConfig(imported.selectedConfig);
  editedConfig.rules[1].threshold = 27;

  const editedResult = evaluate(
    {
      value: 26.5,
      previousValue: 26.3,
      previousState: "normal",
      stateDurationMs: 0
    },
    editedConfig
  );
  assert.equal(editedResult.state, "normal");
  assert.equal(editedResult.action, "no_action");

  assert.equal(imported.importedBaseConfig.rules[1].threshold, 26);

  const exportPayload = normalizeExportConfig(editedConfig);
  assert.deepEqual(Object.keys(exportPayload).sort(), ["escalations", "rules", "states"]);
  assert.equal(exportPayload.rules[1].threshold, 27);
  assert.ok(!("name" in exportPayload.rules[0]));

  const reImported = parseImportedConfigText(buildExportConfigJson(editedConfig));
  assert.equal(reImported.selectedPreset, IMPORTED_CONFIG_PRESET);
  assert.deepEqual(reImported.importedBaseConfig, reImported.selectedConfig);
  assert.equal(reImported.importedBaseConfig.rules[1].threshold, 27);

  const reImportedResult = evaluate(
    {
      value: 26.5,
      previousValue: 26.3,
      previousState: "normal",
      stateDurationMs: 0
    },
    reImported.selectedConfig
  );
  assert.equal(reImportedResult.state, "normal");
  assert.equal(reImportedResult.action, "no_action");
});

test("imported flow rejects invalid canonical-ready config during round-trip import", () => {
  const invalidConfig = {
    states: [{ name: "normal", action: "no_action" }],
    rules: [{ type: "value_gte", threshold: 30, state: "hot" }],
    escalations: {
      action: {
        fanLowToHigh: {}
      },
      state: {
        hotToCritical: {
          durationMs: 5000
        }
      }
    }
  };

  assert.throws(() => parseImportedConfigText(JSON.stringify(invalidConfig)), /canonical-ready shape/);
});
