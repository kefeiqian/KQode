import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from 'ink';
import { App } from '@/App.js';
import { launchSourceBackend } from '@libs/backend/backendProcess.js';
import { createProcessBackendClient } from '@libs/backend/processBackendClient.js';
import { readGitStatusLabel } from '@libs/git/gitStatus.js';
import { resolveRepoRoot, resolveWorkspaceCwd } from '@libs/path/runtimePaths.js';
import { readProductVersion } from '@libs/product/productMetadata.js';

const tuiPackageRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = resolveRepoRoot(tuiPackageRoot);
const workspaceCwd = resolveWorkspaceCwd();
const productVersion = readProductVersion(repoRoot);
const gitStatusLabel = readGitStatusLabel(workspaceCwd);

const backendClient = createProcessBackendClient({
  launch: () => launchSourceBackend({ repoRoot, workspaceCwd })
});
process.once('exit', () => backendClient.dispose());

render(<App screen={{ productVersion, workspaceCwd, gitStatusLabel, backendClient }} />);
