---
name: adopting-toolkit-hub
description: Use when adding, updating or removing a @radoslavirha/* toolkit dependency in a pnpm project, when an install fails with 401/404 from GitHub Packages, or when deciding whether a toolkit package also ships agent skills and how to install them. Covers the pnpm install, the marketplace lookup, and keeping the npm dependency and its skill in step.
---

# Adopting toolkit-hub packages and their skills

Two things travel together: the **npm package** (code, from GitHub Packages) and its
**agent skill** (guidance, from the APM marketplace in `radoslavirha/toolkit-hub`).
Adopt both, or an agent works against the package without knowing how it is meant to be used.

## 1. Registry access (once per repo)

Toolkit packages are published to **GitHub Packages**, not npmjs.org. Without both lines
below, installs fail with `404 Not Found` (missing scope mapping) or `401 Unauthorized`
(missing token).

```ini
# .npmrc - committed
@radoslavirha:registry=https://npm.pkg.github.com/
```

```ini
# ~/.npmrc or CI secret - NEVER committed
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

The token needs `read:packages`. In GitHub Actions, `secrets.GITHUB_TOKEN` is enough;
`actions/setup-node` with `registry-url: https://npm.pkg.github.com/` and
`scope: '@radoslavirha'` wires it up.

## 2. Install the package

Always install the latest published version; do not hand-pick an older one. Everything in
this toolkit is developed against its own newest release.

```bash
# In a pnpm workspace, install into the workspace member that needs it
pnpm --filter YOUR_SERVICE add @radoslavirha/utils@latest

# Root-level tooling (configs) goes to the root as a dev dependency
pnpm add -Dw @radoslavirha/config-eslint@latest
```

If the repo uses a pnpm catalog, add the version to the catalog in `pnpm-workspace.yaml`
and reference `catalog:` from the member instead of pinning per package.

To see what versions exist:

```bash
pnpm view @radoslavirha/utils versions
```

## 3. Check whether that package ships a skill

The marketplace is the authoritative list — not every package has one yet.

```bash
apm marketplace add radoslavirha/toolkit-hub    # once per machine
apm marketplace browse toolkit-hub
```

The `Version` column is the package version the skill describes, so it should match the
version you just installed. A package absent from that list simply has no skill yet; use
its README.

## 4. Install the skill

```bash
apm install utils@toolkit-hub --target claude,copilot
```

Skills land in `.agents/skills/<name>/` (Copilot and the shared agent path) and
`.claude/skills/<name>/` (Claude Code). Both are generated — never hand-edit a deployed
skill; APM refuses to manage a file it did not write, and your edit is lost on the next
update. Fix the source in `toolkit-hub` instead.

Commit `apm.yml`, `apm.lock.yaml`, and the deployed skill directories. `apm_modules/`
is generated and belongs in `.gitignore`.

## 5. Staying current

The dependency line carries no ref, so it tracks the default branch and `apm install`
warns `dependency unpinned`. That is deliberate: guidance should not lag the code it
describes. Reproducibility is preserved by `apm.lock.yaml`, which pins the exact commit
and a sha256 per deployed file — a fresh `apm install` restores precisely that state.

```bash
apm update          # move to the newest skills, rewrite the lockfile
apm deps list       # what is installed and at which commit
```

Pin only to deliberately freeze on an old major, using the tag the release already pushes:

```yaml
dependencies:
  apm:
    - git: https://github.com/radoslavirha/toolkit-hub.git
      path: packages/utils
      ref: '@radoslavirha/utils@0.8.5'
```

## 6. Keep the pair in step

| You do | Also do |
|---|---|
| Add `@radoslavirha/<pkg>` | `apm install <pkg>@toolkit-hub` if the marketplace lists it |
| Update the npm dependency | `apm update` so the skill matches the new version |
| Remove the npm dependency | `apm uninstall radoslavirha/toolkit-hub/packages/<pkg>` |

A skill left behind after its package is gone is worse than no skill: it advertises APIs
the project no longer has.
