# Vectors

`vectors/` is the shared location for reusable input and expected-output data.

Current role:

- store small shared data files used across runtimes where practical
- provide a stable reference for JS/C++ parity checks
- keep test code and reusable data separate

## Current Relationship

- `test/`
  - contains executable JS tests
- `vectors/`
  - contains shared data files
- `test/minimal-temperature.test.js`
  - reads `vectors/minimal-temperature.json` directly
- `test/js-cpp-parity.test.js`
  - mirrors the same named parity cases on the JS side
- `runtimes/cpp/run_test_vectors.cpp`
  - mirrors the same named parity cases on the C++ side

## Why C++ Uses Handwritten Mirrors

The C++ runtime is intentionally small and does not include a JSON parser.

Because of that:

- shared vector intent is documented here
- the actual C++ parity cases are handwritten in `runtimes/cpp/run_test_vectors.cpp`
- the actual JS parity cases are handwritten in `test/js-cpp-parity.test.js`

## Maintenance Policy

When adding a new parity case:

1. define or update the shared vector intent in `vectors/`
2. add the same named case to `test/js-cpp-parity.test.js`
3. add the same named case to `runtimes/cpp/run_test_vectors.cpp`

The goal is not automatic loading across runtimes.
The goal is to keep JS and C++ parity cases aligned by name and expected result.

Future direction:

- some vectors may later be executed directly from JSON in multiple runtimes
- until then, JS and C++ keep handwritten mirrors of the same named cases
