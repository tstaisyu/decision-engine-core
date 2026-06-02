// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

export const IMPORTED_CONFIG_PRESET = "__imported_config__";

function normalizeRule(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return null;
  }

  const nextRule = { ...rule };
  if (typeof nextRule.state !== "string" || nextRule.state.length === 0) {
    return null;
  }
  delete nextRule.name;

  return nextRule;
}

function isCanonicalConfigShape(config) {
  return Boolean(config && Array.isArray(config.states) && Array.isArray(config.rules));
}

export function isViewerCanonicalReadyConfig(config) {
  const actionEscalation = config?.escalations?.action?.fanLowToHigh;
  const stateEscalation = config?.escalations?.state?.hotToCritical;

  return Boolean(
    config &&
    typeof config === "object" &&
    !Array.isArray(config) &&
    Array.isArray(config.states) &&
    Array.isArray(config.rules) &&
    config.escalations &&
    typeof config.escalations === "object" &&
    !Array.isArray(config.escalations) &&
    actionEscalation &&
    typeof actionEscalation === "object" &&
    typeof actionEscalation.durationMs === "number" &&
    typeof actionEscalation.requireNoCoolingEffect === "boolean" &&
    stateEscalation &&
    typeof stateEscalation === "object" &&
    typeof stateEscalation.durationMs === "number"
  );
}

export function normalizeExportConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {
      states: [],
      rules: []
    };
  }

  if (isCanonicalConfigShape(config)) {
    const { states: _states, rules: _rules, actions: _actions, ...rest } = config;
    const canonicalStates = config.states.map((state) => ({ ...state }));
    const canonicalRules = config.rules.map(normalizeRule).filter(Boolean);

    return {
      ...rest,
      states: canonicalStates,
      rules: canonicalRules
    };
  }

  console.warn("Viewer expects canonical config shape with states[] and rules[]. Legacy config was ignored.");

  return {
    states: [],
    rules: []
  };
}

function normalizeViewerConfig(config) {
  return normalizeExportConfig(config);
}

export function normalizeViewerReadyConfig(config) {
  const normalized = normalizeViewerConfig(config);
  return isViewerCanonicalReadyConfig(normalized) ? normalized : null;
}

export function parseImportedConfigText(rawText) {
  const parsed = JSON.parse(rawText);
  const nextConfig = normalizeViewerReadyConfig(parsed);

  if (!nextConfig) {
    throw new Error("imported config が評価に必要な canonical-ready shape を満たしていません。");
  }

  return {
    selectedPreset: IMPORTED_CONFIG_PRESET,
    selectedConfig: nextConfig,
    importedBaseConfig: structuredClone(nextConfig)
  };
}

export function buildExportConfigJson(config) {
  return JSON.stringify(normalizeExportConfig(config), null, 2);
}
