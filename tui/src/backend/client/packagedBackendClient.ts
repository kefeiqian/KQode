import { createBackendClient, type BackendClientHandle } from '@backend/client/backendClient.ts';
import { BackendClientError, BackendErrorKind } from '@contracts/backend/index.ts';

/** Packaged/dist composition inputs: run the embedded backend in `workspaceCwd`. */
export type PackagedBackendClientOptions = {
  /** Workspace directory the materialized backend process runs in. */
  workspaceCwd: string;
  requestTimeoutMs?: number;
};

/**
 * Creates a backend client backed by the Rust binary embedded in the standalone
 * executable.
 *
 * The materialize/verify/launch implementation lands in a later unit; this stub
 * keeps the distribution seam wired and fails closed with a typed `launch`
 * error so packaged mode can never silently look connected.
 */
export function createPackagedBackendClient(
  options: PackagedBackendClientOptions
): BackendClientHandle {
  return createBackendClient({
    launch: () =>
      Promise.reject(
        new BackendClientError(
          BackendErrorKind.Launch,
          'packaged backend launch is not implemented yet'
        )
      ),
    requestTimeoutMs: options.requestTimeoutMs
  });
}
