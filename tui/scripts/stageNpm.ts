import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exeSuffix, parseArgs, resolveProductVersion } from './scriptUtils.ts';
import { stageRootPackage, writePlatformPackage } from './npmStaging.ts';

/**
 * Stages the publish-ready npm layout for the current host into
 * `packaging/npm/dist/`.
 *
 * Copies the committed root `kqode` package (stamping the build version onto it
 * and its per-platform optional dependencies) and generates the host's
 * `@kqode/cli-<platform>-<arch>` package containing the prebuilt executable
 * (from `cargo xtask package`). Produce every platform package at once from
 * release archives with `stageNpmFromRelease.ts`. Pass `--version=`, `--exe=`,
 * or `--out=` to override.
 */

const tuiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(tuiRoot, '..');

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const version = args.get('version') ?? resolveProductVersion({ repoRoot });
  const exePath = args.get('exe') ?? path.join(tuiRoot, 'dist', `kqode${exeSuffix}`);
  const distRoot = args.get('out') ?? path.join(repoRoot, 'packaging', 'npm', 'dist');

  if (!fs.existsSync(exePath)) {
    throw new Error(
      `packaged executable not found at ${exePath}; run \`cargo xtask package\` first or pass --exe=<path>`
    );
  }

  fs.rmSync(distRoot, { recursive: true, force: true });
  fs.mkdirSync(distRoot, { recursive: true });
  const rootDir = stageRootPackage(version, distRoot);
  const platformDir = writePlatformPackage({
    platform: process.platform,
    arch: process.arch,
    exePath,
    version,
    distRoot
  });

  console.log(`Staged npm packages (version ${version}):`);
  console.log(`  root:     ${rootDir}`);
  console.log(`  platform: ${platformDir}`);
}

main();
