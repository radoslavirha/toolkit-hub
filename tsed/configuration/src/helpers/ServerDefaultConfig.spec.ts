import { describe, expect, it } from 'vitest';
import { getServerDefaultConfig } from './ServerDefaultConfig.js';

describe('getServerDefaultConfig', () => {
    describe('Default configuration values', () => {
        it('Should return default server configuration', () => {
            const config = getServerDefaultConfig();

            expect(config).toEqual({
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
        });

        it('Should have httpPort set to 4000', () => {
            const config = getServerDefaultConfig();
            expect(config.httpPort).toBe(4000);
        });

        it('Should accept application/json mime type', () => {
            const config = getServerDefaultConfig();
            expect(config.acceptMimes).toContain('application/json');
            expect(config.acceptMimes?.length).toBe(1);
        });

        it('Should have httpsPort disabled', () => {
            const config = getServerDefaultConfig();
            expect(config.httpsPort).toBe(false);
        });

        it('Should exclude spec files', () => {
            const config = getServerDefaultConfig();
            expect(config.exclude).toContain('**/*.spec.ts');
        });

        it('Should have component scan disabled', () => {
            const config = getServerDefaultConfig();
            expect(config.disableComponentsScan).toBe(true);
        });

        it('Should configure jsonMapper with additionalProperties false', () => {
            const config = getServerDefaultConfig();
            expect(config.jsonMapper).toEqual({
                additionalProperties: false
            });
        });

        it('Should configure ajv with returnsCoercedValues true', () => {
            const config = getServerDefaultConfig();
            expect(config.ajv).toEqual({
                returnsCoercedValues: true
            });
        });
    });

    describe('Return value behavior', () => {
        it('Should return a new object on each call', () => {
            const config1 = getServerDefaultConfig();
            const config2 = getServerDefaultConfig();

            // Should return different instances
            expect(config1).not.toBe(config2);
            
            // But with same values
            expect(config1).toEqual(config2);
        });

        it('Should be safe to mutate returned object', () => {
            const config1 = getServerDefaultConfig();
            const originalPort = config1.httpPort;

            // Mutate first config
            config1.httpPort = 8080;
            (config1.acceptMimes as string[]).push('text/html');

            // Get fresh config
            const config2 = getServerDefaultConfig();

            // Should return original values
            expect(config2.httpPort).toBe(originalPort);
            expect(config2.acceptMimes).toEqual(['application/json']);
        });
    });

    describe('Configuration structure', () => {
        it('Should return object with expected keys', () => {
            const config = getServerDefaultConfig();
            const keys = Object.keys(config);

            expect(keys).toContain('httpPort');
            expect(keys).toContain('acceptMimes');
            expect(keys).toContain('httpsPort');
            expect(keys).toContain('exclude');
            expect(keys).toContain('disableComponentsScan');
            expect(keys).toContain('jsonMapper');
            expect(keys).toContain('ajv');
        });

        it('Should return valid TsED Configuration partial', () => {
            const config = getServerDefaultConfig();

            // Type check - should be assignable to Partial<TsED.Configuration>
            const tsedConfig: Partial<TsED.Configuration> = config;
            expect(tsedConfig).toBeDefined();
        });
    });

    describe('Value types', () => {
        it('Should have correct value types', () => {
            const config = getServerDefaultConfig();

            expect(typeof config.httpPort).toBe('number');
            expect(Array.isArray(config.acceptMimes)).toBe(true);
            expect(typeof config.httpsPort).toBe('boolean');
            expect(Array.isArray(config.exclude)).toBe(true);
            expect(typeof config.disableComponentsScan).toBe('boolean');
            expect(typeof config.jsonMapper).toBe('object');
            expect(typeof config.ajv).toBe('object');
        });

        it('Should have nested object structures', () => {
            const config = getServerDefaultConfig();

            expect(config.jsonMapper).toHaveProperty('additionalProperties');
            expect(typeof config.jsonMapper?.additionalProperties).toBe('boolean');

            expect(config.ajv).toHaveProperty('returnsCoercedValues');
            expect(typeof config.ajv?.returnsCoercedValues).toBe('boolean');
        });
    });
});
