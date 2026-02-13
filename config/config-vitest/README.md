# @radoslavirha/config-vitest

Pre-configured Vitest test runner with SWC for blazing-fast TypeScript testing. Includes coverage thresholds, decorator support, and optimized settings for Ts.ED applications.

---

## 🤖 Quick Reference for AI Agents

**Purpose:** Fast TypeScript testing with Vitest + SWC.

**Install in pnpm monorepo:**
```bash
# Install in packages that need testing
pnpm --filter YOUR_PACKAGE_NAME add -D @radoslavirha/config-vitest vitest @swc/core @vitest/coverage-v8
```

**Essential Usage:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { defaultConfig } from '@radoslavirha/config-vitest';

export default defineConfig(defaultConfig);
```

```json
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Coverage Thresholds:**
- `defaultConfig` - 95% coverage (branches, functions, lines, statements)
- `Coverage90` - 90% thresholds
- `Coverage100` - 100% thresholds

**Custom Coverage:**
```typescript
import { defaultConfig, Coverage90 } from '@radoslavirha/config-vitest';
import { ObjectUtils } from '@radoslavirha/utils';

export default defineConfig(
  ObjectUtils.mergeDeep(defaultConfig, { test: { coverage: Coverage90 } })
);
```

**Features:** SWC compilation, decorator support, 95% default coverage

**Full documentation below** ↓

---

## Installation

```bash
# Simple repository
pnpm add -D @radoslavirha/config-vitest vitest @swc/core @vitest/coverage-v8

# Monorepo - install at workspace root (shared config)
pnpm add -D -w @radoslavirha/config-vitest vitest @swc/core @vitest/coverage-v8
```

See [root README](../../README.md#-installation) for `.npmrc` setup and monorepo details.

**Peer dependencies:**
- `vitest` >= 4.0.0
- `@swc/core` >= 1.0.0
- `@vitest/coverage-v8` >= 4.0.0

**Dependencies (included):**
- `unplugin-swc` - SWC plugin for Vitest

**Optional (for config customization):**
- `@radoslavirha/utils` - For clean configuration merging with `ObjectUtils.mergeDeep()`

## What's Included

### Configurations

- **`defaultConfig`** - Complete Vitest configuration with SWC and 95% coverage
- **`Coverage90`** - 90% coverage thresholds
- **`Coverage95`** - 95% coverage thresholds (default)
- **`Coverage100`** - 100% coverage thresholds

### Key Features

✅ **Fast TypeScript Compilation** - Uses SWC instead of ts-jest/tsx  
✅ **Decorator Support** - Legacy decorators + metadata for Ts.ED  
✅ **Global Test APIs** - `describe`, `it`, `expect` without imports  
✅ **V8 Coverage** - Fast native coverage with configurable thresholds  
✅ **Auto-exclude** - Skips index files and standard patterns  
✅ **Zero Config** - Works out of the box

## Usage

### Basic Setup

Create `vitest.config.ts`:

```typescript
import { defaultConfig } from '@radoslavirha/config-vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig(defaultConfig);
```

### Add Test Scripts

Add to your `package.json`:

```json
{
    "scripts": {
        "test": "vitest run",
        "test:watch": "vitest"
    }
}
```

### Run Tests

```bash
# Run all tests once
pnpm test

# Watch mode (re-run on file changes)
pnpm test:watch
```

## Customization

**Note:** Use `ObjectUtils.mergeDeep()` from [@radoslavirha/utils](../../packages/utils/) for clean configuration merging.

### Change Coverage Threshold

```typescript
import { defaultConfig, Coverage90 } from '@radoslavirha/config-vitest';
import { ObjectUtils } from '@radoslavirha/utils';
import { defineConfig } from 'vitest/config';

export default defineConfig(
    ObjectUtils.mergeDeep(defaultConfig, {
        test: {
            coverage: {
                thresholds: Coverage90  // Use 90% threshold
            }
        }
    })
);
```

### Disable Coverage

```typescript
import { defaultConfig } from '@radoslavirha/config-vitest';
import { ObjectUtils } from '@radoslavirha/utils';
import { defineConfig } from 'vitest/config';

export default defineConfig(
    ObjectUtils.mergeDeep(defaultConfig, {
        test: {
            coverage: {
                enabled: false
            }
        }
    })
);
```

### Custom Test Directory

```typescript
import { defaultConfig } from '@radoslavirha/config-vitest';
import { ObjectUtils } from '@radoslavirha/utils';
import { defineConfig } from 'vitest/config';

export default defineConfig(
    ObjectUtils.mergeDeep(defaultConfig, {
        test: {
            dir: './tests'  // Look for tests in tests/ directory
        }
    })
);
```

### Exclude Additional Files from Coverage

```typescript
import { defaultConfig } from '@radoslavirha/config-vitest';
import { ObjectUtils } from '@radoslavirha/utils';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig(
    ObjectUtils.mergeDeep(defaultConfig, {
        test: {
            coverage: {
                exclude: [
                    '**/types/**',
                    '**/constants/**',
                    ...coverageConfigDefaults.exclude
                ]
            }
        }
    })
);
```

### Add Custom Setup File

```typescript
import { defaultConfig } from '@radoslavirha/config-vitest';
import { ObjectUtils } from '@radoslavirha/utils';
import { defineConfig } from 'vitest/config';

export default defineConfig(
    ObjectUtils.mergeDeep(defaultConfig, {
        test: {
            setupFiles: ['./tests/setup.ts']  // Run before tests
        }
    })
);
```

### Environment Configuration

```typescript
import { defaultConfig } from '@radoslavirha/config-vitest';
import { ObjectUtils } from '@radoslavirha/utils';
import { defineConfig } from 'vitest/config';

export default defineConfig(
    ObjectUtils.mergeDeep(defaultConfig, {
        test: {
            environment: 'node',  // or 'jsdom' for browser tests
            env: {
                NODE_ENV: 'test'
            }
        }
    })
);
```

---

## See Also

For integration patterns and architecture guidance, see [AGENTS.md](../../AGENTS.md)

## Related Packages

- [@radoslavirha/config-typescript](../config-typescript/) - TypeScript config used by tests
- [@radoslavirha/config-eslint](../config-eslint/) - Lint test files
- [@radoslavirha/utils](../../packages/utils/) - Utilities for test helpers
