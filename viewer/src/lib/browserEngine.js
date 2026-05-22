// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Browser-side runtime wrapper for viewer consumption.
//
// This module keeps browser/viewer-side convenience around the runtime core:
// - resolveConfig
// - normalizeInput
// - resolveCoolingEffectForBrowser
// - deriveAction (wrapper around core action resolution)
// - buildResult
// - evaluate (browser-facing wrapper)
//
// Portable helper semantics are now consumed from the internal ESM/browser-
// consumable core entry under runtimes/js/core while this file remains a thin
// browser wrapper around that portable runtime behavior.
import { deriveActionCore, deriveState, findStateAction } from "../../../runtimes/js/core/index.mjs";
import { normalizeInput } from "./browserInput.js";
import { buildResult } from "./browserResult.js";
import { assertCanonicalEscalationLeaves } from "./browserConfigAssert.js";
import { defaultConfig } from "./viewerPresets.js";

// Portable semantics consume:
// these imports are the browser wrapper's only dependency on the portable
// state/action core and form the main replacement-sensitive area if the
// viewer-local ESM copy is swapped out later.

// Config shaping / canonical assert:
// these helpers keep browser evaluation on the strict canonical-ready path.
// Config boundary convenience:
// lightweight rule copying/filtering for the browser-side runtime path.
function normalizeRule(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return rule;
  }

  return { ...rule };
}

// JS/browser convenience:
// prepare a canonical-ready config for evaluation without supplementing
// missing rules/states/escalation leaves.
function resolveConfig(config) {
  const safeConfig = config || {};
  const stateEntries = Array.isArray(safeConfig.states) ? safeConfig.states.map((state) => ({ ...state })) : [];
  const rules = Array.isArray(safeConfig.rules)
    ? safeConfig.rules.map(normalizeRule).filter((rule) => typeof rule?.state === "string" && rule.state.length > 0)
    : [];
  assertCanonicalEscalationLeaves(safeConfig);

  return {
    ...safeConfig,
    rules,
    stateEntries,
    states: stateEntries
  };
}

// Browser-only fallback:
// these helpers are runtime-adjacent but intentionally remain outside the
// portable core because they depend on browser/JS convenience behavior.
// For now this fallback and the deriveAction wrapper stay together here so the
// browser-side action-resolution flow remains readable in one place. If they
// are extracted later, deriveAction and resolveCoolingEffectForBrowser should
// move together as a paired browser-action helper.
// Portable runtime semantics plus JS convenience:
// action resolution itself is part of the portable runtime contract.
// The coolingEffect -> stateRate fallback is JS/browser convenience and would
// likely remain outside a future minimal extracted core.
function resolveCoolingEffectForBrowser(baseAction, coolingEffect, stateRate, coolingEffectRateThreshold) {
  if (baseAction !== "fan_high" && baseAction !== "fan_low") {
    return false;
  }

  if (typeof coolingEffect === "boolean") {
    return coolingEffect;
  }

  return stateRate < coolingEffectRateThreshold;
}

function deriveAction(normalized, stateContext, config) {
  const { coolingEffect, stateRate } = normalized;
  const { state, effectiveStateDurationMs } = stateContext;
  const { coolingEffectRateThreshold = -0.01 } = config;

  // Portable action resolution:
  // resolve the base action from the chosen state mapping first.
  const baseAction = findStateAction(config.stateEntries, state);

  // JS/browser convenience:
  // portable runtimes prefer explicit coolingEffect input. The browser runtime
  // also falls back to stateRate when coolingEffect is omitted so local
  // simulation can still infer an action-escalation condition.
  const hasCoolingEffectForDecision = resolveCoolingEffectForBrowser(
    baseAction,
    coolingEffect,
    stateRate,
    coolingEffectRateThreshold
  );

  return deriveActionCore(baseAction, effectiveStateDurationMs, hasCoolingEffectForDecision, config);
}

// Wrapper evaluation entrypoint:
// keep the browser-facing evaluation flow grouped here even if helper-level
// extraction happens later.
// Runtime entrypoint:
// evaluate() is the browser-facing runtime wrapper. It currently combines
// portable runtime evaluation with browser-side config/input convenience.
// A future extraction would keep the deterministic state/action core while
// moving config fallback and result enrichment into a thinner wrapper layer.
function evaluate(input, config) {
  const normalized = normalizeInput(input);
  const effectiveConfig = resolveConfig(config ?? defaultConfig);
  const stateContext = deriveState(normalized, effectiveConfig);
  const actionContext = deriveAction(normalized, stateContext, effectiveConfig);

  return buildResult(stateContext, actionContext);
}

export { evaluate };
