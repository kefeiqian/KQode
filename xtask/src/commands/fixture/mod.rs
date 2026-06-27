use crate::commands::CommandSpec;

pub mod prepare_react_complex;
pub mod prepare_react_simple;

pub const PREPARE_REACT_SIMPLE: CommandSpec = CommandSpec {
    name: "fixture-prepare-react-simple",
    description: "Reset workspace from the committed simple React fixture",
    run: prepare_react_simple::run,
};

pub const PREPARE_REACT_COMPLEX: CommandSpec = CommandSpec {
    name: "fixture-prepare-react-complex",
    description: "Reset workspace from the cached official Vite React template",
    run: prepare_react_complex::run,
};

pub const COMMANDS: &[CommandSpec] = &[PREPARE_REACT_SIMPLE, PREPARE_REACT_COMPLEX];
