import { defaultConfig } from '@radoslavirha/config-vitest';
import { defineConfig } from 'vitest/config';

const config = { ...defaultConfig };
config.test!.globalSetup = [import.meta.resolve('@tsed/testcontainers-mongo/vitest/setup')];
config.test!.coverage?.exclude!.push('src/test');
config.test!.coverage?.exclude!.push('src/types');

export default defineConfig(config);