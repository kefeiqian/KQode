# KQode distribution registration guide

This guide walks a maintainer through publishing the standalone `kqode` executable
through the four supported channels: **GitHub Release direct download**, **npm
global install**, **Homebrew**, and **winget**.

Every channel distributes the *same* per-platform standalone executable. Package
managers are thin installers that select or download that executable; none of
them build KQode from source or require Cargo, Node, or npm at runtime (except
npm, which is itself the installer for the npm channel).

## Scope

In scope:

- Building direct-download release archives and checksums.
- Uploading them as GitHub Release assets (automated by
  `.github/workflows/release.yml`).
- Manually registering/publishing the npm, Homebrew, and winget packages that
  point at those GitHub Release asset URLs.

Deferred (not covered here, intentionally out of scope for this slice):

- Automated registry publishing, Homebrew tap submission, and winget submission
  from CI.
- Code signing, notarization, and auto-update.

## Artifacts

`cargo xtask package-release` produces, for the **current host target**, under
`tui/dist/release/`:

```text
tui/dist/release/
  kqode-<target>.tar.gz | kqode-<target>.zip   # the standalone executable
  kqode-<target>.sha256                          # single-line checksum
  checksums.txt                                  # aggregate of this run
```

The `.github/workflows/release.yml` pipeline runs that command on one native
runner per target, then a final release job downloads every target's archive and
`.sha256`, concatenates them into a single aggregate `checksums.txt`, and uploads
all archives plus `checksums.txt` to the GitHub Release.

## Target matrix

| Release target        | Archive                     | npm platform package        |
| --------------------- | --------------------------- | --------------------------- |
| `kqode-darwin-arm64`  | `kqode-darwin-arm64.tar.gz` | `@kqode/cli-darwin-arm64`   |
| `kqode-darwin-x64`    | `kqode-darwin-x64.tar.gz`   | `@kqode/cli-darwin-x64`     |
| `kqode-linux-arm64`   | `kqode-linux-arm64.tar.gz`  | `@kqode/cli-linux-arm64`    |
| `kqode-linux-x64`     | `kqode-linux-x64.tar.gz`    | `@kqode/cli-linux-x64`      |
| `kqode-windows-arm64` | `kqode-windows-arm64.zip`   | `@kqode/cli-win32-arm64`    |
| `kqode-windows-x64`   | `kqode-windows-x64.zip`     | `@kqode/cli-win32-x64`      |

Release archive names use conventional OS names (`windows`). npm platform
packages use Node's `process.platform` key (`win32`) because the root selector
resolves them at install time from `process.platform`/`process.arch`.

## Building artifacts

Local (host target only):

```bash
cargo xtask package-release
```

This builds the release backend, Bun-compiles the standalone executable, then
archives it with a checksum. Cross-platform artifacts are produced by CI on
native runners; a single machine only builds its own target.

## 1. GitHub Release direct download

1. Push a version tag to trigger `.github/workflows/release.yml`:

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

   (Or run the workflow via **Actions → Release → Run workflow** for a
   release-candidate dry run.)

2. The workflow creates/updates the GitHub Release for the tag and uploads:

   - `kqode-<target>.tar.gz` / `kqode-<target>.zip` for every target,
   - `kqode-<target>.sha256` for every target,
   - the aggregate `checksums.txt`.

3. Asset URLs follow this shape (used by the npm/Homebrew/winget steps below):

   ```text
   https://github.com/<owner>/<repo>/releases/download/v0.1.0/kqode-<target>.tar.gz
   https://github.com/<owner>/<repo>/releases/download/v0.1.0/checksums.txt
   ```

4. Users verify a download against the published checksum:

   ```bash
   # POSIX
   shasum -a 256 -c kqode-darwin-arm64.sha256

   # Windows (PowerShell)
   (Get-FileHash kqode-windows-x64.zip -Algorithm SHA256).Hash
   ```

## 2. npm

npm distributes a thin root `kqode` package plus one `@kqode/cli-<target>`
optional dependency per platform. The root `bin` runs a small selector
(`packaging/npm/kqode/bin/kqode.cjs` + `lib/resolve.cjs`) that locates the
executable inside the installed platform package for the host
`process.platform`/`process.arch`. The root `bin` never runs a JavaScript
runtime copy of the TUI. npm's `os`/`cpu` fields gate *installation*, not
publishing, so all packages can be published from one machine.

### What to register and set (one-time)

