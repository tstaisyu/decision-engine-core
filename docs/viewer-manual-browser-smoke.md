# Viewer Manual Browser Smoke

## Purpose

Provide a short manual browser-only smoke check for the viewer before a
release.

This smoke is intentionally limited to interaction wiring that is not already
covered by:

- `npm run viewer:test`
- `npm run viewer:build`
- `npm run verify:release`
- root config/runtime/parity verification

## When To Run

Run this smoke:

- before a release candidate is finalized
- before publishing a release that includes viewer changes
- when browser-only viewer behavior was touched, even if helper/integration
  tests still pass

## Preconditions

1. Root release verification already passed:
   - `npm run verify:release`
2. Viewer dependencies are installed:
   - `cd viewer && npm install`
3. Viewer is started locally:
   - `cd viewer && npm run dev`
4. A canonical/exported config JSON file is available.
   - Example source:
     - `examples/node-temp-sim/config/exported-config.sample.json`

## Manual Browser Smoke

### 1. Viewer Startup

1. Open the viewer in a browser.
2. Confirm the main panels render:
   - Definition
   - Input
   - Result
   - Timeline / Simulation
3. Confirm there is no obvious layout break or blank screen.

### 2. Import Config

1. Click `Import Config`.
2. Choose a canonical/exported config JSON file.
3. Confirm the preset display switches to `imported/custom`.
4. Confirm no visible import error is shown.

### 3. Evaluate And Export

1. Run single-step evaluation with the imported config.
2. Confirm a `state` / `action` result appears.
3. Click `Export Config`.
4. Confirm a JSON download is triggered.

### 4. Workspace Save / Load / Clear

1. Click `Save`.
2. Change something visible in the current config or inputs.
3. Click `Load`.
4. Confirm the saved state is restored.
5. Click `Clear`.
6. Confirm the workspace status indicates the saved workspace was cleared.

### 5. Preset Edit And Reset

1. Select a built-in preset.
2. Change at least one rule threshold or action mapping.
3. Confirm the change summary shows the edited item.
4. Click `変更をリセット`.
5. Confirm the edited item returns to the preset baseline.
6. Confirm the change summary returns to `none`.

### 6. Timeline Run And Reset

1. Run `Run Simulation`.
2. Confirm result rows appear in the timeline table.
3. Confirm the timeline chart renders.
4. Click `Reset`.
5. Confirm timeline rows are cleared and the empty-state message returns.

## Expected Results

- Viewer loads normally in the browser.
- Import works and switches the authoring context to `imported/custom`.
- Single-step evaluation and export both work after import.
- Workspace save/load/clear works with visible feedback.
- Built-in preset edits can be reset back to the baseline.
- Timeline simulation produces rows and can be reset cleanly.

## Failure Conditions

Treat the smoke as failed if any of the following occur:

- blank screen or obvious layout break
- `Import Config` does not open a file chooser
- imported config does not switch to `imported/custom`
- evaluate or export stops working after import
- save/load/clear does not restore or clear visible state
- reset does not return edited values to the baseline
- timeline run does not produce rows
- timeline reset does not clear rows
- unexpected browser error messages appear during the smoke

## Estimated Duration

3 to 5 minutes.
