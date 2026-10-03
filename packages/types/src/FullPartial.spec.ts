import type { FullPartial } from './FullPartial.js';
import type { NullableProperty } from './NullableProperty.js';

// Type-level spec: checked by `tsc --noEmit` (the `test` script), not executed.

interface Config {
    database?: { host: string; port: number };
    cache: NullableProperty<{ ttl: number; size: number }>;
}

// Optional and nullable nested objects are made partial too.
export const optionalNested: FullPartial<Config> = { database: { host: 'localhost' } };
export const nullableNested: FullPartial<Config> = { cache: { ttl: 10 } };
export const nullValue: FullPartial<Config> = { cache: null };

// Leaf types are still enforced.
// @ts-expect-error -- 'port' must stay a number
export const wrongLeaf: FullPartial<Config> = { database: { port: '5432' } };
