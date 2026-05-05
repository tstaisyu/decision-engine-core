// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import TimelineChart from "./TimelineChart";

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

      <label htmlFor="timeline-sequence-json">シーケンス JSON（各要素 = 1ステップ）</label>
      <textarea
        id="timeline-sequence-json"
        value={sequenceText}
        onChange={(event) => onSequenceChange(event.target.value)}
        spellCheck={false}
      />
      <div className="button-row">
        <button type="button" onClick={onRunSimulation}>
          Run Simulation
        </button>
        <button type="button" onClick={onPlaySimulation} disabled={isTimelinePlaying}>
          Play
        </button>
        <button type="button" className="secondary" onClick={onStopSimulation} disabled={!isTimelinePlaying}>
          Stop
        </button>
        <button type="button" className="secondary" onClick={onResetSimulation}>
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
            {timelineRows.map((row) => (
              <tr key={`timeline-row-${row.step}`}>
                <td>{row.step}</td>
                <td>{row.elapsedMs}</td>
                <td>{row.value}</td>
                <td>{row.state}</td>
                <td>{row.action}</td>
                <td>{row.appliedRule}</td>
                <td>{row.stateDurationMs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="timeline-chart-section">
        <label>タイムラインチャート（Timeline Chart）</label>
        <TimelineChart rows={timelineRows} domainRows={timelineDomainRows} />
      </div>
    </section>
  );
}

export default TimelineSimulationPanel;
