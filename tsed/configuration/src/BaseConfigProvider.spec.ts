import { describe, expect, it } from 'vitest';
import { BaseConfigProvider } from './BaseConfigProvider.js';

interface TestConfig {
    name: string;
    port: number;
    nested: {
        value: string;
        array: number[];
    };
}

describe('BaseConfigProvider', () => {
    describe('Immutability', () => {
        it('Should return a deep clone of the configuration', () => {
            const originalConfig: TestConfig = {
                name: 'test',
                port: 3000,
                nested: {
                    value: 'original',
                    array: [1, 2, 3]
                }
            };

            const provider = new BaseConfigProvider(originalConfig);
            const config1 = provider.config;
            const config2 = provider.config;

            // Should return different instances
            expect(config1).not.toBe(config2);
            expect(config1.nested).not.toBe(config2.nested);
            expect(config1.nested.array).not.toBe(config2.nested.array);

            // But should have same values
            expect(config1).toEqual(config2);
        });

        it('Should prevent mutations to primitive properties', () => {
            const originalConfig: TestConfig = {
                name: 'test',
                port: 3000,
                nested: {
                    value: 'original',
                    array: [1, 2, 3]
                }
            };

            const provider = new BaseConfigProvider(originalConfig);
            const config1 = provider.config;

            // Mutate the retrieved config
            config1.name = 'modified';
            config1.port = 8080;

            // Get a new copy
            const config2 = provider.config;

            // Original values should be preserved
            expect(config2.name).toBe('test');
            expect(config2.port).toBe(3000);
        });

        it('Should prevent mutations to nested objects', () => {
            const originalConfig: TestConfig = {
                name: 'test',
                port: 3000,
                nested: {
                    value: 'original',
                    array: [1, 2, 3]
                }
            };

            const provider = new BaseConfigProvider(originalConfig);
            const config1 = provider.config;

            // Mutate nested object
            config1.nested.value = 'modified';
            config1.nested.array.push(4);

            // Get a new copy
            const config2 = provider.config;

            // Original nested values should be preserved
            expect(config2.nested.value).toBe('original');
            expect(config2.nested.array).toEqual([1, 2, 3]);
        });

        it('Should prevent mutations to arrays', () => {
            const originalConfig: TestConfig = {
                name: 'test',
                port: 3000,
                nested: {
                    value: 'original',
                    array: [1, 2, 3]
                }
            };

            const provider = new BaseConfigProvider(originalConfig);
            const config1 = provider.config;

            // Mutate array
            config1.nested.array[0] = 999;
            config1.nested.array.push(4);
            config1.nested.array.pop();

            // Get a new copy
            const config2 = provider.config;

            // Original array should be preserved
            expect(config2.nested.array).toEqual([1, 2, 3]);
        });
    });

    describe('Configuration storage', () => {
        it('Should store and retrieve simple configuration', () => {
            const config = { key: 'value', number: 42 };
            const provider = new BaseConfigProvider(config);

            const retrieved = provider.config;
            expect(retrieved).toEqual(config);
        });

        it('Should handle empty configuration', () => {
            const config = {};
            const provider = new BaseConfigProvider(config);

            const retrieved = provider.config;
            expect(retrieved).toEqual({});
        });

        it('Should handle complex nested structures', () => {
            const config = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep'
                        }
                    }
                },
                arrays: [[1, 2], [3, 4]],
                mixed: {
                    arr: [{ id: 1 }, { id: 2 }]
                }
            };

            const provider = new BaseConfigProvider(config);
            const retrieved = provider.config;

            expect(retrieved).toEqual(config);
            expect(retrieved.level1.level2.level3.value).toBe('deep');
            expect(retrieved.arrays).toEqual([[1, 2], [3, 4]]);
        });
    });

    describe('Type safety', () => {
        it('Should maintain type information', () => {
            interface TypedConfig {
                stringValue: string;
                numberValue: number;
                booleanValue: boolean;
            }

            const config: TypedConfig = {
                stringValue: 'test',
                numberValue: 123,
                booleanValue: true
            };

            const provider = new BaseConfigProvider<TypedConfig>(config);
            const retrieved = provider.config;

            // TypeScript should allow these assignments
            const str: string = retrieved.stringValue;
            const num: number = retrieved.numberValue;
            const bool: boolean = retrieved.booleanValue;

            expect(str).toBe('test');
            expect(num).toBe(123);
            expect(bool).toBe(true);
        });
    });
});
