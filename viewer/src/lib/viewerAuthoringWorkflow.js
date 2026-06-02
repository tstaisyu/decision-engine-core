// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import { IMPORTED_CONFIG_PRESET, normalizeViewerReadyConfig } from "./viewerConfigRoundTrip.js";

function cloneConfig(value) {
  return structuredClone(value);
}

export function getPresetLabel(name) {
  return name === IMPORTED_CONFIG_PRESET ? "imported/custom" : name;
}

export function buildPresetSelectionState(presets, presetName) {
  return {
    selectedPreset: presetName,
    importedBaseConfig: null,
    selectedConfig: normalizeViewerReadyConfig(cloneConfig(presets[presetName]))
  };
}

export function resolveBaseSelectedConfig({ selectedPreset, importedBaseConfig, presets }) {
  if (selectedPreset === IMPORTED_CONFIG_PRESET) {
    return importedBaseConfig;
  }

  if (!selectedPreset) {
    return null;
  }

  return normalizeViewerReadyConfig(cloneConfig(presets[selectedPreset]));
}

export function buildDefinitionChanges(selectedConfig, baseSelectedConfig) {
  const rules = Array.isArray(selectedConfig?.rules) ? selectedConfig.rules : [];
  const states = Array.isArray(selectedConfig?.states) ? selectedConfig.states : [];
  const actions = Object.fromEntries(states.map((state) => [state.name, state.action]));
  const stateEscalations = selectedConfig?.escalations?.state || {};
  const actionEscalations = selectedConfig?.escalations?.action || {};
  const baseRules = Array.isArray(baseSelectedConfig?.rules) ? baseSelectedConfig.rules : [];
  const baseStates = Array.isArray(baseSelectedConfig?.states) ? baseSelectedConfig.states : [];
  const baseActions = Object.fromEntries(baseStates.map((state) => [state.name, state.action]));
  const baseStateEscalations = baseSelectedConfig?.escalations?.state || {};
  const baseActionEscalations = baseSelectedConfig?.escalations?.action || {};

  const changes = [];

  rules.forEach((rule, index) => {
    const baseRule = baseRules[index];
    if (!baseRule) {
      return;
    }

    const ruleThreshold = typeof rule.onThreshold === "number" ? rule.onThreshold : rule.threshold;
    const baseRuleThreshold = typeof baseRule.onThreshold === "number" ? baseRule.onThreshold : baseRule.threshold;
    if (typeof ruleThreshold === "number" && ruleThreshold !== baseRuleThreshold) {
      changes.push({
        key: `rule-threshold-${index}`,
        label: `Rules: ${rule.state} threshold ${baseRuleThreshold} -> ${ruleThreshold}`,
        resetType: "rule-threshold",
        target: index
      });
    }

    if (typeof rule.offThreshold === "number" && rule.offThreshold !== baseRule.offThreshold) {
      changes.push({
        key: `rule-off-threshold-${index}`,
        label: `Rules: ${rule.state} offThreshold ${baseRule.offThreshold} -> ${rule.offThreshold}`,
        resetType: "rule-off-threshold",
        target: index
      });
    }
  });

  Object.entries(actions).forEach(([state, action]) => {
    const baseAction = baseActions[state];
    if (baseAction !== undefined && action !== baseAction) {
      changes.push({
        key: `action-${state}`,
        label: `Actions: ${state} ${baseAction} -> ${action}`,
        resetType: "action",
        target: state
      });
    }
  });

  Object.entries(stateEscalations).forEach(([name, escalation]) => {
    const baseEscalation = baseStateEscalations[name];
    if (baseEscalation && escalation.durationMs !== baseEscalation.durationMs) {
      changes.push({
        key: `state-escalation-${name}`,
        label: `Escalations: ${name} ${baseEscalation.durationMs}ms -> ${escalation.durationMs}ms`,
        resetType: "state-escalation",
        target: name
      });
    }
  });

  Object.entries(actionEscalations).forEach(([name, escalation]) => {
    const baseEscalation = baseActionEscalations[name];
    if (baseEscalation && escalation.durationMs !== baseEscalation.durationMs) {
      changes.push({
        key: `action-escalation-${name}`,
        label: `Escalations: ${name} ${baseEscalation.durationMs}ms -> ${escalation.durationMs}ms`,
        resetType: "action-escalation",
        target: name
      });
    }

    const baseRequireNoCoolingEffect = baseEscalation?.requireNoCoolingEffect;
    if (baseEscalation && escalation.requireNoCoolingEffect !== baseRequireNoCoolingEffect) {
      changes.push({
        key: `action-escalation-cooling-effect-${name}`,
        label: `Escalations: ${name} requireNoCoolingEffect ${String(baseRequireNoCoolingEffect)} -> ${String(escalation.requireNoCoolingEffect)}`,
        resetType: "action-escalation-cooling-effect",
        target: name
      });
    }
  });

  return changes;
}

export function resetDefinitionChange(selectedConfig, baseSelectedConfig, resetType, target) {
  const nextConfig = cloneConfig(selectedConfig);
  if (!nextConfig || !baseSelectedConfig) {
    return selectedConfig;
  }

  const baseRules = Array.isArray(baseSelectedConfig?.rules) ? baseSelectedConfig.rules : [];
  const states = Array.isArray(selectedConfig?.states) ? selectedConfig.states : [];
  const baseStates = Array.isArray(baseSelectedConfig?.states) ? baseSelectedConfig.states : [];
  const baseActions = Object.fromEntries(baseStates.map((state) => [state.name, state.action]));
  const baseStateEscalations = baseSelectedConfig?.escalations?.state || {};
  const baseActionEscalations = baseSelectedConfig?.escalations?.action || {};

  if (resetType === "rule-threshold" && nextConfig.rules?.[target]) {
    if (
      typeof nextConfig.rules[target].onThreshold === "number" ||
      typeof baseRules[target]?.onThreshold === "number"
    ) {
      nextConfig.rules[target].onThreshold = baseRules[target]?.onThreshold;
    } else {
      nextConfig.rules[target].threshold = baseRules[target]?.threshold;
    }
  }

  if (resetType === "rule-off-threshold" && nextConfig.rules?.[target]) {
    nextConfig.rules[target].offThreshold = baseRules[target]?.offThreshold;
  }

  if (resetType === "action") {
    nextConfig.states = Array.isArray(nextConfig.states) ? nextConfig.states : cloneConfig(states);
    const targetState = nextConfig.states.find((state) => state?.name === target);
    if (targetState) {
      targetState.action = baseActions[target];
    }
  }

  if (resetType === "state-escalation" && nextConfig.escalations?.state?.[target]) {
    nextConfig.escalations.state[target].durationMs = baseStateEscalations[target]?.durationMs;
  }

  if (resetType === "action-escalation" && nextConfig.escalations?.action?.[target]) {
    nextConfig.escalations.action[target].durationMs = baseActionEscalations[target]?.durationMs;
  }

  if (resetType === "action-escalation-cooling-effect" && nextConfig.escalations?.action?.[target]) {
    const baseValue = baseActionEscalations[target]?.requireNoCoolingEffect;
    if (baseValue === undefined) {
      delete nextConfig.escalations.action[target].requireNoCoolingEffect;
    } else {
      nextConfig.escalations.action[target].requireNoCoolingEffect = baseValue;
    }
  }

  return nextConfig;
}

export function resetAllDefinitionChanges(baseSelectedConfig) {
  if (!baseSelectedConfig) {
    return null;
  }

  return cloneConfig(baseSelectedConfig);
}
