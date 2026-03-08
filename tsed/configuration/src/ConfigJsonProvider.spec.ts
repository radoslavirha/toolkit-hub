import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { ConfigJsonProvider } from './ConfigJsonProvider.js';
import { BaseConfig } from './models/BaseConfig.js';

// Must match the config file in config/test.json
const ConfigModel = BaseConfig.extend({
    test: z.string()
});

// invalid: test2 is required but absent from config/test.json
const ConfigModelInvalid = ConfigModel.extend({
    test2: z.string()
});

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
        expect(provider.config.test).toBe('value');
    });

    it('should throw and log error', () => {
        expect.hasAssertions();

        try {
            new ConfigJsonProvider(ConfigModelInvalid);
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toMatch('Invalid configuration!');
            expect(consoleErrorSpy).not.toHaveBeenCalledWith('Configuration validation failed:');
        }
    });
});
