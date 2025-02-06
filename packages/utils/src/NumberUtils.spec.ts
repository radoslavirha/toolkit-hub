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
});
