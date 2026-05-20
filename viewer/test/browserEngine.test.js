// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import test from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "../src/lib/browserEngine.js";

test("evaluate preserves canonical-ready rules and states behavior", () => {
  const config = {
    states: [
      { name: "normal", action: "no_action" },
      { name: "warm", action: "fan_mid" },
      { name: "hot", action: "fan_max" }
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

  const result = evaluate(
    {
      value: 26.5,
      previousValue: 26.5,
      previousState: "normal",
      stateDurationMs: 0
    },
    config
  );

  assert.equal(result.state, "warm");
  assert.equal(result.action, "fan_mid");
});

test("evaluate applies canonical state escalation leaves", () => {
  const stateEscalationConfig = {
    states: [
      { name: "normal", action: "no_action" },
      { name: "hot", action: "fan_high" },
      { name: "critical", action: "alert" }
    ],
    rules: [{ type: "value_gte", threshold: 30, state: "hot" }],
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

  const stateEscalated = evaluate(
    {
      value: 31,
      previousValue: 31,
      previousState: "hot",
      stateDurationMs: 6000
    },
    stateEscalationConfig
  );

  assert.equal(stateEscalated.state, "critical");
  assert.equal(stateEscalated.action, "alert");
});

test("evaluate applies canonical action escalation leaves", () => {
  const actionEscalationConfig = {
    states: [
      { name: "normal", action: "no_action" },
      { name: "warming", action: "fan_low" }
    ],
    rules: [{ type: "rate_gt", threshold: 0.02, state: "warming" }],
    escalations: {
      action: {
        fanLowToHigh: {
          durationMs: 1000,
          requireNoCoolingEffect: true
        }
      },
      state: {
        hotToCritical: {
          durationMs: 5000
        }
      }
    }
  };

  const actionEscalated = evaluate(
    {
      value: 26.5,
      previousValue: 26.3,
      tempRateAvg: 0.03,
      previousState: "warming",
      stateDurationMs: 1500,
      coolingEffect: false
    },
    actionEscalationConfig
  );

  assert.equal(actionEscalated.state, "warming");
  assert.equal(actionEscalated.action, "fan_high");
  assert.equal(actionEscalated.debug.actionEscalated, true);
});

test("evaluate does not supplement missing escalation leaves on the strict canonical-ready path", () => {
  const missingLeafConfig = {
    states: [
      { name: "normal", action: "no_action" },
      { name: "warming", action: "fan_low" }
    ],
    rules: [{ type: "rate_gt", threshold: 0.02, state: "warming" }],
    escalations: {
      action: {
        fanLowToHigh: {}
      },
      state: {
        hotToCritical: {
          durationMs: 5000
        }
      }
    }
  };

  assert.throws(
    () =>
      evaluate(
        {
          value: 26.5,
          previousValue: 26.3,
          tempRateAvg: 0.03,
          previousState: "warming",
          stateDurationMs: 1500,
          coolingEffect: false
        },
        missingLeafConfig
      ),
    /durationMs|requireNoCoolingEffect/
  );
});
