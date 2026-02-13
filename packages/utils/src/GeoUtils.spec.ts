import { describe, expect, it } from 'vitest';
import { GeoUtils } from './GeoUtils.js';

describe('GeoUtils', () => {

    describe('calculateKmBetweenCoordinates', () => {

        it('should correctly calculate the distance between two coordinates', async () => {
            const result = GeoUtils.calculateKmBetweenCoordinates(52.520008, 13.404954, 51.507351, -0.127758);

            expect(result).toBe(931.5646);
        });

        it('should return 0 for same coordinates', async () => {
            const result = GeoUtils.calculateKmBetweenCoordinates(40.7128, -74.0060, 40.7128, -74.0060);

            expect(result).toBe(0);
        });

        it('should handle equator crossing', async () => {
            const result = GeoUtils.calculateKmBetweenCoordinates(10, 0, -10, 0);

            expect(result).toBe(2223.8985);
        });

        it('should handle prime meridian crossing', async () => {
            const result = GeoUtils.calculateKmBetweenCoordinates(0, 10, 0, -10);

            expect(result).toBe(2223.8985);
        });

        it('should handle negative coordinates', async () => {
            const result = GeoUtils.calculateKmBetweenCoordinates(-33.8688, 151.2093, -37.8136, 144.9631);

            expect(result).toBe(713.4275);
        });
    });

    describe('degToRad', () => {

        it('should correctly convert 0 degrees to radians', async () => {
            const result = GeoUtils.degToRad(0);

            expect(result).toBe(0);
        });

        it('should correctly convert 90 degrees to radians', async () => {
            const result = GeoUtils.degToRad(90);

            expect(result).toBe(1.5707963267948966);
        });

        it('should correctly convert 180 degrees to radians', async () => {
            const result = GeoUtils.degToRad(180);

            expect(result).toBe(3.141592653589793);
        });

        it('should correctly convert 270 degrees to radians', async () => {
            const result = GeoUtils.degToRad(270);

            expect(result).toBe(4.71238898038469);
        });

        it('should correctly convert 360 degrees to radians', async () => {
            const result = GeoUtils.degToRad(360);

            expect(result).toBe(6.283185307179586);
        });

        it('should handle negative degrees', async () => {
            const result = GeoUtils.degToRad(-90);

            expect(result).toBe(-1.5707963267948966);
        });
    });
});
