import swc from 'unplugin-swc';
import { Plugin } from 'vitest/config';

export const pluginSWC: Plugin = swc.vite({
    sourceMaps: 'inline',
    jsc: {
        target: 'es2022',
        externalHelpers: true,
        keepClassNames: true,
        parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: true,
            dynamicImport: true
        },
        transform: {
            useDefineForClassFields: false,
            legacyDecorator: true,
            decoratorMetadata: true
        }
    },
    module: {
        type: 'es6',
        strictMode: true,
        lazy: false,
        noInterop: false
    },
    isModule: true
});