import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from 'ink';
import { createStore, Provider } from 'jotai';
import { App } from '@/App.js';
import { launchSourceBackend } from '@backend/process/backendProcess.js';
import { createProcessBackendClient } from '@backend/client/processBackendClient.js';
import { resolveRepoRoot, resolveWorkspaceCwd } from '@libs/path/runtimePaths.js';
import { readProductVersion } from '@libs/product/productMetadata.js';
import { startBackendRuntime } from '@backend/runtime/backendRuntime.js';
import { seedScreenState } from '@state/global/index.js';

const tuiPackageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = resolveRepoRoot(tuiPackageRoot);
const workspaceCwd = resolveWorkspaceCwd();
const productVersion = readProductVersion(repoRoot);

const store = createStore();
seedScreenState(store, { repoRoot, productVersion, workspaceCwd });

const backendClient = createProcessBackendClient({
  launch: () => launchSourceBackend({ repoRoot, workspaceCwd })
});
const disposeBackend = startBackendRuntime(store, backendClient);

const { waitUntilExit } = render(
  <Provider store={store}>
    <App />
  </Provider>
);

void waitUntilExit().finally(disposeBackend);
