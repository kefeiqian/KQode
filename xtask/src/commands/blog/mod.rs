use crate::commands::CommandSpec;

pub mod build;
pub mod install;
pub mod serve;
pub mod typecheck;

pub const INSTALL: CommandSpec = CommandSpec {
    name: "blog-install",
    description: "Install the Docusaurus blog dependencies with Bun",
    run: install::run,
};

pub const BUILD: CommandSpec = CommandSpec {
    name: "blog-build",
    description: "Build the Docusaurus blog",
    run: build::run,
};

pub const TYPECHECK: CommandSpec = CommandSpec {
    name: "blog-typecheck",
    description: "Run the Docusaurus blog TypeScript typecheck",
    run: typecheck::run,
};

pub const SERVE: CommandSpec = CommandSpec {
    name: "blog-serve",
    description: "Serve the Docusaurus blog locally",
    run: serve::run,
};

pub const COMMANDS: &[CommandSpec] = &[INSTALL, BUILD, TYPECHECK, SERVE];
