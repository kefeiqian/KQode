/**
 * Build-time distribution identity shared by the Rust packaging tooling and the
 * TypeScript composition root.
 *
 * These values cross the Rust/TS boundary: `cargo xtask package` injects them
 * with Bun `--define`, and the TUI reads them at startup. Keep the literals here
 * authoritative and searchable.
 *
 * Note: the composition-root branch in `bootstrap.ts` compares
 * `process.env.KQODE_DISTRIBUTION` against the `'packaged'` string literal
 * directly (not these consts) because Bun only dead-code-eliminates the dead
 * branch when the comparison is a literal; an imported const defeats it. Use
 * these constants for tooling, tests, and documentation rather than the hot
 * branch.
 */

/** Environment variable carrying the build-time distribution mode. */
export const DISTRIBUTION_ENV_VAR = 'KQODE_DISTRIBUTION';

/** Self-contained executable that runs the embedded Rust backend. */
export const PACKAGED_DISTRIBUTION = 'packaged';

/** Source checkout that builds and launches the backend with Cargo. */
export const SOURCE_DISTRIBUTION = 'source';

/** Environment variable carrying the build-time product version. */
export const VERSION_ENV_VAR = 'KQODE_VERSION';

/** Environment variable carrying the embedded backend asset SHA-256 (packaged mode). */
export const BACKEND_SHA256_ENV_VAR = 'KQODE_BACKEND_SHA256';
