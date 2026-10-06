---
name: releasing-packages
description: Use when releasing toolkit-hub packages, deciding whether a change needs a changeset, writing a changeset file, reviewing a Version Packages PR, or investigating why apm.yml and marketplace.json versions disagree with package.json. Explains what triggers versioning, what runs during it, and what must never be hand-edited.
---

# Releasing packages

Changesets drives versions; APM metadata rides along automatically.

## The chain

1. **You add a changeset** — a `.changeset/<name>.md` file naming the packages and bump
   types. It travels in the feature PR.
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
- Not: repo tooling, workflows, root-level docs, the maintainer skills in `.apm/skills/`

Expect a cascade: `updateInternalDependencies: "patch"` means a `utils` patch also bumps the
`tsed-*` packages that depend on it. That is normal dependency behaviour, not a mistake.

## Writing a changeset

`pnpm changeset` is interactive, so an agent cannot drive it. Write the file by hand — one
per change, named after it:

```markdown
---
"@radoslavirha/utils": patch
"@radoslavirha/tsed-mongoose": patch
---

One line describing the change from a consumer's point of view.
```

`patch` for a fix or a skill-only change, `minor` for an additive feature, `major` for a
breaking change. Name only packages you changed; the cascade adds their dependents.

## Never hand-edit

- `<pkg>/apm.yml` version — written by `scripts/sync-apm-versions.sh`
- `.claude-plugin/marketplace.json` — written by `apm pack`

`apm-plugins/*` are the exception: they have no npm package, sit outside the sync script's
globs (`packages/*`, `config/*`, `tsed/*`), and their versions are bumped by hand.

## When versions disagree

Requires the APM CLI 0.28 or later (`apm --version`). Run the checks, apply the fix for what
fails, and rerun until both pass:

```bash
pnpm check:apm-versions      # exits 1 on mismatch
apm marketplace check        # every marketplace entry resolves
```

| Failing check | Fix |
|---|---|
| `check:apm-versions` | `pnpm sync:apm-versions` — rewrites each `apm.yml` from `package.json` |
| `apm pack --check-clean` in CI | `pnpm build:marketplace` — regenerates `marketplace.json` |
| `apm marketplace check` | fix the `source:` path in the root `apm.yml` entry |

## Reviewing a Version Packages PR

```
- [ ] Every bumped package.json has a matching apm.yml version
- [ ] marketplace.json versions match the bumped packages
- [ ] CHANGELOG entries describe the change for consumers, not the implementation
- [ ] Cascade bumps are patch-level dependents of a changed package, nothing unexplained
- [ ] CI is green, including the documentation checks
```

## Toolchain facts worth knowing

- Changesets **CLI v3** is required — `changesets/action@v2` validates this and rejects v2.
- The action's inputs are `publish-script` and `version-script` (not `publish` / `version`),
  and the token goes in the `github-token` input — a `GITHUB_TOKEN` env var is ignored. npm auth
  comes from `actions/setup-node` (`registry-url` + `scope`).
- `release.yml` installs the APM CLI via `microsoft/apm-action` with `setup-only: true`.
- `changeset version` exits 1 when there are no changesets; the action gates on that, so it
  only matters if you run the script by hand.
