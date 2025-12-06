import { Required } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { ConfigProviderOptions, ConfigProvider } from './ConfigProvider.js';
import { injector } from '@tsed/di';
import { BaseConfig } from './models/BaseConfig.js';

// Must match the config file in config/test.json
class ConfigModel extends BaseConfig {
    @Required()
    test!: string;
}

class ConfigModelInvalid extends ConfigModel {
    @Required()
    test2!: string;
}

const options: ConfigProviderOptions<ConfigModel> = {
    configModel: ConfigModel
};

describe('ConfigProvider', () => {
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
                configModel: ConfigModelInvalid
            };
    
            try {
                injector().get(ConfigProvider, { useOpts: options });
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toMatch('Invalid configuration!');
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
        
        it('Should load package.json', async () => {
            const loader = new ConfigProvider<ConfigModel>(options);

            expect(loader.packageJson).toEqual({
                name: '@radoslavirha/tsed-configuration',
                version: expect.any(String),
                description: 'Ts.ED server configuration'
            });
        });
    
        it('Should fail', async () => {
            // const spy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
            const options: ConfigProviderOptions<ConfigModelInvalid> = {
                configModel: ConfigModelInvalid
            };
    
            try {
                new ConfigProvider<ConfigModelInvalid>(options);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toMatch('Invalid configuration!');
                // expect(spy).toBeCalledWith(expect.stringContaining('Config file: '));
            }
        });
    });
});
