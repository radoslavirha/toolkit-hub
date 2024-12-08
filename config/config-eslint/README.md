# @radoslavirha/config-eslint

Provides eslint rules for typescript projects with pre-installed eslint. Uses eslint v9.

## Installation

`pnpm add -D @radoslavirha/config-eslint`

## Usage

Create `eslint.config.js` file and add following code:

```js
/* eslint-disable @typescript-eslint/no-require-imports */
const { config } = require('typescript-eslint');
const Config = require('./index');

module.exports = config(...Config);
```

You can extend it with own rules.

Add scripts to your `package.json`:

```json
"lint": "eslint .",
"lint:fix": "eslint --fix ."
```

test