# @radoslavirha/config-tsup

Pre-configured tsup build configurations for TypeScript libraries with dual ESM/CJS output. Simplifies library bundling with TypeScript declaration generation and tree-shaking support.

## Installation

```bash
# Simple repository
pnpm add -D tsup @radoslavirha/config-tsup

# Monorepo - install at workspace root (shared config)
pnpm add -D -w tsup @radoslavirha/config-tsup
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Peer dependencies:**
- `tsup` >= 8.0.0

## What's Included

### Build Configurations

- **`cjsConfig`** - CommonJS build configuration
- **`esmConfig`** - ES Module build configuration
- **`config`** - Combined ESM + CJS build (single execution)

### Key Features

✅ **Dual Output** - Generate both ESM and CJS bundles  
✅ **TypeScript Declarations** - Auto-generate `.d.ts` files  
✅ **Clean Builds** - Removes output directory before building  
✅ **Tree-shakeable** - ESM output supports tree-shaking  
✅ **Zero Config** - Works with sensible defaults

## Usage

### Basic Setup (Dual Output)

Create `tsup.config.ts`:

```typescript
import { cjsConfig, esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig([cjsConfig, esmConfig]);
```

### Combined Build (Faster)

For faster builds, use the combined config:

```typescript
import { config } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig(config);
```

### Add Build Script

Add to your `package.json`:

```json
{
    "scripts": {
        "build": "tsup"
    }
}
```

### Configure Package.json Exports

Set up proper module exports for dual format:

```json
{
    "name": "@yourscope/your-library",
    "version": "1.0.0",
    "type": "module",
    "main": "./dist/cjs/index.js",
    "module": "./dist/esm/index.js",
    "types": "./dist/esm/index.d.ts",
    "exports": {
        ".": {
            "import": {
                "types": "./dist/esm/index.d.ts",
                "default": "./dist/esm/index.js"
            },
            "require": {
                "types": "./dist/cjs/index.d.ts",
                "default": "./dist/cjs/index.js"
            }
        }
    },
    "files": [
        "dist",
        "package.json",
        "README.md"
    ]
}
```

### Run Build

```bash
pnpm build
```

## Configuration Reference

### cjsConfig

CommonJS build configuration.

```typescript
{
    name: 'CJS build',
    format: 'cjs',
    outDir: 'dist/cjs',
    entry: ['src/index.ts'],
    dts: true,
    clean: true,
    tsconfig: './tsconfig.json'
}
```

**Output:**
- `dist/cjs/index.js` - CommonJS bundle
- `dist/cjs/index.d.ts` - TypeScript declarations

---

### esmConfig

ES Module build configuration.

```typescript
{
    name: 'ESM build',
    format: 'esm',
    outDir: 'dist/esm',
    entry: ['src/index.ts'],
    dts: true,
    clean: true,
    tsconfig: './tsconfig.json'
}
```

**Output:**
- `dist/esm/index.js` - ES Module bundle
- `dist/esm/index.d.ts` - TypeScript declarations

---

### config (Combined)

Generates both formats in a single build (faster than separate configs).

```typescript
{
    name: 'ESM + CJS build',
    format: ['esm', 'cjs'],
    outDir: 'dist',
    entry: ['src/index.ts'],
    dts: true,
    clean: true,
    tsconfig: './tsconfig.json'
}
```

**Output:**
- `dist/index.js` - ES Module (default)
- `dist/index.cjs` - CommonJS
- `dist/index.d.ts` - TypeScript declarations

**Note:** With combined config, adjust package.json exports accordingly:
```json
{
    "main": "./dist/index.cjs",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts"
}
```

## Customization

### Override Entry Points

```typescript
import { cjsConfig, esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig([
    {
        ...cjsConfig,
        entry: ['src/main.ts']
    },
    {
        ...esmConfig,
        entry: ['src/main.ts']
    }
]);
```

### Multiple Entry Points

```typescript
import { cjsConfig, esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig([
    {
        ...cjsConfig,
        entry: {
            index: 'src/index.ts',
            cli: 'src/cli.ts'
        }
    },
    {
        ...esmConfig,
        entry: {
            index: 'src/index.ts',
            cli: 'src/cli.ts'
        }
    }
]);
```

### Add Code Splitting

```typescript
import { esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig({
    ...esmConfig,
    splitting: true,  // Enable code splitting for ESM
    treeshake: true   // Enable tree-shaking
});
```

### Minification

```typescript
import { config } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig({
    ...config,
    minify: true,        // Minify output
    sourcemap: true      // Generate sourcemaps
});
```

### External Dependencies

```typescript
import { cjsConfig, esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig([
    {
        ...cjsConfig,
        external: ['lodash', '@tsed/core']  // Don't bundle these
    },
    {
        ...esmConfig,
        external: ['lodash', '@tsed/core']
    }
]);
```

### Custom tsconfig Path

```typescript
import { config } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig({
    ...config,
    tsconfig: './tsconfig.build.json'
});
```

## Advanced Patterns

### Separate Dev and Prod Builds

```typescript
// tsup.config.ts
import { cjsConfig, esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig([
    {
        ...cjsConfig,
        minify: !isDev,
        sourcemap: isDev
    },
    {
        ...esmConfig,
        minify: !isDev,
        sourcemap: isDev
    }
]);
```

```json
{
    "scripts": {
        "build": "NODE_ENV=production tsup",
        "build:dev": "NODE_ENV=development tsup"
    }
}
```

### Watch Mode for Development

```typescript
import { esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig({
    ...esmConfig,
    watch: process.env.WATCH === 'true'
});
```

```json
{
    "scripts": {
        "build": "tsup",
        "build:watch": "WATCH=true tsup"
    }
}
```

### Bundle Analysis

```typescript
import { config } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig({
    ...config,
    metafile: true  // Generate meta.json for bundle analysis
});
```

### Custom Output Extensions

```typescript
import { cjsConfig, esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig([
    {
        ...cjsConfig,
        outExtension: () => ({ js: '.cjs' })
    },
    {
        ...esmConfig,
        outExtension: () => ({ js: '.mjs' })
    }
]);
```

## Output Structure

### Using [cjsConfig, esmConfig]

```
dist/
├── cjs/
│   ├── index.js
│   └── index.d.ts
└── esm/
    ├── index.js
    └── index.d.ts
```

### Using config (combined)

```
dist/
├── index.js        # ESM
├── index.cjs       # CJS
├── index.d.ts      # Shared types
└── index.d.cts     # CJS types (optional)
```

## Integration Examples

### Monorepo Package

```typescript
// packages/my-library/tsup.config.ts
import { cjsConfig, esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig([
    {
        ...cjsConfig,
        external: [/@radoslavirha\/.*/]  // Externalize other workspace packages
    },
    {
        ...esmConfig,
        external: [/@radoslavirha\/.*/]
    }
]);
```

### CLI Tool

```typescript
import { esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig({
    ...esmConfig,
    entry: {
        index: 'src/index.ts',
        cli: 'src/cli.ts'
    },
    // Make CLI executable
    banner: {
        js: '#!/usr/bin/env node'
    }
});
```

### Plugin System

```typescript
import { cjsConfig, esmConfig } from '@radoslavirha/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig([
    {
        ...cjsConfig,
        entry: ['src/index.ts', 'src/plugins/*.ts'],  // Multiple entries
        splitting: false  // Keep plugins separate
    },
    {
        ...esmConfig,
        entry: ['src/index.ts', 'src/plugins/*.ts'],
        splitting: false
    }
]);
```

## Why Dual Format?

### CommonJS (CJS)
- ✅ Supported by all Node.js versions
- ✅ Required for some legacy tools
- ✅ Works with `require()`

### ES Modules (ESM)
- ✅ Modern JavaScript standard
- ✅ Supports tree-shaking
- ✅ Better static analysis
- ✅ Future-proof

**Best practice:** Provide both formats for maximum compatibility.

## Troubleshooting

### "Cannot find module" errors

Ensure your `package.json` has correct `exports` field and `type: "module"`.

### Type definitions not generated

Check that:
1. `dts: true` is set in config
2. TypeScript is installed
3. `tsconfig.json` exists

### Build output not cleaned

The `clean: true` option is included. If issues persist, manually clean:
```bash
rm -rf dist
pnpm build
```

### Circular dependency warnings

Use code splitting for ESM:
```typescript
{
    ...esmConfig,
    splitting: true
}
```

## When to Use

✅ Use this config when:
- Building TypeScript libraries for npm
- Need dual ESM/CJS support
- Want declaration file generation
- Publishing packages to registry
- Building monorepo packages

❌ Don't use when:
- Building applications (not libraries)
- Need custom bundling (use Rollup/Webpack directly)
- Only targeting one format
- Need advanced bundle optimization

## Related Packages

- [@radoslavirha/config-typescript](../config-typescript/) - TypeScript compiler configuration
- [@radoslavirha/config-eslint](../config-eslint/) - Linting before build
- [@radoslavirha/config-vitest](../config-vitest/) - Testing built packages
