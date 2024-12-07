# @irha-tookit/config-jest

Provides jest configuration.

## Installation

`pnpm add -D @irha-tookit/config-jest jest @types/jest`

## Usage

Create `jest.config.ts` file and add following code:

```
import { config } from '@irha-tookit/config-jest';

export default {
    ...config
};
```

Add scripts to your `package.json`:

```
"test": "cross-env NODE_ENV=test jest",
"test:watch": "pnpm run test --watchAll"
```

You can use provided coverage thresholds like:
```
import { config, Coverage100, Coverage95, Coverage90 } from '@irha-tookit/config-jest';

export default {
    ...config,
    coverageThreshold: {
        global: Coverage100
    }
};
```