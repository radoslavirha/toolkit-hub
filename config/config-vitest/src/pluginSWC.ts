import swc from 'unplugin-swc';
import { Plugin } from 'vitest/config';

export const pluginSWC: Plugin = swc.vite({
    sourceMaps: 'inline',
    jsc: {
        target: 'esnext',
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
        type: 'nodenext',
        strictMode: true,
        lazy: false,
        noInterop: false
    },
    isModule: true
});