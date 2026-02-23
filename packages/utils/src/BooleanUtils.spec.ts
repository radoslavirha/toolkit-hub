import { describe, expect, it } from 'vitest';
import { BooleanUtils } from './BooleanUtils.js';

describe('BooleanUtils', () => {
    describe('isBoolean', () => {
        it('returns true for boolean true', () => {
            expect(BooleanUtils.isBoolean(true)).toBe(true);
        });

        it('returns true for boolean false', () => {
            expect(BooleanUtils.isBoolean(false)).toBe(true);
        });

        it('returns false for number 0 (falsy but not boolean)', () => {
            expect(BooleanUtils.isBoolean(0)).toBe(false);
        });

        it('returns false for number 1 (truthy but not boolean)', () => {
            expect(BooleanUtils.isBoolean(1)).toBe(false);
        });

        it('returns false for string "true"', () => {
            expect(BooleanUtils.isBoolean('true')).toBe(false);
        });

        it('returns false for empty string', () => {
            expect(BooleanUtils.isBoolean('')).toBe(false);
        });

        it('returns false for null', () => {
            expect(BooleanUtils.isBoolean(null)).toBe(false);
        });

        it('returns false for undefined', () => {
            expect(BooleanUtils.isBoolean(undefined)).toBe(false);
        });

        it('returns false for an object', () => {
            expect(BooleanUtils.isBoolean({})).toBe(false);
        });
    });
});
