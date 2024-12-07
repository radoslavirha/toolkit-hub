# @irha-tookit/config-tsup

Provides basic tsup configuration for code transpilation.

## Installation

`pnpm add -D tsup @irha-tookit/config-tsup`

## Usage

Create `tsup.config.ts`:

```ts
import { cjsConfig, esmConfig } from '@irha-tookit/config-tsup';
import { defineConfig } from 'tsup';

export default defineConfig([cjsConfig, esmConfig]);
```

Add scripts to your `package.json`:

```json
"build": "tsup",
```

Set correct exports and files in `package.json`:

```json
"main": "dist/cjs/index.js",
"module": "dist/esm/index.ts",
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
```
