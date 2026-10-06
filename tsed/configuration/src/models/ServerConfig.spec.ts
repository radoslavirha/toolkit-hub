import { describe, expect, it } from 'vitest';
import { ServerConfig } from './ServerConfig.js';

describe('ServerConfig', () => {
    it('Should accept httpPort supplied as a string by an environment variable mapping', () => {
        // config/custom-environment-variables.json: { "server": { "httpPort": "PORT" } } with PORT=3000
        const result = ServerConfig.safeParse({ httpPort: '3000' });

        expect(result.success).toStrictEqual(true);
        expect(result.data?.httpPort).toStrictEqual(3000);
    });

    it('Should keep accepting a numeric httpPort', () => {
        const result = ServerConfig.safeParse({ httpPort: 4000 });

        expect(result.data?.httpPort).toStrictEqual(4000);
    });

    it.each(['', '  ', 'abc'])('Should reject httpPort %j', (httpPort) => {
        expect(ServerConfig.safeParse({ httpPort }).success).toStrictEqual(false);
    });

    it('Should reject a null httpPort', () => {
        expect(ServerConfig.safeParse({ httpPort: null }).success).toStrictEqual(false);
    });
});
