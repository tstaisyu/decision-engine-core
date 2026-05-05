# Examples

## Adapter Examples (M5 Temperature + Fan)

実運用連携を想定した実験用サンプルを追加しています。

- Node シミュレーション実行:
  - `npm run example:node-temp-sim`
- アダプター:
  - `examples/adapters/temperature-input-adapter.js`
  - `examples/adapters/fan-action-adapter.js`
- M5 連携メモ:
  - `examples/m5-temp-fan/README.md`
  - `examples/m5-temp-fan/flow.md`

- It is intended to help you inspect the flow of `Input -> Definition -> Result`.
- It is not designed for production use.
- In the future, it may evolve into a separate product such as a config editor or dedicated UI.

## Rules（状態判定ルール）

### 概要

Rules は「どの条件で、どの状態にするか」を定義します。

エンジンは、ルールを上から順に評価し、最初に一致した状態を採用します。

### 基本構造

1つのルールは以下の意味を持ちます。

> この条件に一致したら、この状態にする

### 例

```json
{
  "type": "value_gte",
  "threshold": 26,
  "state": "hot"
}
```

`rule.state` は canonical rules で必須です。

意味:

- `value`（現在値）が `26` 以上なら
- `state = "hot"`

### 評価順（priority）

ルールは順番が重要です。

1. `critical (>= 40)`
2. `hot (>= 26)`

この場合:

- `40` 以上なら `critical`
- それ以外で `26` 以上なら `hot`

上のルールが優先されます。

### type（条件の種類）

`type` は「どの値をどう比較するか」を表します。

| type | 意味 |
| --- | --- |
| `value_gte` | `value >= threshold` |
| `rate_gt` | `rate > threshold` |
| `rate_lt` | `rate < threshold` |
| `hysteresis` | 状態維持 |

### hysteresis（ヒステリシス）

状態のバタつきを防ぐための仕組みです。

```json
{
  "type": "hysteresis",
  "state": "hot",
  "offThreshold": 25.5
}
```

意味:

- すでに `hot` のとき
- `25.5` を下回るまで `hot` を維持

### 重要なポイント

- ルールは「状態の一覧」ではなく「状態になる条件」
- 上から順に評価される
- 最初に一致したものだけが採用される

## Actions（アクション）

### 概要

Actions は、状態（state）が決まった後に実行する内容を定義します。

エンジンは以下の流れで動作します。

```text
入力（Input） -> 状態（State） -> アクション（Action）
```

### 基本構造

Actions は「状態 -> 実行内容」の対応関係です。

```json
{
  "hot": "fan_high",
  "warming": "fan_low",
  "normal": "no_action"
}
```

### 例

| state | action |
| --- | --- |
| `hot` | `fan_high` |
| `warming` | `fan_low` |
| `normal` | `no_action` |

意味:

- 状態が `hot` のとき -> `fan_high` を実行
- 状態が `warming` のとき -> `fan_low` を実行

### 重要なポイント

- `rules` は「状態を決める」
- `actions` は「何をするかを決める」

判定と実行を分離しています。

### 補足

`action` の内容は自由に定義できます。

例:

- ファン制御（`fan_high` / `fan_low`）
- アラート通知（`alert`）
- 何もしない（`no_action`）

将来的には、これらが実際のデバイス制御や外部処理に接続されます。

## Escalations（継続時間による昇格）

### 概要

Escalations は、同じ状態（state）が一定時間続いた場合の挙動を定義します。

エンジンの基本フロー:

```text
入力 -> 状態判定（Rules） -> 継続時間（Duration） -> 昇格（Escalation） -> アクション（Action）
```

### なぜ必要か

一時的な変化ではなく、継続した状態に対して異なる対応をするためです。

例:

- 一瞬の高温 -> 無視
- 高温が続く -> 危険（critical）

### 状態の昇格（State Escalation）

```json
{
  "name": "hotToCritical",
  "durationMs": 5000
}
```

意味:

- `hot` 状態が `5` 秒続いた場合
- `critical` に昇格する

状態が時間によって変化します。

### アクションの昇格（Action Escalation）

```json
{
  "name": "fanLowToHigh",
  "durationMs": 1000,
  "requireNoCoolingEffect": false
}
```

意味:

- 同じアクションが `1` 秒続いた場合
- より強いアクションに切り替える

出力（制御）を段階的に強めます。

### durationMs

継続時間（ミリ秒）です。

例:

- `1000` -> `1` 秒
- `5000` -> `5` 秒

### requireNoCoolingEffect

オプションです。

冷却効果がない場合のみ昇格させるかどうかを表します。

例:

- `true` -> 冷却が効いていない場合のみ昇格
- `false` -> 常に昇格対象

### 重要なポイント

- `Rules` は「瞬間の状態」を決める
- `Escalations` は「時間による変化」を扱う

状態 + 時間 = 実際の制御、という考え方です。

### 補足

Escalations は必須ではありませんが、以下のために重要な機能です。

- ノイズ耐性
- 誤検知防止
- 段階的制御

## Result（結果）

### 概要

Result は、入力と定義に基づいてエンジンが最終的に決定した出力です。

エンジンは以下の流れで処理を行います。

```text
入力（Input） -> 状態判定（Rules） -> 継続時間（Escalations） -> アクション（Actions） -> 結果（Result）
```

### 表示内容

Result には以下が表示されます。

- 最終状態（`state`）
- 実行アクション（`action`）

例:

- 状態: `hot`
- アクション: `fan_high`

### 意味

- `state`: 現在のシステム状態
- `action`: その状態に対して実行される処理

これがエンジンの最終アウトプットです。

### 適用されたルール

結果には、どのルールが適用されたかも表示されます。

例:

- 適用ルール: `hot（value ≥ 26）`

判定の根拠を確認できます。

### 判定の詳細（Debug）

詳細な判定プロセスは Debug として確認できます。

例:

- 評価されたルール
- 継続時間の計算
- 状態遷移の過程

Debug は通常は非表示で、必要な場合のみ確認します。

### 使い方

1. 入力を設定する
2. 定義を選択する
3. Evaluate を実行する
4. Result を確認する

### 重要なポイント

- Result は「最終結果」のみをシンプルに表示する
- 判定のロジックは Rules / Escalations に分離されている

判断と出力が明確に分かれている構造です。
