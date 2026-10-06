---
description: Mapping a nullable model must use MappingUtils instead of a hand-written null check.
plugins: ["../.."]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm working in a TypeScript service that depends on @radoslavirha/utils. Given
`class Model { name!: string }` and `class DTO { label!: string }`, write
`async function toDTO(model: Model | null): Promise<DTO | null>` that maps `name` to
`label` and returns null when there is no model. Reply with only the code.
