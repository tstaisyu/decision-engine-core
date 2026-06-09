// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");
const CHANGELOG_PATH = path.join(ROOT_DIR, "CHANGELOG.md");

function isPlainVersion(value) {
  return /^\d+\.\d+\.\d+$/.test(value);
}

function parseTaggedVersion(value) {
  const match = /^v(\d+\.\d+\.\d+)$/.exec(value);
  return match ? match[1] : null;
}

function readPackageVersion(packageJsonPath = PACKAGE_JSON_PATH) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  return packageJson.version;
}

function readLatestChangelogVersion(changelogPath = CHANGELOG_PATH) {
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const match = changelog.match(/^## \[(.+)\]$/m);
  return match ? match[1] : null;
}

function parseArgs(argv) {
  const args = { tag: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--tag") {
      const tag = argv[index + 1];
      if (!tag) {
        throw new Error("--tag requires a value");
      }
      args.tag = tag;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function checkReleaseMetadata(options = {}) {
  const packageVersion = readPackageVersion(options.packageJsonPath);
  const changelogVersion = readLatestChangelogVersion(options.changelogPath);
  const expectedTag = packageVersion ? `v${packageVersion}` : null;
  const providedTag = options.tag || null;
  const errors = [];

  if (!packageVersion) {
    errors.push("package.json version is missing");
  } else if (!isPlainVersion(packageVersion)) {
    errors.push(`package.json version must use X.Y.Z format: ${packageVersion}`);
  }

  if (!changelogVersion) {
    errors.push("latest CHANGELOG.md release entry was not found");
  } else {
    const parsedChangelogVersion = parseTaggedVersion(changelogVersion);
    if (!parsedChangelogVersion) {
      errors.push(`latest CHANGELOG.md release entry must use vX.Y.Z format: ${changelogVersion}`);
    } else if (packageVersion && parsedChangelogVersion !== packageVersion) {
      errors.push(
        `latest CHANGELOG.md release entry does not match package.json version: ${changelogVersion} vs ${packageVersion}`
      );
    }
  }

  if (providedTag) {
    const parsedTagVersion = parseTaggedVersion(providedTag);
    if (!parsedTagVersion) {
      errors.push(`provided tag must use vX.Y.Z format: ${providedTag}`);
    } else if (packageVersion && parsedTagVersion !== packageVersion) {
      errors.push(`provided tag does not match package.json version: ${providedTag} vs ${packageVersion}`);
    }
  }

  return {
    ok: errors.length === 0,
    packageVersion,
    changelogVersion,
    expectedTag,
    providedTag,
    errors
  };
}

function formatResult(result) {
  const lines = [];
  lines.push(result.ok ? "PASS: release metadata preflight succeeded" : "FAIL: release metadata preflight failed");
  lines.push(`package version: ${result.packageVersion || "<missing>"}`);
  lines.push(`changelog version: ${result.changelogVersion || "<missing>"}`);
  lines.push(`expected tag: ${result.expectedTag || "<unknown>"}`);

  if (result.providedTag) {
    lines.push(`provided tag: ${result.providedTag}`);
  }

  for (const error of result.errors) {
    lines.push(`error: ${error}`);
  }

  return lines.join("\n");
}

function main(argv) {
  let args;

  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  }

  const result = checkReleaseMetadata({ tag: args.tag });
  console.log(formatResult(result));

  if (!result.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = {
  CHANGELOG_PATH,
  PACKAGE_JSON_PATH,
  checkReleaseMetadata,
  formatResult,
  isPlainVersion,
  main,
  parseArgs,
  parseTaggedVersion,
  readLatestChangelogVersion,
  readPackageVersion
};
