// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import { evaluateWithConfig } from "./engineAdapter.js";
import { isViewerCanonicalReadyConfig } from "./viewerConfigRoundTrip.js";

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

export function parseSequenceText(sequenceText) {
  const parsed = JSON.parse(sequenceText);
  if (!Array.isArray(parsed)) {
    throw new Error("シーケンスは JSON 配列で指定してください。");
  }

  return parsed;
}

export function buildTimelineRows(sequence, selectedConfig, limit = sequence.length) {
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

export function createEmptyTimelineState() {
  return {
    timelineRows: [],
    timelineDomainRows: [],
    timelineError: ""
  };
}
