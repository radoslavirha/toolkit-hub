import { describe, expect, it } from 'vitest';
import { DefaultsUtil } from './DefaultsUtil.js';

describe('DefaultsUtil', () => {
    describe('string', () => {
        it('returns default value when string is undefined', () => {
            const result = DefaultsUtil.string(undefined, 'fallback');

            expect(result).toBe('fallback');
        });

        it('returns default value when string is null', () => {
            const result = DefaultsUtil.string(null, 'fallback');

            expect(result).toBe('fallback');
        });


        it('returns provided string when value exists', () => {
            const result = DefaultsUtil.string('actual', 'fallback');

            expect(result).toBe('actual');
        });

        it('returns default value when string is empty string', () => {
            const result = DefaultsUtil.string('', 'fallback');
            
            expect(result).toBe('fallback');
        });

        it('returns string with whitespace when value has only whitespace', () => {
            const result = DefaultsUtil.string('   ', 'fallback');
            
            expect(result).toBe('   ');
        });

        it('returns string with special characters', () => {
            const result = DefaultsUtil.string('!@#$%', 'fallback');
            
            expect(result).toBe('!@#$%');
        });
    });

    describe('number', () => {
        it('returns default value when number is undefined', () => {
            const result = DefaultsUtil.number(undefined, 42);

            expect(result).toBe(42);
        });

        it('returns default value when number is null', () => {
            const result = DefaultsUtil.number(null, 42);

            expect(result).toBe(42);
        });

        it('returns provided number when value exists', () => {
            const result = DefaultsUtil.number(7, 42);

            expect(result).toBe(7);
        });

        it('returns zero when value is zero', () => {
            const result = DefaultsUtil.number(0, 42);

            expect(result).toBe(0);
        });

        it('returns negative number when value is negative', () => {
            const result = DefaultsUtil.number(-5, 42);

            expect(result).toBe(-5);
        });
    });
});
