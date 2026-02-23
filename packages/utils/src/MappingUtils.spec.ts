import { describe, expect, it, vi } from 'vitest';
import { MappingUtils } from './MappingUtils.js';

enum SourceEnum {
    A = 'A',
    B = 'B',
    C = 'C'
}

enum TargetEnum {
    A = 'ONE',
    B = 'TWO'
}

describe('MappingUtils', () => {
    const mappingUtils = new MappingUtils();

    describe('mapOptionalModel', () => {
        it('maps model and forwards additional mapper args', async () => {
            const result = await mappingUtils.mapOptionalModel({ value: 'x' }, async (model: { value: string }, prefix: string) => `${prefix}:${model.value}`, 'mapped');

            expect(result).toBe('mapped:x');
        });

        it('maps model using vi.fn mapper variant', async () => {
            const mapper = vi.fn(async (model: { value: string }, prefix: string) => `${prefix}:${model.value}`);

            const result = await mappingUtils.mapOptionalModel({ value: 'x' }, mapper, 'mapped');

            expect(result).toBe('mapped:x');
            expect(mapper).toHaveBeenCalledWith({ value: 'x' }, 'mapped');
        });

        it('returns null when model is null', async () => {
            const result = await mappingUtils.mapOptionalModel(null, async () => {
                throw new Error('mapper should not be called for null input');
            });

            expect(result).toBeNull();
        });

        it('returns undefined when model is undefined', async () => {
            const result = await mappingUtils.mapOptionalModel(undefined, async () => {
                throw new Error('mapper should not be called for undefined input');
            });

            expect(result).toBeUndefined();
        });
    });

    describe('mapArray', () => {
        it('maps all array items', async () => {
            const result = await mappingUtils.mapArray([1, 2, 3], async (value) => value * 2);

            expect(result).toEqual([2, 4, 6]);
        });

        it('maps all array items using vi.fn mapper variant', async () => {
            const mapper = vi.fn(async (value: number) => value * 2);

            const result = await mappingUtils.mapArray([1, 2, 3], mapper);

            expect(result).toEqual([2, 4, 6]);
            expect(mapper).toHaveBeenCalledTimes(3);
        });

        it('returns null when source array is null', async () => {
            const result = await mappingUtils.mapArray(null, async () => {
                throw new Error('mapper should not be called for null array');
            });

            expect(result).toBeNull();
        });
    });

    describe('mapOptionalArray', () => {
        it('maps optional array items using vi.fn mapper variant', async () => {
            const mapper = vi.fn(async (value: number, prefix: string) => `${prefix}${value}`);

            const result = await mappingUtils.mapOptionalArray([1, 2], mapper, 'n-');

            expect(result).toEqual(['n-1', 'n-2']);
            expect(mapper).toHaveBeenCalledTimes(2);
        });

        it('returns undefined when source array is undefined', async () => {
            const result = await mappingUtils.mapOptionalArray(undefined, async () => {
                throw new Error('mapper should not be called for undefined array');
            });

            expect(result).toBeUndefined();
        });

        it('returns null when source array is null', async () => {
            const result = await mappingUtils.mapOptionalArray(null, async () => {
                throw new Error('mapper should not be called for null array');
            });

            expect(result).toBeNull();
        });
    });

    describe('mapMap', () => {
        it('maps map entries', async () => {
            const source = new Map<string, number>([
                ['a', 1],
                ['b', 2]
            ]);

            const result = await mappingUtils.mapMap(source, async (key, value) => [key.toUpperCase(), value * 10]);

            expect(result).toEqual(new Map([
                ['A', 10],
                ['B', 20]
            ]));
        });

        it('maps map entries using vi.fn mapper variant', async () => {
            const source = new Map<string, number>([
                ['a', 1],
                ['b', 2]
            ]);
            const mapper = vi.fn(async (key: string, value: number): Promise<[string, number]> => [key.toUpperCase(), value * 10]);

            const result = await mappingUtils.mapMap(source, mapper);

            expect(result).toEqual(new Map([
                ['A', 10],
                ['B', 20]
            ]));
            expect(mapper).toHaveBeenCalledTimes(2);
        });

        it('returns null when source map is null', async () => {
            const result = await mappingUtils.mapMap(null, async (): Promise<[string, number]> => {
                throw new Error('mapper should not be called for null map');
            });

            expect(result).toBeNull();
        });
    });

    describe('mapOptionalMap', () => {
        it('maps optional map entries using vi.fn mapper variant', async () => {
            const source = new Map<string, number>([['a', 1]]);
            const mapper = vi.fn(async (key: string, value: number): Promise<[string, number]> => [key.toUpperCase(), value + 1]);

            const result = await mappingUtils.mapOptionalMap(source, mapper);

            expect(result).toEqual(new Map([['A', 2]]));
            expect(mapper).toHaveBeenCalledTimes(1);
        });

        it('returns undefined when source map is undefined', async () => {
            const result = await mappingUtils.mapOptionalMap(undefined, async (): Promise<[string, number]> => {
                throw new Error('mapper should not be called for undefined map');
            });

            expect(result).toBeUndefined();
        });
    });

    describe('mapEnum', () => {
        it('maps enum values by key name', () => {
            const result = mappingUtils.mapEnum({ SourceEnum }, { TargetEnum }, SourceEnum.A);

            expect(result).toBe(TargetEnum.A);
        });

        it('returns null when enum value is null', () => {
            const result = mappingUtils.mapEnum({ SourceEnum }, { TargetEnum }, null);

            expect(result).toBeNull();
        });

        it('throws when source value does not exist in source enum', () => {
            expect(() =>
                mappingUtils.mapEnum(
                    { SourceEnum },
                    { TargetEnum },
                    'UNKNOWN' as SourceEnum
                )
            ).toThrow("doesn't exist in SourceEnum");
        });

        it('throws when source key is missing in target enum', () => {
            expect(() =>
                mappingUtils.mapEnum(
                    { SourceEnum },
                    { TargetEnum },
                    SourceEnum.C
                )
            ).toThrow('cannot be mapped to TargetEnum.C');
        });

        it('returns undefined for unknown key when ignoreUnknownKeys is true', () => {
            const result = mappingUtils.mapEnum(
                { SourceEnum },
                { TargetEnum },
                'UNKNOWN' as SourceEnum,
                true
            );

            expect(result).toBeUndefined();
        });
    });

    describe('mapOptionalEnum', () => {
        it('maps enum values by key name', () => {
            const result = mappingUtils.mapOptionalEnum({ SourceEnum }, { TargetEnum }, SourceEnum.A);

            expect(result).toBe(TargetEnum.A);
        });

        it('returns null when enum value is null', () => {
            const result = mappingUtils.mapOptionalEnum({ SourceEnum }, { TargetEnum }, null);

            expect(result).toBeNull();
        });

        it('returns undefined when enum value is undefined', () => {
            const result = mappingUtils.mapOptionalEnum({ SourceEnum }, { TargetEnum }, undefined);

            expect(result).toBeUndefined();
        });

        it('throws when source value does not exist in source enum', () => {
            expect(() =>
                mappingUtils.mapOptionalEnum(
                    { SourceEnum },
                    { TargetEnum },
                    'UNKNOWN' as SourceEnum
                )
            ).toThrow("doesn't exist in SourceEnum");
        });

        it('throws when source key is missing in target enum', () => {
            expect(() =>
                mappingUtils.mapOptionalEnum(
                    { SourceEnum },
                    { TargetEnum },
                    SourceEnum.C
                )
            ).toThrow('cannot be mapped to TargetEnum.C');
        });

        it('returns undefined for unknown key when ignoreUnknownKeys is true', () => {
            const result = mappingUtils.mapOptionalEnum(
                { SourceEnum },
                { TargetEnum },
                'UNKNOWN' as SourceEnum,
                true
            );

            expect(result).toBeUndefined();
        });
    });
});
