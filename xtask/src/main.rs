mod commands;
mod support;

use std::{env, process::ExitCode};

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("xtask failed: {error}");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<(), String> {
    let repo_root = support::paths::repo_root();
    let command = env::args().nth(1);

    commands::run(command.as_deref(), &repo_root)
}
