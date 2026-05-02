# Examples

`viewer.html` is a sample UI for visualizing how `decision-engine-core` works.

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
  "name": "hot",
  "type": "value_gte",
  "threshold": 26
}
```

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
  "name": "hot_hysteresis",
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
