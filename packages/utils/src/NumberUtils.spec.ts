import { describe, expect, it } from 'vitest';
import { NumberUtils } from './NumberUtils.js';

describe('NumberUtils', () => {
    describe('getPercentFromValue', () => {

        it('should use defaults', async () => {
            const result = NumberUtils.getPercentFromValue();

            expect(result).toBe(50);
        });

        it('should return correct value', async () => {
            const result = NumberUtils.getPercentFromValue(20, 2);

            expect(result).toBe(10);
        });

        it('should handle zero value', async () => {
            const result = NumberUtils.getPercentFromValue(100, 0);

            expect(result).toBe(0);
        });

        it('should handle value greater than maxValue', async () => {
            const result = NumberUtils.getPercentFromValue(50, 100);

            expect(result).toBe(200);
        });

        it('should handle negative values', async () => {
            const result = NumberUtils.getPercentFromValue(100, -25);

            expect(result).toBe(-25);
        });
    });

    describe('getValueFromPercent', () => {

        it('should use defaults', async () => {
            const result = NumberUtils.getValueFromPercent();

            expect(result).toBe(50);
        });

        it('should return correct value', async () => {
            const result = NumberUtils.getValueFromPercent(20, 20);

            expect(result).toBe(4);
        });

        it('should handle zero percent', async () => {
            const result = NumberUtils.getValueFromPercent(100, 0);

            expect(result).toBe(0);
        });

        it('should handle percent over 100', async () => {
            const result = NumberUtils.getValueFromPercent(50, 200);

            expect(result).toBe(100);
        });

        it('should handle negative percent', async () => {
            const result = NumberUtils.getValueFromPercent(100, -25);

            expect(result).toBe(-25);
        });
    });

    describe('mean', () => {

        it('should calculate mean value', async () => {
            const result = NumberUtils.mean([1, 2, 3, 4, 5]);

            expect(result).toBe(3);
        });

        it('should calculate mean with negative numbers', async () => {
            const result = NumberUtils.mean([-10, 0, 10]);

            expect(result).toBe(0);
        });

        it('should calculate mean for single element', async () => {
            const result = NumberUtils.mean([42]);

            expect(result).toBe(42);
        });

        it('should calculate mean with decimal values', async () => {
            const result = NumberUtils.mean([1.5, 2.5, 3.5]);

            expect(result).toBe(2.5);
        });
    });

    describe('round', () => {

        it('should round to 0 decimals', async () => {
            const result = NumberUtils.round(1.234);

            expect(result).toBe(1);
        });

        it('should round to 2 decimals', async () => {
            const result = NumberUtils.round(1.234, 2);

            expect(result).toBe(1.23);
        });

        it('should round negative numbers', async () => {
            const result = NumberUtils.round(-1.567, 1);

            expect(result).toBe(-1.6);
        });

        it('should round to negative precision', async () => {
            const result = NumberUtils.round(1234.5678, -2);

            expect(result).toBe(1200);
        });
    });

    describe('floor', () => {

        it('should floor to 0 decimals', async () => {
            const result = NumberUtils.floor(1.234);

            expect(result).toBe(1);
        });

        it('should floor to 2 decimals', async () => {
            const result = NumberUtils.floor(1.234, 2);

            expect(result).toBe(1.23);
        });

        it('should floor negative numbers', async () => {
            const result = NumberUtils.floor(-1.234, 1);

            expect(result).toBe(-1.3);
        });

        it('should floor to negative precision', async () => {
            const result = NumberUtils.floor(1234.5678, -2);

            expect(result).toBe(1200);
        });
    });

    describe('ceil', () => {

        it('should ceil to 0 decimals', async () => {
            const result = NumberUtils.ceil(1.234);

            expect(result).toBe(2);
        });

        it('should ceil to 2 decimals', async () => {
            const result = NumberUtils.ceil(1.234, 2);

            expect(result).toBe(1.24);
        });

        it('should ceil negative numbers', async () => {
            const result = NumberUtils.ceil(-1.234, 1);

            expect(result).toBe(-1.2);
        });

        it('should ceil to negative precision', async () => {
            const result = NumberUtils.ceil(1234.5678, -2);

            expect(result).toBe(1300);
        });
    });

    describe('min', () => {
        
        it('should return minimum value', async () => {
            const result = NumberUtils.min([1, 2, 3, 4, 5]);

            expect(result).toBe(1);
        });

        it('should return minimum value with negative numbers', async () => {
            const result = NumberUtils.min([10, -5, 20, -15, 0]);

            expect(result).toBe(-15);
        });

        it('should return undefined for empty array', async () => {
            const result = NumberUtils.min([]);

            expect(result).toBeUndefined();
        });

        it('should return the only value for single element array', async () => {
            const result = NumberUtils.min([42]);

            expect(result).toBe(42);
        });
    });

    describe('max', () => {
        
        it('should return maximum value', async () => {
            const result = NumberUtils.max([1, 2, 3, 4, 5]);

            expect(result).toBe(5);
        });

        it('should return maximum value with negative numbers', async () => {
            const result = NumberUtils.max([10, -5, 20, -15, 0]);

            expect(result).toBe(20);
        });

        it('should return undefined for empty array', async () => {
            const result = NumberUtils.max([]);

            expect(result).toBeUndefined();
        });

        it('should return the only value for single element array', async () => {
            const result = NumberUtils.max([42]);

            expect(result).toBe(42);
        });
    });
});
