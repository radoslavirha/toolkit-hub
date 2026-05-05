# @radoslavirha/config-typescript

Base TypeScript compiler configurations for strict, modern projects. Provides targeted presets for Ts.ED services, pure Node.js packages, React libraries, and React Vite apps.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Shared TypeScript compiler configurations — pick the preset that matches your package type.

**Install in pnpm monorepo:**
```bash
pnpm --filter YOUR_PACKAGE_NAME add -D @radoslavirha/config-typescript typescript tslib
```

**Available presets:**

| Config | Use for |
|--------|---------|
| `tsconfig.tsed.json` | Ts.ED services & framework packages (decorators, NodeNext) |
| `tsconfig.node.json` | Pure Node.js library packages (no decorators, full strict) |
| `tsconfig.react.json` | Shareable React component/library packages (buildable) |
| `tsconfig.react-app.json` | React Vite apps (extends react, adds `noEmit` + stricter checks) |
| `tsconfig.base.json` | Shared base only — extend for custom presets |
| `tsconfig.json` | Backward-compat alias → `tsconfig.tsed.json` |

**Usage:**
```json
// Ts.ED service or framework package
{ "extends": "@radoslavirha/config-typescript/tsconfig.tsed.json" }

// Pure Node.js library (utils, logger, types, build/test tooling)
{ "extends": "@radoslavirha/config-typescript/tsconfig.node.json" }

// Shareable React package
{ "extends": "@radoslavirha/config-typescript/tsconfig.react.json" }

// React Vite app
{ "extends": "@radoslavirha/config-typescript/tsconfig.react-app.json" }
```

**Full documentation below** ↓

---

## Installation

```bash
# Simple repository
pnpm add -D @radoslavirha/config-typescript tslib typescript

# Monorepo - install at workspace root (shared config)
pnpm add -D -w @radoslavirha/config-typescript tslib typescript
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Peer dependencies:**
- `typescript` >= 5.0.0
- `tslib` >= 2.0.0

## Presets

### `tsconfig.tsed.json` — Ts.ED packages

For Ts.ED services and framework packages that use decorators and DI.

**Key settings:** `experimentalDecorators`, `strictPropertyInitialization: false`, `useDefineForClassFields: false`, NodeNext modules.

```json
{
    "extends": "@radoslavirha/config-typescript/tsconfig.tsed.json",
    "compilerOptions": {
        "rootDir": "./src",
        "composite": false
    }
}
```

### `tsconfig.node.json` — Node.js library packages

For pure Node.js packages with no Ts.ED dependency (`utils`, `logger`, `types`, build/test tooling).

**Key settings:** NodeNext modules, full strict mode, standard class fields.

```json
{
    "extends": "@radoslavirha/config-typescript/tsconfig.node.json",
    "compilerOptions": {
        "rootDir": "./src",
        "composite": false
    }
}
```

### `tsconfig.react.json` — Shareable React packages

For published React component libraries or shared UI packages that need build output.

**Key settings:** `Bundler` module resolution, `react-jsx`, DOM libs, `isolatedModules`, no `noEmit`.

```json
{
    "extends": "@radoslavirha/config-typescript/tsconfig.react.json",
    "compilerOptions": {
        "rootDir": "./src",
        "outDir": "./dist"
    }
}
```

### `tsconfig.react-app.json` — React Vite apps

For React apps bundled by Vite. Extends `tsconfig.react.json` with stricter checks and `noEmit: true`.

**Key settings:** everything from `tsconfig.react.json` plus `noEmit`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`.

```json
{
    "extends": "@radoslavirha/config-typescript/tsconfig.react-app.json",
    "compilerOptions": {
        "types": ["vitest/globals", "node"]
    },
    "include": ["src", "vite.config.ts", "vitest.config.ts"]
}
```

---

## See Also

For integration patterns and architecture guidance, see [AGENTS.md](../../AGENTS.md)

## Related Packages

- [@radoslavirha/config-eslint](../config-eslint/) - ESLint rules for TypeScript
- [@radoslavirha/config-tsdown](../config-tsdown/) - Build configuration using this tsconfig
- [@radoslavirha/config-vitest](../config-vitest/) - Test configuration with TypeScript support
