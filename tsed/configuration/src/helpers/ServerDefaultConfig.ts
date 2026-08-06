/**
 * Returns default server configuration.
 */
export const getServerDefaultConfig = (): Partial<TsED.Configuration> => ({
    httpPort: 4000,
    acceptMimes: ['application/json'],
    httpsPort: false,
    exclude: ['**/*.spec.ts'],
    disableComponentsScan: true,
    jsonMapper: {
        additionalProperties: false
    },
    ajv: {
        returnsCoercedValues: true
    },
    // Kubernetes probe endpoints. Suppresses `@tsed/platform-log-request`'s
    // `request.end` line; the @radoslavirha/tsed-logger equivalent is suppressed
    // by `logger.requests.ignorePaths`, which defaults to the same paths.
    logger: {
        ignoreUrlPatterns: ['^/health(/|$)', '^/healthz$']
    }
});