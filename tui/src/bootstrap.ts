import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from 'jotai';
import type { BackendClientHandle } from '@backend/client/backendClient.ts';
import { startBackendRuntime } from '@backend/runtime/backendRuntime.ts';
import { resolveRepoRoot, resolveWorkspaceCwd } from '@libs/path/runtimePaths.ts';
import { PRODUCT_NAME, resolveProductVersion } from '@libs/product/productMetadata.ts';
import { setTerminalWindowTitle } from '@libs/terminal/windowTitle.ts';
import { productVersionAtom, repoRootAtom, workspaceCwdAtom } from '@state/global/index.ts';

type Store = ReturnType<typeof createStore>;

/** Composed application runtime: the shared store plus a backend disposer. */
export type AppRuntime = {
  store: Store;
  dispose: () => void;
};

/**
 * Composes the TUI store and the distribution-appropriate backend client.
 *
 * The `process.env.KQODE_DISTRIBUTION === 'packaged'` check is intentionally a
 * string literal (matching `PACKAGED_DISTRIBUTION`): Bun `--define` inlines it
 * at build time so the unused launch strategy is dead-code-eliminated — the
 * Cargo source-launch code is dropped from the packaged executable, and the
 * embedded-backend module is never resolved in source mode. Each strategy is
 * therefore loaded with a dynamic `import()` inside its own branch.
 *
 * `entryUrl` is the source-mode anchor used to locate the repo root for Cargo
 * and product metadata; it is ignored in packaged mode.
 */
export async function createAppRuntime({ entryUrl }: { entryUrl: string }): Promise<AppRuntime> {
  const store = createStore();
  const workspaceCwd = resolveWorkspaceCwd();
  store.set(workspaceCwdAtom, workspaceCwd);

  let client: BackendClientHandle;
  let productVersion: string;
  if (process.env.KQODE_DISTRIBUTION === 'packaged') {
    productVersion = resolveProductVersion({});
    const { createPackagedBackendClient } = await import('@backend/client/packagedBackendClient.ts');
    client = createPackagedBackendClient({ workspaceCwd });
  } else {
    const repoRoot = resolveRepoRoot(path.dirname(fileURLToPath(entryUrl)));
    store.set(repoRootAtom, repoRoot);
    productVersion = resolveProductVersion({ repoRoot });
    const { createSourceBackendClient } = await import('@backend/client/sourceBackendClient.ts');
    client = createSourceBackendClient({ repoRoot, workspaceCwd });
  }

  store.set(productVersionAtom, productVersion);
  setTerminalWindowTitle(PRODUCT_NAME, productVersion);

  const dispose = startBackendRuntime(store, client);
  return { store, dispose };
}
