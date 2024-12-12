import { coverageConfigDefaults, ViteUserConfig } from 'vitest/config';
import { Coverage95 } from './coverage.js';
import { pluginSWC } from './pluginSWC.js';

export const defaultConfig: ViteUserConfig = {
    test: {
        globals: true,
        root: './src',
        coverage: {
            enabled: true,
            exclude: [
                '**/index.ts',
                ...coverageConfigDefaults.exclude
            ],
            thresholds: Coverage95
        }
    },
    plugins: [
        pluginSWC
    ]
};