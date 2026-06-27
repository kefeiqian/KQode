import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from 'ink';
import { App } from './src/App.js';
import { resolveRepoRoot, resolveWorkspaceCwd } from './src/libs/path/runtimePaths.js';
import { readProductVersion } from './src/libs/product/productMetadata.js';

const tuiPackageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = resolveRepoRoot(tuiPackageRoot);
const workspaceCwd = resolveWorkspaceCwd();
const productVersion = readProductVersion(repoRoot);

render(<App productVersion={productVersion} workspaceCwd={workspaceCwd} />);
