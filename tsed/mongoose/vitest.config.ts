import { defaultConfig } from '@radoslavirha/config-vitest';
import { ObjectUtils } from '@radoslavirha/utils';
import { defineConfig } from 'vitest/config';

export default defineConfig(ObjectUtils.mergeDeep(defaultConfig, {
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