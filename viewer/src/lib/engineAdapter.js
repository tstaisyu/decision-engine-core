import { evaluate, presets } from "./browserEngine";

export function getPresets() {
  return presets;
}

export function evaluateWithPreset(input, presetName) {
  const preset = presets[presetName];

  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  return evaluate(input, preset);
}
