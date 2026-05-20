// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

// Thin CommonJS bridge for existing src/ consumers.
//
// The portable runtime core source-of-truth now lives under runtimes/js/core.
// This file remains to preserve current internal import paths while the package
// stays CommonJS and public exports remain unchanged.
module.exports = require("../runtimes/js/core");
