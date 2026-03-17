import swc from 'unplugin-swc';

export const pluginSWC = swc.vite({
    sourceMaps: true,
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
    isModule: true,
    minify: true
});