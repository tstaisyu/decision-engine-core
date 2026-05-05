// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";

const SAMPLE_INPUTS = {
  default: {
    value: 31.5,
    previousValue: 30.8,
    tempRateAvg: 0.7,
    coolingEffect: false,
    previousState: "normal",
    stateDurationMs: 0
  },
  normal: {
    value: 25.0,
    tempDelta: 0,
    tempRate: 0,
    tempRateAvg: 0,
    previousState: "normal",
    stateDurationMs: 500
  },
  simpleWarm: {
    value: 27,
    tempDelta: 0,
    tempRate: 0,
    tempRateAvg: 0,
    previousState: "normal",
    stateDurationMs: 500
  }
};

function InputPanel({ inputText, onInputChange, onEvaluate, error }) {
  const parsed = useMemo(() => {
    try {
      return { value: JSON.parse(inputText), error: "" };
    } catch (err) {
      return { value: null, error: err instanceof Error ? err.message : String(err) };
    }
  }, [inputText]);

  function loadSample(sampleKey) {
    const sample = SAMPLE_INPUTS[sampleKey];
    if (!sample) {
      return;
    }

    onInputChange(JSON.stringify(sample, null, 2));
  }

  function updateInputField(key, rawValue, type = "number") {
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
      return;
    }

    const next = structuredClone(parsed.value);
    if (type === "number") {
      const value = Number(rawValue);
      if (!Number.isFinite(value)) {
        return;
      }
      next[key] = value;
    } else if (type === "boolean") {
      if (rawValue === "") {
        delete next[key];
      } else {
        next[key] = rawValue === "true";
      }
    } else {
      next[key] = rawValue;
    }

    onInputChange(JSON.stringify(next, null, 2));
  }

  const input = parsed.value && typeof parsed.value === "object" && !Array.isArray(parsed.value) ? parsed.value : {};

  return (
    <section className="panel secondary-panel">
      <h2>入力（Input）</h2>
      <div className="input-block">
        <label htmlFor="sample-input">標準入力を読み込む（Sample Input）</label>
        <select id="sample-input" defaultValue="" onChange={(event) => loadSample(event.target.value)}>
          <option value="" disabled>
            サンプルを選択
          </option>
          <option value="default">デフォルト（default）</option>
          <option value="normal">通常温度（input.normal）</option>
          <option value="simpleWarm">やや高温（input.simple-warm）</option>
        </select>
      </div>

      <div className="input-block">
        <h3>入力フォーム（Input Form）</h3>
        <div className="input-form-grid">
          <div className="input-row">
            <span className="input-row-label">温度（value）</span>
            <input
              type="number"
              step="any"
              value={input.value ?? ""}
              onChange={(event) => updateInputField("value", event.target.value)}
            />
          </div>
          <div className="input-row">
            <span className="input-row-label">前回温度（previousValue）</span>
            <input
              type="number"
              step="any"
              value={input.previousValue ?? ""}
              onChange={(event) => updateInputField("previousValue", event.target.value)}
            />
          </div>
          <div className="input-row">
            <span className="input-row-label">温度差（tempDelta）</span>
            <input
              type="number"
              step="any"
              value={input.tempDelta ?? ""}
              onChange={(event) => updateInputField("tempDelta", event.target.value)}
            />
          </div>
          <div className="input-row">
            <span className="input-row-label">温度変化率（tempRate）</span>
            <input
              type="number"
              step="any"
              value={input.tempRate ?? ""}
              onChange={(event) => updateInputField("tempRate", event.target.value)}
            />
          </div>
          <div className="input-row">
            <span className="input-row-label">平均変化率（tempRateAvg）</span>
            <input
              type="number"
              step="any"
              value={input.tempRateAvg ?? ""}
              onChange={(event) => updateInputField("tempRateAvg", event.target.value)}
            />
          </div>
          <div className="input-row">
            <span className="input-row-label">前回状態（previousState）</span>
            <select
              value={input.previousState ?? "normal"}
              onChange={(event) => updateInputField("previousState", event.target.value, "string")}
            >
              <option value="normal">normal</option>
              <option value="warm">warm</option>
              <option value="warming">warming</option>
              <option value="hot">hot</option>
              <option value="cooling">cooling</option>
              <option value="critical">critical</option>
            </select>
          </div>
          <div className="input-row">
            <span className="input-row-label">継続時間 ms（stateDurationMs）</span>
            <input
              type="number"
              step="1"
              value={input.stateDurationMs ?? ""}
              onChange={(event) => updateInputField("stateDurationMs", event.target.value)}
            />
          </div>
          <div className="input-row">
            <span className="input-row-label">冷却効果（coolingEffect）</span>
            <select
              value={input.coolingEffect === true ? "true" : input.coolingEffect === false ? "false" : ""}
              onChange={(event) => updateInputField("coolingEffect", event.target.value, "boolean")}
            >
              <option value="">未指定</option>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
        </div>
      </div>

      <details>
        <summary>JSONを確認する（Developer View）</summary>
        <label htmlFor="input-json">入力 JSON（Input JSON）</label>
        <textarea
          id="input-json"
          value={inputText}
          onChange={(event) => onInputChange(event.target.value)}
          spellCheck={false}
        />
      </details>
      {parsed.error ? <p className="error">入力 JSON エラー: {parsed.error}</p> : null}
      {!parsed.error && error ? <p className="error">評価エラー: {error}</p> : null}
      <button type="button" onClick={onEvaluate}>
        評価する（Evaluate）
      </button>
    </section>
  );
}

export default InputPanel;
