import { StringUtils } from '@radoslavirha/utils';
import { z } from 'zod';

/**
 * Environment variables always reach the `config` package as strings, so a port mapped
 * through `custom-environment-variables.json` arrives as e.g. `'3000'`. Numeric strings are
 * converted; anything else (empty string, null, ...) is left for `z.number()` to reject.
 */
const numericString = (value: unknown): unknown =>
    StringUtils.isNotEmpty(value) && Number.isFinite(Number(value)) ? Number(value) : value;

/**
 * Zod schema for TsED server configuration.
 *
 * Uses `z.looseObject()` so any additional Ts.ED configuration properties
 * are forwarded to the server without being stripped.
 *
 * `httpPort` accepts a numeric string (as supplied by an environment variable mapping).
 */
export const ServerConfig = z.looseObject({
    httpPort: z.preprocess(numericString, z.number())
});

/**
 * TypeScript type for TsED server configuration.
 * Derived from {@link ServerConfig}.
 */
export type ServerConfig = z.infer<typeof ServerConfig>;
