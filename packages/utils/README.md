# @radoslavirha/utils

Variety of shareable utils.

## Installation

`pnpm add -D @radoslavirha/utils`

## Usage

```ts
import { CommonUtils } from '@radoslavirha/utils';
import { defineConfig } from 'vitest/config';

const object = { key: 'value' };
const clone = CommonUtils.cloneDeep(object);
```
