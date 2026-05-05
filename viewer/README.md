# Viewer (React + Vite)

This is the current viewer UI for the project.
It keeps `src/` as the core package.

## Run

```bash
cd viewer
npm install
npm run dev
```

## Export Config

1. Open the viewer and edit the current preset config, for example a `threshold` value.
2. Click `Export Config` in the header controls.
3. The current edited config is downloaded as `decision-engine-config.json` in canonical config shape with `states[]` and `rules[]`.
4. Legacy compatibility fields are kept only for internal editing compatibility, not as the primary export shape.
5. Replace `examples/node-temp-sim/exported-config.sample.json` with the exported file content.
6. Run `npm run example:node-temp-sim:sample` from the repository root to verify the mock deploy flow.
7. Confirm `state`, `action`, and `pwm` in the output.

## Config Shape

- The viewer now prefers canonical config shape internally: `states[]` and `rules[]`.
- `Export Config` outputs canonical config.
- Legacy `states.rules` and `actions.byState` are kept only as legacy/deprecated compatibility paths.
- Edits made in `DefinitionPanel` are reflected into `states[]` / `rules[]`.
- The simulation engine also prefers canonical shape during evaluation.
- Canonical shape is the formal config shape for new config and export flows.
- New presets, exports, and examples should use canonical shape.
- Legacy shape is still supported for backward compatibility through normalization and viewer-side compatibility handling, but may be removed in the future.
- In practice, compatibility is currently absorbed by viewer-side compatibility handling and shared normalization logic.
- The C++ runtime also follows the canonical shape direction.

## Notes

- Uses local engine files from the parent repository (`../src`).
- Current scope is minimal: preset selector, input JSON editor, evaluate button, and state/action result.
- `viewer/src/lib/browserEngine.js` is a temporary browser-safe ESM copy of minimal core logic to avoid CommonJS `require()` runtime issues in Vite.
