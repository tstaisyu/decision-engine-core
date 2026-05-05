// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from "react";
import { evaluateWithPreset, getPresets } from "../lib/engineAdapter";

const WORKSPACE_STORAGE_KEY = "decision-engine-viewer.workspace.v1";

const defaultInput = {
  value: 31.5,
  previousValue: 30.8,
  tempRateAvg: 0.7,
  coolingEffect: false,
  previousState: "normal",
  stateDurationMs: 0
};

const defaultSequence = [
  { value: 25.0, tempRateAvg: 0, elapsedMs: 1000 },
  { value: 27.0, tempRateAvg: 0.03, elapsedMs: 1000 },
  { value: 31.0, tempRateAvg: 0.05, elapsedMs: 1000 },
  { value: 30.5, tempRateAvg: -0.01, elapsedMs: 1000 }
];

function parseTimestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getMatchedRuleLabel(result) {
  return (
    result?.appliedRule ||
    result?.matchedRule ||
    (result?.debug?.baseState ? `baseState: ${result.debug.baseState}` : result?.reason || "-")
  );
}

function normalizeRule(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return rule;
  }

  const nextRule = { ...rule };
  if (typeof nextRule.state !== "string" || nextRule.state.length === 0) {
    nextRule.state = nextRule.name;
  }

  return nextRule;
}

function normalizeExportConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {
      states: [],
      rules: []
    };
  }

  if (Array.isArray(config.states) || Array.isArray(config.rules)) {
    const canonicalStates = Array.isArray(config.states)
      ? config.states.map((state) => ({ ...state }))
      : config.actions?.byState && typeof config.actions.byState === "object"
        ? Object.entries(config.actions.byState).map(([name, action]) => ({ name, action }))
        : [];
    const canonicalRules = Array.isArray(config.rules)
      ? config.rules.map(normalizeRule)
      : Array.isArray(config.states?.rules)
        ? config.states.rules.map(normalizeRule)
        : [];

    return {
      ...config,
      states: canonicalStates,
      rules: canonicalRules
    };
  }

  const rules = Array.isArray(config.states?.rules) ? config.states.rules.map(normalizeRule) : [];
  const states =
    config.actions?.byState && typeof config.actions.byState === "object"
      ? Object.entries(config.actions.byState).map(([name, action]) => ({ name, action }))
      : [];

  return {
    ...config,
    states,
    rules
  };
}

function normalizeViewerConfig(config) {
  const canonicalConfig = normalizeExportConfig(config);
  const { states: canonicalStates, rules: canonicalRules, ...restCanonicalConfig } = canonicalConfig;
  const actionsByState = Object.fromEntries(
    canonicalStates
      .filter((state) => state && typeof state.name === "string")
      .map((state) => [state.name, state.action])
  );

  return {
    ...restCanonicalConfig,
    states: {
      ...(config && config.states && !Array.isArray(config.states) ? config.states : {}),
      rules: canonicalRules
    },
    actions: {
      ...(config && config.actions && !Array.isArray(config.actions) ? config.actions : {}),
      byState: actionsByState
    }
  };
}

