import { spawn, type ChildProcess } from 'node:child_process';
import type { Readable, Writable } from 'node:stream';
import { BackendClientError, BackendErrorKind } from '@backend/client/backendClient.js';
import { buildBackend, resolveBackendBinaryPath } from '@backend/process/backendBuild.js';
import { BACKEND_MODE_ARG, DEFAULT_STARTUP_TIMEOUT_MS } from '@backend/backendConstants.js';
import { buildHardenedEnv } from '@backend/process/processEnv.js';
import { killProcessTree } from '@backend/process/processUtils.js';

/** How a launched backend process ended. */
export type BackendExit = { code: number | null; signal: NodeJS.Signals | null };

/**
 * A running backend process exposed as transport-neutral handles.
 *
 * The JSON-RPC client consumes `stdin`/`stdout`, observes termination through
 * `onExit`, and reclaims the process tree through `dispose`; no display code
 * ever touches the underlying child process.
 */
export type LaunchedBackend = {
  readonly pid: number | undefined;
  readonly stdin: Writable;
  readonly stdout: Readable;
  readonly stderr: Readable;
  onExit(listener: (exit: BackendExit) => void): void;
  dispose(): void;
};

export type SpawnBackendOptions = {
  binaryPath: string;
  workspaceCwd: string;
  env?: NodeJS.ProcessEnv;
  startupTimeoutMs?: number;
};

/**
 * Spawns an already-built backend binary in `workspaceCwd` over piped stdio.
 *
 * # Errors
 *
 * Rejects with a `launch` error when the executable is missing or stdio pipes
 * are unavailable, and a `timeout` error when the process never reports a start.
 */
export async function spawnBackend({
  binaryPath,
  workspaceCwd,
  env = buildHardenedEnv(),
  startupTimeoutMs = DEFAULT_STARTUP_TIMEOUT_MS
}: SpawnBackendOptions): Promise<LaunchedBackend> {
  const child = spawn(binaryPath, [BACKEND_MODE_ARG], {
    cwd: workspaceCwd,
    env,
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });

  await waitForSpawn(child, startupTimeoutMs);

  const { stdin, stdout, stderr } = child;
  if (stdin === null || stdout === null || stderr === null) {
    killProcessTree(child.pid);
    throw new BackendClientError(BackendErrorKind.Launch, 'backend process is missing stdio pipes');
  }

  return {
    pid: child.pid,
    stdin,
    stdout,
    stderr,
    onExit(listener) {
      child.once('exit', (code, signal) => listener({ code, signal }));
    },
    dispose() {
      killProcessTree(child.pid);
    }
  };
}

export type LaunchSourceBackendOptions = {
  repoRoot: string;
  workspaceCwd: string;
  buildTimeoutMs?: number;
  startupTimeoutMs?: number;
};

/**
 * Builds the backend from `repoRoot`, then launches it in `workspaceCwd`.
 *
 * This is the source-mode developer path: the trusted build and the
 * workspace-scoped execution are kept as two guarded steps sharing one
 * hardened environment policy.
 */
export async function launchSourceBackend({
  repoRoot,
  workspaceCwd,
  buildTimeoutMs,
  startupTimeoutMs
}: LaunchSourceBackendOptions): Promise<LaunchedBackend> {
  await buildBackend({ repoRoot, timeoutMs: buildTimeoutMs });
  return await spawnBackend({
    binaryPath: resolveBackendBinaryPath(repoRoot),
    workspaceCwd,
    startupTimeoutMs
  });
}

function waitForSpawn(child: ChildProcess, startupTimeoutMs: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const settle = (action: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      action();
    };

    const timer = setTimeout(() => {
      settle(() => {
        killProcessTree(child.pid);
        reject(
          new BackendClientError(
            BackendErrorKind.Timeout,
            `backend did not start within ${startupTimeoutMs}ms`
          )
        );
      });
    }, startupTimeoutMs);

    child.once('spawn', () => settle(resolve));
    child.once('error', (error) => {
      settle(() => {
        reject(
          new BackendClientError(
            BackendErrorKind.Launch,
            `failed to start backend process: ${error.message}`,
            { cause: error }
          )
        );
      });
    });
  });
}
