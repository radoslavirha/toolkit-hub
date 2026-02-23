import { describe, expect, it } from 'vitest';
import { ArrayUtils } from './ArrayUtils.js';

describe('ArrayUtils', () => {
    describe('isArray', () => {
        it('returns true for a non-empty array', () => {
            expect(ArrayUtils.isArray([1, 2, 3])).toBe(true);
        });

        it('returns true for an empty array', () => {
            expect(ArrayUtils.isArray([])).toBe(true);
        });

        it('returns false for a string', () => {
            expect(ArrayUtils.isArray('string')).toBe(false);
        });

        it('returns false for a number', () => {
            expect(ArrayUtils.isArray(42)).toBe(false);
        });

        it('returns false for an object', () => {
            expect(ArrayUtils.isArray({ a: 1 })).toBe(false);
        });

        it('returns false for null', () => {
            expect(ArrayUtils.isArray(null)).toBe(false);
        });

        it('returns false for undefined', () => {
            expect(ArrayUtils.isArray(undefined)).toBe(false);
        });
    });

    describe('toArray', () => {
        it('returns empty array for null', () => {
            expect(ArrayUtils.toArray(null)).toEqual([]);
        });

        it('returns empty array for undefined', () => {
            expect(ArrayUtils.toArray(undefined)).toEqual([]);
        });

        it('returns same array when value is already an array', () => {
            const input = [1, 2, 3];

            expect(ArrayUtils.toArray(input)).toEqual([1, 2, 3]);
        });

        it('wraps a single value into an array', () => {
            expect(ArrayUtils.toArray('hello')).toEqual(['hello']);
        });

        it('wraps a single number into an array', () => {
            expect(ArrayUtils.toArray(42)).toEqual([42]);
        });

        it('wraps a single object into an array', () => {
            const obj = { id: 1 };

            expect(ArrayUtils.toArray(obj)).toEqual([{ id: 1 }]);
        });

        it('passes through an array of objects unchanged', () => {
            const input = [{ id: 1 }, { id: 2 }];

            expect(ArrayUtils.toArray(input)).toEqual(input);
        });
    });
});
