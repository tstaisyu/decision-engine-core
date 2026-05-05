# Test Vectors

`test-vectors/` is the shared location for reusable comparison inputs and expected outputs.

Current role:

- store small shared vector files used across runtimes where practical
- provide a stable reference for JS/C++ parity checks

## Current Relationship

- `test/minimal-temperature.test.js`
  - reads `test-vectors/minimal-temperature.json` directly
- `test/js-cpp-parity.test.js`
  - mirrors the same named parity cases on the JS side
- `runtimes/cpp/run_test_vectors.cpp`
  - mirrors the same named parity cases on the C++ side

## Why C++ Uses Handwritten Mirrors

The C++ runtime is intentionally small and does not include a JSON parser.

Because of that:

- shared vector intent is documented here
- the actual C++ parity cases are handwritten in `runtimes/cpp/run_test_vectors.cpp`

## Maintenance Policy

When adding a new parity case:

1. define or update the shared vector intent in `test-vectors/`
2. add the same named case to `test/js-cpp-parity.test.js`
3. add the same named case to `runtimes/cpp/run_test_vectors.cpp`

The goal is not automatic loading across runtimes.
The goal is to keep JS and C++ parity cases aligned by name and expected result.
