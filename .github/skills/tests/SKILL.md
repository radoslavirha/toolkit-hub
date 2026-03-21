---
name: tests
description: Guide for creating and maintaining Vitest tests for the toolkit-hub monorepo
---

This skill provides guidance for creating and maintaining high-quality Vitest tests for the toolkit-hub monorepo. Use it when writing or updating test cases for any package, ensuring tests are passing and up-to-date with the latest code changes. Always follow best practices for testing and strive for high test coverage across the monorepo.

---

# File Naming & Location

- **Convention:** `*.spec.ts` — always `spec`, never `test`
- **Location:** Co-located with source files inside `src/`, e.g. `src/CommonUtils.spec.ts` next to `src/CommonUtils.ts`
- **Integration tests:** Use `.integration.spec.ts` suffix to distinguish from unit tests
- **Test helpers/fixtures:** Place in `src/test/` subdirectory per-package (e.g. `src/test/TestMongoModel.ts`). These are excluded from coverage automatically.

---

# Vitest Configuration

Each package has its own thin `vitest.config.ts` wrapper — never modify the shared base config:

```ts
import { defaultConfig } from '@radoslavirha/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';
export default defineConfig(mergeConfig(defaultConfig, {}));
```

**Coverage thresholds** — import from `@radoslavirha/config-vitest`:
- `Coverage90` — 90% all metrics
- `Coverage95` — 95% all metrics (default for most packages)
- `Coverage100` — 100% all metrics

**Package-specific overrides:**
- Packages with Ts.ED DI models/test helpers: exclude `src/models`, `src/test`, `src/types` from coverage
- Packages using MongoDB: add `globalSetup: ['@tsed/testcontainers-mongo/vitest/setup']`

```ts
// Example with MongoDB + coverage exclusions
export default defineConfig(mergeConfig(defaultConfig, {
  test: {
    globalSetup: ['@tsed/testcontainers-mongo/vitest/setup'],
    coverage: {
      exclude: ['src/models/**', 'src/test/**', 'src/types/**', ...coverageConfigDefaults.exclude],
    },
  },
}));
```

---

# Imports

Always use **explicit named imports** from `vitest` (do not rely on globals even though `globals: true` is set):

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
```

Source imports always use the `.js` extension (ESM with `nodenext` module resolution):

```ts
import { CommonUtils } from './CommonUtils.js';
import { ZodValidator } from './ZodValidator.js';
```

Cross-package imports use full package names (no `.js`):

```ts
import { BaseModel } from '@radoslavirha/tsed-common';
import { CommonUtils } from '@radoslavirha/utils';
```

---

# Test Structure

- Always use `describe` + `it` (never `test()`)
- Top-level `describe` = class or module name
- Nested `describe` = method or scenario group
- `it` descriptions: `'verb + outcome'` style
- Never use `.only` or `.skip`

```ts
describe('ZodValidator', () => {
    describe('validate', () => {
        it('returns validated value when input is valid', async () => { ... });
        it('throws when a required field is missing', async () => { ... });
    });
});
```

---

# Async Style

- Not every `it` callback needs to be `async`
- Use `try/catch` for error path testing only when multiple assertions are needed, otherwise use `.rejects.toThrow()`
- Always add `expect.assertions(N)` in error path tests to guarantee assertions ran

```ts
it('throws when handler fails', async () => {
    vi.spyOn(handler, 'performOperation').mockRejectedValue(new Error('fail'));
    expect.assertions(1);
    try {
        await handler.execute();
    } catch (error) {
        expect(error).toEqual(new Error('fail'));
    }
});
```

---

# Mocking Patterns

```ts
// Suppress and assert on console output
consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
```

**`vi.fn()`** — for inline mock callbacks:

```ts
const mapper = vi.fn(async (model: Model) => ({ id: model.id }));
expect(mapper).toHaveBeenCalledTimes(3);
```

---

**Ts.ED DI container lifecycle:**
```ts
beforeEach(PlatformTest.bootstrap(Server, { mount: { '/': [TestController] } }));
afterEach(PlatformTest.reset);
```

**MongoDB (testcontainers):**
```ts
beforeEach(() => TestContainersMongo.create());
beforeEach(() => {
    mapper = PlatformTest.get<TestMongoMapper>(TestMongoMapper);
});
afterEach(() => TestContainersMongo.reset());
```

---

# Assertion Style

| Use case | Assertion |
|----------|-----------|
| Primitive equality | `expect(x).toBe(y)` |
| Deep equality | `expect(x).toEqual(y)` |
| Strict deep equality | `expect(x).toStrictEqual(y)` |
| Truthiness | `expect(x).toBeTruthy()` / `.toBeFalsy()` |
| Null / undefined | `expect(x).toBeNull()` / `.toBeUndefined()` / `.toBeDefined()` |
| Length | `expect(x).toHaveLength(N)` |
| Contains | `expect(x).toContain(value)` |
| Spy calls | `expect(spy).toHaveBeenCalledWith(...)` / `.toHaveBeenCalledTimes(N)` |
| Sync throws | `expect(() => fn()).toThrow()` |
| Partial match | `expect.objectContaining({})` / `expect.arrayContaining([])` / `expect.any(Type)` |
| Partial string | `expect.stringContaining(str)` |

always prefer toStrictEqual(), it checks also types and prevents false positives from toEqual() which can match different types with same structure (e.g. class instance vs plain object)
---

# Test Helpers / Fixtures

Test helpers live in `src/test/` and are excluded from coverage. Follow these conventions:

- Prefix with `Test*`: `TestMongoMapper`, `TestMongoModel`, `TestMongoRepository`, `TestController`
- Use full Ts.ED decorators (`@Model`, `@Service`, `@Controller`) so DI resolution works
- Retrieve from DI container via `PlatformTest.get<T>(T)` in tests
- Each package has its own `src/test/` — do not share helpers across packages

---

# Integration Tests (HTTP)

Use **SuperTest** against the live Ts.ED platform for HTTP-level tests:

```ts
import SuperTest from 'supertest';

it('GET / returns 200', async () => {
    const request = SuperTest.agent(PlatformTest.callback());
    const response = await request.get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ... });
});
```

---

# Validation Checklist

When writing or reviewing tests, verify:

- [ ] File is named `*.spec.ts` (or `*.integration.spec.ts`) and lives in `src/`
- [ ] Explicit `import { describe, it, expect, vi, ... } from 'vitest'` at top
- [ ] Source imports use `.js` extension
- [ ] Only `describe` + `it` used (no `test()`)
- [ ] No `.only` or `.skip`
- [ ] Error path tests use `try/catch` when multiple assertions are needed, otherwise use `.rejects.toThrow()` + `expect.assertions(N)`
- [ ] `mockRestore()` called in `afterEach` (not `mockReset()`)
- [ ] Test helpers placed in `src/test/` and excluded from coverage config
- [ ] Coverage threshold set appropriately (`Coverage95` default)