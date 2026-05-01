# decision-engine-core Roadmap

## 現在地

- M5に埋め込まれていた温度制御ロジックを core 側へ移植済み
- state/action の結果は M5 と一致確認済み
- state判定は rules 配列化済み
- M5用設定は preset として分離済み

## Phase 1: Config仕様の固定

目的：
UIや外部連携の前に、状態定義・action定義・昇格条件の設定形式を安定させる。

やること：
- config schema の整理
- rules type の一覧化
- action mapping の仕様化
- escalation の仕様化
- サンプルconfig追加

## Phase 2: Config validation

目的：
壊れたconfigを読み込んでも安全に検出できるようにする。

やること：
- validateConfig(config) の追加
- 必須項目チェック
- 未対応rule typeチェック
- action未定義チェック

## Phase 3: CLI support

目的：
UIなしでもconfigを読み込んで評価できるようにする。

やること：
- configファイルを指定してevaluateするCLI追加
- サンプル入力JSONでstate/actionを確認
- プリセット選択

## Phase 4: Local browser UI

目的：
ブラウザ上でプリセット作成・編集・確認をできるようにする。

やること：
- state rule編集
- threshold / unit設定
- action mapping編集
- duration escalation編集
- sample inputで即時評価

## Phase 5: Embedded integration

目的：
PlatformIO / Arduino IDE / M5Stack側との接続を強化する。

やること：
- configからC/C++定数生成
- M5側ログとの比較
- firmware側との同期方法検討

## 優先順位

まずは UI ではなく config仕様・validator・CLI を優先する。
UIは config仕様が固まってから作る。
