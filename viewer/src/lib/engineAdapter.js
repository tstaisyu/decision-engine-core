import { evaluate, presets } from "./browserEngine";

export function getPresets() {
  return presets;
}

export function evaluateWithPreset(input, presetName, configOverride) {
  const preset = configOverride || presets[presetName];

  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  return evaluate(input, preset);
}
