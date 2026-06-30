import fs from 'node:fs';
import path from 'node:path';

/** Display name of the product. Centralized so a future rename touches one place. */
export const PRODUCT_NAME = 'KQode';

const CARGO_VERSION_PATTERN = /^\s*version\s*=\s*"([^"]+)"/m;

export function readProductVersion(repoRoot: string): string {
  const manifestPath = path.join(repoRoot, 'Cargo.toml');
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  const match = CARGO_VERSION_PATTERN.exec(manifest);

  if (match === null) {
    throw new Error(`Could not read KQode version from ${manifestPath}`);
  }

  return match[1];
}
