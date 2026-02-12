import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { EnvironmentVariablesProvider } from './EnvironmentVariablesProvider.js';

describe('EnvironmentVariablesProvider', () => {
    // Store original env to restore after tests
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = { ...process.env };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.clearAllMocks();
    });

    describe('Environment variable loading', () => {
        it('Should load process.env variables', () => {
            process.env.TEST_VAR = 'test-value';
            process.env.ANOTHER_VAR = '123';

            const provider = new EnvironmentVariablesProvider();
            const env = provider.config;

            expect(env.TEST_VAR).toBe('test-value');
            expect(env.ANOTHER_VAR).toBe('123');
        });

        it('Should load NODE_ENV', () => {
            process.env.NODE_ENV = 'test';

            const provider = new EnvironmentVariablesProvider();
            const env = provider.config;

            expect(env.NODE_ENV).toBe('test');
        });

        it('Should handle undefined environment variables', () => {
            const provider = new EnvironmentVariablesProvider();
            const env = provider.config;

            // Accessing non-existent variable should return undefined
            expect(env.NON_EXISTENT_VAR).toBeUndefined();
        });
    });

    describe('Immutability', () => {
        it('Should return immutable configuration', () => {
            process.env.TEST_VAR = 'original';

            const provider = new EnvironmentVariablesProvider();
            const env1 = provider.config;

            // Try to mutate
            env1.TEST_VAR = 'modified';

            // Get a fresh copy
            const env2 = provider.config;

            // Original value should be preserved
            expect(env2.TEST_VAR).toBe('original');
        });

        it('Should return different instances on each access', () => {
            const provider = new EnvironmentVariablesProvider();
            const env1 = provider.config;
            const env2 = provider.config;

            // Should be different instances
            expect(env1).not.toBe(env2);
            
            // But with same values
            expect(env1).toEqual(env2);
        });
    });

    describe('Environment variable types',  () => {
        it('Should handle string values', () => {
            process.env.STRING_VAR = 'hello world';

            const provider = new EnvironmentVariablesProvider();
            const env = provider.config;

            expect(typeof env.STRING_VAR).toBe('string');
            expect(env.STRING_VAR).toBe('hello world');
        });

        it('Should handle empty string values', () => {
            process.env.EMPTY_VAR = '';

            const provider = new EnvironmentVariablesProvider();
            const env = provider.config;

            expect(env.EMPTY_VAR).toBe('');
        });

        it('Should handle numeric string values', () => {
            process.env.PORT = '3000';

            const provider = new EnvironmentVariablesProvider();
            const env = provider.config;

            // All env vars are strings
            expect(typeof env.PORT).toBe('string');
            expect(env.PORT).toBe('3000');
        });

        it('Should handle boolean-like string values', () => {
            process.env.DEBUG = 'true';
            process.env.PRODUCTION = 'false';

            const provider = new EnvironmentVariablesProvider();
            const env = provider.config;

            // All env vars are strings, not actual booleans
            expect(typeof env.DEBUG).toBe('string');
            expect(env.DEBUG).toBe('true');
            expect(env.PRODUCTION).toBe('false');
        });
    });

    describe('Multiple environment variables', () => {
        it('Should load all available environment variables', () => {
            process.env.VAR1 = 'value1';
            process.env.VAR2 = 'value2';
            process.env.VAR3 = 'value3';

            const provider = new EnvironmentVariablesProvider();
            const env = provider.config;

            expect(env.VAR1).toBe('value1');
            expect(env.VAR2).toBe('value2');
            expect(env.VAR3).toBe('value3');
        });

        it('Should preserve all standard NODE environment variables', () => {
            const provider = new EnvironmentVariablesProvider();
            const env = provider.config;

            // These are typically set by Node.js
            expect(env).toHaveProperty('NODE_ENV');
            expect(env).toHaveProperty('PATH');
        });
    });

    describe('Extended interface compatibility', () => {
        it('Should work with typed ENVS interface', () => {
            interface TypedENVS extends Record<string, string | undefined> {
                NODE_ENV: string;
                PORT?: string;
                API_URL?: string;
            }

            process.env.NODE_ENV = 'test';
            process.env.PORT = '4000';

            const provider = new EnvironmentVariablesProvider();
            const env = provider.config as TypedENVS;

            expect(env.NODE_ENV).toBe('test');
            expect(env.PORT).toBe('4000');
            expect(env.API_URL).toBeUndefined();
        });
    });
});
