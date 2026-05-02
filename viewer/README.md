# Viewer (React + Vite)

This is the first migration step for a richer viewer UI.
It keeps `src/` as the core package and keeps `examples/viewer.html` as-is.

## Run

```bash
cd viewer
npm install
npm run dev
```

## Notes

- Uses local engine files from the parent repository (`../src`).
- Current scope is minimal: preset selector, input JSON editor, evaluate button, and state/action result.
- `viewer/src/lib/browserEngine.js` is a temporary browser-safe ESM copy of minimal core logic to avoid CommonJS `require()` runtime issues in Vite.
