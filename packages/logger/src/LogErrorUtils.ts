/** Flat log fields describing an `Error`. */
export interface LogErrorFields {
    readonly error_name?: string;
    readonly error_message: string;
    readonly error_stack?: string;
}

/** Options for {@link LogErrorUtils.toFields}. */
export interface LogErrorFieldsOptions {
    /** Include `error_stack`. Defaults to `true`. */
    readonly stack?: boolean;
}

/**
 * Converts errors into plain log fields. Spreading an `Error` or passing it to
 * `JSON.stringify` drops `name`, `message` and `stack`, so convert it first.
 */
export class LogErrorUtils {
    /**
     * Returns `error_name` / `error_message` / `error_stack` for an error.
     * `error_name` falls back to `error.code` when `name` is missing.
     */
    public static toFields(error: Error & { code?: string }, options?: LogErrorFieldsOptions): LogErrorFields {
        return {
            error_name: error.name ?? error.code,
            error_message: error.message,
            ...(options?.stack ?? true ? { error_stack: error.stack } : {})
        };
    }
}
