# Changelog

This project keeps a lightweight changelog for release consumers.

Entries focus on:

- supported public API impact
- runtime and topology changes worth calling out to consumers
- generated-config and verification changes
- notable example, documentation, and CI changes

For `v0.x`, versioning is kept intentionally simple:

- patch
  - bug fixes
  - docs/examples/CI improvements
  - internal changes without intended public API impact
- minor
  - supported API behavior changes
  - `evaluate(input, config)` contract changes
  - release consumer-facing workflow changes
- breaking changes
  - are called out explicitly even during `v0.x`

Historical manual releases are backfilled here as a baseline only.
They do not attempt a complete reconstruction of every intermediate change.
The current changelog format is intended to be applied consistently from the
next release onward.

## [v0.3.0]

Repository consolidation release for the current structured runtime and
verification line.

### Public API

- clarified the supported JS public API boundary around the root
  `evaluate(input, config)` entry
- documented supported compatibility expectations for `evaluate(input, config)`
- kept core helpers, `decision-engine-core/core`, public ESM entrypoints, and
  `package.exports`-based subpath imports as future candidates rather than
  supported public API

### Runtime / Internal Topology

- materialized `runtimes/js/core` as the portable JS runtime semantics
  source-of-truth
- clarified the JS runtime layering across:
  - `runtimes/js/core`
  - `src/runtimeCore.js`
  - `src/evaluate.js`
  - `viewer/src/lib/browserEngine.js`
  - `viewer/src/lib/engineAdapter.js`
- documented the current deferred `package.exports` strategy and internal ESM
  entry handling

### Generated Config / Verification

- added canonical/exported config verification through `npm run check:config`
- added generated C++ header consistency verification through
  `npm run check:generated-config`
- added a standard regeneration path with `npm run generate:m5-config`
- strengthened generated-config consume parity and C++ parity fixture coverage

### Examples / Docs / CI

- added representative JS examples for:
  - shortest public API usage (`minimal-evaluate`)
  - JS application-side single-step adapter flow (`node-single-step`)
  - exported config time-series simulation (`node-temp-sim`)
  - embedded/generated-config consume flow (`m5-temp-fan`)
- added the `Verify Runtime` GitHub Actions workflow covering:
  - config validation
  - generated-config consistency
  - JS tests
  - example smoke tests
  - C++ parity verification
- consolidated release checklist, README onboarding, compatibility/support
  notes, changelog, and GitHub Release notes template

### Compatibility Notes

- no intended breaking change to the current supported JS runtime behavior
- this release advances repository structure, verification, onboarding, and
  release-engineering maturity rather than introducing a new supported public
  API surface
- `package.exports` remains intentionally deferred
- breaking changes: none intended for the supported `evaluate(input, config)`
  boundary

## [v0.2.0]

Historical/manual release baseline for the pre-`runtimes/js/core`
separation period.

### Public API

- the JS package entry remained centered on `evaluate(input, config)`

### Runtime / Internal Topology

- C++ runtime parity coverage was expanded against the then-current JS runtime
- state escalation and action escalation support were added to the C++ runtime
- this release predates the current structured JS runtime layering around
  `runtimes/js/core`, `src/runtimeCore.js`, and the later browser/runtime
  boundary work

### Generated Config / Verification

- JS/C++ parity-oriented verification was part of the release line
- canonical config and runtime-spec consolidation were part of the release work

### Examples / Docs / CI

- runtime specification and canonical config documentation were consolidated
- release/checklist reuse was improved for subsequent release cycles

### Compatibility Notes

- historical/manual release entry
- exact release-note scope is not reconstructed beyond the preserved manual
  release notes

## [v0.1.0]

Historical/manual release baseline for the viewer/canonical-config transition
period.

### Public API

- the JS package entry remained centered on `evaluate(input, config)`

### Runtime / Internal Topology

- React viewer authoring/simulation flow was introduced
- canonical `states[]` / `rules[]` config migration was advanced across the
  repository
- the C++ runtime existed as a prototype rather than the later consolidated
  runtime/verification structure
- this release predates the current JS runtime topology and later
  public/internal boundary consolidation

### Generated Config / Verification

- viewer export to Node simulation verification flow was introduced
- JS/C++ comparison vectors and C++ prototype verification were part of the
  release direction

### Examples / Docs / CI

- `node-temp-sim`, viewer export flow, and the embedded-oriented M5 example
  were part of the release line
- runtime integration, runtime spec, and DRS-oriented documentation were added

### Compatibility Notes

- historical/manual release entry
- should not be read as implying the current structured support boundary or
  later `package.exports` decisions

## [v0.0.1]

Historical/manual release baseline.

### Public API

- initial JS decision-engine package baseline
- early `evaluate()` and CLI-oriented usage were introduced

### Runtime / Internal Topology

- repository was still in an early runtime/core stage before viewer/canonical
  migration and later multi-runtime consolidation

### Generated Config / Verification

- config validation, basic tests, and CI scaffolding were present
- generated-config workflow had not yet reached the later baseline

### Examples / Docs / CI

- early repository documentation, package metadata, and CI/setup baseline

### Compatibility Notes

- historical/manual release entry
- should not be read as defining the current support or compatibility baseline
