---
title: "Reproducible builds"
description: "Verify that deployed canister Wasm matches the source code using deterministic builds"
sidebar:
  order: 7
---

A reproducible build produces the same WebAssembly module byte-for-byte whenever anyone compiles the same source code in the same documented environment. For canisters, this matters because ICP lets anyone query a canister's Wasm hash: but only a reproducible build makes that hash meaningful. Without it, a published hash cannot be linked to readable source code.

This guide explains how to structure your canister project for reproducibility, how to use Docker to standardize build environments, and how users can verify a deployed canister using `icp canister status`.

## Why reproducibility matters

ICP does not expose a canister's Wasm module directly. Only its SHA-256 hash. This is a deliberate privacy measure: developers may want to keep source code private. However, if you do publish your source code, a reproducible build lets users confirm that the hash matches what they compiled themselves.

This is most important for canisters that hold other users' funds or execute critical operations. Before interacting with such a canister, a cautious user can:

1. Obtain the deployed Wasm hash from ICP
2. Reproduce the build from your published source
3. Compare the hashes

If the hashes match and the canister's controllers cannot change the code (see [immutable canisters](#immutable-canisters)), the user can have high confidence in what the canister runs.

See [Security Model](../../concepts/security.md) for the broader trust model.

## Obtaining the deployed Wasm hash

Use `icp canister status` with the canister ID to retrieve the current module hash from ICP:

```bash
icp canister status rdmx6-jaaaa-aaaaa-aaadq-cai -n ic
```

The output includes the module hash alongside cycle balance, controller list, and other status fields. Anyone can query this hash. No controller access is required. Use `-p` / `--public` to explicitly read only public information from the state tree:

```bash
icp canister status rdmx6-jaaaa-aaaaa-aaadq-cai -n ic --public
```

:::note
The `--public` flag (`-p`) skips the management canister query and reads only the publicly available fields from the state tree. This works even when you are not a controller.
:::

The hash reflects the **current** Wasm installed in the canister. A controller can upgrade the canister at any time, changing this hash.

### Immutable canisters

If the canister's controller list is empty, or the only controller is a blackhole canister (a canister that accepts no instructions), no one can change the code. The hash you read is permanent. For canisters in this state, the build verification gives a much stronger trust guarantee.

## Requirements for a reproducible build

To allow users to reproduce your build, you must publish:

1. **The exact source code** used to build the deployed Wasm: typically a tagged commit in a public repository, or an archived source package
2. **A complete description of the build environment**: operating system, compiler versions, toolchain versions, and any relevant environment variables
3. **Deterministic build instructions**: a script or `Dockerfile` that produces the same output when run in the described environment

### Pinning dependencies

Non-determinism often comes from unpinned dependencies, not the build tools themselves.

**For Rust projects:** Cargo generates a `Cargo.lock` file with fixed versions of all transitive dependencies. Commit this file and use the `--locked` flag when building:

```bash
cargo build --locked --target wasm32-unknown-unknown --release
```

Without `--locked`, Cargo may resolve to newer compatible versions and produce a different Wasm.

**For npm projects:** Running `npm install` generates or updates `package-lock.json`. Commit the lockfile, then use `npm ci` (not `npm install`) to reproduce the exact installation:

```bash
npm ci
```

`npm ci` installs exactly what is in `package-lock.json` and fails if it would require changes, making it safe for reproducible builds.

### Sources of non-determinism to avoid

- Randomness or timestamps embedded in build outputs
- Absolute file paths compiled into the binary (use `--remap-path-prefix` for Rust)
- Environment variables like timezone or locale affecting build output
- Third-party build plugins that do not guarantee determinism
- Directory traversal order (file ordering may vary across operating systems)

For Rust, the `--remap-path-prefix` flag normalizes source paths in the binary so they do not depend on where the source lives on the builder's machine:

```bash
export RUSTFLAGS="--remap-path-prefix $(readlink -f $(dirname ${0}))=/build --remap-path-prefix ${CARGO_HOME}=/cargo"
cargo build --locked --target wasm32-unknown-unknown --release
```

### Language-specific notes

