---
name: authoring-skills
description: Use when adding or editing any SKILL.md in toolkit-hub (package skills, apm-plugins, the maintainer skills in .apm/skills) or an agent prompt in .github/claude, after changing a package's public API so its skill may be stale, when a skill does not trigger, or when adding eval cases for a skill. Covers the file layout and marketplace entry, frontmatter and structure rules, the checks to run until clean, evals, and how skill changes reach consumers.
---

# Authoring skills and agent prompts

Skills ship the judgment that a type signature cannot: which variant to use, what not to
reimplement, which trap to avoid. They travel to consuming repos through APM, which is why
guidance consumers need must live in a skill rather than in `AGENTS.md`.

## Workflow

Copy this checklist and tick it off:

```
- [ ] 1. Place the skill (Layout)
- [ ] 2. Write name and description (Frontmatter)
- [ ] 3. Write the body (Body rules)
- [ ] 4. Register a new package skill in the root apm.yml
- [ ] 5. Add or update eval cases (Evals)
- [ ] 6. Run the checks until clean (Checks)
- [ ] 7. Changeset for a package skill / hand bump for an apm-plugins skill (Versions)
```

## Layout

Where a skill lives follows from what it describes:

| Scope | Location |
|---|---|
| One package | that package's own directory — the skill and the API it describes move together |
| Repo-level, published (adoption, service assembly) | `apm-plugins/<name>/` |
| Maintaining this repo, never published | root `.apm/skills/` |
| Nightly agents (finder, resolver, feedback) | `.github/claude/*.md` prompts — see Agent prompts |

A package plugin:

```
packages/utils/
  apm.yml                              # name, version, description, license, type: skill
  .apm/skills/using-utils/SKILL.md     # the skill; directory name is its identity
  .apm/evals/<case>/                   # eval cases, never shipped to consumers
```

The maintainer skills stay in the root `.apm/` rather than becoming another plugin: a local
path dependency would make `apm pack` refuse to build the marketplace from the same manifest
("local dependencies are for development only"), which would break both the release flow and
the CI freshness gate.

Register a new package plugin in the root `apm.yml` under `marketplace.packages`, without a
`version:` — it falls back to the package's own `apm.yml`, so the version lives in one place:

```yaml
    - name: utils
      description: Agent guidance for @radoslavirha/utils - guards, model building and mapping
      source: ./packages/utils
```

Do not set `targets:` in a package `apm.yml`. A package-level target list is a **ceiling**
consumers cannot widen: naming `[claude, copilot]` would lock out someone on Cursor or Codex.

## Frontmatter

- **`name`** — gerund first, equal to the directory name: `using-<package>` for a package
  skill, a verb-ing phrase otherwise (`writing-tests`, `releasing-packages`). Lowercase
  letters, digits and hyphens, at most 64 characters, never `anthropic` or `claude`.
- **`description`** — at most 1024 characters, no XML-like tags (write `PACKAGE`, not
  `<pkg>`). Start with `Use when …` naming the acts that should trigger it, then say what it
  covers.

The description decides whether the skill exists. An agent loads a skill by matching it —
the body is never read until then — so it must name the acts, in the words that appear in the
work, not describe the document:

- Useless: `"Guide for the utils package"` — an agent about to type `if (x !== undefined)` has
  no reason to match that.
- Useful: `"Use before writing a null/undefined/empty check, a typeof or Array.isArray test,
  a deep clone, a new Model() followed by property assignment…"`

## Body rules

- **Only what an agent cannot derive.** Which of several similar APIs applies, what is
  deprecated and what replaced it, the "do not reimplement" cases a linter cannot catch. Never
  list every method and never state a count ("four helpers") — the `.d.ts` carries the
  inventory, and counts rot (`maintaining-agents-md` has the story).
- **At most 500 lines.** Before that, move detail into a reference file directly beside
  `SKILL.md` and link it from `SKILL.md`. References stay one level deep: a reference file
  never sends the agent on to another file, because agents preview nested files with partial
  reads such as `head -100` and miss the rest.
- **A reference file over 100 lines starts with `## Contents`**, so a partial read still shows
  its scope. `pnpm check:agent-docs --fix` maintains this for READMEs.
- **Point outside the skill by exact path.** In a consuming repo a package README is
  `node_modules/@radoslavirha/<package>/README.md`, and another skill may not be installed —
  say what to read instead. Prefer inlining a short table over sending the agent elsewhere.
- **Match freedom to fragility.** Exact commands and templates for order-dependent or fragile
  steps (releases, changesets, registry auth); a principle and a default for judgment calls
  (README shape). Offer one default with an escape hatch, not a menu of options.
