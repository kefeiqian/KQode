# npm distribution

This directory holds the npm distribution scaffold for the `kqode` CLI. It does
not publish anything; it defines the package shape and a local staging step.

## Layout

```text
packaging/npm/
  kqode/                     # the published root package (committed)
    package.json             #   name "kqode", bin selector, per-platform optionalDependencies
    bin/kqode.cjs            #   selector: resolve the platform package, exec its binary
    lib/resolve.cjs          #   pure platform → package-name mapping
    test/resolve.test.cjs    #   node:test for the mapping (run with `node --test`)
  dist/                      # generated, git-ignored staging output (see below)
```

## Design

The root `kqode` package contains no binary. Each supported target has its own
`@kqode/cli-<platform>-<arch>` package that ships one self-contained executable
(the Rust backend is embedded inside it by `bun build --compile`; see
`tui/scripts/buildPackaged.ts`). Those platform packages are listed as
`optionalDependencies` and carry `os`/`cpu` fields, so npm installs only the one
matching the host. The selector then `exec`s that binary.

This mirrors the proven native-binary distribution pattern used by tools such as
esbuild and swc: no build on the user's machine, no postinstall, and an
unsupported platform is skipped rather than fatal.

## Staging the host platform package

After building the executable (`cargo xtask package`), assemble the
publish-ready layout for the current host into `dist/`:

```bash
cd tui
bun run stage:npm
```

This writes `dist/kqode/` (the root package with versions stamped) and
`dist/@kqode/cli-<host>/` (the platform package containing the executable). The
other five platform packages are produced on their respective CI runners.

## Deferred

The cross-platform build matrix, release archives/checksums, the GitHub Release
pipeline, and the Homebrew/winget registration guide are intentionally out of
scope here and tracked as later release work.
