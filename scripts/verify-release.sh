#!/usr/bin/env bash

set -euo pipefail

run_step() {
  local label="$1"
  shift

  echo
  echo "==> ${label}"
  "$@"
}

run_step "Validate canonical and exported config" npm run check:config
run_step "Verify generated C++ config consistency" npm run check:generated-config
run_step "Run lint" npm run lint
run_step "Run format check" npm run format:check
run_step "Run JS test suite" npm test
run_step "Run C++ parity and generated-config tests" npm run cpp:test-vectors
run_step "Run minimal evaluate example" node examples/minimal-evaluate.js
run_step "Run node single-step adapter example" node examples/node-single-step/index.js
run_step "Run node temp simulation sample" npm run example:node-temp-sim:sample

echo
echo "Release verification commands completed successfully."
