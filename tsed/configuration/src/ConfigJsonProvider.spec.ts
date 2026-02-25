import { Required } from '@tsed/schema';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { JSONSchemaValidator } from '@radoslavirha/tsed-common';
import { ConfigJsonProvider } from './ConfigJsonProvider.js';
import { BaseConfig } from './models/BaseConfig.js';

// Must match the config file in config/test.json
class ConfigModel extends BaseConfig {
    @Required()
    test!: string;
}

describe('ConfigJsonProvider', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should load and validate configuration', () => {
        const provider = new ConfigJsonProvider(ConfigModel);

        expect(provider.config).toBeDefined();
    });

    it('should throw with generic message when validator throws a non-array error', () => {
        expect.hasAssertions();

        const spy = vi.spyOn(JSONSchemaValidator, 'validate').mockImplementation(() => {
            throw new Error('unexpected validator error');
        });

        try {
            new ConfigJsonProvider(ConfigModel);
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toMatch('Invalid configuration!');
            // Array.isArray is false for Error, so the per-error logging should NOT be called
            expect(consoleErrorSpy).not.toHaveBeenCalledWith('Configuration validation failed:');
        } finally {
            spy.mockRestore();
        }
    });
});
