'use strict';

// Pure, I/O-free helpers shared by the launcher (`bin/kqode.cjs`) and the binary
// installer (`lib/install.cjs`). No network and no fs so the mapping stays
// trivially testable.

/** GitHub repository that hosts the release archives the CLI downloads. */
const REPO = 'kefeiqian/kqode-cli';

/**
 * Supported `${process.platform}-${process.arch}` targets.
 *
 * Each entry has a matching `kqode-<os>-<arch>` release archive published by the
 * GitHub Release pipeline (`.github/workflows/release.yml`).
 */
const SUPPORTED_TARGETS = [
  'darwin-arm64',
  'darwin-x64',
  'linux-arm64',
  'linux-x64',
  'win32-arm64',
  'win32-x64'
];

/** Maps Node's `process.platform` to the release-archive OS segment. */
const RELEASE_OS = { darwin: 'darwin', linux: 'linux', win32: 'windows' };

/** Target key for a platform/arch pair, e.g. `win32-x64`. */
function platformKey(platform, arch) {
  return `${platform}-${arch}`;
}

/** Whether a platform/arch pair has a published release archive. */
function isSupported(platform, arch) {
  return SUPPORTED_TARGETS.includes(platformKey(platform, arch));
}

/** Executable file name for a platform, e.g. `kqode.exe` on Windows. */
function binaryName(platform) {
  return platform === 'win32' ? 'kqode.exe' : 'kqode';
}

/** Release asset base name (no extension), e.g. `kqode-windows-x64`. */
function releaseTargetName(platform, arch) {
  return `kqode-${RELEASE_OS[platform]}-${arch}`;
}

/** Release archive extension for a platform: `zip` on Windows, else `tar.gz`. */
function archiveExt(platform) {
  return platform === 'win32' ? 'zip' : 'tar.gz';
}

/** Base URL of the GitHub Release assets for a version (no trailing slash). */
function releaseBaseUrl(version) {
  return `https://github.com/${REPO}/releases/download/v${version}`;
}

module.exports = {
  REPO,
  SUPPORTED_TARGETS,
  RELEASE_OS,
  platformKey,
  isSupported,
  binaryName,
  releaseTargetName,
  archiveExt,
  releaseBaseUrl
};
