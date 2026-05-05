# node-temp-sim

## 目的

`viewer` で編集・exportした config を、実機前の mock deploy として Node.js 上で検証するための example です。

流れ:

`sensor value -> input adapter -> evaluate -> action adapter -> simulated output`

## 実行方法

```bash
node examples/node-temp-sim/index.js
```

```bash
node examples/node-temp-sim/index.js --config examples/node-temp-sim/exported-config.sample.json
```

```bash
node examples/node-temp-sim/index.js --config examples/node-temp-sim/exported-config.sample.json --input examples/node-temp-sim/input-sequence.sample.json
```

## viewerで作ったconfigを試す手順

1. viewer で definition を編集して config JSON を export する
2. export された config は `states[]` / `rules[]` を含む canonical-compatible config である
3. ただし現時点では legacy fields も含む mixed config である
4. export した JSON を `examples/node-temp-sim/exported-config.sample.json` に置き換える
5. 次を実行する

```bash
npm run example:node-temp-sim:sample
```

6. 出力の `state` / `action` / `pwm` を確認する

## 注意

- これは実機 deploy ではなく mock deploy 用の検証です
- 実際の GPIO/PWM 制御はこの example には含みません
