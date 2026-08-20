---
"@radoslavirha/types": patch
"@radoslavirha/config-eslint": patch
"@radoslavirha/config-typescript": patch
"@radoslavirha/config-tsdown": patch
"@radoslavirha/config-vitest": patch
---

Ship agent guidance as APM skills.

`using-types` names the four helpers and what each is for, including why `EnumDictionary` is worth reaching for (it makes a lookup exhaustive, which `Record<string, T>` does not).

The `config-*` skills cover the thin-wrapper pattern each package follows: spreading the shared ESLint flat config rather than nesting it, merging the vitest base rather than replacing it, spreading the tsdown configs, and choosing the right tsconfig base — including that a Ts.ED package extending `tsconfig.node.json` compiles but loses decorator metadata, so DI fails at runtime.
