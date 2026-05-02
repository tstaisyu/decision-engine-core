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
    evaluateCurrent
  };
}
