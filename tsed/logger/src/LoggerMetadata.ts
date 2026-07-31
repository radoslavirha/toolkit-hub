/**
 * Extension point for custom log metadata fields.
 *
 * `Logger` is not generic — it is always typed as `BaseLogger<LoggerMetadata>`. This
 * interface is intentionally empty by default; APIs augment it via TypeScript
 * declaration merging so `metaProvider` and every `.info(body, meta)`-style call are
 * typed with their own custom attributes, without a generic parameter on `Logger`.
 *
 * Declare the augmentation once in a `.d.ts` file:
 *
 * ```typescript
 * // src/types/tsed-logger.d.ts
 * import '@radoslavirha/tsed-logger';
 * import { LoggerProviderLogMetadata } from '../config/LoggerProviderLogMetadata.js';
 *
 * declare module '@radoslavirha/tsed-logger' {
 *   interface LoggerMetadata extends LoggerProviderLogMetadata {}
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LoggerMetadata {}