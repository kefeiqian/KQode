import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { BackendClientError, BackendErrorKind } from '@contracts/backend/index.ts';
import { resolvePackagedBackendPaths } from '@backend/packaged/backendCacheDir.ts';

/**
 * The Rust backend binary embedded in the packaged executable.
 *
 * `readBytes` is injected so the materialization logic stays runtime-agnostic:
 * the packaging build supplies a Bun-embedded-file reader, while tests supply a
 * fake. `sha256` is the lowercase hex digest injected at build time
 * (`KQODE_BACKEND_SHA256`) and is the integrity anchor for every spawn.
 */
export type EmbeddedBackendAsset = {
  readBytes(): Promise<Buffer>;
  readonly sha256: string;
};

const USER_ONLY_DIR_MODE = 0o700;
const GROUP_OTHER_MASK = 0o077;

/** Wraps a materialization failure as a fail-closed `launch`-kind backend error. */
function materializationError(message: string, cause?: unknown): BackendClientError {
  return new BackendClientError(
    BackendErrorKind.Launch,
    `packaged backend materialization failed: ${message}`,
    cause === undefined ? undefined : { cause }
  );
}

function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function isErrnoCode(error: unknown, code: string): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === code;
}

type ExistingState = 'missing' | 'reusable' | 'stale';

/**
 * Classifies any binary already present at the cache path without trusting it.
 *
 * A symlink or non-regular file is rejected outright (never followed); loose
 * group/other permissions on Unix are treated as stale so the file is rewritten
 * with tight permissions; otherwise the on-disk SHA-256 decides reuse.
 */
function inspectExisting(binaryPath: string, expectedSha: string, platform: NodeJS.Platform): ExistingState {
  let stats: fs.Stats;
  try {
    stats = fs.lstatSync(binaryPath);
  } catch (error) {
    if (isErrnoCode(error, 'ENOENT')) {
      return 'missing';
    }
    throw materializationError(`could not inspect ${binaryPath}`, error);
  }

  if (stats.isSymbolicLink()) {
    throw materializationError(`refusing to follow a symlink at ${binaryPath}`);
  }
  if (!stats.isFile()) {
    throw materializationError(`cache path is not a regular file: ${binaryPath}`);
  }
  if (platform !== 'win32' && (stats.mode & GROUP_OTHER_MASK) !== 0) {
    return 'stale';
  }
  return sha256Hex(fs.readFileSync(binaryPath)) === expectedSha ? 'reusable' : 'stale';
}

function ensureRuntimeDir(runtimeDir: string, platform: NodeJS.Platform): void {
  fs.mkdirSync(runtimeDir, { recursive: true, mode: USER_ONLY_DIR_MODE });
  if (platform !== 'win32') {
    // mkdir's mode is masked by umask, so tighten explicitly.
    fs.chmodSync(runtimeDir, USER_ONLY_DIR_MODE);
  }
}

/** Replaces `binaryPath` with `tmpPath`, guarding against a swapped-in symlink. */
function replaceAtomically(tmpPath: string, binaryPath: string, platform: NodeJS.Platform): void {
  try {
    const targetStats = fs.lstatSync(binaryPath);
    if (targetStats.isSymbolicLink()) {
      throw materializationError(`refusing to replace a symlink at ${binaryPath}`);
    }
    if (platform === 'win32') {
      // Windows rename cannot overwrite an existing file.
      fs.rmSync(binaryPath, { force: true });
    }
  } catch (error) {
    if (error instanceof BackendClientError) {
      throw error;
    }
    if (!isErrnoCode(error, 'ENOENT')) {
      throw materializationError(`could not prepare ${binaryPath} for replacement`, error);
    }
  }
  fs.renameSync(tmpPath, binaryPath);
}

