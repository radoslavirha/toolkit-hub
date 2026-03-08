import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { ConfigProviderOptions, ConfigProvider } from './ConfigProvider.js';
import { injector } from '@tsed/di';
import { BaseConfig } from './models/BaseConfig.js';

// Must match the config file in config/test.json
const ConfigModel = BaseConfig.extend({
    test: z.string()
});
type ConfigModel = z.infer<typeof ConfigModel>;

// invalid: test2 is required but absent from config/test.json
const ConfigModelInvalid = ConfigModel.extend({
    test2: z.string()
});
type ConfigModelInvalid = z.infer<typeof ConfigModelInvalid>;

const options: ConfigProviderOptions<ConfigModel> = {
    schema: ConfigModel
};

describe('ConfigProvider', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('Should work with DI @UseOpts', () => {
        it('Should pass', async () => {
            const loader = injector().get(ConfigProvider, { useOpts: options });
    
            expect(loader.api).toEqual({
                service: 'test-service',
                version: expect.any(String),
                description: expect.any(String),
                publicURL: 'http://localhost:4000/api'
            });
            expect(loader.config).toEqual({
                test: 'value',
                server: {
                    httpPort: 4000
                },
                serviceName: 'test-service',
                publicURL: 'http://localhost:4000/api'
            });
            expect(loader.server).toEqual({
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
                envs: expect.any(Object)
            });
        });

        it('Should pass with debug enabled', async () => {
            const debugOptions: ConfigProviderOptions<ConfigModel> = {
                schema: ConfigModel,
                debug: true
            };
            const loader = injector().get(ConfigProvider, { useOpts: debugOptions });
    
            expect(loader.api).toBeDefined();
            expect(loader.config).toBeDefined();
        });
    
        it('Should pass - isTest', async () => {
            const loader = injector().get(ConfigProvider, { useOpts: options });
            loader._envs.NODE_ENV = 'test';
    
            expect(loader.isTest).toEqual(true);
        });
        
        it('Should load package.json', async () => {
            const loader = injector().get(ConfigProvider, { useOpts: options });

            expect(loader.packageJson).toEqual({
                name: '@radoslavirha/tsed-configuration',
                version: expect.any(String),
                description: 'Ts.ED server configuration'
            });
        });
    
        it('Should fail', async () => {
            const options: ConfigProviderOptions<ConfigModelInvalid> = {
                schema: ConfigModelInvalid
            };
    
            try {
                injector().get(ConfigProvider, { useOpts: options });
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toMatch('Invalid configuration!');
                expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration validation failed:'));
                expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('test2'));
            }
        });
    });

    describe('Should work without DI', () => {

        it('Should pass', async () => {
            const loader = new ConfigProvider<ConfigModel>(options);

            expect(loader.api).toEqual({
                service: 'test-service',
                version: expect.any(String),
                description: expect.any(String),
                publicURL: 'http://localhost:4000/api'
            });
            expect(loader.config).toEqual({
                test: 'value',
                server: {
                    httpPort: 4000
                },
                serviceName: 'test-service',
                publicURL: 'http://localhost:4000/api'
            });
            expect(loader.server).toEqual({
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
                envs: expect.any(Object)
            });
        });
    
        it('Should pass - isTest', async () => {
            const loader = new ConfigProvider<ConfigModel>(options);
            loader._envs.NODE_ENV = 'test';
    
            expect(loader.isTest).toEqual(true);
        });

        it('Should pass with debug enabled', async () => {
            const debugOptions: ConfigProviderOptions<ConfigModel> = {
                schema: ConfigModel,
                debug: true
            };
            const loader = new ConfigProvider<ConfigModel>(debugOptions);
    
            expect(loader.api).toBeDefined();
            expect(loader.config).toBeDefined();
        });
        
        it('Should load package.json', async () => {
            const loader = new ConfigProvider<ConfigModel>(options);

            expect(loader.packageJson).toEqual({
                name: '@radoslavirha/tsed-configuration',
                version: expect.any(String),
                description: 'Ts.ED server configuration'
            });
        });
    
        it('Should fail', async () => {
            const options: ConfigProviderOptions<ConfigModelInvalid> = {
                schema: ConfigModelInvalid
            };
    
            try {
                new ConfigProvider<ConfigModelInvalid>(options);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toMatch('Invalid configuration!');
                expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration validation failed:'));
                expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('test2'));
            }
        });
    });
});
