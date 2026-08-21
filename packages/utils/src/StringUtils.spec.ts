import { describe, expect, it } from 'vitest';
import { StringUtils } from './StringUtils.js';

describe('StringUtils', () => {
    describe('isString', () => {
        it('returns true for a non-empty string', () => {
            expect(StringUtils.isString('hello')).toBe(true);
        });

        it('returns true for an empty string', () => {
            expect(StringUtils.isString('')).toBe(true);
        });

        it('returns false for a number', () => {
            expect(StringUtils.isString(42)).toBe(false);
        });

        it('returns false for a boolean', () => {
            expect(StringUtils.isString(true)).toBe(false);
        });

        it('returns false for an array', () => {
            expect(StringUtils.isString(['a', 'b'])).toBe(false);
        });

        it('returns false for an object', () => {
            expect(StringUtils.isString({ value: 'x' })).toBe(false);
        });

        it('returns false for null', () => {
            expect(StringUtils.isString(null)).toBe(false);
        });

        it('returns false for undefined', () => {
            expect(StringUtils.isString(undefined)).toBe(false);
        });
    });

    describe('isNotEmpty', () => {
        it('returns true for a string with content', () => {
            expect(StringUtils.isNotEmpty('hello')).toBe(true);
        });

        it('returns false for an empty string', () => {
            expect(StringUtils.isNotEmpty('')).toBe(false);
        });

        it('returns false for a whitespace-only string', () => {
            expect(StringUtils.isNotEmpty('   ')).toBe(false);
        });

        it('returns false for a non-string value', () => {
            expect(StringUtils.isNotEmpty(42)).toBe(false);
            expect(StringUtils.isNotEmpty(null)).toBe(false);
        });
    });
});
