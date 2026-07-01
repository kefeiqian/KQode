use std::path::Path;

use crate::{commands::CommandSpec, support::bun};

/// Package-local Bun script that assembles the npm package set from release archives.
const NPM_RELEASE_SCRIPT: &str = "stage:npm-release";

pub const COMMAND: CommandSpec = CommandSpec {
    name: "package-npm",
    description: "Assemble the npm package set from the release archives in tui/dist/release",
    run,
};

/// Assembles the publish-ready npm packages from release archives.
///
/// Delegates to the package-local Bun script, which reads
/// `kqode-<target>.(tar.gz|zip)` archives from `tui/dist/release/` and stages the
/// root `kqode` package plus each `@kqode/cli-<platform>-<arch>` package into
/// `packaging/npm/dist/`. Populate `tui/dist/release/` first (via `cargo xtask
/// package-release`, or by downloading a GitHub Release's archives). CI publishes
/// with the same script pointed at the downloaded assets.
///
/// # Errors
///
/// Returns an error when the Bun script exits non-zero (for example when a
/// required target archive is missing).
pub fn run(repo_root: &Path) -> Result<(), String> {
    bun::run(repo_root, &["run", NPM_RELEASE_SCRIPT])
}
