'use strict';

// Pure platform-resolution helpers shared by the `kqode` selector bin and its
// tests. No I/O so the mapping stays trivially testable.

/** npm scope that owns the per-platform executable packages. */
const SCOPE = '@kqode';

/** Package-name segment identifying the platform executable packages. */
const CLI_SEGMENT = 'cli';

/**
 * Supported `${process.platform}-${process.arch}` targets.
 *
 * Each entry corresponds to a published `@kqode/cli-<target>` package carrying
 * the prebuilt standalone executable for that platform.
 */
const SUPPORTED_TARGETS = [
  'darwin-arm64',
  'darwin-x64',
  'linux-arm64',
  'linux-x64',
  'win32-arm64',
  'win32-x64'
];

/** Target key for a platform/arch pair, e.g. `win32-x64`. */
function platformKey(platform, arch) {
  return `${platform}-${arch}`;
}

/** Platform package name for a target, e.g. `@kqode/cli-win32-x64`. */
function platformPackageName(platform, arch) {
  return `${SCOPE}/${CLI_SEGMENT}-${platformKey(platform, arch)}`;
}

/** Executable file name shipped inside a platform package. */
function binaryName(platform) {
  return platform === 'win32' ? 'kqode.exe' : 'kqode';
}

/** Whether a platform/arch pair has a published platform package. */
function isSupported(platform, arch) {
  return SUPPORTED_TARGETS.includes(platformKey(platform, arch));
}

module.exports = {
  SCOPE,
  CLI_SEGMENT,
  SUPPORTED_TARGETS,
  platformKey,
  platformPackageName,
  binaryName,
  isSupported
};
