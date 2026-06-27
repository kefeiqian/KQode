use std::path::Path;

use crate::support::{paths, workspace};

const FIXTURE_SOURCE: &str = "tests/fixtures/dummy-react-app";

pub fn run(repo_root: &Path) -> Result<(), String> {
    let source = repo_root.join(FIXTURE_SOURCE);
    let target = paths::workspace(repo_root);

    workspace::reset_from_dir(&source, &target)?;
    println!("prepared react-simple workspace at {}", target.display());
    Ok(())
}
