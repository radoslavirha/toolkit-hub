---
description: A new spec is co-located, named *.spec.ts, imports from vitest explicitly and uses .js source imports.
plugins: ["../.."]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

In the toolkit-hub monorepo, `packages/utils/src/StringUtils.ts` exports
`class StringUtils { static isNotEmpty(value: unknown): value is string }`, which is true
for a string with non-whitespace content. Write its spec. Reply with the file path on the
first line, then the file content.
The repository is not checked out here, so do not search for files - answer from what is above.
