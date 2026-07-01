import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import resolve from '../../packaging/npm/kqode/lib/resolve.cjs';
import { parseArgs, resolveProductVersion } from './scriptUtils.ts';
import { stageRootPackage, writePlatformPackage } from './npmStaging.ts';

/**
 * Assembles the full npm package set (root `kqode` + every
 * `@kqode/cli-<platform>-<arch>`) from a directory of GitHub Release archives on
 * a single machine, so npm publishing does not require building on all six OSes.
 *
 * For each supported target it locates `kqode-<os>-<arch>.(tar.gz|zip)` in
 * `--from`, extracts the executable, and stages the platform package into
 * `--out`. `win32-arm64` is best-effort (skipped when absent); the other five
 * targets are required. Override `--from`, `--out`, or `--version`.
 */

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const tuiRoot = path.resolve(scriptsDir, '..');
const repoRoot = path.resolve(tuiRoot, '..');

/** Maps Node's `process.platform` to the release-archive OS segment. */
const RELEASE_OS: Record<string, string> = { darwin: 'darwin', linux: 'linux', win32: 'windows' };

/** Targets that may be absent without failing the run (no native Bun yet). */
const OPTIONAL_TARGETS = new Set(['win32-arm64']);

function archiveName(platform: string, arch: string): { name: string; ext: 'zip' | 'tar.gz' } {
  const ext = platform === 'win32' ? 'zip' : 'tar.gz';
  return { name: `kqode-${RELEASE_OS[platform]}-${arch}.${ext}`, ext };
}

/** Extracts `binaryName` from an archive into a fresh temp dir and returns both paths. */
function extractBinary(
  archivePath: string,
  ext: 'zip' | 'tar.gz',
  binaryName: string
): { binaryPath: string; stageDir: string } {
  const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kqode-npm-'));
  const args =
    ext === 'tar.gz'
      ? ['-xzf', archivePath, '-C', stageDir]
      : process.platform === 'win32'
        ? ['-xf', archivePath, '-C', stageDir] // bsdtar reads zip
        : null;

  const result = args
    ? spawnSync('tar', args, { stdio: ['ignore', 'inherit', 'inherit'] })
    : spawnSync('unzip', ['-o', '-q', archivePath, '-d', stageDir], {
        stdio: ['ignore', 'inherit', 'inherit']
      });

  if (result.error) {
    throw new Error(`failed to extract ${path.basename(archivePath)}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`extracting ${path.basename(archivePath)} exited with ${result.status}`);
  }

  const binaryPath = path.join(stageDir, binaryName);
  if (!fs.existsSync(binaryPath)) {
    fs.rmSync(stageDir, { recursive: true, force: true });
    throw new Error(`archive ${path.basename(archivePath)} did not contain ${binaryName}`);
  }
  return { binaryPath, stageDir };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const version = args.get('version') ?? resolveProductVersion({ repoRoot });
  const fromDir = path.resolve(args.get('from') ?? path.join(tuiRoot, 'dist', 'release'));
  const distRoot = path.resolve(args.get('out') ?? path.join(repoRoot, 'packaging', 'npm', 'dist'));

  if (!fs.existsSync(fromDir)) {
    throw new Error(`release archive directory not found: ${fromDir}`);
  }
  fs.rmSync(distRoot, { recursive: true, force: true });
  fs.mkdirSync(distRoot, { recursive: true });

  const staged: string[] = [];
  const missing: string[] = [];
  for (const target of resolve.SUPPORTED_TARGETS) {
    const [platform, arch] = target.split('-');
    const { name, ext } = archiveName(platform, arch);
    const archivePath = path.join(fromDir, name);

    if (!fs.existsSync(archivePath)) {
      if (OPTIONAL_TARGETS.has(target)) {
        console.warn(`Skipping optional target ${target}: ${name} not found.`);
      } else {
        missing.push(name);
      }
      continue;
    }

    const { binaryPath, stageDir } = extractBinary(archivePath, ext, resolve.binaryName(platform));
    try {
      staged.push(writePlatformPackage({ platform, arch, exePath: binaryPath, version, distRoot }));
    } finally {
      fs.rmSync(stageDir, { recursive: true, force: true });
    }
  }

  if (missing.length > 0) {
    throw new Error(`missing required release archives in ${fromDir}: ${missing.join(', ')}`);
  }

  const rootDir = stageRootPackage(version, distRoot);
  console.log(`Staged npm packages (version ${version}) into ${distRoot}:`);
  console.log(`  root:     ${path.relative(repoRoot, rootDir)}`);
  for (const dir of staged) {
    console.log(`  platform: ${path.relative(repoRoot, dir)}`);
  }
}

main();
