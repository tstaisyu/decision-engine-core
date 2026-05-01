# v0.0.1 Release Checklist

## Code

- [ ] `npm test` が通る
- [ ] `npm run lint` が通る
- [ ] `npm run format:check` が通る

## Config / Engine

- [ ] M5 preset の出力が期待通り
- [ ] simple preset の出力が期待通り
- [ ] validator が `valid` を返す

## CLI

- [ ] default preset で evaluate が動く
- [ ] `--preset` 指定で evaluate が動く
- [ ] 不正preset指定時にエラーになる

## Docs

- [ ] README が最新
- [ ] CONFIG_SPEC が最新
- [ ] ROADMAP がある
- [ ] CLI usage が README に記載されている

## Repository

- [ ] LICENSE がある（Apache-2.0）
- [ ] `package.json` に以下がある
  - [ ] `name`
  - [ ] `version`
  - [ ] `description`
  - [ ] `main`
  - [ ] `license`
- [ ] `package-lock.json` がコミットされている

## CI

- [ ] GitHub Actions が通る

## Versioning

- [ ] version が `0.0.1` になっている
- [ ] `git tag v0.0.1` を作成

## Optional（後でOK）

- [ ] `npm publish`
- [ ] README に badge 追加
