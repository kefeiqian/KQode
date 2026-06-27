use std::path::Path;

use crate::commands::{CommandSpec, all_commands};

const COMMAND_NAME_WIDTH: usize = 30;

pub const COMMAND: CommandSpec = CommandSpec {
    name: "help",
    description: "Show available xtask commands",
    run,
};

pub fn run(_repo_root: &Path) -> Result<(), String> {
    println!("Available xtask commands:");
    for command in all_commands() {
        print_command(command);
    }
    Ok(())
}

fn print_command(command: &CommandSpec) {
    let name = command.name;
    let description = command.description;
    println!("  {name:<COMMAND_NAME_WIDTH$} {description}");
}
