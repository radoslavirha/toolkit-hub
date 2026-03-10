import type { UserConfig } from 'tsdown';

const commonConfig: UserConfig = {
    entry: ['src/index.ts'],
    dts: true,
    clean: true,
    tsconfig: './tsconfig.json',
    outExtensions: ({ format }) => {
        if (format === 'es') return { js: '.js', dts: '.d.ts' };
        return undefined;
    }
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

export const config: UserConfig = {
    name: 'ESM + CJS build',
    format: ['esm', 'cjs'],
    outDir: 'dist',
    ...commonConfig
};
