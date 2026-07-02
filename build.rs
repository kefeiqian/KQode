//! Bridges the `KQODE_ENV` build variable into the custom `kqode_env` compile
//! cfg, giving the Rust core the same single dev/test/prod environment axis as
//! the TUI (`tui/src/libs/runtime/buildEnv.ts`).
//!
//! Resolving the environment here (at build time) rather than at runtime makes
//! it a compile-time constant, so `#[cfg(kqode_env = "...")]` arms are
//! conditionally compiled and `cfg!(kqode_env = "...")` branches are
//! const-folded — the Rust analog of the TUI's Bun `--define`. Keep the variable
//! name and accepted values in sync with `src/build_env.rs`.

use std::env;

/// Build variable selecting the environment. Mirrors the TUI's `KQODE_ENV`.
const ENV_VAR: &str = "KQODE_ENV";

/// Accepted values, also registered as the valid `values(...)` for check-cfg.
const ALLOWED: [&str; 3] = ["dev", "test", "prod"];

/// Value used when `KQODE_ENV` is unset (plain `cargo build` / `cargo test`).
const DEFAULT: &str = "dev";

fn main() {
    // Register the custom cfg so rustc's `unexpected_cfgs` lint (>=1.80) stays
    // quiet for `kqode_env` everywhere it is used in the crate.
    println!(
        "cargo::rustc-check-cfg=cfg(kqode_env, values(\"{}\"))",
        ALLOWED.join("\", \"")
    );

    let env = env::var(ENV_VAR).unwrap_or_else(|_| DEFAULT.to_owned());
    assert!(
        ALLOWED.contains(&env.as_str()),
        "{ENV_VAR} must be one of {ALLOWED:?}, got {env:?}"
    );

    println!("cargo::rustc-cfg=kqode_env=\"{env}\"");
    // Env vars are not tracked by default; rebuild when this one changes.
    println!("cargo::rerun-if-env-changed={ENV_VAR}");
}
