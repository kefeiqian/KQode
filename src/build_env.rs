//! Build-time environment identity, mirroring the TUI's `KQODE_ENV` axis.
//!
//! `build.rs` reads the `KQODE_ENV` variable and exposes it to the compiler as
//! the custom `kqode_env` cfg (`"dev"`, `"test"`, or `"prod"`). Gate
//! environment-specific code with `#[cfg(kqode_env = "prod")]` for true
//! conditional compilation, or read [`BuildEnv::current`] for a runtime value
//! (for example, when logging the active environment).
//!
//! Prefer the built-in `#[cfg(test)]` for unit-test-only code. `kqode_env =
//! "test"` is for building the whole product in test mode (e.g. an eval
//! harness) and is only set when `KQODE_ENV=test` is passed at build time — a
//! plain `cargo test` defaults to `dev`.

/// Build variable that selects the environment. Kept in sync with `build.rs`.
pub const ENV_VAR: &str = "KQODE_ENV";

/// The environments KQode is built for, selected by [`ENV_VAR`] at build time.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuildEnv {
    /// Source checkout run with Cargo; the default when `KQODE_ENV` is unset.
    Dev,
    /// Test/eval build where product-wide test seams are active.
    Test,
    /// Packaged release that embeds and runs the backend.
    Prod,
}

impl BuildEnv {
    /// The environment this crate was compiled for, resolved from the
    /// `kqode_env` cfg.
    ///
    /// Falls back to [`BuildEnv::Dev`] when the cfg is unset, e.g. tooling that
    /// does not run `build.rs`.
    #[must_use]
    pub const fn current() -> Self {
        #[cfg(kqode_env = "prod")]
        const CURRENT: BuildEnv = BuildEnv::Prod;
        #[cfg(kqode_env = "test")]
        const CURRENT: BuildEnv = BuildEnv::Test;
        #[cfg(not(any(kqode_env = "prod", kqode_env = "test")))]
        const CURRENT: BuildEnv = BuildEnv::Dev;

        CURRENT
    }

    /// The lowercase name of this environment (`"dev"`, `"test"`, or `"prod"`).
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Dev => "dev",
            Self::Test => "test",
            Self::Prod => "prod",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::BuildEnv;

    #[test]
    fn current_agrees_with_the_active_cfg() {
        let env = BuildEnv::current();
        if cfg!(kqode_env = "prod") {
            assert_eq!(env, BuildEnv::Prod);
        } else if cfg!(kqode_env = "test") {
            assert_eq!(env, BuildEnv::Test);
        } else {
            assert_eq!(env, BuildEnv::Dev);
        }
    }

    #[test]
    fn as_str_maps_each_variant() {
        assert_eq!(BuildEnv::Dev.as_str(), "dev");
        assert_eq!(BuildEnv::Test.as_str(), "test");
        assert_eq!(BuildEnv::Prod.as_str(), "prod");
    }
}