/** Writes `bytes` to a fresh sibling temp file, then atomically moves it into place. */
function writeBinary(binaryPath: string, runtimeDir: string, bytes: Buffer, platform: NodeJS.Platform): void {
  const tmpPath = path.join(
    runtimeDir,
    `${path.basename(binaryPath)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`
  );

  let fd: number | undefined;
  try {
    // 'wx' creates a new file and fails if one exists, so a planted temp path is never reused.
    fd = fs.openSync(tmpPath, 'wx', USER_ONLY_DIR_MODE);
    fs.writeSync(fd, bytes);
    fs.fsyncSync(fd);
  } catch (error) {
    if (fd !== undefined) {
      fs.closeSync(fd);
    }
    fs.rmSync(tmpPath, { force: true });
    throw materializationError(`could not stage backend binary at ${tmpPath}`, error);
  }
  fs.closeSync(fd);

  try {
    if (platform !== 'win32') {
      fs.chmodSync(tmpPath, USER_ONLY_DIR_MODE);
    }
    replaceAtomically(tmpPath, binaryPath, platform);
  } catch (error) {
    fs.rmSync(tmpPath, { force: true });
    throw error;
  }
}

export type MaterializeBackendOptions = {
  asset: EmbeddedBackendAsset;
  version: string;
  cacheBaseDir?: string;
  platform?: NodeJS.Platform;
};

/** Injectable seams for deterministic tests of the concurrent-write path. */
export type MaterializeBackendDeps = {
  writeBinary?: typeof writeBinary;
};

/**
 * Materializes the embedded backend into the per-user cache and returns its path.
 *
 * The cache is content-addressed (`backends/<version>/<sha256>/`): an
 * already-materialized binary whose SHA-256 matches is reused as-is; otherwise
 * the embedded bytes are written with create-new + atomic-replace semantics and
 * user-only permissions. The asset bytes are integrity-checked against the
 * embedded digest before being written, and the on-disk result is re-verified
 * before the path is returned, so a corrupt asset or a tampered cache fails
 * closed.
 *
 * Concurrency: because the path is keyed by content, a different backend build
 * never targets the same file as a running one. For the narrow case of two
 * instances of the *same* build racing a first-ever write (where the loser's
 * write can fail against the winner's freshly created — and, on Windows, locked
 * — file), the loser falls back to the winner's now-valid binary instead of
 * failing.
 *
 * # Errors
 *
 * Throws a `launch`-kind {@link BackendClientError} when the cache path is a
 * symlink/irregular file, the asset fails its integrity check, or filesystem
 * operations fail without a valid binary being present.
 */
export async function materializePackagedBackend(
  options: MaterializeBackendOptions,
  deps: MaterializeBackendDeps = {}
): Promise<string> {
  const { asset, version, cacheBaseDir, platform = process.platform } = options;
  const write = deps.writeBinary ?? writeBinary;
  const { runtimeDir, binaryPath } = resolvePackagedBackendPaths({
    version,
    sha256: asset.sha256,
    cacheBaseDir,
    platform
  });

  if (inspectExisting(binaryPath, asset.sha256, platform) === 'reusable') {
    return binaryPath;
  }

  const bytes = await asset.readBytes();
  const actualSha = sha256Hex(bytes);
  if (actualSha !== asset.sha256) {
    throw materializationError(
      `embedded asset integrity check failed (expected ${asset.sha256}, got ${actualSha})`
    );
  }

  ensureRuntimeDir(runtimeDir, platform);
  try {
    write(binaryPath, runtimeDir, bytes, platform);
    if (sha256Hex(fs.readFileSync(binaryPath)) !== asset.sha256) {
      throw materializationError('post-write integrity check failed');
    }
    return binaryPath;
  } catch (error) {
    // A concurrent instance of the same build may have materialized (and, on
    // Windows, locked) the identical binary between our inspect and our write —
    // or replaced it in the brief atomic-replace gap our post-write read-back
    // observed. Defer to it when the cache is now valid instead of failing the
    // launch; genuine corruption leaves the cache invalid and still throws.
    if (inspectExisting(binaryPath, asset.sha256, platform) === 'reusable') {
      return binaryPath;
    }
    throw error;
  }
}
