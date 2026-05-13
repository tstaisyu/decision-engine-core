// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Runtime boundary for the viewer:
// this adapter is the viewer-facing entrypoint for runtime evaluation and
// preset access. The UI and simulation hooks should depend on this file rather
// than browserEngine.js directly.
//
// Today it bridges to:
// - browserEngine.js for runtime-like JS evaluation
// - viewerPresets.js for viewer-local preset ownership
//
// If the viewer later switches to an official JS runtime import, this file is
// the intended replacement point.
import { evaluate } from "./browserEngine";
import { presets } from "./viewerPresets";

// Viewer preset access:
// exposes the available starting configs without leaking where they are owned.
export function getPresets() {
  return presets;
}

// Viewer evaluation entrypoint:
// resolve the chosen preset or edited config and run the runtime-like JS
// evaluation path behind the adapter boundary.
export function evaluateWithPreset(input, presetName, configOverride) {
  const preset = configOverride || presets[presetName];

  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  return evaluate(input, preset);
}
