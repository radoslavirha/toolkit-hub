import { z } from 'zod';

/**
 * Zod schema for TsED server configuration.
 *
 * Uses `z.looseObject()` so any additional Ts.ED configuration properties
 * are forwarded to the server without being stripped.
 */
export const ServerConfig = z.looseObject({
    httpPort: z.number()
});

/**
 * TypeScript type for TsED server configuration.
 * Derived from {@link ServerConfig}.
 */
export type ServerConfig = z.infer<typeof ServerConfig>;