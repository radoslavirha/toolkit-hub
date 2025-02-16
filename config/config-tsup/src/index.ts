import type { Options } from 'tsup';

const commonConfig = {
    entry: ['src/index.ts'],
    dts: true,
    clean: true,
    tsconfig: './tsconfig.json',
    shims: true
};

export const cjsConfig: Options = {
    name: 'CJS build',
    format: 'cjs',
    outDir: 'dist/cjs',
    ...commonConfig
};

export const esmConfig: Options = {
    name: 'ESM build',
    format: 'esm',
    outDir: 'dist/esm',
    ...commonConfig
};

export const config: Options = {
    name: 'ESM + CJS build',
    format: ['esm', 'cjs'],
    outDir: 'dist',
    ...commonConfig
};