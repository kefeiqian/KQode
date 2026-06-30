import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from 'ink';
import { createStore, Provider } from 'jotai';
import { App } from '@/App.tsx';
import { createBackendClient } from '@backend/client/backendClient.ts';
import { resolveRepoRoot, resolveWorkspaceCwd } from '@libs/path/runtimePaths.ts';
import { PRODUCT_NAME, readProductVersion } from '@libs/product/productMetadata.ts';
import { setTerminalWindowTitle } from '@libs/terminal/windowTitle.ts';
import { startBackendRuntime } from '@backend/runtime/backendRuntime.ts';
import { productVersionAtom, repoRootAtom, workspaceCwdAtom } from '@state/global/index.ts';

const tuiPackageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = resolveRepoRoot(tuiPackageRoot);
const workspaceCwd = resolveWorkspaceCwd();
const productVersion = readProductVersion(repoRoot);

setTerminalWindowTitle(PRODUCT_NAME, productVersion);

const store = createStore();
store.set(repoRootAtom, repoRoot);
store.set(productVersionAtom, productVersion);
store.set(workspaceCwdAtom, workspaceCwd);

const backendClient = createBackendClient({ repoRoot, workspaceCwd });
const disposeBackend = startBackendRuntime(store, backendClient);

const { waitUntilExit } = render(
  <Provider store={store}>
    <App />
  </Provider>
);

void waitUntilExit().finally(disposeBackend);