1. An **npm account** (npmjs.com) that will own the packages.
2. Create the **`@kqode` organization/scope** (npmjs.com → Add Organization →
   `kqode`; the free plan covers public packages) so `@kqode/cli-*` can be
   published, and own the unscoped **`kqode`** name (the first publish claims it).
3. Generate an npm **Automation** access token (Access Tokens → Generate → an
   Automation token bypasses 2FA in CI; or a Granular token with read/write to
   the `@kqode` scope and the `kqode` package).
4. Add it as the GitHub repo secret **`NPM_TOKEN`** (Settings → Secrets and
   variables → Actions → New repository secret).
5. For supply-chain **provenance**, keep the repo public — the workflow auto-adds
   `--provenance` on public repos (it has `id-token: write`); on private repos it
   is skipped.

### Automated publishing (recommended)

`.github/workflows/npm-publish.yml` downloads a Release's archives, assembles all
packages, and publishes them (platform packages first, root last), skipping any
version already on npm. Trigger it from **Actions → Publish npm → Run workflow**
and enter the tag (e.g. `v0.1.0`).

> A Release created by `release.yml`'s `GITHUB_TOKEN` does not re-trigger the
> `release: published` event, so the manual dispatch above is the reliable path.

### Assemble all packages locally (one machine)

The assembler turns the six release archives into the full npm layout under
`packaging/npm/dist/`, so you do not need to build on all six OSes:

```bash
# Point it at a directory holding the downloaded release archives:
bun tui/scripts/stageNpmFromRelease.ts --from=<dir-of-archives> --out=packaging/npm/dist
# Or, when the archives already sit in tui/dist/release/:
cargo xtask package-npm
```

`stage:npm` (`cd tui && bun run stage:npm`) stages only the **host** platform
package from a freshly built `tui/dist/kqode` — handy for local testing.

### Manual publishing

```bash
# Platform packages first (each declares matching os/cpu):
cd packaging/npm/dist/@kqode/cli-<target> && npm publish --access public
# Root last, so its optionalDependencies resolve:
cd packaging/npm/dist/kqode && npm publish --access public
```

Users then install with `npm install -g kqode`.

## 3. Homebrew

Homebrew consumes the POSIX (`darwin`/`linux`) `.tar.gz` release assets. Create a
formula in your tap that points at the GitHub Release URLs and pins the
published `sha256` values (from `checksums.txt`):

```ruby
class Kqode < Formula
  desc "Rust-core coding-agent harness with a TypeScript Ink terminal UI"
  homepage "https://github.com/<owner>/<repo>"
  version "0.1.0"

  on_macos do
    on_arm do
      url "https://github.com/<owner>/<repo>/releases/download/v0.1.0/kqode-darwin-arm64.tar.gz"
      sha256 "<sha256 from checksums.txt>"
    end
    on_intel do
      url "https://github.com/<owner>/<repo>/releases/download/v0.1.0/kqode-darwin-x64.tar.gz"
      sha256 "<sha256 from checksums.txt>"
    end
  end

  def install
    bin.install "kqode"
  end
end
```

Register by creating a tap repo (`homebrew-<tap>`), committing the formula under
`Formula/`, and instructing users to
`brew install <owner>/<tap>/kqode`.

## 4. winget

winget consumes the Windows `.zip` release assets. Author a manifest set
(version, installer, locale) for submission to
[microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs). The installer
manifest points at the GitHub Release URL and pins the published `SHA256`:

```yaml
# KQode.KQode.installer.yaml (excerpt)
PackageIdentifier: KQode.KQode
PackageVersion: 0.1.0
Installers:
  - Architecture: x64
    InstallerType: zip
    InstallerUrl: https://github.com/<owner>/<repo>/releases/download/v0.1.0/kqode-windows-x64.zip
    InstallerSha256: <SHA256 from checksums.txt>
    NestedInstallerType: portable
    NestedInstallerFiles:
      - RelativeFilePath: kqode.exe
```

Submit via a pull request to `microsoft/winget-pkgs`. Users then install with
`winget install KQode.KQode`.

## Verifying provenance

The release workflow publishes checksums alongside the archives and, where the
platform feature is available, GitHub artifact attestations for the release
assets. Downstream package-manager registrations should pin the `sha256`/`SHA256`
values from the release `checksums.txt`, and verifiers can additionally check
attestations with `gh attestation verify <file> --repo <owner>/<repo>`.
