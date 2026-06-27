use std::{fs, io, path::Path};

/// Replaces a workspace via copy-then-swap so failed copies do not destroy the old target.
///
/// The new tree is first copied into a temporary sibling. The current target is
/// moved to a backup only after the copy succeeds, and that backup is restored
/// if activating the temporary directory fails.
///
/// # Errors
///
/// Returns an error when `source` is missing, parent directories cannot be
/// created, the temporary copy fails, or the final swap cannot be completed.
pub fn reset_from_dir(source: &Path, target: &Path) -> Result<(), String> {
    if !source.is_dir() {
        return Err(format!(
            "workspace source directory does not exist: {}",
            source.display()
        ));
    }

    let parent = target
        .parent()
        .ok_or_else(|| format!("workspace target has no parent: {}", target.display()))?;
    let temporary = sibling_path(target, "tmp")?;
    let backup = sibling_path(target, "backup")?;

    fs::create_dir_all(parent)
        .map_err(|error| format!("create workspace parent {}: {error}", parent.display()))?;
    remove_existing(&temporary)?;
    remove_existing(&backup)?;

    copy_dir(source, &temporary).map_err(|error| {
        let _ = remove_existing(&temporary);
        format!(
            "copy {} to temporary workspace {}: {error}",
            source.display(),
            temporary.display()
        )
    })?;

    if target.exists() {
        fs::rename(target, &backup)
            .map_err(|error| format!("move existing workspace to backup: {error}"))?;
    }

    if let Err(error) = fs::rename(&temporary, target) {
        let _ = restore_backup(&backup, target);
        return Err(format!(
            "activate temporary workspace {}: {error}",
            temporary.display()
        ));
    }

    remove_existing(&backup)
}

pub fn remove_existing(path: &Path) -> Result<(), String> {
    if path.is_dir() {
        fs::remove_dir_all(path)
            .map_err(|error| format!("remove existing directory {}: {error}", path.display()))
    } else if path.exists() {
        fs::remove_file(path)
            .map_err(|error| format!("remove existing file {}: {error}", path.display()))
    } else {
        Ok(())
    }
}

fn copy_dir(source: &Path, target: &Path) -> io::Result<()> {
    fs::create_dir_all(target)?;

    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let source_path = entry.path();
        let target_path = target.join(entry.file_name());

        if file_type.is_dir() {
            copy_dir(&source_path, &target_path)?;
        } else if file_type.is_file() {
            fs::copy(&source_path, &target_path)?;
        }
    }

    Ok(())
}

fn restore_backup(backup: &Path, target: &Path) -> io::Result<()> {
    if backup.exists() && !target.exists() {
        fs::rename(backup, target)?;
    }

    Ok(())
}

fn sibling_path(path: &Path, suffix: &str) -> Result<std::path::PathBuf, String> {
    let file_name = path
        .file_name()
        .ok_or_else(|| format!("path has no file name: {}", path.display()))?
        .to_string_lossy();

    Ok(path.with_file_name(format!("{file_name}.{suffix}")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn missing_source_preserves_existing_workspace() {
        let root = unique_test_dir("missing-source");
        let source = root.join("missing");
        let target = root.join("workspace");
        fs::create_dir_all(&target).unwrap();
        fs::write(target.join("package.json"), "{}").unwrap();

        let error = reset_from_dir(&source, &target).unwrap_err();

        assert!(error.contains("source directory does not exist"));
        assert!(target.join("package.json").is_file());
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn reset_copies_source_into_workspace() {
        let root = unique_test_dir("reset");
        let source = root.join("source");
        let target = root.join("workspace");
        fs::create_dir_all(&source).unwrap();
        fs::write(source.join("package.json"), "{\"name\":\"fixture\"}").unwrap();

        reset_from_dir(&source, &target).unwrap();

        assert_eq!(
            fs::read_to_string(target.join("package.json")).unwrap(),
            "{\"name\":\"fixture\"}"
        );
        let _ = fs::remove_dir_all(root);
    }

    fn unique_test_dir(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("kqode-xtask-{name}-{}", std::process::id()))
    }
}
