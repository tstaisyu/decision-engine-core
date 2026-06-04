# Release Checklist

## Local Verification

- [ ] `npm run verify:release` が通る
- [ ] `npm run check:config` が通る
- [ ] `npm run check:generated-config` が通る
- [ ] generated artifact が stale の場合、`npm run generate:m5-config` で再生成して再度 `npm run check:generated-config` を通す
- [ ] `npm run lint` が通る
- [ ] `npm run format:check` が通る
- [ ] `npm test` が通る
- [ ] `npm run viewer:test` が通る
- [ ] `npm run viewer:build` が通る
- [ ] `npm run cpp:test-vectors` が通る
- [ ] `node examples/minimal-evaluate.js` が通る
- [ ] `node examples/node-single-step/index.js` が通る
- [ ] `npm run example:node-temp-sim:sample` が通る

## CI Verification

- [ ] `Verify Runtime` workflow が green
  - `npm run check:config`
  - `npm run check:generated-config`
  - `npm test`
  - example smoke tests
  - `npm run cpp:test-vectors`
- [ ] `CI` workflow が green
  - `npm test`
  - `npm run viewer:test`
  - `npm run viewer:build`
  - `npm run lint`
  - `npm run format:check`

## Pre-release Manual Review

- [ ] README の onboarding 導線が最新
- [ ] `examples/README.md` の example 導線が最新
- [ ] `docs/viewer-manual-browser-smoke.md` に沿って viewer manual browser smoke を実施する
- [ ] `CHANGELOG.md` が今回の release 対象差分を反映している
- [ ] `CONFIG_SPEC.md` が最新
- [ ] `docs/runtime-spec.md` が最新
- [ ] `docs/runtime-integration.md` の public/internal boundary note が最新
- [ ] generated/exported config sample が release 対象の実装意図と一致している
- [ ] breaking change の有無を確認する
- [ ] breaking change がある場合、README / docs / release note に明記する

## Release

- [ ] `CHANGELOG.md` を repo 内の継続履歴として更新済みである
- [ ] release 対象 commit で `Verify Runtime` workflow の最新成功を確認する
- [ ] `npm run lint` が通る
- [ ] `npm run format:check` が通る
- [ ] `npm run viewer:test` が通る
- [ ] `npm run viewer:build` が通る
- [ ] `dev` から `main` へマージする
- [ ] リリース対象の version を確認する
- [ ] `git tag vX.Y.Z` を作成する
- [ ] GitHub Release を作成する
- [ ] 必要なら `docs/release-notes-template.md` を元に GitHub Release note を作成する
- [ ] GitHub Release note を配布・公開用 summary として作成する
- [ ] GitHub Release note が `CHANGELOG.md` と整合している

## Post-release

- [ ] GitHub Actions の結果を確認する
- [ ] tag と Release が公開されていることを確認する
- [ ] 必要なら次バージョン向けの作業ブランチを切る
