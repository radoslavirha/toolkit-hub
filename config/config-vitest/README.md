# @radoslavirha/config-vitest

Provides vitest configuration.

## Installation

`pnpm add -D @radoslavirha/config-vitest vitest @swc/core @vitest/coverage-v8`

## Usage

Create `vitest.config.ts` file and add following code:

```ts
import { defaultConfig } from '@radoslavirha/config-vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    ...defaultConfig
});
```

Add scripts to your `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```
