# decision-engine-core

`decision-engine-core` は、M5側ファームウェアに埋め込まれていた state/action 判定ロジックを外出しするためのコアです。

現時点では M5 temperature control v1 の判定ロジックを移植しています。

M5 へ action を返す処理はまだ行いません。

`tools/serial-dashboard/server.js` は、M5側 state/action と `decision-engine-core` 出力を比較する検証フェーズ用です。

## 使い方

```js
const { evaluate } = require("./src");

const input = {
  deviceId: "m5-gray-001",
  sensorId: "si7021-001",
  valueType: "temperature",
  value: 25.3,
  previousValue: 25.1,
  tempDelta: 0.2,
  tempRate: 0.2,
  tempRateAvg: 0.03,
  coolingEffect: false,
  maxTemp: 26.0,
  previousState: "normal",
  previousAction: "no_action",
  stateDurationMs: 500,
  timestamp: 1710000000000,
};

const config = {
  criticalThreshold: 40.0,
  hotOnThreshold: 26.0,
  hotOffThreshold: 25.5,
  warmingRateThreshold: 0.02,
  coolingRateThreshold: -0.02,
  hotCriticalDurationMs: 5000,
  fanLowEscalationDurationMs: 1000,
  coolingEffectRateThreshold: -0.01,
};

const result = evaluate(input, config);
console.log(result);
```
