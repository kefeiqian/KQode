#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { platformPackageName, binaryName, isSupported } = require('../lib/resolve.cjs');

/**
 * Resolves the absolute path to the prebuilt executable for the host platform.
 *
 * The matching `@kqode/cli-<platform>-<arch>` package is installed by npm as an
 * optional dependency (filtered by its `os`/`cpu` fields), so resolution is a
 * plain module lookup — no build, no network. Throws a clear, actionable error
 * when the host is unsupported or its platform package was not installed.
 */
function resolveBinary() {
  const { platform, arch } = process;
  if (!isSupported(platform, arch)) {
    throw new Error(`kqode: no prebuilt executable is published for ${platform}-${arch}.`);
  }

  const pkg = platformPackageName(platform, arch);
  let manifestPath;
  try {
    manifestPath = require.resolve(`${pkg}/package.json`);
  } catch {
    throw new Error(
      `kqode: the platform package ${pkg} is not installed. ` +
        'Reinstall kqode so npm can fetch the matching optional dependency ' +
        '(ensure optional dependencies are not disabled).'
    );
  }

  return path.join(path.dirname(manifestPath), binaryName(platform));
}

function main() {
  let binary;
  try {
    binary = resolveBinary();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  const result = spawnSync(binary, process.argv.slice(2), { stdio: 'inherit' });
  if (result.error) {
    console.error(`kqode: failed to launch ${binary}: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status === null ? 1 : result.status);
}

if (require.main === module) {
  main();
}

module.exports = { resolveBinary };
