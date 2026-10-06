---
description: An async error-path test uses rejects.toThrow with expect.assertions.
plugins: ["../.."]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

In the toolkit-hub monorepo, write a test case for `tsed/common` showing that
`await ZodValidator.validate(schema, input)` throws when a required field is missing from
`input`. Reply with only the test code.
The repository is not checked out here, so do not search for files - answer from what is above.
