import { spawnBackend, type LaunchedBackend } from '@backend/process/backendProcess.ts';
import {
  materializePackagedBackend,
  type EmbeddedBackendAsset
} from '@backend/packaged/materializeBackend.ts';

export type LaunchPackagedBackendOptions = {
  /** Embedded Rust backend asset plus its build-time integrity digest. */
  asset: EmbeddedBackendAsset;
  /** Product version selecting the versioned cache directory. */
  version: string;
  /** Workspace directory the backend process runs in. */
  workspaceCwd: string;
  cacheBaseDir?: string;
  startupTimeoutMs?: number;
};

/** Injectable seams kept narrow for deterministic tests of the launch path. */
export type LaunchPackagedBackendDeps = {
  materialize?: typeof materializePackagedBackend;
  spawn?: typeof spawnBackend;
};

/**
 * Materializes and verifies the embedded backend, then spawns it.
 *
 * Unlike the source path, this never invokes Cargo: the integrity-checked
 * binary from the packaged cache is spawned directly through the shared
 * {@link spawnBackend} guards (timeout, hardened env, cleanup). Materialization
 * failures propagate as `launch`-kind errors, so the client fails closed.
 */
export async function launchPackagedBackend(
  options: LaunchPackagedBackendOptions,
  deps: LaunchPackagedBackendDeps = {}
): Promise<LaunchedBackend> {
  const materialize = deps.materialize ?? materializePackagedBackend;
  const spawn = deps.spawn ?? spawnBackend;

  const binaryPath = await materialize({
    asset: options.asset,
    version: options.version,
    cacheBaseDir: options.cacheBaseDir
  });

  return spawn({
    binaryPath,
    workspaceCwd: options.workspaceCwd,
    startupTimeoutMs: options.startupTimeoutMs
  });
}
