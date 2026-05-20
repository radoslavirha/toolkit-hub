import { defineConfig } from 'tsdown';
import type { UserConfig } from 'tsdown';

const commonConfig: UserConfig = {
    entry: ['src/index.ts'],
    dts: true,
    clean: true,
    tsconfig: './tsconfig.json',
    deps: {
        skipNodeModulesBundle: true
    }
};

export default defineConfig([
    {
        name: 'CJS build',
        format: 'cjs',
        outDir: 'dist/cjs',
        ...commonConfig
    },
    {
        name: 'ESM build',
        format: 'esm',
        outDir: 'dist/esm',
        ...commonConfig
    }
]);
