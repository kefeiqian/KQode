use std::path::Path;

use crate::support::bun;

pub fn run(repo_root: &Path) -> Result<(), String> {
    bun::run(repo_root, &["run", "test"])
}
