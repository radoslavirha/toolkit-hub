import { coverageConfigDefaults } from 'vitest/config';
import { defaultConfig } from '@radoslavirha/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default defineConfig(mergeConfig(defaultConfig, {
    test: {
        coverage: {
            exclude: ['src/test/**', ...coverageConfigDefaults.exclude]
        }
    }
}));
