import { Required } from '@tsed/schema';
import { describe, expect, it } from 'vitest';
import { ConfigProviderOptions, ConfigProvider } from './ConfigProvider.js';

// Must match the config file in config/test.json
class ConfigModel {
    @Required()
    test!: string;
}

class ConfigModelInvalid extends ConfigModel {
    @Required()
    test2!: string;
}

const options: ConfigProviderOptions = {
    service: 'test',
    fallbackPort: 4000,
    configModel: ConfigModel
};

describe('ConfigProvider', () => {
    it('Should pass', async () => {
        const loader = new ConfigProvider(options);

        expect(loader.service).toEqual('test');
        expect(loader.fallbackPort).toEqual(4000);
        expect(loader.api).toEqual({ service: 'test', version: expect.any(String), description: expect.any(String) });
        expect(loader.isProduction).toEqual(false);
        expect(loader.config).toEqual({ test: 'value' });
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

    it('Should pass - isProduction', async () => {
        const loader = new ConfigProvider(options);
        loader._envs.NODE_ENV = 'production';

        expect(loader.isProduction).toEqual(true);
    });

    it('Should pass - isTest', async () => {
        const loader = new ConfigProvider(options);
        loader._envs.NODE_ENV = 'test';

        expect(loader.isTest).toEqual(true);
    });

    it('Should fail', async () => {
        // const spy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
        const options: ConfigProviderOptions = {
            service: 'test',
            fallbackPort: 4000,
            configModel: ConfigModelInvalid
        };

        try {
            new ConfigProvider(options);
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toMatch('Invalid configuration!');
            // expect(spy).toBeCalledWith(expect.stringContaining('Config file: '));
        }
    });
});
