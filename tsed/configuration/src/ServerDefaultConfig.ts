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
    }
});