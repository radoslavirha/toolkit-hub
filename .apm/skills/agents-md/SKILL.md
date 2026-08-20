---
name: agents-md
description: Use when editing AGENTS.md in toolkit-hub, when a new cross-package pattern emerges and you have to decide where it belongs, or when guidance seems to exist in two places. Says what earns a place in the always-on document, what belongs in a skill instead, and why AGENTS.md must never restate facts derivable from code.
---

# Maintaining AGENTS.md

`AGENTS.md` is **always-on** context: it is paid for on every task in this repo, whether or
not it is relevant. Skills are **on-demand**: they cost nothing until their description
matches what the agent is doing. That difference decides what goes where.

## What belongs in AGENTS.md

Things needed to orient on *any* task here:

- The package map — what exists, one line each, when to reach for it
- Architecture and layering rules that hold repo-wide
- Decision trees for choosing between packages
- Hard rules and anti-patterns that apply across packages

## What belongs in a skill instead

- **Task-triggered recipes.** "Build a REST API with MongoDB" is only needed when someone is
  doing exactly that. It is a skill.
- **Per-package specifics.** How to build models, which mapper method to use, which coverage
  threshold — all of that lives in that package's `.apm/skills/`.

There is a second, decisive reason: **consuming repos never see this file.** They receive
skills through APM; `AGENTS.md` stays here. Any guidance a consumer needs must be in a
skill, or it is invisible to the audience it was written for.

## Never restate what code already says

Do not write counts, method inventories, or signature lists. They are derivable, nobody
updates them, and they rot: this file once claimed "36 common utility methods" in its
package table and "All 39 Methods" in its utilities section while the real public surface
was 41. The per-class breakdown was correct because it was written once and rarely touched;
the summary numbers were wrong because they looked cheap to state.

If a number feels useful, link to the source file instead.

## AGENTS.md is currently hand-written — keep it that way deliberately

There is no `.apm/instructions/` in this repo, so `apm compile` has nothing to compile and
this file is the source.

**The moment anyone adds `.apm/instructions/`, `apm compile` generates `AGENTS.md` and
`CLAUDE.md` from those instructions and overwrites what is here.** If that migration is
wanted, move the content into `.apm/instructions/` in the same change. Adding one
instruction file and running compile will replace this document with that file's contents.

## When to update

- A package is added, removed, or renamed → package map
- A repo-wide rule changes → architecture / anti-patterns
- The same package combination keeps recurring in real work → consider a skill, not a new
  section here
