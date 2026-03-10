import { defineConfig } from 'tsdown';

export default defineConfig({
    name: 'ESM + CJS build',
    format: ['esm', 'cjs'],
    outDir: 'dist',
    entry: ['src/index.ts'],
    dts: true,
    clean: true,
    tsconfig: './tsconfig.json',
    outExtensions: ({ format }) => {
        if (format === 'es') return { js: '.js', dts: '.d.ts' };
        return undefined;
    }
});
