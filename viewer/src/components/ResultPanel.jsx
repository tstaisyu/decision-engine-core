// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

function getAppliedRule(result) {
  return (
    result?.appliedRule ||
    result?.matchedRule ||
    (result?.debug?.baseState ? `baseState: ${result.debug.baseState}` : result?.reason || "-")
  );
}

function isSameDecision(left, right) {
  return left?.state === right?.state && left?.action === right?.action;
}

function buildDiffSummary(edited, original) {
  const editedRule = getAppliedRule(edited);
  const originalRule = getAppliedRule(original);

  return [
    {
      key: "state",
      label:
        edited?.state === original?.state
          ? `State unchanged: ${edited?.state ?? "-"}`
          : `State changed: ${original?.state ?? "-"} -> ${edited?.state ?? "-"}`
    },
    {
      key: "action",
      label:
        edited?.action === original?.action
          ? `Action unchanged: ${edited?.action ?? "-"}`
          : `Action changed: ${original?.action ?? "-"} -> ${edited?.action ?? "-"}`
    },
    {
      key: "rule",
      label:
        editedRule === originalRule ? `Rule unchanged: ${editedRule}` : `Rule changed: ${originalRule} -> ${editedRule}`
    }
  ];
}

function renderResultCard({ title, subtitle, result, panelError, primary = false, quiet = false }) {
  const flow = result ? `Input -> ${result.state} -> ${result.action}` : "-";
  const appliedRule = getAppliedRule(result);
  const panelClassName = ["result-panel", primary ? "result-panel-primary" : "", quiet ? "result-panel-quiet" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={panelClassName}>
      <p className="result-panel-header">{title}</p>
      {subtitle ? <p className="result-panel-subtitle">{subtitle}</p> : null}
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
  const sameDecision = isSameDecision(result?.edited, result?.original);
  const diffSummary = hasComparison ? buildDiffSummary(result?.edited, result?.original) : [];

  return (
    <section className="panel secondary-panel">
      <h2>結果（Result）</h2>
      <p className="section-note">
        編集後の結果は現在の設定、編集前の結果は元のプリセット基準です。変更の影響をここで比較します。
      </p>
      {hasComparison ? (
        <div className="result-diff-summary">
          <p className="result-diff-summary-title">変更の影響（Decision Diff）</p>
          <div className="result-diff-list">
            {diffSummary.map((item) => {
              const changed = item.label.includes("changed:");

              return (
                <div
                  key={item.key}
                  className={["result-diff-item", changed ? "result-diff-item-changed" : "result-diff-item-same"]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="result-diff-badge">{changed ? "Changed" : "Same"}</span>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {!hasComparison ? <p>まだ結果がありません。</p> : null}
      <div className="comparison-grid">
        {renderResultCard({
          title: "編集後の結果（Edited Result）",
          subtitle: "現在の設定に対する最終 decision result です。",
          result: result?.edited,
          panelError: result?.errors?.edited || "",
          primary: true
        })}
        {renderResultCard({
          title: "編集前の結果（Original Result）",
          subtitle: sameDecision
            ? "Baseline comparison: 現在の設定と同じ結果です。"
            : "Baseline comparison: 元のプリセット基準の結果です。",
          result: result?.original,
          panelError: result?.errors?.original || "",
          quiet: sameDecision
        })}
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
