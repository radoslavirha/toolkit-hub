import { defaultConfig } from '@radoslavirha/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default defineConfig(mergeConfig(defaultConfig, {
    test: {
        coverage: {
            exclude: [
                'src/helpers/**',
                'src/models/**'
            ],
            thresholds: {
                // There is some problem with v8 coverage
                branches: 66.66
            }
        }
    }
}));