import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';

describe('ConfigProvider .env loading order', () => {
    const originalCwd = process.cwd();
    const originalEnv = { ...process.env };
    let dir: string;

    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), 'cfg-'));
        mkdirSync(join(dir, 'config'));
        writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'svc', version: '1.0.0' }));
        writeFileSync(join(dir, 'config', 'default.json'), JSON.stringify({ server: { httpPort: 4000 }, databaseUrl: 'mongodb://default' }));
        writeFileSync(join(dir, 'config', 'production.json'), JSON.stringify({ server: { httpPort: 8080 } }));
        writeFileSync(join(dir, 'config', 'custom-environment-variables.json'), JSON.stringify({ databaseUrl: 'DATABASE_URL' }));
        writeFileSync(join(dir, '.env'), 'NODE_ENV=production\nDATABASE_URL=mongodb://from-dotenv\n');
        process.chdir(dir);
        process.env.NODE_CONFIG_DIR = join(dir, 'config');
        delete process.env.NODE_ENV;
        delete process.env.DATABASE_URL;
        vi.resetModules();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        process.chdir(originalCwd);
        process.env = { ...originalEnv };
        rmSync(dir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    it('applies .env values to custom-environment-variables mappings', async () => {
        const { ConfigProvider } = await import('./ConfigProvider.js');
        const { BaseConfig } = await import('./models/BaseConfig.js');
        const schema = BaseConfig.extend({ databaseUrl: z.string() });
        const provider = new ConfigProvider({ schema });

        expect(provider.envs.DATABASE_URL).toStrictEqual('mongodb://from-dotenv');
        expect(provider.config.databaseUrl).toStrictEqual('mongodb://from-dotenv');
    });

    it('loads the config file for NODE_ENV set in .env', async () => {
        const { ConfigProvider } = await import('./ConfigProvider.js');
        const { BaseConfig } = await import('./models/BaseConfig.js');
        const schema = BaseConfig.extend({ databaseUrl: z.string() });
        const provider = new ConfigProvider({ schema });

        expect(provider.envs.NODE_ENV).toStrictEqual('production');
        expect(provider.server.httpPort).toStrictEqual(8080);
    });
});
