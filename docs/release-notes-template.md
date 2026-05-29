# Release Notes Template

Use this template when creating a GitHub Release.

`CHANGELOG.md` is the source of truth for repository-side release history.
GitHub Release notes should be a public-facing summary of the matching
changelog entry rather than a separate source of release facts.

## Summary

- Short release summary
- Main reason this release matters to consumers

## Public API Impact

- Supported API changes
- `evaluate(input, config)` behavior or contract changes
- Explicit note if there is no intended public API impact

## Compatibility Notes

- Breaking changes, if any
- Supported compatibility expectations that changed
- Explicit note if there are no breaking changes

## Generated Config / Verification

- Canonical config validation changes
- Generated artifact or regeneration workflow changes
- Parity / CI verification changes

## Examples / Docs / CI

- New or updated examples
- Onboarding or documentation updates
- CI workflow changes relevant to consumers or contributors

## Upgrade Actions (if any)

- Commands or migration steps release consumers should run
- Explicit note if no upgrade action is required