export function useSimulation() {
  const presets = useMemo(() => getPresets(), []);
  const presetNames = Object.keys(presets);
  const [selectedPreset, setSelectedPreset] = useState(presetNames[0] || "");
  const [selectedConfig, setSelectedConfig] = useState(() => {
    const firstPresetName = presetNames[0];
    return firstPresetName ? normalizeViewerConfig(structuredClone(presets[firstPresetName])) : null;
  });
  const [inputText, setInputText] = useState(JSON.stringify(defaultInput, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [sequenceText, setSequenceText] = useState(JSON.stringify(defaultSequence, null, 2));
  const [timelineRows, setTimelineRows] = useState([]);
  const [timelineError, setTimelineError] = useState("");
  const [workspaceStatus, setWorkspaceStatus] = useState("");
  const baseSelectedConfig = selectedPreset ? normalizeViewerConfig(structuredClone(presets[selectedPreset])) : null;

  function changePreset(presetName) {
    setSelectedPreset(presetName);
    setSelectedConfig(normalizeViewerConfig(structuredClone(presets[presetName])));
  }

  function updateSelectedConfig(nextConfig) {
    setSelectedConfig(normalizeViewerConfig(nextConfig));
  }

  function evaluateCurrent() {
    try {
      const input = JSON.parse(inputText);
      const nextResult = {
        edited: null,
        original: null,
        errors: {
          edited: "",
          original: ""
        }
      };

      try {
        nextResult.edited = evaluateWithPreset(input, selectedPreset, selectedConfig);
      } catch (err) {
        nextResult.errors.edited = err instanceof Error ? err.message : String(err);
      }

      try {
        nextResult.original = evaluateWithPreset(input, selectedPreset, baseSelectedConfig);
      } catch (err) {
        nextResult.errors.original = err instanceof Error ? err.message : String(err);
      }

      setResult(nextResult);
      setError("");
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function runSimulation() {
    try {
      const parsed = JSON.parse(sequenceText);
      if (!Array.isArray(parsed)) {
        throw new Error("シーケンスは JSON 配列で指定してください。");
      }

      let previousState = "normal";
      let previousAction = "no_action";
      let previousValue = null;
      let stateDurationMs = 0;
      let accumulatedElapsedMs = 0;
      let previousTimestampMs = null;

      const rows = parsed.map((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          throw new Error(`ステップ ${index + 1}: 各要素はオブジェクトである必要があります。`);
        }
        if (typeof item.value !== "number") {
          throw new Error(`ステップ ${index + 1}: value (number) は必須です。`);
        }

        let deltaMs = 1000;
        if (typeof item.elapsedMs === "number" && Number.isFinite(item.elapsedMs)) {
          deltaMs = item.elapsedMs;
        } else {
          const ts = parseTimestamp(item.timestamp);
          if (ts !== null && previousTimestampMs !== null) {
            deltaMs = Math.max(0, ts - previousTimestampMs);
          }
          if (ts !== null) {
            previousTimestampMs = ts;
          }
        }
        accumulatedElapsedMs += deltaMs;

        const input = {
          ...item,
          previousState,
          previousAction,
          previousValue: typeof item.previousValue === "number" ? item.previousValue : previousValue,
          stateDurationMs
        };

        const evaluated = evaluateWithPreset(input, selectedPreset, selectedConfig);

        const nextStateDurationMs = evaluated.state === previousState ? stateDurationMs + deltaMs : 0;
        const row = {
          step: index + 1,
          elapsedMs: accumulatedElapsedMs,
          value: item.value,
          state: evaluated.state,
          action: evaluated.action,
          appliedRule: getMatchedRuleLabel(evaluated),
          stateDurationMs: nextStateDurationMs
        };

        previousState = evaluated.state;
        previousAction = evaluated.action;
        previousValue = item.value;
        stateDurationMs = nextStateDurationMs;
        return row;
      });

      setTimelineRows(rows);
      setTimelineError("");
    } catch (err) {
      setTimelineRows([]);
      setTimelineError(err instanceof Error ? err.message : String(err));
    }
  }

  function saveWorkspace() {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        throw new Error("localStorage が利用できません。");
      }

      const payload = {
        version: 1,
        selectedPreset,
        selectedConfig: normalizeExportConfig(selectedConfig),
        inputText,
        sequenceText
      };

      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
      setWorkspaceStatus("saved");
    } catch (err) {
      setWorkspaceStatus(`save error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function loadWorkspace() {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        throw new Error("localStorage が利用できません。");
      }

      const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (!raw) {
        setWorkspaceStatus("no saved data");
        return;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("保存データ形式が不正です。");
      }
      if (parsed.version !== 1) {
        throw new Error(`未対応バージョンです: ${String(parsed.version)}`);
      }
      if (typeof parsed.selectedPreset !== "string" || !presets[parsed.selectedPreset]) {
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

      setSelectedPreset(parsed.selectedPreset);
      setSelectedConfig(normalizeViewerConfig(parsed.selectedConfig));
      setInputText(parsed.inputText);
      setSequenceText(parsed.sequenceText);
      setResult(null);
      setError("");
      setTimelineRows([]);
      setTimelineError("");
      setWorkspaceStatus("loaded");
    } catch (err) {
      setWorkspaceStatus(`load error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function clearWorkspace() {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        throw new Error("localStorage が利用できません。");
      }
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      setWorkspaceStatus("cleared");
    } catch (err) {
      setWorkspaceStatus(`clear error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function exportConfig() {
    try {
      if (typeof window === "undefined" || typeof document === "undefined") {
        throw new Error("ブラウザ環境でのみ export できます。");
      }
      if (!selectedConfig || typeof selectedConfig !== "object") {
        throw new Error("export 対象の config がありません。");
      }

      const json = JSON.stringify(normalizeExportConfig(selectedConfig), null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = "decision-engine-config.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setWorkspaceStatus("config exported");
    } catch (err) {
      setWorkspaceStatus(`export error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    presetNames,
    selectedPreset,
    setSelectedPreset: changePreset,
    baseSelectedConfig,
    selectedConfig,
    setSelectedConfig: updateSelectedConfig,
    inputText,
    setInputText,
    result,
    error,
    evaluateCurrent,
    sequenceText,
    setSequenceText,
    timelineRows,
    timelineError,
    runSimulation,
    saveWorkspace,
    loadWorkspace,
    clearWorkspace,
    exportConfig,
    workspaceStatus
  };
}
