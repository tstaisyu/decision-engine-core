// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Internal ESM/browser-consumable entry for the portable JS runtime core.
//
// This entry intentionally re-exports only the portable semantics helpers so
// CommonJS and ESM consumers can validate the same behavior without expanding
// package exports yet.
import core from "./index.js";

export const { matchRule, findStateAction, deriveState, deriveActionCore } = core;
