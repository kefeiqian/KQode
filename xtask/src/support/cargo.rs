use std::{path::Path, process::Command};

/// Builds a Cargo binary target in release mode from the repository root.
///
/// Used by the packaging command to produce the backend that gets embedded into
/// the standalone executable. The build runs from the trusted `repo_root` so the
/// manifest and `.cargo` config come from the repository, not a workspace.
///
/// # Errors
///
/// Returns an error when Cargo cannot be started or the build exits non-zero.
pub fn build_release_bin(repo_root: &Path, bin: &str) -> Result<(), String> {
    let status = Command::new(command())
        .args(["build", "--release", "--bin", bin])
        .current_dir(repo_root)
        .status()
        .map_err(|error| format!("run cargo build --release --bin {bin}: {error}"))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("cargo build --release --bin {bin} exited with {status}"))
    }
}

fn command() -> &'static str {
    if cfg!(windows) { "cargo.exe" } else { "cargo" }
}
