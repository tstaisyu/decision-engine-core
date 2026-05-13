// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import TimelineChart from "./TimelineChart";

function getTimelineRowChange(row, previousRow) {
  if (!previousRow) {
    return {
      rowClassName: "timeline-row-initial",
      stateBadge: "initial",
      actionBadge: "initial"
    };
  }

  const stateChanged = row.state !== previousRow.state;
  const actionChanged = row.action !== previousRow.action;

  if (stateChanged && actionChanged) {
    return {
      rowClassName: "timeline-row-decision-changed",
      stateBadge: "state changed",
      actionBadge: "action changed"
    };
  }

  if (stateChanged) {
    return {
      rowClassName: "timeline-row-state-changed",
      stateBadge: "state changed",
      actionBadge: ""
    };
  }

  if (actionChanged) {
    return {
      rowClassName: "timeline-row-action-changed",
      stateBadge: "",
      actionBadge: "action changed"
    };
  }

  return {
    rowClassName: "",
    stateBadge: "",
    actionBadge: ""
  };
}

function formatAppliedRule(rule) {
  if (!rule) {
    return "-";
  }

  if (rule.length <= 28) {
    return rule;
  }

  return `${rule.slice(0, 25)}...`;
}

function TimelineSimulationPanel({
  sequenceText,
  onSequenceChange,
  onRunSimulation,
  onPlaySimulation,
  onStopSimulation,
  onResetSimulation,
  timelineRows,
  timelineDomainRows,
  timelineError,
  isTimelinePlaying
}) {
  return (
    <section className="panel secondary-panel timeline-panel">
      <h2>タイムライン / シミュレーション（Timeline / Simulation）</h2>
      <p className="section-note">JSON 配列で時系列入力を定義し、連続評価結果を確認します。</p>
      <div className="panel-hint-list">
        <span>Multi-step Simulation: 複数ステップを連続評価します。</span>
        <span>Run Simulation = すべてのステップを一括評価</span>
        <span>Play = 評価済み結果を step-by-step で再生</span>
      </div>

      <details className="timeline-editor" open={false}>
        <summary>シーケンス JSON を編集する（Edit Sequence JSON）</summary>
        <label htmlFor="timeline-sequence-json">シーケンス JSON（各要素 = 1ステップ）</label>
        <textarea
          id="timeline-sequence-json"
          value={sequenceText}
          onChange={(event) => onSequenceChange(event.target.value)}
          spellCheck={false}
        />
      </details>
      <div className="button-row timeline-button-row">
        <button type="button" className="button-small timeline-primary-button" onClick={onRunSimulation}>
          Run Simulation
        </button>
        <button
          type="button"
          className="button-small timeline-primary-button"
          onClick={onPlaySimulation}
          disabled={isTimelinePlaying}
        >
          Play
        </button>
        <button
          type="button"
          className="secondary button-small timeline-secondary-button"
          onClick={onStopSimulation}
          disabled={!isTimelinePlaying}
        >
          Stop
        </button>
        <button type="button" className="secondary button-small timeline-secondary-button" onClick={onResetSimulation}>
          Reset
        </button>
      </div>

      {timelineError ? <p className="error">{timelineError}</p> : null}

      <div className="timeline-table-wrap">
        <table className="timeline-table">
          <thead>
            <tr>
              <th>step</th>
              <th>elapsedMs</th>
              <th>value</th>
              <th>state</th>
              <th>action</th>
              <th>matched/applied rule</th>
              <th>stateDurationMs</th>
            </tr>
          </thead>
          <tbody>
            {!timelineRows.length ? (
              <tr>
                <td colSpan={7}>シミュレーション結果はまだありません。</td>
              </tr>
            ) : null}
            {timelineRows.map((row, index) => {
              const previousRow = index > 0 ? timelineRows[index - 1] : null;
              const { rowClassName, stateBadge, actionBadge } = getTimelineRowChange(row, previousRow);

              return (
                <tr key={`timeline-row-${row.step}`} className={rowClassName}>
                  <td>{row.step}</td>
                  <td>{row.elapsedMs}</td>
                  <td>{row.value}</td>
                  <td className="timeline-decision-cell">
                    <span>{row.state}</span>
                    {stateBadge ? <span className="timeline-change-badge">{stateBadge}</span> : null}
                  </td>
                  <td className="timeline-decision-cell">
                    <span>{row.action}</span>
                    {actionBadge ? <span className="timeline-change-badge">{actionBadge}</span> : null}
                  </td>
                  <td className="timeline-rule-cell" title={row.appliedRule || ""}>
                    {formatAppliedRule(row.appliedRule)}
                  </td>
                  <td>{row.stateDurationMs}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="timeline-chart-section">
        <label>タイムラインチャート（Timeline Chart）</label>
        <div className="timeline-chart-legend">
          <span className="timeline-chart-legend-item">
            <span className="timeline-chart-legend-swatch timeline-chart-legend-swatch-value" aria-hidden="true" />
            <span>value line: 入力値の推移</span>
          </span>
          <span className="timeline-chart-legend-item">
            <span className="timeline-chart-legend-swatch timeline-chart-legend-swatch-state" aria-hidden="true" />
            <span>state step: state の変化</span>
          </span>
          <span className="timeline-chart-legend-item">
            <span className="timeline-chart-legend-swatch timeline-chart-legend-swatch-action" aria-hidden="true" />
            <span>action marker: action が変わった step</span>
          </span>
        </div>
        <p className="timeline-chart-note">
          table の state/action change 表示と合わせて読むと、どの step で decision が変わったかを追いやすくなります。
        </p>
        <TimelineChart rows={timelineRows} domainRows={timelineDomainRows} />
      </div>
    </section>
  );
}

export default TimelineSimulationPanel;
