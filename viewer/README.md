# Viewer (React + Vite)

This is the first migration step for a richer viewer UI.
It keeps `src/` as the core package and keeps `examples/viewer.html` as-is.

## Run

```bash
cd viewer
npm install
npm run dev
```

## Export Config

1. Open the viewer and edit the current preset config, for example a `threshold` value.
2. Click `Export Config` in the header controls.
3. The current edited config is downloaded as `decision-engine-config.json` in canonical shape (`states[]` + `rules[]`).
4. Replace `examples/node-temp-sim/exported-config.sample.json` with the exported file content.
5. Run `npm run example:node-temp-sim:sample` from the repository root to verify the mock deploy flow.

## Notes

- Uses local engine files from the parent repository (`../src`).
- Current scope is minimal: preset selector, input JSON editor, evaluate button, and state/action result.
- `viewer/src/lib/browserEngine.js` is a temporary browser-safe ESM copy of minimal core logic to avoid CommonJS `require()` runtime issues in Vite.
