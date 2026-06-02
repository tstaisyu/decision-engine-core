// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDefinitionChanges,
  buildPresetSelectionState,
  resetAllDefinitionChanges,
  resolveBaseSelectedConfig
} from "../src/lib/viewerAuthoringWorkflow.js";
import { IMPORTED_CONFIG_PRESET, normalizeViewerReadyConfig } from "../src/lib/viewerConfigRoundTrip.js";
import { presets } from "../src/lib/viewerPresets.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildImportedState() {
  const importedBaseConfig = normalizeViewerReadyConfig(clone(presets.simpleTemperature));
  const selectedConfig = clone(importedBaseConfig);
  return {
    selectedPreset: IMPORTED_CONFIG_PRESET,
    importedBaseConfig,
    selectedConfig
  };
}

test("built-in preset baseline supports edit/compare/reset-all", () => {
  const presetState = buildPresetSelectionState(presets, "simpleTemperature");
  const baseline = resolveBaseSelectedConfig({
    selectedPreset: presetState.selectedPreset,
    importedBaseConfig: presetState.importedBaseConfig,
    presets
  });

  assert.equal(presetState.selectedPreset, "simpleTemperature");
  assert.equal(presetState.importedBaseConfig, null);
  assert.deepEqual(presetState.selectedConfig, baseline);

  const editedConfig = clone(presetState.selectedConfig);
  editedConfig.rules[1].threshold = 27;

  const changes = buildDefinitionChanges(editedConfig, baseline);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].resetType, "rule-threshold");

  const resetConfig = resetAllDefinitionChanges(baseline);
  assert.deepEqual(resetConfig, baseline);
  assert.equal(resetConfig.rules[1].threshold, 26);
});

test("imported baseline supports edit/compare/reset-all", () => {
  const importedState = buildImportedState();
  const baseline = resolveBaseSelectedConfig({
    selectedPreset: importedState.selectedPreset,
    importedBaseConfig: importedState.importedBaseConfig,
    presets
  });

  assert.equal(importedState.selectedPreset, IMPORTED_CONFIG_PRESET);
  assert.deepEqual(baseline, importedState.importedBaseConfig);

  const editedConfig = clone(importedState.selectedConfig);
  editedConfig.rules[1].threshold = 27;

  const changes = buildDefinitionChanges(editedConfig, baseline);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].resetType, "rule-threshold");

  const resetConfig = resetAllDefinitionChanges(baseline);
  assert.deepEqual(resetConfig, baseline);
  assert.equal(resetConfig.rules[1].threshold, 26);
});

test("preset reselection clears imported/custom baseline and restores built-in baseline", () => {
  const importedState = buildImportedState();
  const nextPresetState = buildPresetSelectionState(presets, "m5Temperature");

  assert.equal(importedState.selectedPreset, IMPORTED_CONFIG_PRESET);
  assert.equal(nextPresetState.selectedPreset, "m5Temperature");
  assert.equal(nextPresetState.importedBaseConfig, null);

  const nextBaseline = resolveBaseSelectedConfig({
    selectedPreset: nextPresetState.selectedPreset,
    importedBaseConfig: nextPresetState.importedBaseConfig,
    presets
  });

  assert.deepEqual(nextPresetState.selectedConfig, nextBaseline);
  assert.notDeepEqual(nextPresetState.selectedConfig, importedState.importedBaseConfig);
});
