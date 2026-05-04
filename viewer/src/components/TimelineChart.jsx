// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const stateOrder = ["normal", "cooling", "warming", "warm", "hot", "critical"];

function TimelineChart({ rows }) {
  if (!rows || !rows.length) {
    return (
      <div className="timeline-chart-empty">
        <p>チャート表示用のデータがありません。</p>
      </div>
    );
  }

  const chartData = rows.map((row) => ({
    ...row,
    stateIndex: stateOrder.indexOf(row.state)
  }));

  const actionPoints = chartData.filter((row, index) => {
    if (index === 0) {
      return true;
    }
    return row.action !== chartData[index - 1].action;
  });

  return (
    <div className="timeline-chart-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 10, right: 18, bottom: 6, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="step" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="value" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="state"
            orientation="right"
            tick={{ fontSize: 11 }}
            domain={[0, stateOrder.length - 1]}
            ticks={stateOrder.map((_, i) => i)}
            tickFormatter={(index) => stateOrder[index] || ""}
          />
          <Tooltip />
          <Line yAxisId="value" type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot />
          <Line
            yAxisId="state"
            type="stepAfter"
            dataKey="stateIndex"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
          />
          {actionPoints.map((point) => (
            <ReferenceDot
              key={`action-point-${point.step}`}
              yAxisId="value"
              x={point.step}
              y={point.value}
              r={4}
              fill="#ef4444"
              stroke="none"
              label={{ value: point.action, position: "top", fontSize: 10 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TimelineChart;
