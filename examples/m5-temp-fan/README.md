# M5 Temperature + Fan Adapter Example

このディレクトリは、M5Stack 温度センサー + ファン制御を `decision-engine-core` に接続する際の責任分離を示す実験用ドキュメントです。

## 責任分離

### M5 側の責任

- センサー値を取得する
- `temperature-input-adapter` で engine input を作る
- `evaluate(input, config)` を呼ぶ
- `fan-action-adapter` で action を PWM 等に変換して反映する

### core 側の責任

- 入力（input）から状態（state）とアクション（action）を返す
- ルール判定、継続時間判定、昇格判定を行う

## 重要

- この例は `examples/` の実験用途です
- まだ Arduino / M5 の完全実装は含みません
- `src/` の公式 API には未統合です

## 実行

```bash
npm run example:node-temp-sim
```