**Motoko:** The Motoko compiler aims to be deterministic. If you observe non-determinism, file an issue at [github.com/dfinity/motoko](https://github.com/dfinity/motoko/issues/new/choose).

**Rust:** Known potential non-determinism issues are tracked under the [A-reproducibility label](https://github.com/rust-lang/rust/labels/A-reproducibility) in the Rust repository. If you observe differences between builds on Linux and macOS, pin the build platform and version using Docker.

**Webpack:** Since version 5, webpack supports [deterministic naming of module and chunk IDs](https://webpack.js.org/configuration/optimization/). Enable this option for frontend builds.

## Build environments using Docker

Docker is the standard approach for distributing reproducible build environments. A `Dockerfile` pins the operating system and toolchain versions so anyone building your canister works in an identical environment.

:::caution
Pin your Docker builds to `x86_64`. Builds are generally not reproducible across CPU architectures. If you develop on Apple Silicon (M-series), use [lima](https://github.com/lima-vm/lima) to run an x86_64 Linux VM: lima is more stable than Docker Desktop or Docker Machine for this use case on macOS.
:::

### Example Dockerfile for a Rust canister

The following `Dockerfile` creates a fully pinned Rust build environment:

```dockerfile title="Dockerfile"
FROM ubuntu:22.04

ENV NVM_DIR=/root/.nvm
ENV NVM_VERSION=v0.39.1
ENV NODE_VERSION=18.1.0

ENV RUSTUP_HOME=/opt/rustup
ENV CARGO_HOME=/opt/cargo
ENV RUST_VERSION=1.82.0

# Install system dependencies
RUN apt -yq update && \
    apt -yqq install --no-install-recommends curl ca-certificates \
        build-essential pkg-config libssl-dev llvm-dev liblmdb-dev clang cmake rsync

# Install Node.js using nvm
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin:${PATH}"
RUN curl --fail -sSf https://raw.githubusercontent.com/creationix/nvm/${NVM_VERSION}/install.sh | bash
RUN . "${NVM_DIR}/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "${NVM_DIR}/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "${NVM_DIR}/nvm.sh" && nvm alias default v${NODE_VERSION}

# Install Rust and Cargo
ENV PATH=/opt/cargo/bin:${PATH}
RUN curl --fail https://sh.rustup.rs -sSf \
        | sh -s -- -y --default-toolchain ${RUST_VERSION}-x86_64-unknown-linux-gnu --no-modify-path && \
    rustup default ${RUST_VERSION}-x86_64-unknown-linux-gnu && \
    rustup target add wasm32-unknown-unknown && \
    cargo install ic-wasm

COPY . /canister
WORKDIR /canister
```

Key design choices in this `Dockerfile`:

- **Official base image**: starting from `ubuntu:22.04` gives users a trusted, unmodified foundation
- **Direct installation, not package managers**: package managers do not pin transitive dependencies reliably; installing tools directly with fixed version numbers ensures everyone gets the same binary
- **`ic-wasm` included**: required for Wasm shrinking, which strips debug info and reduces file size

Place this `Dockerfile` in your canister project directory. Build the container image:

```bash
docker build -t mycanister .
```

Start an interactive shell inside the container to experiment with build steps:

```bash
docker run -it --rm mycanister
```

Once your build steps are deterministic, add them to the `Dockerfile`:

```dockerfile
RUN ./build_script.sh
```

### Example build script

```bash title="build_script.sh"
#!/bin/bash
# Remap source paths so absolute paths do not leak into the binary
export RUSTFLAGS="--remap-path-prefix $(readlink -f $(dirname ${0}))=/build --remap-path-prefix ${CARGO_HOME}=/cargo"
cargo build --locked --target wasm32-unknown-unknown --release
ic-wasm target/wasm32-unknown-unknown/release/example_backend.wasm -o example_backend.wasm shrink
```

## Deploying a verified prebuilt Wasm

If you have already built a Wasm and computed its hash, you can deploy it using the `@dfinity/prebuilt` recipe in `icp.yaml`. The recipe verifies the hash before deploying, ensuring the file has not been modified since you computed the hash.

```yaml title="icp.yaml"
canisters:
  - name: my-canister
    recipe:
      type: "@dfinity/prebuilt@v2.0.0"
      configuration:
        path: dist/my-canister.wasm
        sha256: d7c1aba0de1d7152897aeca49bd5fe89a174b076a0ee1cc3b9e45fcf6bde71a6
```

Compute the hash for your Wasm file with `sha256sum`:

```bash
sha256sum dist/my-canister.wasm
```

The recipe will fail with a hash mismatch error if the Wasm file does not match the declared `sha256`. This makes it safe to check the hash into version control alongside the path: users and CI pipelines can reproduce the deployment exactly.

Optional recipe parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | required | Local path to the prebuilt Wasm |
| `sha256` | string | - | SHA-256 hash for integrity verification |
| `shrink` | boolean | `false` | Remove unused functions and debug info |
| `compress` | boolean | `false` | Gzip compress the Wasm |
| `metadata` | array | `[]` | Custom metadata key-value pairs to inject |

The `shrink` and `compress` options require `ic-wasm`. If you installed icp-cli via npm (`npm install -g @icp-sdk/icp-cli`), `ic-wasm` is included automatically.

See the [recipe reference](https://github.com/dfinity/icp-cli-recipes/tree/main/recipes/prebuilt) for the full parameter documentation.

## Testing reproducibility

To confirm your build is actually reproducible, use [reprotest](https://salsa.debian.org/reproducible-builds/reprotest). It runs your build twice in environments that differ in paths, file ordering, and other variables, then compares the outputs.

Add `reprotest` to your `Dockerfile`:

```dockerfile
RUN apt -yqq install --no-install-recommends reprotest disorderfs faketime rsync sudo wabt
```

Then, inside the running container:

```bash
mkdir artifacts
reprotest -vv --store-dir=artifacts --variations '+all,-time' \
  'icp build' \
  '.icp/cache/artifacts/*/*.wasm'
```

:::note
The `--variations '+all,-time'` flag excludes the time variation. The Rust compiler uses `jemalloc` for memory allocation, which is [not compatible](https://github.com/wolfcw/libfaketime/issues/130) with `faketime` used by `reprotest` to simulate time changes.
:::

If the two builds produce identical output, `reprotest` reports `Reproduction successful`. You can then compare the hash of the local artifact against the deployed canister:

```bash
sha256sum .icp/cache/artifacts/my-canister/my-canister.wasm
# compare against: icp canister status <canister-id> -n ic
```

If the hashes match, the deployed canister is running what the source code says it runs.

For deeper investigation of reproducibility failures, consider [DetTrace](https://github.com/dettrace/dettrace), a container abstraction that attempts to make arbitrary builds fully deterministic. Run `reprotest` under multiple host operating systems to catch platform-specific differences.

## Long-term considerations

Maintaining a reproducible build over years requires more than getting it working once.

**Toolchain availability:** Package archives and distribution mirrors may drop old versions. Back up your entire toolchain and all dependencies. Projects like [Software Heritage](https://www.softwareheritage.org/) archive source code at scale and are worth contributing to.

**Dependency URLs:** URLs in build scripts can stop working. Pin all external downloads to content-addressed locations where possible, and archive what you cannot pin.

**Build evolution:** Even if you must update the build process to adapt to toolchain changes, reproducibility is maintained as long as the same process always produces the same Wasm. Document every change with a commit note explaining what changed and why.

## Next steps

- [Canister lifecycle](lifecycle.md): deploy and upgrade workflow
- [Canister settings](settings.md): configure controllers and make canisters immutable
- [Cycles management](cycles-management.md): top up canisters before long-term deployment
- [Trust in canisters](trust-in-canisters.md): how users can use reproducible build verification to assess whether a canister is safe to interact with

<!-- Upstream: informed by dfinity/portal — docs/building-apps/best-practices/reproducible-builds.mdx; dfinity/icp-cli-recipes — recipes/prebuilt/README.md, recipe.hbs; dfinity/icp-cli — docs/guides/using-recipes.md -->
