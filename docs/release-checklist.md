# Release Checklist

## Pre-release

- [ ] `npm test` が通る
- [ ] `npm run lint` が通る
- [ ] `npm run format:check` が通る
- [ ] `npm run cpp:test-vectors` が通る
- [ ] README が最新
- [ ] `CONFIG_SPEC.md` が最新
- [ ] `docs/runtime-spec.md` が最新
- [ ] breaking change の有無を確認する
- [ ] breaking change がある場合、リリースノートに明記する

## Release

- [ ] `dev` から `main` へマージする
- [ ] リリース対象の version を確認する
- [ ] `git tag vX.Y.Z` を作成する
- [ ] GitHub Release を作成する
- [ ] リリースノートを貼り付ける

## Post-release

- [ ] GitHub Actions の結果を確認する
- [ ] tag と Release が公開されていることを確認する
- [ ] 必要なら次バージョン向けの作業ブランチを切る
