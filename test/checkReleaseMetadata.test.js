// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  checkReleaseMetadata,
  formatResult,
  parseArgs
} = require("../scripts/check-release-metadata");

function withTempReleaseMetadata(packageVersion, changelogVersion, fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "release-metadata-"));
  const packageJsonPath = path.join(tempDir, "package.json");
  const changelogPath = path.join(tempDir, "CHANGELOG.md");

  fs.writeFileSync(packageJsonPath, JSON.stringify({ version: packageVersion }, null, 2));
  fs.writeFileSync(changelogPath, `# Changelog\n\n## [${changelogVersion}]\n\n### Public API\n\n- test\n`);

  try {
    return fn({ packageJsonPath, changelogPath });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test("release metadata check passes when package and changelog versions match", () => {
  withTempReleaseMetadata("1.2.3", "v1.2.3", ({ packageJsonPath, changelogPath }) => {
    const result = checkReleaseMetadata({ packageJsonPath, changelogPath });
    assert.equal(result.ok, true);
    assert.equal(result.expectedTag, "v1.2.3");
    assert.deepEqual(result.errors, []);
  });
});

test("release metadata check fails when package and changelog versions differ", () => {
  withTempReleaseMetadata("1.2.3", "v1.2.4", ({ packageJsonPath, changelogPath }) => {
    const result = checkReleaseMetadata({ packageJsonPath, changelogPath });
    assert.equal(result.ok, false);
    assert.match(result.errors[0], /does not match package\.json version/);
  });
});

test("release metadata check validates an optional tag", () => {
  withTempReleaseMetadata("1.2.3", "v1.2.3", ({ packageJsonPath, changelogPath }) => {
    const result = checkReleaseMetadata({ packageJsonPath, changelogPath, tag: "v1.2.4" });
    assert.equal(result.ok, false);
    assert.match(result.errors[0], /provided tag does not match package\.json version/);
  });
});

test("release metadata check rejects malformed versions", () => {
  withTempReleaseMetadata("1.2", "release-1.2.3", ({ packageJsonPath, changelogPath }) => {
    const result = checkReleaseMetadata({ packageJsonPath, changelogPath, tag: "1.2.3" });
    assert.equal(result.ok, false);
    assert.equal(result.errors.length, 3);
    assert.match(result.errors[0], /package\.json version must use X\.Y\.Z format/);
    assert.match(result.errors[1], /latest CHANGELOG\.md release entry must use vX\.Y\.Z format/);
    assert.match(result.errors[2], /provided tag must use vX\.Y\.Z format/);
  });
});

test("parseArgs accepts an optional tag", () => {
  assert.deepEqual(parseArgs(["--tag", "v1.2.3"]), { tag: "v1.2.3" });
});

test("formatResult renders a human-readable failure summary", () => {
  const output = formatResult({
    ok: false,
    packageVersion: "1.2.3",
    changelogVersion: "v1.2.4",
    expectedTag: "v1.2.3",
    providedTag: "v1.2.4",
    errors: ["latest CHANGELOG.md release entry does not match package.json version: v1.2.4 vs 1.2.3"]
  });

  assert.match(output, /^FAIL: release metadata preflight failed/m);
  assert.match(output, /package version: 1.2.3/);
  assert.match(output, /changelog version: v1.2.4/);
  assert.match(output, /provided tag: v1.2.4/);
  assert.match(output, /error: latest CHANGELOG\.md release entry does not match package\.json version/);
});
