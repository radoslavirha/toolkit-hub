# @radoslavirha/config-eslint

Provides eslint rules for typescript projects with pre-installed eslint. Uses eslint v9.

## Installation

`pnpm add -D @radoslavirha/config-eslint`

## Usage

Create `eslint.config.mjs` file and add following code:

```js
import { config } from 'typescript-eslint';
import Config from '@radoslavirha/config-eslint';

export default config(...Config);
```

You can extend it with own rules.

Add scripts to your `package.json`:

```json
"lint": "eslint .",
"lint:fix": "eslint --fix ."
```
