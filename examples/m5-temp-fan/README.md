# M5 Temperature + Fan Example

## 目的

この example は、M5Stack / Arduino 環境で `decision-engine` の C++ runtime を使うときの最小構成を整理するための設計入口です。

想定する流れは次のとおりです。

- viewer で config を設計する
- runtime spec に沿って config shape を定義する
- C++ runtime で state / action を評価する
- M5Stack 側で fan control へ接続する

この段階では、まだ実機コードそのものではなく、どの責務をどこに置くかを明確にすることを目的とします。

## 現在の到達点

現在の example では、次の end-to-end flow を M5Stack Gray 上で確認できる状態です。

```text
Si7021 temperature input
  -> DecisionInput adapter
  -> DecisionEngine evaluation
  -> action resolution
  -> PWM output adapter
  -> LED / fan output
```

ここで確認済みなのは PWM LED verification です。
real fan verification はまだ実施していません。

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

## main.cpp の位置づけ

`main.cpp` は、実機接続に向けた Arduino-compatible example です。

現時点では:

- Si7021 から温度を読む
- ESP32 PWM を GPIO へ出力する
- `Serial` 出力で `value / state / action / pwm` を確認する

関数/ヘッダごとの責任は次のとおりです。

- `adapters/temperature_input_adapter.h`: input adapter と runtime state
- `adapters/fan_output_adapter.h`: action adapter と PWM output adapter
- `applyPwm()`: device output の差し替えポイント

実機化するときは、主に次を置き換える想定です。

- PWM 出力先 GPIO と駆動回路
- LED verification から real fan verification への切り替え

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
- real fan verification

## 位置づけ

- この example は `examples/` 配下の representative embedded example です
- M5Stack Gray + Si7021 + PWM LED verification までを対象にしています
- real fan verification はまだ含みません
