import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import resolve from '../../packaging/npm/kqode/lib/resolve.cjs';

/**
 * Stages the publish-ready npm layout for the current host into
 * `packaging/npm/dist/`.
 *
 * Copies the committed root `kqode` package (stamping the build version onto it
 * and its per-platform optional dependencies) and generates the host's
 * `@kqode/cli-<platform>-<arch>` package containing the prebuilt executable
 * (from `cargo xtask package`). The other platform packages are produced on
 * their own CI runners. Pass `--version=`, `--exe=`, or `--out=` to override.
 */

const tuiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(tuiRoot, '..');
const npmRoot = path.join(repoRoot, 'packaging', 'npm');
const exeSuffix = process.platform === 'win32' ? '.exe' : '';

function parseArgs(argv: string[]): Map<string, string> {
  const args = new Map<string, string>();
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match === null) {
      throw new Error(`unrecognized argument: ${arg} (use --key=value)`);
    }
    args.set(match[1], match[2]);
  }
  return args;
}

function readCargoVersion(): string {
  const manifest = fs.readFileSync(path.join(repoRoot, 'Cargo.toml'), 'utf8');
  const match = /^\s*version\s*=\s*"([^"]+)"/m.exec(manifest);
  if (match === null) {
    throw new Error('could not read version from Cargo.toml');
  }
  return match[1];
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function stageRoot(version: string, distRoot: string): string {
  const srcRoot = path.join(npmRoot, 'kqode');
  const destRoot = path.join(distRoot, 'kqode');
  fs.mkdirSync(destRoot, { recursive: true });
  fs.cpSync(path.join(srcRoot, 'bin'), path.join(destRoot, 'bin'), { recursive: true });
  fs.cpSync(path.join(srcRoot, 'lib'), path.join(destRoot, 'lib'), { recursive: true });
  fs.copyFileSync(path.join(srcRoot, 'README.md'), path.join(destRoot, 'README.md'));

  const manifest = JSON.parse(fs.readFileSync(path.join(srcRoot, 'package.json'), 'utf8'));
  manifest.version = version;
  for (const dep of Object.keys(manifest.optionalDependencies ?? {})) {
    manifest.optionalDependencies[dep] = version;
  }
  writeJson(path.join(destRoot, 'package.json'), manifest);
  return destRoot;
}

function stagePlatform(version: string, exePath: string, distRoot: string): string {
  const { platform, arch } = process;
  if (!resolve.isSupported(platform, arch)) {
    throw new Error(`unsupported host target ${platform}-${arch}`);
  }

  const pkgName = resolve.platformPackageName(platform, arch);
  const destDir = path.join(distRoot, ...pkgName.split('/'));
  fs.mkdirSync(destDir, { recursive: true });

  const binaryFile = resolve.binaryName(platform);
  fs.copyFileSync(exePath, path.join(destDir, binaryFile));

  writeJson(path.join(destDir, 'package.json'), {
    name: pkgName,
    version,
    description: `Prebuilt KQode executable for ${platform}-${arch}.`,
    os: [platform],
    cpu: [arch],
    files: [binaryFile, 'README.md']
  });
  fs.writeFileSync(
    path.join(destDir, 'README.md'),
    `# ${pkgName}\n\nPrebuilt \`kqode\` executable for ${platform}-${arch}. ` +
      'Installed automatically as an optional dependency of `kqode`; do not depend on it directly.\n'
  );
  return destDir;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const version = args.get('version') ?? readCargoVersion();
  const exePath = args.get('exe') ?? path.join(tuiRoot, 'dist', `kqode${exeSuffix}`);
  const distRoot = args.get('out') ?? path.join(npmRoot, 'dist');

  if (!fs.existsSync(exePath)) {
    throw new Error(
      `packaged executable not found at ${exePath}; run \`cargo xtask package\` first or pass --exe=<path>`
    );
  }

  fs.rmSync(distRoot, { recursive: true, force: true });
  fs.mkdirSync(distRoot, { recursive: true });
  const rootDir = stageRoot(version, distRoot);
  const platformDir = stagePlatform(version, exePath, distRoot);

  console.log(`Staged npm packages (version ${version}):`);
  console.log(`  root:     ${rootDir}`);
  console.log(`  platform: ${platformDir}`);
}

main();
