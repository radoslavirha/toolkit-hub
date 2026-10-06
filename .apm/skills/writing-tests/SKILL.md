---
name: writing-tests
description: Use when writing or changing a `*.spec.ts` file in toolkit-hub, writing a regression test for a bug fix, adding tests to a new package, writing a `vitest.config.ts`, or mocking Ts.ED DI or MongoDB testcontainers. States the conventions this repo enforces — spec naming and location, describe/it structure, assertion choices, mocking patterns, where test helpers live — and how to run tests until they pass.
---

# Writing tests

## Prerequisites

- Node 24+ and pnpm 11.26+ (`node --version`, `pnpm --version`), then `pnpm install && pnpm build`
  — workspace packages resolve each other through `dist/`, so tests need a build.
- **Docker running** for `tsed/mongoose`, whose tests start MongoDB through testcontainers.
  Check with `docker info`; without it the global setup fails before any test runs.

## Run, fix, repeat

```bash
pnpm --filter @radoslavirha/<package> test     # vitest run, with coverage thresholds
pnpm --filter @radoslavirha/<package> lint
```

Fix what fails and rerun until both pass. A coverage drop below the threshold fails the run:
cover the branch rather than lowering the threshold. A regression test must also fail without
the fix, for the reason the bug claims — `bash scripts/check-regression-test.sh` proves it by
running the changed specs with and without the source change.

## Files and location

- **Convention:** `*.spec.ts` — always `spec`, never `test`
- **Location:** co-located with source files inside `src/`, e.g. `src/CommonUtils.spec.ts` next to `src/CommonUtils.ts`
- **Integration tests:** `.integration.spec.ts` suffix to distinguish them from unit tests; `.spec.tsx` for a component
- **One spec per source file:** new tests for `src/Foo.ts` go into the existing `src/Foo.spec.ts`, inside the
  matching `describe`. Never add a second spec for the same source file (`Foo.bug.spec.ts`, `Foo.alg.spec.ts`, ...)
- **Test helpers/fixtures:** in the package's own `src/test/` (e.g. `src/test/TestMongoModel.ts`), excluded from coverage

## Vitest configuration

Each package has a thin `vitest.config.ts` wrapper over the shared `defaultConfig` — never
modify the shared base config to suit one package. The wrapper, the `Coverage90` /
`Coverage95` / `Coverage100` presets (`Coverage95` is the base default), the coverage
exclusions for Ts.ED models and the MongoDB `globalSetup` are in
`config/config-vitest/.apm/skills/using-config-vitest/SKILL.md`.

## Imports

Always use **explicit named imports** from `vitest` (do not rely on globals even though `globals: true` is set):

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
```

Source imports always use the `.js` extension (ESM with `nodenext` module resolution);
cross-package imports use the full package name:

```ts ignore
import { CommonUtils } from './CommonUtils.js';
import { BaseModel } from '@radoslavirha/tsed-common';
```

## Structure

- Always `describe` + `it` (never `test()`)
- Top-level `describe` = class or module name; nested `describe` = method or scenario group
- `it` descriptions: `'verb + outcome'` style
- Never commit `.only` or `.skip`

```ts ignore
describe('ZodValidator', () => {
    describe('validate', () => {
        it('returns validated value when input is valid', async () => { ... });
        it('throws when a required field is missing', async () => { ... });
    });
});
```

## Error paths

- Use `.rejects.toThrow()`; use `try/catch` only when the error needs several assertions
- Always add `expect.assertions(N)` in error path tests to guarantee the assertions ran
- Not every `it` callback needs to be `async`

```ts ignore
it('throws when handler fails', async () => {
    vi.spyOn(handler, 'performOperation').mockRejectedValue(new Error('fail'));
    expect.assertions(1);
    await expect(handler.execute()).rejects.toThrow('fail');
});
```

## Assertions

Only the choices this repo makes; the rest is ordinary Vitest.

- **`toStrictEqual` over `toEqual`** — it also compares types, so a class instance never
  matches a plain object with the same keys. Use `toEqual` only when that match is intended.
- `toBe` for primitives; `expect.objectContaining` / `expect.arrayContaining` /
  `expect.any(Type)` when only part of a value matters.

## Mocking

Restore spies after each test so the original method is back for the next one —
`afterEach(() => vi.restoreAllMocks())`, or `spy.mockRestore()` for a single spy:

```ts ignore
beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
```

**Ts.ED DI container lifecycle:**
```ts ignore
beforeEach(PlatformTest.bootstrap(Server, { mount: { '/': [TestController] } }));
afterEach(PlatformTest.reset);
```

**Request context (unit-testing code that takes a `PlatformContext`, e.g. `$onResponse`):** never hand-roll a fake context with `as unknown as PlatformContext`. Create a real one with `PlatformTest.createRequestContext()` (no options; its defaults are a working fake request/response), set only what the test needs on `$ctx.request.raw` / `$ctx.response`, run the code inside it with `runInContext` from `@tsed/di`, and destroy it afterwards:
```ts ignore
let $ctx: PlatformContext;

beforeEach(() => {
    $ctx = PlatformTest.createRequestContext();
});
afterEach(() => $ctx.destroy());

it('...', async () => {
    $ctx.request.raw.url = '/cb?x=1';
    $ctx.request.raw.query = { x: '1' };
    $ctx.response.status(503);

    await runInContext($ctx, () => logger.$onResponse($ctx));
});
```

**MongoDB (testcontainers, needs Docker):**
```ts ignore
beforeEach(() => TestContainersMongo.create());
beforeEach(() => {
    mapper = PlatformTest.get<TestMongoMapper>(TestMongoMapper);
});
afterEach(() => TestContainersMongo.reset());
```

## Test helpers

- Prefix with `Test*`: `TestMongoMapper`, `TestMongoModel`, `TestMongoRepository`, `TestController`
- Use full Ts.ED decorators (`@Model`, `@Service`, `@Controller`) so DI resolution works
- Retrieve from the DI container via `PlatformTest.get<T>(T)` in tests
- Each package has its own `src/test/` — do not share helpers across packages

## Integration tests (HTTP)

Use **SuperTest** against the live Ts.ED platform:

```ts ignore
import SuperTest from 'supertest';

it('GET / returns 200', async () => {
    const request = SuperTest.agent(PlatformTest.callback());
    const response = await request.get('/');
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ ... });
});
```

## When a regression test is not required

Every behaviour change gets a test. A fix may go without one — PR labelled
`no-regression-test`, with the reason in its description — only when no spec can observe it:

- the change is type-only and `pnpm build` (`tsc --noEmit`) is what proves it
- the change is to build, lint or packaging configuration (`tsdown`, `tsconfig`, `eslint`,
  the `exports` map), where the build output is the observable
- the change is documentation or skills only, which `check-regression-test.sh` ignores anyway

## Checklist

- [ ] File is named `*.spec.ts` (or `*.integration.spec.ts`), lives in `src/`, one per source file
- [ ] Explicit `import { describe, it, expect, vi, ... } from 'vitest'` at top
- [ ] Source imports use `.js` extension
- [ ] Only `describe` + `it` used (no `test()`), no `.only` or `.skip`
- [ ] Error path tests use `.rejects.toThrow()` + `expect.assertions(N)`, or `try/catch` when several assertions are needed
- [ ] Spies restored in `afterEach`
- [ ] Test helpers placed in `src/test/`
- [ ] `test` and `lint` pass for the package
