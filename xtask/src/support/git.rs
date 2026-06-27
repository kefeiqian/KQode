use std::{
    path::Path,
    process::{Command, Stdio},
};

/// Clones one pinned ref and checks out only the requested path for fixture sources.
///
/// This keeps the complex React fixture realistic without downloading the full
/// upstream repository history or tree.
///
/// # Errors
///
/// Returns an error when `git clone` or `git sparse-checkout set` cannot be
/// started or exits unsuccessfully.
pub fn clone_sparse_at_ref(
    repository: &str,
    git_ref: &str,
    sparse_path: &str,
    checkout: &Path,
) -> Result<(), String> {
    let status = Command::new("git")
        .args([
            "clone",
            "--depth",
            "1",
            "--filter=blob:none",
            "--sparse",
            "--branch",
            git_ref,
            repository,
        ])
        .arg(checkout)
        .status()
        .map_err(|error| format!("run git clone for {repository}: {error}"))?;

    if !status.success() {
        return Err(format!("git clone for {repository} exited with {status}"));
    }

    let status = Command::new("git")
        .args(["-C"])
        .arg(checkout)
        .args(["sparse-checkout", "set", sparse_path])
        .status()
        .map_err(|error| format!("run git sparse-checkout for {repository}: {error}"))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!(
            "git sparse-checkout for {repository} exited with {status}"
        ))
    }
}

/// Returns whether a checkout's HEAD exactly matches the expected pinned commit.
///
/// A missing or invalid checkout returns `Ok(false)` so callers can invalidate
/// and recreate fixture caches without treating absence as a fatal read error.
///
/// # Errors
///
/// Returns an error when `git rev-parse` cannot be started or when Git emits a
/// non-UTF-8 commit id.
pub fn head_matches(checkout: &Path, expected_commit: &str) -> Result<bool, String> {
    let output = Command::new("git")
        .args(["-C"])
        .arg(checkout)
        .args(["rev-parse", "HEAD"])
        .stderr(Stdio::null())
        .output()
        .map_err(|error| format!("read git HEAD for {}: {error}", checkout.display()))?;

    if !output.status.success() {
        return Ok(false);
    }

    let head = String::from_utf8(output.stdout)
        .map_err(|error| format!("git HEAD is not UTF-8 for {}: {error}", checkout.display()))?;

    Ok(head.trim() == expected_commit)
}
