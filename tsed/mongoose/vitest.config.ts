import { defaultConfig } from '@radoslavirha/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default defineConfig(mergeConfig(defaultConfig, {
    test: {
        globalSetup: [import.meta.resolve('@tsed/testcontainers-mongo/vitest/setup')],
        coverage: {
            exclude: [
                'src/models',
                'src/test',
                'src/types'
            ]
        }
    }
}));