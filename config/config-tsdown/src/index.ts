import type { UserConfig } from 'tsdown';

const commonConfig: UserConfig = {
    entry: ['src/index.ts'],
    dts: true,
    clean: true,
    tsconfig: './tsconfig.json'
};

export const cjsConfig: UserConfig = {
    name: 'CJS build',
    format: 'cjs',
    outDir: 'dist/cjs',
    ...commonConfig
};

export const esmConfig: UserConfig = {
    name: 'ESM build',
    format: 'esm',
    outDir: 'dist/esm',
    ...commonConfig
};
