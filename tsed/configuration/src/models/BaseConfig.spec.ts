import { describe, expect, it } from 'vitest';
import { BaseConfig } from './BaseConfig.js';

describe('BaseConfig', () => {
    it('keeps server, serviceName and publicURL', () => {
        const result = BaseConfig.parse({
            server: { httpPort: 4000 },
            serviceName: 'svc',
            publicURL: 'https://example.com'
        });

        expect(result).toMatchObject({ serviceName: 'svc', publicURL: 'https://example.com' });
    });

    it('strips version and description, which always come from package.json', () => {
        const result = BaseConfig.parse({
            server: { httpPort: 4000 },
            version: '2.0.0',
            description: 'From config file'
        });

        expect(result).not.toHaveProperty('version');
        expect(result).not.toHaveProperty('description');
    });
});
