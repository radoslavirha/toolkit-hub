---
name: package-readme
description: Use when creating a README for a new toolkit-hub package, or after changing a package's public exports so its README no longer matches the code. Says which sections a package README must have and which are optional, how examples are written, and how to check a README against the real exports.
---

# Writing a toolkit-hub package README

A package README is the human-facing document. Agent-facing guidance goes in that package's
`.apm/skills/` (see `package-skill-authoring`), and cross-package guidance goes in
`AGENTS.md` (see `agents-md`). Do not duplicate between them — duplicated facts drift.

## Required core

Every package README has:

1. `# @radoslavirha/<name>` + a one-line description
2. `## 🤖 Quick Reference for AI Agents` — the shortest path to correct usage: install command, main exports, a minimal example
3. `## See Also` — link to [AGENTS.md](../../AGENTS.md) and to related packages

## Optional, per package

`## Installation`, `## What's Included`, `## Usage`, `## API Reference`, `## Related Packages`.

Use them when they carry weight. They are not a checklist to satisfy:

- The `config-*` packages have no meaningful `## API Reference` — they export configuration
  objects, not an API. Omitting it is correct.
- `packages/redaction` uses sections shaped to its domain (*Why a profile*, *Selector syntax*,
  *Serialisation fallbacks*, *Configuration*). That reads better than the generic template
  and is a legitimate variant, not a violation.

Prefer the shape that explains the package over the shape that matches its neighbours.

## Examples

- **Generic names only**: `Handler`, `Controller`, `Service`, `Request`, `Response`, `Model`,
  `MongoModel`, `Mapper`. Never domain nouns (`User`, `Order`, `Product`).
- **Examples must compile.** Write them as TypeScript blocks against the real exports, and
  check them — a block that no longer compiles is the drift signal. Prose claims cannot be
  verified and rot silently.
- **Installation** uses pnpm with a filter:
  ```bash
  pnpm --filter YOUR_SERVICE add @radoslavirha/package-name
  ```

## Do not restate what the types already say

Never write a method count ("36 utilities", "all 39 methods"). It is derivable from the
code, nobody updates it, and it is wrong within two releases — this exact claim was
simultaneously 36 in one place and 39 in another while reality was 41. Describe what a
class is *for* and when to reach for it; let `.d.ts` carry the inventory.

Never document a method that does not exist. Verify names and signatures against
`src/index.ts` and the class source before writing them down.

## Before you finish

- [ ] Quick Reference matches the actual exports of `src/index.ts`
- [ ] Every code block compiles against the current package
- [ ] Examples use generic names
- [ ] Install command uses `pnpm --filter`
- [ ] No invented methods, no hand-maintained counts
- [ ] `See Also` links resolve
- [ ] If the package ships a skill, the README and the skill do not contradict each other
