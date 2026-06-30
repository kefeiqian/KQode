import type { createStore } from 'jotai';
import type { BackendClient } from '@contracts/backend/index.js';
import { backendClientAtom } from '@state/global/backend.js';
import { BACKEND_LOADING_HINT, startupStatusHintAtom } from '@state/global/statusHint.js';

type Store = ReturnType<typeof createStore>;

/** Backend seam plus the lifecycle hooks the composition root drives. */
export type RuntimeBackendClient = BackendClient & {
  ensureStarted(): Promise<void>;
  dispose(): void;
};

/**
 * Injects an already-created backend client into the store and starts it eagerly.
 *
 * The composition root owns the process: `client` is published through the narrow
 * `backendClientAtom` seam, the backend is started immediately behind the
 * `Loading backend` hint instead of lazily on the first prompt, and the returned
 * disposer lets the entry point tear the process down on exit. A failed start
 * disposes the client and clears the seam so the UI never looks connected.
 */
export function startBackendRuntime(store: Store, client: RuntimeBackendClient): () => void {
  store.set(backendClientAtom, client);
  store.set(startupStatusHintAtom, BACKEND_LOADING_HINT);

  void client
    .ensureStarted()
    .catch(() => {
      client.dispose();
      store.set(backendClientAtom, undefined);
    })
    .finally(() => {
      store.set(startupStatusHintAtom, undefined);
    });

  return () => {
    client.dispose();
  };
}
