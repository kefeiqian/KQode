# kqode

The `kqode` command-line interface. Installing this package pulls in the prebuilt
standalone executable for your platform as an optional dependency and exposes it
as the `kqode` binary.

```bash
npm install -g kqode
kqode
```

## How it works

`kqode` ships no platform binary itself. Instead it declares one
`@kqode/cli-<platform>-<arch>` optional dependency per supported target, each
carrying a single self-contained executable (the Rust backend is embedded inside
it). npm installs only the package whose `os`/`cpu` match the host, and the
`bin/kqode.cjs` selector resolves that package and executes its binary, forwarding
all arguments, stdio, and the exit code.

Because the executable is self-contained, running `kqode` needs neither a Node
runtime at execution time nor a Rust toolchain.

## Supported platforms

`darwin-arm64`, `darwin-x64`, `linux-arm64`, `linux-x64`, `win32-arm64`,
`win32-x64`. On an unsupported host, or if optional dependencies were disabled
during install, `kqode` prints an actionable error instead of failing silently.
