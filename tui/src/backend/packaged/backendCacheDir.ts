import os from 'node:os';
import path from 'node:path';

/** Per-user KQode home directory holding local runtime/data state. */
export const KQODE_HOME_DIRNAME = '.kqcode';

/** Subdirectory under the KQode home for materialized runtime binaries. */
export const RUNTIME_DIRNAME = 'runtime';

/** Base name of the materialized packaged backend binary. */
export const PACKAGED_BACKEND_BASENAME = 'kqode-backend';

/** Default per-user cache base, e.g. `~/.kqcode`. */
export function defaultCacheBaseDir(homeDir: string = os.homedir()): string {
  return path.join(homeDir, KQODE_HOME_DIRNAME);
}

/** Platform-correct file name for the materialized backend binary. */
export function packagedBackendBinaryName(platform: NodeJS.Platform = process.platform): string {
  return platform === 'win32' ? `${PACKAGED_BACKEND_BASENAME}.exe` : PACKAGED_BACKEND_BASENAME;
}

export type PackagedBackendPaths = {
  /** Versioned runtime directory, e.g. `~/.kqcode/runtime/0.1.0`. */
  runtimeDir: string;
  /** Absolute path to the materialized backend binary inside `runtimeDir`. */
  binaryPath: string;
};

/**
 * Resolves the versioned per-user paths the packaged backend materializes into.
 *
 * The `version` segment isolates each release so an upgraded executable never
 * reuses a stale sibling's materialized binary.
 */
export function resolvePackagedBackendPaths(options: {
  version: string;
  cacheBaseDir?: string;
  platform?: NodeJS.Platform;
}): PackagedBackendPaths {
  const { version, cacheBaseDir = defaultCacheBaseDir(), platform = process.platform } = options;
  const runtimeDir = path.join(cacheBaseDir, RUNTIME_DIRNAME, version);
  return { runtimeDir, binaryPath: path.join(runtimeDir, packagedBackendBinaryName(platform)) };
}
