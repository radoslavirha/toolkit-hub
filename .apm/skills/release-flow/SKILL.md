---
name: release-flow
description: Use when releasing toolkit-hub packages, deciding whether a change needs a changeset, reviewing a Version Packages PR, or investigating why apm.yml and marketplace.json versions disagree with package.json. Explains what triggers versioning, what runs during it, and what must never be hand-edited.
---

# Release flow

Changesets drives versions; APM metadata rides along automatically.

## The chain

1. **You add a changeset** — `pnpm changeset` writes `.changeset/<name>.md` naming the
   packages and bump types. It travels in the feature PR.
2. **Merge to `main`** → `release.yml` runs `changesets/action@v2`:
   - **Changesets present** → runs `pnpm run version`, which is
     `changeset version && pnpm sync:apm-versions && pnpm build:marketplace`, and opens the
     **Version Packages** PR containing bumped `package.json` files, CHANGELOGs, each
     package's `apm.yml`, and a regenerated `.claude-plugin/marketplace.json`.
   - **No changesets, unpublished versions present** → runs `pnpm changeset publish`:
     publishes to GitHub Packages and pushes tags `@radoslavirha/<pkg>@<version>`.
3. **Merge the Version Packages PR** → the second branch above fires and publishes.

So APM versions update *inside* `changeset version`, only ever when a changeset exists.

## What needs a changeset

- Any change to a package's code
- **A change to a package's skill** — it changes what consumers get, even though skills are
  not in the npm tarball (`files` is `dist`, `package.json`, `README.md`)
- Not: repo tooling, workflows, root-level docs

Expect a cascade: `updateInternalDependencies: "patch"` means a `utils` patch also bumps the
`tsed-*` packages that depend on it. That is normal dependency behaviour, not a mistake.

## Never hand-edit

- `<pkg>/apm.yml` version — written by `scripts/sync-apm-versions.sh`
- `.claude-plugin/marketplace.json` — written by `apm pack`

To check they agree with `package.json`:

```bash
pnpm check:apm-versions      # exits 1 on mismatch
apm marketplace check        # every marketplace entry resolves
```

`apm-plugins/*` are the exception: they have no npm package, sit outside the sync script's globs (`packages/*`, `config/*`,
`tsed/*`), and their versions are bumped by hand.

## Toolchain facts worth knowing

- Changesets **CLI v3** is required — `changesets/action@v2` validates this and rejects v2.
- v2 renamed the inputs (`publish` → `publish-script`, `version` → `version-script`) and no
  longer reads a `GITHUB_TOKEN` env var; the token goes in the `github-token` input. npm auth
  comes from `actions/setup-node` (`registry-url` + `scope`).
- `release.yml` installs the APM CLI via `microsoft/apm-action` with `setup-only: true`.
- `changeset version` exits 1 when there are no changesets; the action gates on that, so it
  only matters if you run the script by hand.
