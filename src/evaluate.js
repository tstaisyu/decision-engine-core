function evaluate(input, config) {
  const {
    value,
    previousValue,
    tempDelta,
    tempRate,
    tempRateAvg,
    coolingEffect,
    maxTemp,
    previousState,
    previousAction,
    stateDurationMs,
    timestamp
  } = input;

  const {
    criticalThreshold = 40.0,
    hotOnThreshold = 26.0,
    hotOffThreshold = 25.5,
    warmingRateThreshold = 0.02,
    coolingRateThreshold = -0.02,
    hotCriticalDurationMs = 5000,
    fanLowEscalationDurationMs = 1000,
    coolingEffectRateThreshold = -0.01
  } = config;

  const effectiveTempDelta =
    typeof tempDelta === "number"
      ? tempDelta
      : typeof value === "number" && typeof previousValue === "number"
        ? value - previousValue
        : 0;
  const effectiveTempRate =
    typeof tempRate === "number" ? tempRate : effectiveTempDelta;
  const stateRate =
    typeof tempRateAvg === "number" ? tempRateAvg : effectiveTempRate;
  const previousStateSafe =
    typeof previousState === "string" ? previousState : "normal";

  let baseState = "normal";

  if (value >= criticalThreshold) {
    baseState = "critical";
  } else if (value >= hotOnThreshold) {
    baseState = "hot";
  } else if (value > hotOffThreshold && previousStateSafe === "hot") {
    baseState = "hot";
  } else if (stateRate > warmingRateThreshold) {
    baseState = "warming";
  } else if (stateRate < coolingRateThreshold) {
    baseState = "cooling";
  }

  const rawStateDurationMs =
    typeof stateDurationMs === "number" ? stateDurationMs : 0;
  const effectiveStateDurationMs =
    baseState === previousStateSafe ? rawStateDurationMs : 0;

  let state = baseState;
  if (
    baseState === "hot" &&
    previousStateSafe === "hot" &&
    effectiveStateDurationMs >= hotCriticalDurationMs
  ) {
    state = "critical";
  }

  let baseAction = "no_action";
  if (state === "critical") {
    baseAction = "alert";
  } else if (state === "hot") {
    baseAction = "fan_high";
  } else if (state === "warming" || state === "cooling") {
    baseAction = "fan_low";
  }
  let action = baseAction;

  const hasCoolingEffectForDecision =
    baseAction === "fan_high" || baseAction === "fan_low"
      ? typeof coolingEffect === "boolean"
        ? coolingEffect
        : stateRate < coolingEffectRateThreshold
      : false;
  let actionEscalated = false;

  if (
    baseAction === "fan_low" &&
    effectiveStateDurationMs >= fanLowEscalationDurationMs &&
    !hasCoolingEffectForDecision
  ) {
    action = "fan_high";
    actionEscalated = true;
  }

  const reason =
    `baseState=${baseState}; previousState=${previousStateSafe}; ` +
    `rawDuration=${rawStateDurationMs}; ` +
    `effectiveDuration=${effectiveStateDurationMs}; ` +
    `actionEscalated=${actionEscalated}`;

  return {
    state,
    action,
    reason,
    debug: {
      baseState,
      rawStateDurationMs,
      effectiveStateDurationMs,
      actionEscalated
    }
  };
}

module.exports = {
  evaluate
};
