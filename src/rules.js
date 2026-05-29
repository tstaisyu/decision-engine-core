// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Shared rule contract / registry definitions used by canonical config
// validation and other rule-type-aware tooling.

const SUPPORTED_RULE_TYPES = new Set(["value_gte", "hysteresis", "rate_gt", "rate_lt"]);

module.exports = {
  SUPPORTED_RULE_TYPES
};
