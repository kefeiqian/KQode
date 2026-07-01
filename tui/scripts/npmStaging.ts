import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import resolve from '../../packaging/npm/kqode/lib/resolve.cjs';

/**
 * Shared npm-package staging helpers used by both `stageNpm.ts` (host package)
 * and `stageNpmFromRelease.ts` (full cross-platform set from release archives).
 *
 * The npm layout is a thin root `kqode` selector package plus one
 * `@kqode/cli-<platform>-<arch>` package per target carrying the prebuilt
 * executable. Keep the layout single-sourced here so the two entry points stay
 * consistent.
 */

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const npmSrcRoot = path.resolve(scriptsDir, '..', '..', 'packaging', 'npm', 'kqode');

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

/** Stages the root `kqode` selector package, stamping `version` onto it and its optional deps. */
export function stageRootPackage(version: string, distRoot: string): string {
  const dest = path.join(distRoot, 'kqode');
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(path.join(npmSrcRoot, 'bin'), path.join(dest, 'bin'), { recursive: true });
  fs.cpSync(path.join(npmSrcRoot, 'lib'), path.join(dest, 'lib'), { recursive: true });
  fs.copyFileSync(path.join(npmSrcRoot, 'README.md'), path.join(dest, 'README.md'));

  const manifest = JSON.parse(fs.readFileSync(path.join(npmSrcRoot, 'package.json'), 'utf8'));
  manifest.version = version;
  for (const dep of Object.keys(manifest.optionalDependencies ?? {})) {
    manifest.optionalDependencies[dep] = version;
  }
  writeJson(path.join(dest, 'package.json'), manifest);
  return dest;
}

interface PlatformPackage {
  /** Node `process.platform` value, e.g. `darwin`, `linux`, `win32`. */
  platform: string;
  /** Node `process.arch` value, e.g. `x64`, `arm64`. */
  arch: string;
  /** Path to the prebuilt executable to embed. */
  exePath: string;
  version: string;
  distRoot: string;
}

/** Stages one `@kqode/cli-<platform>-<arch>` package containing the prebuilt executable. */
export function writePlatformPackage({ platform, arch, exePath, version, distRoot }: PlatformPackage): string {
  if (!resolve.isSupported(platform, arch)) {
    throw new Error(`unsupported target ${platform}-${arch}`);
  }

  const pkgName = resolve.platformPackageName(platform, arch);
  const dest = path.join(distRoot, ...pkgName.split('/'));
  fs.mkdirSync(dest, { recursive: true });

  const binaryFile = resolve.binaryName(platform);
  const binaryPath = path.join(dest, binaryFile);
  fs.copyFileSync(exePath, binaryPath);
  if (platform !== 'win32') {
    fs.chmodSync(binaryPath, 0o755);
  }

  writeJson(path.join(dest, 'package.json'), {
    name: pkgName,
    version,
    description: `Prebuilt KQode executable for ${platform}-${arch}.`,
    os: [platform],
    cpu: [arch],
    files: [binaryFile, 'README.md']
  });
  fs.writeFileSync(
    path.join(dest, 'README.md'),
    `# ${pkgName}\n\nPrebuilt \`kqode\` executable for ${platform}-${arch}. ` +
      'Installed automatically as an optional dependency of `kqode`; do not depend on it directly.\n'
  );
  return dest;
}
