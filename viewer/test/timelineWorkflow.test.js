// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import test from "node:test";
import assert from "node:assert/strict";
import { normalizeViewerReadyConfig } from "../src/lib/viewerConfigRoundTrip.js";
import { buildTimelineRows, createEmptyTimelineState, parseSequenceText } from "../src/lib/viewerTimelineWorkflow.js";

function buildCanonicalFixture() {
  return {
    states: [
      { name: "normal", action: "no_action" },
      { name: "warm", action: "fan_low" },
      { name: "hot", action: "fan_high" }
    ],
    rules: [
      { type: "value_gte", threshold: 30, state: "hot" },
      { type: "value_gte", threshold: 26, state: "warm" }
    ],
    escalations: {
      action: {
        fanLowToHigh: {
          durationMs: 1000,
          requireNoCoolingEffect: false
        }
      },
      state: {
        hotToCritical: {
          durationMs: 5000
        }
      }
    }
  };
}

test("valid timeline sequence generates rows with state/action progression", () => {
  const config = normalizeViewerReadyConfig(buildCanonicalFixture());
  assert.ok(config);

  const sequence = parseSequenceText(
    JSON.stringify([
      { value: 25.0, elapsedMs: 1000 },
      { value: 27.0, elapsedMs: 1000 },
      { value: 31.0, elapsedMs: 1500 },
      { value: 30.5, elapsedMs: 1000 }
    ])
  );

  const rows = buildTimelineRows(sequence, config);
  assert.equal(rows.length, 4);

  assert.deepEqual(
    rows.map((row) => ({
      step: row.step,
      state: row.state,
      action: row.action
    })),
    [
      { step: 1, state: "normal", action: "no_action" },
      { step: 2, state: "warm", action: "fan_low" },
      { step: 3, state: "hot", action: "fan_high" },
      { step: 4, state: "hot", action: "fan_high" }
    ]
  );

  assert.deepEqual(
    rows.map((row) => ({ elapsedMs: row.elapsedMs, stateDurationMs: row.stateDurationMs })),
    [
      { elapsedMs: 1000, stateDurationMs: 1000 },
      { elapsedMs: 2000, stateDurationMs: 0 },
      { elapsedMs: 3500, stateDurationMs: 0 },
      { elapsedMs: 4500, stateDurationMs: 1000 }
    ]
  );
});

test("invalid non-array sequence JSON is rejected", () => {
  assert.throws(() => parseSequenceText(JSON.stringify({ value: 25 })), /JSON 配列/);
});

test("invalid timeline item shape is rejected", () => {
  const config = normalizeViewerReadyConfig(buildCanonicalFixture());
  assert.ok(config);

  const invalidSequence = [{ elapsedMs: 1000 }];
  assert.throws(() => buildTimelineRows(invalidSequence, config), /value \(number\) は必須/);
});

test("timeline reset contract clears rows, domain rows, and error", () => {
  const clearedState = createEmptyTimelineState();
  assert.deepEqual(clearedState, {
    timelineRows: [],
    timelineDomainRows: [],
    timelineError: ""
  });
});
