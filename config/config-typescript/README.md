# @radoslavirha/config-typescript

Base TypeScript compiler configuration for strict, modern Node.js applications. Provides sensible defaults for ESNext + Node.js projects with support for decorators and optimal type checking.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Base TypeScript compiler configuration with strict settings.

**Install in pnpm monorepo:**
```bash
# Install in packages that need TypeScript compilation
pnpm --filter YOUR_PACKAGE_NAME add -D @radoslavirha/config-typescript typescript tslib
```

**Essential Usage:**
```json
// tsconfig.json
{
  "extends": "@radoslavirha/config-typescript",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Included Settings:**
- Strict mode enabled
- ESNext target + NodeNext module resolution
- Decorator support (experimentalDecorators, emitDecoratorMetadata)
- JSON module imports
- Skip lib check for faster compilation

**Override if needed:**
```json
{
  "extends": "@radoslavirha/config-typescript",
  "compilerOptions": {
    "target": "ES2020",  // Override specific options
    "outDir": "./build"
  }
}
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

## What's Included

### Compiler Settings

✅ **Strict Mode** - All strict type checking options enabled  
✅ **ESNext Target** - Modern JavaScript features  
✅ **Node.js Module Resolution** - NodeNext for modern Node.js  
✅ **Decorator Support** - Experimental decorators (for Ts.ED)  
✅ **JSON Modules** - Import JSON files as modules  
✅ **Skip Lib Check** - Faster compilation by skipping type checks in `.d.ts` files

### Key Features

- **Zero Configuration** - Works out of the box
- **Ts.ED Compatible** - Decorator settings for Ts.ED framework
- **Monorepo Ready** - Supports TypeScript project references
- **Production Optimized** - No incremental builds or diagnostics

## Usage

### Basic Setup

Create `tsconfig.json` in your project root:

```json
{
    "extends": "@radoslavirha/config-typescript/tsconfig.json",
    "compilerOptions": {
        "rootDir": "./src",
        "composite": false
    }
}
```

### Compilation

Use TypeScript compiler directly or via build tools:

```bash
# Direct compilation
pnpm tsc

# With build tool (tsup, swc, etc.)
pnpm build
```

## Customization

### Override Compiler Options

```json
{
    "extends": "@radoslavirha/config-typescript/tsconfig.json",
    "compilerOptions": {
        "composite": false,
        "outDir": "./dist",
        "baseUrl": "./src",
        "paths": {
            "@/*": ["*"]
        }
    }
}
```

### Change Source Directory

```json
{
    "extends": "@radoslavirha/config-typescript/tsconfig.json",
    "compilerOptions": {
        "rootDir": "./lib",
        "composite": false
    },
    "include": ["lib/**/*"]
}
```

### Add Type Definitions

```json
{
    "extends": "@radoslavirha/config-typescript/tsconfig.json",
    "compilerOptions": {
        "types": ["node", "jest"],
        "composite": false
    }
}
```

---

## See Also

For integration patterns and architecture guidance, see [AGENTS.md](../../AGENTS.md)

## Related Packages

- [@radoslavirha/config-eslint](../config-eslint/) - ESLint rules for TypeScript
- [@radoslavirha/config-tsup](../config-tsup/) - Build configuration using this tsconfig
- [@radoslavirha/config-vitest](../config-vitest/) - Test configuration with TypeScript support
