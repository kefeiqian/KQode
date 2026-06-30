import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

/**
 * Builds the self-contained packaged `kqode` executable with Bun.
 *
 * Stages the prebuilt Rust backend as an embeddable asset, computes its
 * SHA-256, then runs `Bun.build({ compile })` on the packaged entry, injecting
 * the distribution mode, product version, and backend digest as build-time
 * constants. The Rust backend is NOT built here — pass `--backend=<path>` or
 * build `target/release/kqode` first (the `cargo xtask package` wrapper does
 * this). This script is the reusable implementation that wrapper delegates to.
 */

const tuiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(tuiRoot, '..');
const exeSuffix = process.platform === 'win32' ? '.exe' : '';

// Ink imports the optional `react-devtools-core` inside a `process.env.DEV ===
// 'true'` branch that never runs in the packaged binary, and the package is not
// installed. Bun matches `--define` only on dot access, not Ink's bracket
// access, so the branch cannot be DCE'd; instead resolve the dependency to an
// empty stub. The runtime DEV guard ensures the stub is never evaluated.
const stubReactDevtools = {
  name: 'stub-react-devtools-core',
  setup(build: { onResolve: Function; onLoad: Function }): void {
    build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
      path: 'react-devtools-core',
      namespace: 'kqode-stub'
    }));
    build.onLoad({ filter: /.*/, namespace: 'kqode-stub' }, () => ({
      contents: 'export default {};',
      loader: 'js'
    }));
  }
};

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

function stageBackend(backendSource: string): { stagedPath: string; sha256: string } {
  if (!fs.existsSync(backendSource)) {
    throw new Error(
      `Rust backend not found at ${backendSource}; build it with \`cargo build --release --bin kqode\` or pass --backend=<path>`
    );
  }
  const assetsDir = path.join(tuiRoot, 'packaged', 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  const stagedPath = path.join(assetsDir, 'kqode-backend');
  fs.copyFileSync(backendSource, stagedPath);

  const sha256 = createHash('sha256').update(fs.readFileSync(stagedPath)).digest('hex');
  return { stagedPath, sha256 };
}

async function compile(version: string, sha256: string, outBase: string): Promise<string> {
  const distDir = path.dirname(outBase);
  fs.mkdirSync(distDir, { recursive: true });
  const entry = path.join(tuiRoot, 'packaged', 'entry.packaged.tsx');

  const result = await Bun.build({
    entrypoints: [entry],
    minify: true,
    define: {
      'process.env.KQODE_DISTRIBUTION': '"packaged"',
      'process.env.KQODE_VERSION': JSON.stringify(version),
      'process.env.KQODE_BACKEND_SHA256': JSON.stringify(sha256)
    },
    plugins: [stubReactDevtools],
    compile: { outfile: outBase }
  });

  if (!result.success) {
    const detail = result.logs.map((entry) => String(entry.message ?? entry)).join('\n');
    throw new Error(`bun build --compile failed:\n${detail}`);
  }
  return `${outBase}${exeSuffix}`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const backendSource =
    args.get('backend') ?? path.join(repoRoot, 'target', 'release', `kqode${exeSuffix}`);
  const version = args.get('version') ?? readCargoVersion();
  const outBase = args.get('out') ?? path.join(tuiRoot, 'dist', 'kqode');

  const { sha256 } = stageBackend(backendSource);
  const outfile = await compile(version, sha256, outBase);

  console.log(`Packaged ${outfile} (version ${version}, backend sha256 ${sha256.slice(0, 12)}…)`);
}

await main();
