import { defaultConfig } from '@radoslavirha/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default defineConfig(mergeConfig(defaultConfig, {
    test: {
        env: {
            SUPPRESS_NO_CONFIG_WARNING: '1'
        },
        coverage: {
            exclude: [
                'src/test'
            ]
        }
    }
}));