import path from 'node:path';

export function resolveRepoRoot(tuiPackageRoot: string): string {
  return path.normalize(path.resolve(tuiPackageRoot, '..'));
}

export function resolveWorkspaceCwd(cwd = process.cwd()): string {
  return path.normalize(cwd);
}
