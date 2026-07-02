/**
 * Build/runtime environment identity for the TUI.
 *
 * A single axis — `KQODE_ENV` — spans the three environments the TUI runs in:
 *
 * - `dev`  — source checkout run with `tsx`/Cargo; the implicit default when the
 *            variable is unset.
 * - `test` — the Vitest runtime, where test-only seams (viewport and git-status
 *            overrides) are active.
 * - `prod` — the packaged `bun build --compile` binary that embeds the Rust
 *            backend.
 *
 * The `prod` build injects `process.env.KQODE_ENV = "prod"` with Bun `--define`,
 * so branches that compare against the `'prod'` / `'test'` string *literals*
 * (never these consts) are dead-code-eliminated: Bun only folds the comparison
 * when it sees a literal, and an imported const defeats it. Use these constants
 * from tooling, tests, and docs; keep the raw literals in the hot branches
 * (`bootstrap.ts`, `state/global/*`), each flagged with a comment pointing here.
 */

/** Build-time environment variable that selects the dev/test/prod code paths. */
export const ENV_VAR = 'KQODE_ENV';

/** Source checkout (Cargo-launched backend); the default when `KQODE_ENV` is unset. */
export const DEV_ENV = 'dev';

/** Vitest runtime; test-only override seams are active. */
export const TEST_ENV = 'test';

/** Packaged executable that runs the embedded Rust backend. */
export const PROD_ENV = 'prod';

/** Build-time env var carrying the product version (injected in `prod`). */
export const VERSION_ENV_VAR = 'KQODE_VERSION';

/** Build-time env var carrying the embedded backend asset SHA-256 (`prod` only). */
export const BACKEND_SHA256_ENV_VAR = 'KQODE_BACKEND_SHA256';
