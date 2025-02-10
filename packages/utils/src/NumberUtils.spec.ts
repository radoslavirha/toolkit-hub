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
    });

    describe('mean', () => {

        it('should calculate mean value', async () => {
            const result = NumberUtils.mean([1, 2, 3, 4, 5]);

            expect(result).toBe(3);
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
    });

    describe('min', () => {
        
        it('should return minimum value', async () => {
            const result = NumberUtils.min([1, 2, 3, 4, 5]);

            expect(result).toBe(1);
        });
    });

    describe('max', () => {
        
        it('should return maximum value', async () => {
            const result = NumberUtils.max([1, 2, 3, 4, 5]);

            expect(result).toBe(5);
        });
    });
});
