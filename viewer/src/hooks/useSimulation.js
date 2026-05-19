// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useRef, useState } from "react";
import { evaluateWithConfig, getPresets } from "../lib/engineAdapter";

// Viewer application orchestrator:
// this hook owns preset selection, edited config state, single-step evaluation
// orchestration, timeline simulation orchestration, and workspace/export
// handling for the viewer.
//
// It does not define runtime semantics itself. Runtime evaluation is accessed
// through engineAdapter.js so the viewer remains a runtime consumer rather than
// a runtime source.
//
// Timeline helpers such as buildTimelineRows belong here because sequencing,
// replay, and viewer-local simulation flow are viewer responsibilities.
const WORKSPACE_STORAGE_KEY = "decision-engine-viewer.workspace.v1";
const TIMELINE_PLAY_INTERVAL_MS = 1000;

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

function isViewerCanonicalReadyConfig(config) {
  return Boolean(
    config &&
      typeof config === "object" &&
      !Array.isArray(config) &&
      Array.isArray(config.states) &&
      Array.isArray(config.rules) &&
      config.escalations &&
      typeof config.escalations === "object" &&
      !Array.isArray(config.escalations)
  );
}

function normalizeExportConfig(config) {
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

function normalizeViewerReadyConfig(config) {
  const normalized = normalizeViewerConfig(config);
  return isViewerCanonicalReadyConfig(normalized) ? normalized : null;
}

function parseSequenceText(sequenceText) {
  const parsed = JSON.parse(sequenceText);
  if (!Array.isArray(parsed)) {
    throw new Error("シーケンスは JSON 配列で指定してください。");
  }

  return parsed;
}

function buildTimelineRows(sequence, selectedConfig, limit = sequence.length) {
  if (!isViewerCanonicalReadyConfig(selectedConfig)) {
    throw new Error("評価に必要な config shape が不足しています。");
  }

  let previousState = "normal";
  let previousAction = "no_action";
  let previousValue = null;
  let stateDurationMs = 0;
  let accumulatedElapsedMs = 0;
  let previousTimestampMs = null;

  return sequence.slice(0, limit).map((item, index) => {
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

    const evaluated = evaluateWithConfig(input, selectedConfig);

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
}

export function useSimulation() {
  const presets = useMemo(() => getPresets(), []);
  const presetNames = Object.keys(presets);
  const timelineTimerRef = useRef(null);
  const [selectedPreset, setSelectedPreset] = useState(presetNames[0] || "");
  const [selectedConfig, setSelectedConfig] = useState(() => {
    const firstPresetName = presetNames[0];
    return firstPresetName ? normalizeViewerReadyConfig(structuredClone(presets[firstPresetName])) : null;
  });
  const [inputText, setInputText] = useState(JSON.stringify(defaultInput, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [sequenceText, setSequenceText] = useState(JSON.stringify(defaultSequence, null, 2));
  const [timelineRows, setTimelineRows] = useState([]);
  const [timelineDomainRows, setTimelineDomainRows] = useState([]);
  const [timelineError, setTimelineError] = useState("");
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState("");
  const baseSelectedConfig = selectedPreset
    ? normalizeViewerReadyConfig(structuredClone(presets[selectedPreset]))
    : null;

  function clearTimelineTimer() {
    if (timelineTimerRef.current !== null) {
      clearInterval(timelineTimerRef.current);
      timelineTimerRef.current = null;
    }
  }

  function stopTimelinePlayback() {
    clearTimelineTimer();
    setIsTimelinePlaying(false);
  }

  function resetTimelinePlayback() {
    stopTimelinePlayback();
    setTimelineRows([]);
    setTimelineDomainRows([]);
    setTimelineError("");
  }

  useEffect(() => clearTimelineTimer, []);

  function changePreset(presetName) {
    resetTimelinePlayback();
    setSelectedPreset(presetName);
    setSelectedConfig(normalizeViewerReadyConfig(structuredClone(presets[presetName])));
  }

  function updateSelectedConfig(nextConfig) {
    resetTimelinePlayback();
    setSelectedConfig(normalizeViewerReadyConfig(nextConfig));
  }

  function updateSequenceText(nextSequenceText) {
    stopTimelinePlayback();
    setSequenceText(nextSequenceText);
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
        if (!isViewerCanonicalReadyConfig(selectedConfig)) {
          throw new Error("edited config が評価に必要な shape を満たしていません。");
        }
        nextResult.edited = evaluateWithConfig(input, selectedConfig);
      } catch (err) {
        nextResult.errors.edited = err instanceof Error ? err.message : String(err);
      }

      try {
        if (!isViewerCanonicalReadyConfig(baseSelectedConfig)) {
          throw new Error("original config が評価に必要な shape を満たしていません。");
        }
        nextResult.original = evaluateWithConfig(input, baseSelectedConfig);
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
      stopTimelinePlayback();
      const parsed = parseSequenceText(sequenceText);
      const rows = buildTimelineRows(parsed, selectedConfig);
      setTimelineRows(rows);
      setTimelineDomainRows(rows);
      setTimelineError("");
    } catch (err) {
      setTimelineRows([]);
      setTimelineDomainRows([]);
      setTimelineError(err instanceof Error ? err.message : String(err));
    }
  }

  function playSimulation() {
    try {
      stopTimelinePlayback();
      const parsed = parseSequenceText(sequenceText);
      const fullRows = buildTimelineRows(parsed, selectedConfig);

      setTimelineRows([]);
      setTimelineDomainRows(fullRows);
      setTimelineError("");

      if (!fullRows.length) {
        return;
      }

      let stepCount = 0;
      const advance = () => {
        stepCount += 1;
        setTimelineRows(fullRows.slice(0, stepCount));

        if (stepCount >= fullRows.length) {
          stopTimelinePlayback();
        }
      };

      setIsTimelinePlaying(true);
      advance();

      if (parsed.length > 1) {
        timelineTimerRef.current = setInterval(() => {
          try {
            advance();
          } catch (err) {
            stopTimelinePlayback();
            setTimelineRows([]);
            setTimelineError(err instanceof Error ? err.message : String(err));
          }
        }, TIMELINE_PLAY_INTERVAL_MS);
      }
    } catch (err) {
      stopTimelinePlayback();
      setTimelineRows([]);
      setTimelineDomainRows([]);
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

      const nextConfig = normalizeViewerReadyConfig(parsed.selectedConfig);
      if (!nextConfig) {
        throw new Error("selectedConfig が評価に必要な shape を満たしていません。");
      }

      setSelectedPreset(parsed.selectedPreset);
      setSelectedConfig(nextConfig);
      setInputText(parsed.inputText);
      setSequenceText(parsed.sequenceText);
      setResult(null);
      setError("");
      resetTimelinePlayback();
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
    setSequenceText: updateSequenceText,
    timelineRows,
    timelineDomainRows,
    timelineError,
    isTimelinePlaying,
    runSimulation,
    playSimulation,
    stopSimulation: stopTimelinePlayback,
    resetSimulation: resetTimelinePlayback,
    saveWorkspace,
    loadWorkspace,
    clearWorkspace,
    exportConfig,
    workspaceStatus
  };
}
