# @radoslavirha/types

Variety of shareable types.

## Installation

`pnpm add -D @radoslavirha/types`

## Usage

```ts
import { EnumDictionary } from '@radoslavirha/types';

enum KEYS {
    A = 'A',
    B = 'B'
}
const dictionary: EnumDictionary<KEYS, string> = {
    [KEYS.A]: 'value',
    [KEYS.B]: 'another value',
};
```
