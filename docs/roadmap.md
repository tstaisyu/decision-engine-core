# decision-engine-core Roadmap

This roadmap tracks the repository as a canonical-config-centered multi-runtime
toolchain.

It focuses on repository and package evolution rather than personal task
tracking.

## Done

- Canonical config shape is fixed around:
  - `states[]`
  - `rules[]`
  - `escalations`
- Config validation is implemented in the JS runtime
- JS CLI support is implemented for local evaluation and verification
- React viewer is implemented for config authoring and local simulation
- Canonical config export from the viewer is implemented
- C++ config generation from canonical JSON is implemented
- Embedded-oriented C++ runtime is implemented
- JS/C++ parity coverage exists through shared vectors and mirrored test cases
- Generated-config smoke testing exists for the C++ runtime
- A representative embedded integration example exists under `examples/m5-temp-fan/`
- Runtime / adapter / orchestration boundaries are documented
- `runtimes/js/core` is materialized as the portable JS runtime semantics source-of-truth
- Viewer runtime consumption is now routed through the internal ESM core entry via `browserEngine.js`
- Runtime public/internal boundaries, parity boundaries, and consume topology are documented

## In Progress

- Keep docs aligned with the current repository reality
- Keep canonical config, JS runtime behavior, and C++ runtime behavior in sync
- Keep generated-config workflow and embedded examples aligned with the runtime
  specification

## Current Milestone Focus (M6)

- Core evaluate topology / public runtime entry decision
  - confirm runtime responsibility mapping across portable core, convenience runtime, and browser wrapper
  - decide whether a dedicated `evaluateCore` entry is necessary or current helper composition is sufficient
  - define the boundary between portable core, convenience runtime, and browser-only logic
  - decide how helper/core-level parity should relate to JS/C++ topology
  - confirm the future public runtime shape for main/default runtime entry vs core subpath entry
  - review browser/runtime convergence and the long-term role of `browserEngine.js`
  - review package exports readiness without freezing transitional bridges too early
  - define stabilization / exit criteria for bridge removal and parity-maintenance cleanup

M6 completion note:

- M6 is treated as complete at the topology/contract decision level
- public main runtime: `evaluate`
- internal portable core: `runtimes/js/core`
- internal browser wrapper: `viewer/src/lib/browserEngine.js`
- `evaluateCore` remains an unimplemented candidate
- core helpers remain internal future public candidates
- `decision-engine-core/core` remains a future candidate and is not added to
  exports at this stage
- `package.exports` remains intentionally unchanged

M7 completion note:

- M7 is treated as complete as a supported-API / package-exports preparation phase
- the current public boundary remains evaluate-only
- `decision-engine-core/core` is not exported at this stage
- core helpers remain semantics-stable but externally immature
- core helpers therefore remain internal future public candidates
- `package.exports` remains intentionally unchanged
- future work before any core subpath promotion includes:
  - helper-level API docs
  - normalized input contract
  - canonical-ready config preconditions
  - compatibility policy
  - direct helper usage examples

## Next Milestone Focus (M8)

- Public API Stabilization / Export Trigger Conditions
  - completed as a trigger-condition review milestone rather than an export
    implementation milestone
  - `package.exports` remains intentionally unimplemented at this stage
  - the current public boundary remains the CommonJS root/default `evaluate`
    entry
  - the future export shape remains:
    - default/root runtime
    - optional future core subpath
  - `decision-engine-core/core` and public ESM support both remain deferred
  - internal entries remain in place for now:
    - `runtimes/js/core/index.mjs`
    - `src/runtimeCore.js`
    - `viewer/src/lib/browserRuntimeCore.js`
  - future export work still depends on:
    - final export shape confirmation
    - CommonJS/ESM strategy
    - internal ESM entry strategy
    - bridge exit criteria
    - parity-maintenance exit criteria

## Next

- Viewer UX and simulation workflow improvements
- Generated-config workflow improvements
  - M9-1 progress:
    - `check:generated-config` now verifies consistency between
      `fan_config.sample.json` and committed `generated_fan_config.h`
    - `check:config` now validates both the default preset config and
      `exported-config.sample.json`
    - generated C++ header consistency and exported JSON canonical validity now
      have a CI-friendly verification path
  - M9-2 progress:
    - `generate:m5-config` now provides the standard regeneration path for
      `generated_fan_config.h`
    - `check:generated-config` now points to `generate:m5-config` first when
      regeneration is needed
    - direct `generate-cpp-config.js` usage remains available as a fallback
  - clearer regeneration path
  - better generated artifact handling
- Richer parity coverage across JS and C++
  - M9-3 progress:
    - added generated-config consume parity coverage on the JS side for
      `generated_config.normal`, `generated_config.warm`, and
      `generated_config.hot`
    - parity remains focused on `state` / `action`, while
      `reason` / `debug` stay out of scope
    - fixed C++ parity fixture construction bugs in `run_test_vectors.cpp`
      for `customActionConfig` and `unsupportedRuleConfig`
    - these were parity fixture fixes rather than runtime semantics changes
- Additional representative examples using the same adapter pattern
- More explicit generated-config verification in local and CI-friendly flows

## Future

- Additional rule types, if they improve the portable runtime model
- Additional runtime targets beyond the current JS and C++ implementations
- More target-specific generators built on top of canonical config
- Deeper simulation / replay / diff workflows around canonical config
- Broader embedded integration examples beyond the current M5 temperature fan
  path

## v0.x Structure Cleanup Candidate

The current `src/` layout remains natural because it is still the npm package's
primary JS runtime implementation.

However, the repository now includes:

- authoring
- canonical config export
- C++ config generation
- multiple runtime implementations
- parity verification
- representative embedded integration

Because of that, a future layout such as:

- `runtimes/js/`
- `runtimes/cpp/`

may become more natural than the current `src/` + `runtimes/cpp/` split.

This is only a v0.x structure cleanup candidate.
It should not be treated as an immediate refactor.

If it is revisited later, the following impact areas must be checked:

- package entrypoint
- internal imports
- tests
- viewer integration
- examples
- scripts and generator paths

For now, the current repository structure remains valid and should be kept
stable unless there is a clear maintenance benefit.
