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

## In Progress

- Keep docs aligned with the current repository reality
- Keep canonical config, JS runtime behavior, and C++ runtime behavior in sync
- Keep generated-config workflow and embedded examples aligned with the runtime
  specification

## Next

- Viewer UX and simulation workflow improvements
- Generated-config workflow improvements
  - clearer regeneration path
  - better generated artifact handling
- Richer parity coverage across JS and C++
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
