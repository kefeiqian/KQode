use std::path::Path;

use crate::support::{git, paths, workspace};

const CHECKOUT_DIR: &str = "vite-react-template";
const TEMPLATE_PATH: &str = "packages/create-vite/template-react";
const VITE_REPOSITORY: &str = "https://github.com/vitejs/vite.git";
const VITE_REF: &str = "v7.3.6";
const VITE_COMMIT: &str = "0a7b53ba230c6e68f502a89864534c607d393ab7";

pub fn run(repo_root: &Path) -> Result<(), String> {
    let checkout = paths::fixture_sources_root(repo_root).join(CHECKOUT_DIR);

    ensure_cached_checkout(&checkout)?;

    let source = checkout.join(TEMPLATE_PATH);
    let target = paths::workspace(repo_root);
    workspace::reset_from_dir(&source, &target)?;

    println!(
        "prepared react-complex workspace from {VITE_REPOSITORY} at {}",
        target.display()
    );
    Ok(())
}

/// Reuses the sparse checkout only when it still matches the pinned Vite commit.
///
/// If the cache is missing, corrupt, or points at a different commit, it is
/// deleted and recreated from the pinned Vite tag before the workspace copy.
///
/// # Errors
///
/// Returns an error when the cache cannot be removed or created, Git fails, the
/// checkout does not resolve to the pinned commit, or the sparse template path
/// is absent after checkout.
fn ensure_cached_checkout(checkout: &Path) -> Result<(), String> {
    let template = checkout.join(TEMPLATE_PATH);

    if template.is_dir() && git::head_matches(checkout, VITE_COMMIT)? {
        println!(
            "using cached react-complex fixture source at {}",
            checkout.display()
        );
        return Ok(());
    }

    workspace::remove_existing(checkout)?;
    if let Some(parent) = checkout.parent() {
        std::fs::create_dir_all(parent).map_err(|error| {
            format!("create fixture source parent {}: {error}", parent.display())
        })?;
    }

    git::clone_sparse_at_ref(VITE_REPOSITORY, VITE_REF, TEMPLATE_PATH, checkout)?;

    if !git::head_matches(checkout, VITE_COMMIT)? {
        Err(format!(
            "react-complex fixture checkout did not resolve to pinned commit {VITE_COMMIT}"
        ))
    } else if template.is_dir() {
        Ok(())
    } else {
        Err(format!(
            "react-complex fixture template missing after clone: {}",
            template.display()
        ))
    }
}
