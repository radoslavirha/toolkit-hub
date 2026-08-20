---
name: using-config-typescript
description: Use when adding a tsconfig.json to a package or app, choosing which shared TypeScript config to extend, or setting rootDir and composite options. Names the available bases and what each targets.
---

# Using @radoslavirha/config-typescript

Every package extends a shared base rather than declaring compiler options itself:

```json
{
    "extends": "@radoslavirha/config-typescript/tsconfig.node.json",
    "compilerOptions": {
        "rootDir": "./src"
    }
}
```

## Which base

| Base | For |
|---|---|
| `tsconfig.base.json` | the common settings the others build on |
| `tsconfig.node.json` | Node library and service packages — the usual choice here |
| `tsconfig.tsed.json` | Ts.ED packages, which need decorator metadata |
| `tsconfig.react.json` / `tsconfig.react-app.json` | React libraries and applications |

Picking `tsconfig.node.json` for a Ts.ED package is the common mistake: decorators compile
but their metadata is missing, so dependency injection fails at runtime rather than at build
time.

## What still belongs in the package

`rootDir` (normally `./src`), and genuinely package-specific flags such as extra `types`
entries. Everything else — strictness, module resolution, target — comes from the base and
should not be restated, or packages drift apart silently.
