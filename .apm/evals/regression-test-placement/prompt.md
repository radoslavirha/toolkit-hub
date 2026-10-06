---
description: A regression test goes into the existing spec for the source file, never a second spec.
plugins: ["../.."]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

In the toolkit-hub monorepo, `ObjectUtils.mergeDeep` in `packages/utils/src/ObjectUtils.ts`
replaces arrays at the root instead of merging them. `packages/utils/src/ObjectUtils.spec.ts`
already exists with `describe('ObjectUtils')` and a nested `describe('mergeDeep')`. Write the
regression test and say which file it goes in.
The repository is not checked out here, so do not search for files - answer from what is above.