- **Multi-step work gets a copyable checklist; quality-critical work gets a loop** — run the
  real command, fix what it reports, rerun until clean.
- **Name the prerequisites outside `pnpm install`** — CLIs (`apm`, `gh`), runtime versions
  (Node, pnpm), services (Docker for testcontainers) — each with its version check. npm
  dependencies need no mention.
- **One term per concept.** In this repo: *document* for the Mongoose class, *model* for the
  API class, *mapper*, *repository*, *skill* for a `SKILL.md`, *plugin* for what the
  marketplace lists.
- **No dates and no "currently".** Replaced APIs go in a migration table, as `using-tsed-mongoose`
  does.

### Write claims as compilable code

Prose is unverifiable; a fenced TypeScript block can be checked against the real package.
**Every `ts` block in a skill is compiled by CI** against that package's own `tsconfig`, with
imports of the package's own name rewritten to its source entrypoint. A block that cannot
stand alone — a signature listing, a fragment continuing an earlier example — must be tagged
so it is skipped:

    ```ts ignore

Prefer making the block self-contained over tagging it. A complete example is usually only
two lines longer than a fragment, and it is the only version CI can defend.

## Agent prompts

`.github/claude/*.md` are loaded from the default branch by `.github/actions/agent-setup`, so
a PR branch cannot rewrite its own instructions. Keep that property:

- A prompt that needs another prompt reads it from the default branch —
  `git show origin/main:.github/claude/<file>` — never from the checked-out branch.
- Point at a skill for a convention instead of restating it, and give the fallback path
  `.apm/skills/<name>/SKILL.md`, because `apm install` is allowed to fail in CI.
- A procedure with more than a few steps opens with a one-line step list the agent can copy
  into `TodoWrite`.

## Evals

Each skill that consumers rely on has at least three eval cases, run with Claude Code's
built-in `claude plugin eval` (Claude Code 2.1.269 or later, `claude --version`). Cases live
in `.apm/evals/` beside `.apm/skills/` — not inside the skill directory, which APM deploys to
consumers:

```
packages/utils/.apm/evals/<case>/
  prompt.md          # frontmatter: plugins: ["../.."], max_turns, allowed_tools; body: the request
  graders/
    result.md        # type: regex on the final message - what correct code contains
    skill-fired.md   # type: tool_used, tool: Skill - the skill triggered
```

Write the prompt the way a developer would ask, without naming the skill or the package API.
Grade the result with `regex` graders where you can; they are free and stable. Then:

```bash
claude plugin eval packages/utils/.apm --no-publish                  # with vs without the skill
claude plugin eval packages/utils/.apm --no-publish --model haiku    # the weakest model in use
```

Runs call the model with your credentials. Read the result as a loop: `skill-fired` failing
means the description does not trigger — fix the description; `Δ` at or below zero means the
skill adds nothing for that case — fix the body or drop the case; rerun. Results land in
`.apm/evals/results/`, which is gitignored.

## Checks

Requires the APM CLI 0.28 or later (`apm --version`; install with `brew install apm` or
`pip install apm-cli`). Run all of these, fix every reported file, and rerun until each
reports zero problems:

```bash
pnpm check:agent-docs        # name, description, size, README Contents (--fix rewrites Contents)
pnpm check:doc-links         # relative links and heading anchors
pnpm build && pnpm check:doc-snippets   # every ts block compiles
apm marketplace check        # every marketplace entry resolves
apm pack --check-clean       # .claude-plugin/marketplace.json is up to date
```

After changing a root `.apm/skills/` skill, also run `apm install` and commit the updated
`apm.lock.yaml`.

## Versions

- `<pkg>/apm.yml` version mirrors `package.json`; `scripts/sync-apm-versions.sh` writes it
  during `changeset version`. Never edit it by hand.
- **A package skill change earns a changeset** (see `releasing-packages`). It changes the
  package as consumers experience it. Note in the changeset that no runtime code changed —
  skills are not part of the npm tarball.
- `apm-plugins/*` have no npm package: bump their `apm.yml` version by hand, then run
  `apm pack` to regenerate `.claude-plugin/marketplace.json`.
- Consumers track the default branch, so they receive an edited skill as soon as it lands on
  `main`, regardless of any version bump.

## Never edit a deployed copy

`.claude/skills/**` and `.agents/skills/**` are generated by `apm install`. APM refuses to
manage a file it did not write, and the edit is lost on the next update. Change the source
under `.apm/` and redeploy.
