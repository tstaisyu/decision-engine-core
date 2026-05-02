function toEngineInput({
  value,
  previousValue,
  previousState = "normal",
  previousAction = "no_action",
  stateDurationMs = 0,
  timestamp = Date.now()
}) {
  const safeValue = Number(value);
  const safePreviousValue = Number(previousValue);
  const tempDelta =
    Number.isFinite(safeValue) && Number.isFinite(safePreviousValue) ? safeValue - safePreviousValue : 0;

  return {
    value: safeValue,
    previousValue: Number.isFinite(safePreviousValue) ? safePreviousValue : safeValue,
    tempDelta,
    tempRate: tempDelta,
    tempRateAvg: tempDelta,
    previousState,
    previousAction,
    stateDurationMs,
    timestamp
  };
}

module.exports = {
  toEngineInput
};
