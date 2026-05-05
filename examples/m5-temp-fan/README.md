# M5 Temperature + Fan Example

## 目的

この example は、M5Stack / Arduino 環境で `decision-engine` の C++ runtime を使うときの最小構成を整理するための設計入口です。

想定する流れは次のとおりです。

- viewer で config を設計する
- runtime spec に沿って config shape を定義する
- C++ runtime で state / action を評価する
- M5Stack 側で fan control へ接続する

この段階では、まだ実機コードそのものではなく、どの責務をどこに置くかを明確にすることを目的とします。

## 責任分離

### sensor read

- 温度センサー値を読む

### input adapter

- 温度値を `DecisionInput` に変換する

### runtime

- `DecisionEngine.evaluate()` を呼ぶ
- `state` と `action` を決定する

### action adapter

- `action` を PWM 値などの実行可能な device command に変換する

### device output

- `analogWrite` や GPIO 出力などを実行する

## 疑似コード

```cpp
DecisionEngine engine;
DecisionConfig config;

engine.loadConfig(config);

void loop() {
  float temperature = readTemperature();

  DecisionInput input;
  input.value = temperature;
  input.timestamp = millis();

  DecisionResult result = engine.evaluate(input);

  int pwm = mapActionToPwm(result.action);
  analogWrite(FAN_PIN, pwm);
}
```

上の疑似コードでは、処理の責任は次のように分かれます。

- `readTemperature()`: sensor read
- `DecisionInput` 作成: input adapter
- `engine.evaluate(input)`: runtime
- `mapActionToPwm(result.action)`: action adapter
- `analogWrite(...)`: device output

## 最初は JSON 読み込みしない

初期段階では config を C++ 構造体として埋め込みます。

つまり、最初は次を前提にします。

- `DecisionConfig` をコード内で定義する
- viewer export config をそのまま実機で読むことはしない

将来的には、viewer export config を変換または読み込みできるようにする余地を残します。

## まだやらないこと

- Wi-Fi 経由 config 受信
- SD カード読み込み
- JSON parser
- OTA 連携
- 実機完全制御

## 位置づけ

- この example は `examples/` 配下の設計用ドキュメントです
- まだ Arduino / M5 向けの完全実装は含みません
- まずは viewer export config -> runtime spec -> C++ runtime -> M5 出力の接続方針を固定するための入口です
