// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

function getAppliedRule(result) {
  return (
    result?.appliedRule ||
    result?.matchedRule ||
    (result?.debug?.baseState ? `baseState: ${result.debug.baseState}` : result?.reason || "-")
  );
}

function renderResultCard(title, result, panelError) {
  const flow = result ? `Input -> ${result.state} -> ${result.action}` : "-";
  const appliedRule = getAppliedRule(result);

  return (
    <div className="result-panel">
      <p className="result-panel-header">{title}</p>
      <div className="result-card">
        <div className="result-grid">
          <div className="result-primary-card">
            <strong>状態（State）</strong>
            <p>{result?.state ?? "-"}</p>
          </div>
          <div className="result-primary-card">
            <strong>アクション（Action）</strong>
            <p>{result?.action ?? "-"}</p>
          </div>
        </div>

        <div>
          <label>適用ルール（Applied Rule）</label>
          <div className="result-detail-card">{appliedRule}</div>
        </div>
        <div>
          <label>フロー（Flow）</label>
          <div className="flow-line">{flow}</div>
        </div>
        <details>
          <summary>判定の詳細（Debug）</summary>
          <div className="result-debug-grid">
            <div className="result-detail-card">
              <strong>基準状態（baseState）</strong>
              <p>{result?.debug?.baseState ?? "-"}</p>
            </div>
            <div className="result-detail-card">
              <strong>元の継続時間（rawStateDurationMs）</strong>
              <p>{result?.debug?.rawStateDurationMs ?? "-"}</p>
            </div>
            <div className="result-detail-card">
              <strong>有効継続時間（effectiveStateDurationMs）</strong>
              <p>{result?.debug?.effectiveStateDurationMs ?? "-"}</p>
            </div>
            <div className="result-detail-card">
              <strong>アクション昇格（actionEscalated）</strong>
              <p>{String(result?.debug?.actionEscalated ?? "-")}</p>
            </div>
          </div>
          <label>判定理由（Reason）</label>
          <div className="result-detail-card">{result?.reason ?? "-"}</div>
        </details>
        <div>
          <label>エラー（Error）</label>
          <div className="result-detail-card">{panelError || "-"}</div>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result, error }) {
  const hasComparison = result?.edited || result?.original;

  return (
    <section className="panel secondary-panel">
      <h2>結果（Result）</h2>
      {!hasComparison ? <p>まだ結果がありません。</p> : null}
      <div className="comparison-grid">
        {renderResultCard("編集後の結果（Edited Result）", result?.edited, result?.errors?.edited || "")}
        {renderResultCard("編集前の結果（Original Result）", result?.original, result?.errors?.original || "")}
      </div>
      {!hasComparison && error ? (
        <div>
          <label>エラー（Error）</label>
          <div className="result-detail-card error">{error}</div>
        </div>
      ) : null}
    </section>
  );
}

export default ResultPanel;
