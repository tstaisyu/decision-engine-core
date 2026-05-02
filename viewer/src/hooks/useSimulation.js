import { useMemo, useState } from "react";
import { evaluateWithPreset, getPresets } from "../lib/engineAdapter";

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

export function useSimulation() {
  const presets = useMemo(() => getPresets(), []);
  const presetNames = Object.keys(presets);
  const [selectedPreset, setSelectedPreset] = useState(presetNames[0] || "");
  const [selectedConfig, setSelectedConfig] = useState(() => {
    const firstPresetName = presetNames[0];
    return firstPresetName ? structuredClone(presets[firstPresetName]) : null;
  });
  const [inputText, setInputText] = useState(JSON.stringify(defaultInput, null, 2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [sequenceText, setSequenceText] = useState(JSON.stringify(defaultSequence, null, 2));
  const [timelineRows, setTimelineRows] = useState([]);
  const [timelineError, setTimelineError] = useState("");
  const baseSelectedConfig = selectedPreset ? presets[selectedPreset] : null;

  function changePreset(presetName) {
    setSelectedPreset(presetName);
    setSelectedConfig(structuredClone(presets[presetName]));
  }

  function updateSelectedConfig(nextConfig) {
    setSelectedConfig(nextConfig);
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
    runSimulation
  };
}
