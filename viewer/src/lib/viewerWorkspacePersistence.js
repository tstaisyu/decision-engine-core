// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import { IMPORTED_CONFIG_PRESET, normalizeExportConfig, normalizeViewerReadyConfig } from "./viewerConfigRoundTrip.js";

export const VIEWER_WORKSPACE_VERSION = 1;

export function buildWorkspacePayload({ selectedPreset, selectedConfig, importedBaseConfig, inputText, sequenceText }) {
  return {
    version: VIEWER_WORKSPACE_VERSION,
    selectedPreset,
    selectedConfig: normalizeExportConfig(selectedConfig),
    importedBaseConfig:
      selectedPreset === IMPORTED_CONFIG_PRESET ? normalizeExportConfig(importedBaseConfig ?? selectedConfig) : null,
    inputText,
    sequenceText
  };
}

export function parseWorkspacePayload(rawWorkspace, presets) {
  const parsed = JSON.parse(rawWorkspace);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("保存データ形式が不正です。");
  }
  if (parsed.version !== VIEWER_WORKSPACE_VERSION) {
    throw new Error(`未対応バージョンです: ${String(parsed.version)}`);
  }
  if (
    typeof parsed.selectedPreset !== "string" ||
    (parsed.selectedPreset !== IMPORTED_CONFIG_PRESET && !presets[parsed.selectedPreset])
  ) {
    throw new Error("selectedPreset が不正です。");
  }
  if (typeof parsed.inputText !== "string") {
    throw new Error("inputText が不正です。");
  }
  if (typeof parsed.sequenceText !== "string") {
    throw new Error("sequenceText が不正です。");
  }
  if (!parsed.selectedConfig || typeof parsed.selectedConfig !== "object") {
    throw new Error("selectedConfig が不正です。");
  }

  const nextConfig = normalizeViewerReadyConfig(parsed.selectedConfig);
  if (!nextConfig) {
    throw new Error("selectedConfig が評価に必要な shape を満たしていません。");
  }

  let nextImportedBaseConfig = null;
  if (parsed.selectedPreset === IMPORTED_CONFIG_PRESET) {
    const candidateBaseConfig = parsed.importedBaseConfig ?? parsed.selectedConfig;
    if (!candidateBaseConfig || typeof candidateBaseConfig !== "object") {
      throw new Error("importedBaseConfig が不正です。");
    }

    nextImportedBaseConfig = normalizeViewerReadyConfig(candidateBaseConfig);
    if (!nextImportedBaseConfig) {
      throw new Error("importedBaseConfig が評価に必要な shape を満たしていません。");
    }
  }

  return {
    selectedPreset: parsed.selectedPreset,
    selectedConfig: nextConfig,
    importedBaseConfig: nextImportedBaseConfig,
    inputText: parsed.inputText,
    sequenceText: parsed.sequenceText
  };
}
